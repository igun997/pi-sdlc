/**
 * Plan Tracker Tool - Native task tracking for SDLC workflow
 *
 * Actions:
 * - init: Initialize with tasks from plan phase
 * - status: Get current progress and active task
 * - update: Update task status (pending/in_progress/complete/blocked)
 * - clear: Clear all tasks after verification
 * - approve: Mark current phase as approved (no re-asking)
 * - check_approval: Check if phase is approved
 */

import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { Text, truncateToWidth } from "@earendil-works/pi-tui";
import { Type } from "typebox";

// ============================================================
// Types
// ============================================================

type TaskStatus = "pending" | "in_progress" | "complete" | "blocked";
type Phase = "spec" | "plan" | "execute" | "verify";

interface Task {
  index: number;
  name: string;
  status: TaskStatus;
  type?: "backend" | "frontend" | "mixed";
  criteria?: string[];
  blockedReason?: string;
}

interface PhaseApproval {
  phase: Phase;
  approvedAt: number;
  summary?: string;
}

interface PlanTrackerState {
  tasks: Task[];
  currentIndex: number;
  approvals: PhaseApproval[];
  feature?: string;
  specPath?: string;
}

interface PlanTrackerDetails {
  action: string;
  state: PlanTrackerState;
  error?: string;
}

// ============================================================
// Tool Schema
// ============================================================

const PlanTrackerParams = Type.Object({
  action: StringEnum(["init", "status", "update", "clear", "approve", "check_approval"] as const),
  
  // For init
  tasks: Type.Optional(Type.Array(Type.Object({
    name: Type.String(),
    type: Type.Optional(StringEnum(["backend", "frontend", "mixed"] as const)),
    criteria: Type.Optional(Type.Array(Type.String())),
  }))),
  feature: Type.Optional(Type.String({ description: "Feature name" })),
  specPath: Type.Optional(Type.String({ description: "Path to spec file" })),
  
  // For update
  index: Type.Optional(Type.Number({ description: "Task index (0-based)" })),
  status: Type.Optional(StringEnum(["pending", "in_progress", "complete", "blocked"] as const)),
  blockedReason: Type.Optional(Type.String({ description: "Reason if blocked" })),
  
  // For approve/check_approval
  phase: Type.Optional(StringEnum(["spec", "plan", "execute", "verify"] as const)),
  summary: Type.Optional(Type.String({ description: "Approval summary" })),
});

// ============================================================
// Extension
// ============================================================

export default function planTrackerExtension(pi: ExtensionAPI): void {
  // In-memory state (reconstructed from session)
  let state: PlanTrackerState = {
    tasks: [],
    currentIndex: 0,
    approvals: [],
  };

  /**
   * Reconstruct state from session entries
   */
  const reconstructState = (ctx: ExtensionContext) => {
    state = {
      tasks: [],
      currentIndex: 0,
      approvals: [],
    };

    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type !== "message") continue;
      const msg = entry.message;
      if (msg.role !== "toolResult" || msg.toolName !== "plan_tracker_ide") continue;

      const details = msg.details as PlanTrackerDetails | undefined;
      if (details?.state) {
        state = details.state;
      }
    }

    updateStatusBar(ctx);
  };

  /**
   * Update status bar with progress
   */
  const updateStatusBar = (ctx: ExtensionContext) => {
    if (state.tasks.length === 0) {
      ctx.ui?.setStatus?.("plan-tracker", undefined);
      ctx.ui?.setWidget?.("plan-tracker", undefined);
      return;
    }

    const complete = state.tasks.filter(t => t.status === "complete").length;
    const total = state.tasks.length;
    const current = state.tasks[state.currentIndex];
    
    const theme = ctx.ui?.theme;
    if (theme) {
      const progress = `${complete}/${total}`;
      const statusText = current 
        ? `📋 ${progress} | ${current.name}`
        : `📋 ${progress}`;
      ctx.ui?.setStatus?.("plan-tracker", theme.fg("accent", statusText));
    }
  };

  // Reconstruct on session events
  pi.on("session_start", async (_event, ctx) => reconstructState(ctx));
  pi.on("session_tree", async (_event, ctx) => reconstructState(ctx));

  // ============================================================
  // Register Tool
  // ============================================================

  pi.registerTool({
    name: "plan_tracker_ide",
    label: "Plan Tracker",
    description: `Track SDLC task progress. Actions:
- init: Initialize with tasks [{name, type?, criteria?}], feature name, specPath
- status: Get current progress and active task
- update: Update task by index with status (pending/in_progress/complete/blocked)
- clear: Clear all tasks after verification
- approve: Mark phase as approved (spec/plan/execute/verify) with optional summary
- check_approval: Check if phase is already approved`,
    parameters: PlanTrackerParams,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      switch (params.action) {
        // --------------------------------------------------------
        // INIT
        // --------------------------------------------------------
        case "init": {
          if (!params.tasks || params.tasks.length === 0) {
            return {
              content: [{ type: "text", text: "Error: tasks array required for init" }],
              details: { action: "init", state, error: "tasks required" } as PlanTrackerDetails,
            };
          }

          state.tasks = params.tasks.map((t, i) => ({
            index: i,
            name: t.name,
            status: "pending" as TaskStatus,
            type: t.type,
            criteria: t.criteria,
          }));
          state.currentIndex = 0;
          state.feature = params.feature;
          state.specPath = params.specPath;

          updateStatusBar(ctx);

          const summary = state.tasks.map((t, i) => 
            `${i}. [${t.status}] ${t.name}${t.type ? ` (${t.type})` : ""}`
          ).join("\n");

          return {
            content: [{ type: "text", text: `Initialized ${state.tasks.length} tasks:\n${summary}` }],
            details: { action: "init", state: { ...state } } as PlanTrackerDetails,
          };
        }

        // --------------------------------------------------------
        // STATUS
        // --------------------------------------------------------
        case "status": {
          if (state.tasks.length === 0) {
            return {
              content: [{ type: "text", text: "No tasks tracked. Use init to start." }],
              details: { action: "status", state: { ...state } } as PlanTrackerDetails,
            };
          }

          const complete = state.tasks.filter(t => t.status === "complete").length;
          const blocked = state.tasks.filter(t => t.status === "blocked").length;
          const current = state.tasks[state.currentIndex];

          let text = `Progress: ${complete}/${state.tasks.length}`;
          if (blocked > 0) text += ` (${blocked} blocked)`;
          text += "\n\n";

          text += state.tasks.map((t, i) => {
            const marker = t.status === "complete" ? "✓" 
              : t.status === "in_progress" ? "→"
              : t.status === "blocked" ? "✗"
              : "○";
            const suffix = i === state.currentIndex ? " ← current" : "";
            return `${marker} ${i}. ${t.name} [${t.status}]${suffix}`;
          }).join("\n");

          if (current?.criteria?.length) {
            text += `\n\nCurrent task criteria:\n${current.criteria.map(c => `- ${c}`).join("\n")}`;
          }

          // Show approvals
          if (state.approvals.length > 0) {
            text += "\n\nApproved phases: " + state.approvals.map(a => a.phase).join(", ");
          }

          return {
            content: [{ type: "text", text }],
            details: { action: "status", state: { ...state } } as PlanTrackerDetails,
          };
        }

        // --------------------------------------------------------
        // UPDATE
        // --------------------------------------------------------
        case "update": {
          if (params.index === undefined) {
            return {
              content: [{ type: "text", text: "Error: index required for update" }],
              details: { action: "update", state: { ...state }, error: "index required" } as PlanTrackerDetails,
            };
          }

          if (!params.status) {
            return {
              content: [{ type: "text", text: "Error: status required for update" }],
              details: { action: "update", state: { ...state }, error: "status required" } as PlanTrackerDetails,
            };
          }

          const task = state.tasks[params.index];
          if (!task) {
            return {
              content: [{ type: "text", text: `Error: task ${params.index} not found` }],
              details: { action: "update", state: { ...state }, error: "task not found" } as PlanTrackerDetails,
            };
          }

          task.status = params.status;
          if (params.status === "blocked" && params.blockedReason) {
            task.blockedReason = params.blockedReason;
          }

          // Auto-advance currentIndex to next pending/in_progress task
          if (params.status === "complete") {
            const nextPending = state.tasks.findIndex((t, i) => 
              i > params.index! && (t.status === "pending" || t.status === "in_progress")
            );
            if (nextPending !== -1) {
              state.currentIndex = nextPending;
            }
          }

          updateStatusBar(ctx);

          return {
            content: [{ type: "text", text: `Task ${params.index} "${task.name}" → ${params.status}` }],
            details: { action: "update", state: { ...state } } as PlanTrackerDetails,
          };
        }

        // --------------------------------------------------------
        // CLEAR
        // --------------------------------------------------------
        case "clear": {
          const count = state.tasks.length;
          state = {
            tasks: [],
            currentIndex: 0,
            approvals: [], // Keep approvals? Or clear?
          };

          updateStatusBar(ctx);

          return {
            content: [{ type: "text", text: `Cleared ${count} tasks` }],
            details: { action: "clear", state: { ...state } } as PlanTrackerDetails,
          };
        }

        // --------------------------------------------------------
        // APPROVE
        // --------------------------------------------------------
        case "approve": {
          if (!params.phase) {
            return {
              content: [{ type: "text", text: "Error: phase required for approve" }],
              details: { action: "approve", state: { ...state }, error: "phase required" } as PlanTrackerDetails,
            };
          }

          // Check if already approved
          const existing = state.approvals.find(a => a.phase === params.phase);
          if (existing) {
            return {
              content: [{ type: "text", text: `Phase "${params.phase}" already approved` }],
              details: { action: "approve", state: { ...state } } as PlanTrackerDetails,
            };
          }

          state.approvals.push({
            phase: params.phase,
            approvedAt: Date.now(),
            summary: params.summary,
          });

          return {
            content: [{ type: "text", text: `Phase "${params.phase}" approved${params.summary ? `: ${params.summary}` : ""}` }],
            details: { action: "approve", state: { ...state } } as PlanTrackerDetails,
          };
        }

        // --------------------------------------------------------
        // CHECK_APPROVAL
        // --------------------------------------------------------
        case "check_approval": {
          if (!params.phase) {
            return {
              content: [{ type: "text", text: "Error: phase required for check_approval" }],
              details: { action: "check_approval", state: { ...state }, error: "phase required" } as PlanTrackerDetails,
            };
          }

          const approval = state.approvals.find(a => a.phase === params.phase);
          if (approval) {
            return {
              content: [{ type: "text", text: `Phase "${params.phase}" is APPROVED. Do not re-ask for confirmation.${approval.summary ? ` Summary: ${approval.summary}` : ""}` }],
              details: { action: "check_approval", state: { ...state } } as PlanTrackerDetails,
            };
          }

          return {
            content: [{ type: "text", text: `Phase "${params.phase}" is NOT approved. Proceed with review.` }],
            details: { action: "check_approval", state: { ...state } } as PlanTrackerDetails,
          };
        }

        // --------------------------------------------------------
        // DEFAULT
        // --------------------------------------------------------
        default:
          return {
            content: [{ type: "text", text: `Unknown action: ${params.action}` }],
            details: { action: params.action, state: { ...state }, error: "unknown action" } as PlanTrackerDetails,
          };
      }
    },

    // ============================================================
    // Renderers
    // ============================================================

    renderCall(args, theme, _context) {
      let text = theme.fg("toolTitle", theme.bold("plan_tracker ")) + theme.fg("muted", args.action);
      if (args.index !== undefined) text += ` ${theme.fg("accent", `#${args.index}`)}`;
      if (args.status) text += ` → ${theme.fg("dim", args.status)}`;
      if (args.phase) text += ` ${theme.fg("accent", args.phase)}`;
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme, _context) {
      const details = result.details as PlanTrackerDetails | undefined;
      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "", 0, 0);
      }

      if (details.error) {
        return new Text(theme.fg("error", `Error: ${details.error}`), 0, 0);
      }

      const { state: s, action } = details;

      switch (action) {
        case "init": {
          let text = theme.fg("success", "✓ ") + theme.fg("muted", `Initialized ${s.tasks.length} tasks`);
          if (s.feature) text += theme.fg("dim", ` (${s.feature})`);
          if (expanded) {
            text += "\n" + s.tasks.map((t, i) => 
              `  ${theme.fg("dim", "○")} ${theme.fg("accent", `${i}.`)} ${t.name}`
            ).join("\n");
          }
          return new Text(text, 0, 0);
        }

        case "status": {
          const complete = s.tasks.filter(t => t.status === "complete").length;
          let text = theme.fg("accent", `${complete}/${s.tasks.length}`);
          
          if (expanded && s.tasks.length > 0) {
            text += "\n" + s.tasks.map((t, i) => {
              const marker = t.status === "complete" ? theme.fg("success", "✓")
                : t.status === "in_progress" ? theme.fg("warning", "→")
                : t.status === "blocked" ? theme.fg("error", "✗")
                : theme.fg("dim", "○");
              const current = i === s.currentIndex ? theme.fg("accent", " ←") : "";
              return `  ${marker} ${t.name}${current}`;
            }).join("\n");
          }
          return new Text(text, 0, 0);
        }

        case "update": {
          const text = result.content[0];
          return new Text(theme.fg("success", "✓ ") + theme.fg("muted", text?.type === "text" ? text.text : ""), 0, 0);
        }

        case "clear":
          return new Text(theme.fg("success", "✓ ") + theme.fg("muted", "Cleared"), 0, 0);

        case "approve":
          return new Text(theme.fg("success", "✓ ") + theme.fg("muted", `Approved`), 0, 0);

        case "check_approval": {
          const approval = s.approvals.find(a => result.content[0]?.type === "text" && result.content[0].text.includes(a.phase));
          const isApproved = result.content[0]?.type === "text" && result.content[0].text.includes("APPROVED");
          return new Text(
            isApproved 
              ? theme.fg("success", "✓ Approved") 
              : theme.fg("warning", "⏳ Pending"),
            0, 0
          );
        }

        default:
          return new Text(theme.fg("dim", action), 0, 0);
      }
    },
  });

  // ============================================================
  // Commands
  // ============================================================

  pi.registerCommand("tasks", {
    description: "Show current task tracker status",
    handler: async (_args, ctx) => {
      if (state.tasks.length === 0) {
        ctx.ui?.notify?.("No tasks tracked", "info");
        return;
      }

      const complete = state.tasks.filter(t => t.status === "complete").length;
      const lines = [
        `Progress: ${complete}/${state.tasks.length}`,
        "",
        ...state.tasks.map((t, i) => {
          const marker = t.status === "complete" ? "✓" 
            : t.status === "in_progress" ? "→"
            : t.status === "blocked" ? "✗"
            : "○";
          const current = i === state.currentIndex ? " ← current" : "";
          return `${marker} ${i}. ${t.name} [${t.status}]${current}`;
        }),
      ];

      if (state.approvals.length > 0) {
        lines.push("", `Approved: ${state.approvals.map(a => a.phase).join(", ")}`);
      }

      ctx.ui?.notify?.(lines.join("\n"), "info");
    },
  });
}
