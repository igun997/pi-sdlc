import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text, Spacer } from "@earendil-works/pi-tui";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

interface TierModels {
  spec: string;
  plan: string;
  execute: string;
  verify: string;
}

interface SDLCConfig {
  tier: string;
  autoAdvance?: boolean;
  gates?: string[];
  onFail?: string;
  testCommand?: string;
  buildCommand?: string;
  models: Record<string, TierModels>;
}

const DEFAULT_TIERS: Record<string, TierModels> = {
  high: {
    spec: "claude-opus-4-7",
    plan: "claude-opus-4-6",
    execute: "claude-sonnet-4-6",
    verify: "claude-sonnet-4-6",
  },
  medium: {
    spec: "gemini-2.5-pro",
    plan: "gemini-2.5-pro",
    execute: "gpt-4o",
    verify: "gpt-4o-mini",
  },
  budget: {
    spec: "deepseek-r1",
    plan: "deepseek-r1",
    execute: "deepseek-coder-v3",
    verify: "gemini-flash",
  },
};

function loadConfig(cwd: string): SDLCConfig {
  const configPath = join(cwd, "sdlc.config.json");
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    } catch {
      // Fall through to defaults
    }
  }
  return {
    tier: "medium",
    models: { ...DEFAULT_TIERS },
  };
}

function saveConfig(cwd: string, config: SDLCConfig): void {
  const configPath = join(cwd, "sdlc.config.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getAvailableModels(pi: ExtensionAPI): string[] {
  const registry = pi.getModelRegistry?.() ?? (pi as any).modelRegistry;
  if (!registry?.getAllModels) return [];
  
  const models = registry.getAllModels();
  return models.map((m: any) => {
    if (m.provider && m.id) {
      return `${m.provider}/${m.id}`;
    }
    return m.id || m.name || String(m);
  });
}

export default function (pi: ExtensionAPI) {
  // Register /sdlc-choose command
  pi.registerCommand("sdlc-choose", {
    description: "Configure SDLC model tiers interactively",
    handler: async (args, ctx) => {
      const config = loadConfig(ctx.cwd);
      const currentTier = process.env.SDLC_TIER || config.tier || "medium";
      const currentModels = config.models[currentTier] || DEFAULT_TIERS[currentTier] || DEFAULT_TIERS.medium;

      // Quick commands
      if (args) {
        const cmd = args.trim().toLowerCase();
        
        if (cmd === "show") {
          ctx.ui.notify(
            `Tier: ${currentTier}\n` +
            `Spec/Plan: ${currentModels.spec}\n` +
            `Execute: ${currentModels.execute}\n` +
            `Verify: ${currentModels.verify}`,
            "info"
          );
          return;
        }
        
        if (cmd === "list") {
          const models = getAvailableModels(pi);
          ctx.ui.notify(`Available models (${models.length}):\n${models.slice(0, 20).join("\n")}${models.length > 20 ? "\n..." : ""}`, "info");
          return;
        }
        
        if (["high", "medium", "budget"].includes(cmd) || config.models[cmd]) {
          config.tier = cmd;
          saveConfig(ctx.cwd, config);
          process.env.SDLC_TIER = cmd;
          ctx.ui.notify(`Tier set to: ${cmd}`, "success");
          return;
        }
      }

      // Interactive menu
      const menuItems: SelectItem[] = [
        { value: "tier", label: "🎯 Set tier", description: "high/medium/budget presets" },
        { value: "customize", label: "🔧 Customize models", description: "Pick specific models per phase" },
        { value: "show", label: "📋 Show current", description: "Display current configuration" },
        { value: "save", label: "💾 Save as custom tier", description: "Save current as named tier" },
        { value: "cancel", label: "❌ Cancel", description: "Exit without changes" },
      ];

      const menuChoice = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
        const container = new Container();
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
        container.addChild(new Text(theme.fg("accent", theme.bold("📋 SDLC Configuration")), 1, 0));
        container.addChild(new Spacer(1));
        container.addChild(new Text(theme.fg("muted", `Current tier: ${currentTier}`), 1, 0));
        container.addChild(new Text(theme.fg("dim", `  Spec/Plan: ${currentModels.spec}`), 1, 0));
        container.addChild(new Text(theme.fg("dim", `  Execute: ${currentModels.execute}`), 1, 0));
        container.addChild(new Text(theme.fg("dim", `  Verify: ${currentModels.verify}`), 1, 0));
        container.addChild(new Spacer(1));

        const selectList = new SelectList(menuItems, 5, {
          selectedPrefix: (t) => theme.fg("accent", t),
          selectedText: (t) => theme.fg("accent", t),
          description: (t) => theme.fg("muted", t),
        });
        selectList.onSelect = (item) => done(item.value);
        selectList.onCancel = () => done(null);
        container.addChild(selectList);

        container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 1, 0));
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

        return {
          render: (w) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data) => { selectList.handleInput(data); tui.requestRender(); },
        };
      });

      if (!menuChoice || menuChoice === "cancel") return;

      if (menuChoice === "show") {
        const tierModels = config.models[currentTier] || currentModels;
        ctx.ui.notify(
          `📋 Current Configuration\n\n` +
          `Tier: ${currentTier}\n\n` +
          `Models:\n` +
          `  Spec/Plan: ${tierModels.spec}\n` +
          `  Execute: ${tierModels.execute}\n` +
          `  Verify: ${tierModels.verify}`,
          "info"
        );
        return;
      }

      if (menuChoice === "tier") {
        // Tier selection
        const tierItems: SelectItem[] = [
          { value: "high", label: "💎 High", description: "Claude Opus/Sonnet (best quality)" },
          { value: "medium", label: "⚡ Medium", description: "Gemini Pro, GPT-4o (balanced)" },
          { value: "budget", label: "💰 Budget", description: "DeepSeek, Qwen (cost-effective)" },
        ];
        
        // Add custom tiers
        for (const tierName of Object.keys(config.models)) {
          if (!["high", "medium", "budget"].includes(tierName)) {
            tierItems.push({ value: tierName, label: `📁 ${tierName}`, description: "Custom tier" });
          }
        }

        const tierChoice = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
          const container = new Container();
          container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
          container.addChild(new Text(theme.fg("accent", theme.bold("🎯 Select Tier")), 1, 0));
          container.addChild(new Spacer(1));

          const selectList = new SelectList(tierItems, Math.min(tierItems.length, 8), {
            selectedPrefix: (t) => theme.fg("accent", t),
            selectedText: (t) => theme.fg("accent", t),
            description: (t) => theme.fg("muted", t),
          });
          selectList.onSelect = (item) => done(item.value);
          selectList.onCancel = () => done(null);
          container.addChild(selectList);

          container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 1, 0));
          container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

          return {
            render: (w) => container.render(w),
            invalidate: () => container.invalidate(),
            handleInput: (data) => { selectList.handleInput(data); tui.requestRender(); },
          };
        });

        if (tierChoice) {
          config.tier = tierChoice;
          if (!config.models[tierChoice]) {
            config.models[tierChoice] = { ...DEFAULT_TIERS[tierChoice] || DEFAULT_TIERS.medium };
          }
          saveConfig(ctx.cwd, config);
          process.env.SDLC_TIER = tierChoice;
          ctx.ui.notify(`✅ Tier set to: ${tierChoice}`, "success");
        }
        return;
      }

      if (menuChoice === "customize") {
        // Get available models for selection
        const availableModels = getAvailableModels(pi);
        const phases = [
          { key: "spec", label: "Spec/Plan", description: "Reasoning, architecture, planning" },
          { key: "execute", label: "Execute", description: "Coding, implementation" },
          { key: "verify", label: "Verify", description: "Testing, review, verification" },
        ] as const;

        const newModels: Partial<TierModels> = {};

        for (const phase of phases) {
          const currentModel = currentModels[phase.key as keyof TierModels];
          
          // Build model items - current first, then others
          const modelItems: SelectItem[] = [];
          
          // Add current as first option
          modelItems.push({
            value: currentModel,
            label: `✓ ${currentModel}`,
            description: "(current)",
          });

          // Add common models
          const commonModels = [
            "claude-opus-4-7", "claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5",
            "gemini-2.5-pro", "gemini-2.5-flash", "gemini-flash",
            "gpt-4o", "gpt-4o-mini", "o1", "o3-mini",
            "deepseek-r1", "deepseek-coder-v3",
            "qwen-max", "qwen-coder-plus",
          ].filter(m => m !== currentModel);

          for (const model of commonModels) {
            modelItems.push({ value: model, label: model });
          }

          // Add separator and available models
          if (availableModels.length > 0) {
            modelItems.push({ value: "__sep__", label: "─── Available Models ───", description: "" });
            for (const model of availableModels.slice(0, 30)) {
              if (!commonModels.includes(model) && model !== currentModel) {
                modelItems.push({ value: model, label: model });
              }
            }
          }

          const modelChoice = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
            const container = new Container();
            container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
            container.addChild(new Text(theme.fg("accent", theme.bold(`🔧 ${phase.label} Phase`)), 1, 0));
            container.addChild(new Text(theme.fg("muted", phase.description), 1, 0));
            container.addChild(new Spacer(1));

            const selectList = new SelectList(
              modelItems.filter(i => i.value !== "__sep__"),
              Math.min(modelItems.length, 12),
              {
                selectedPrefix: (t) => theme.fg("accent", t),
                selectedText: (t) => theme.fg("accent", t),
                description: (t) => theme.fg("muted", t),
                scrollInfo: (t) => theme.fg("dim", t),
              }
            );
            selectList.onSelect = (item) => done(item.value);
            selectList.onCancel = () => done(null);
            container.addChild(selectList);

            container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 1, 0));
            container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

            return {
              render: (w) => container.render(w),
              invalidate: () => container.invalidate(),
              handleInput: (data) => { selectList.handleInput(data); tui.requestRender(); },
            };
          });

          if (!modelChoice) {
            ctx.ui.notify("Cancelled", "info");
            return;
          }

          newModels[phase.key as keyof TierModels] = modelChoice;
        }

        // Update plan to match spec
        newModels.plan = newModels.spec;

        // Confirm and save
        const confirmChoice = await ctx.ui.confirm(
          "Save Configuration?",
          `Spec/Plan: ${newModels.spec}\nExecute: ${newModels.execute}\nVerify: ${newModels.verify}`
        );

        if (confirmChoice) {
          config.models[currentTier] = newModels as TierModels;
          saveConfig(ctx.cwd, config);
          ctx.ui.notify(`✅ Models saved for tier: ${currentTier}`, "success");
        }
        return;
      }

      if (menuChoice === "save") {
        // Save as custom tier
        const tierName = await ctx.ui.input("Enter tier name:", "custom");
        
        if (tierName && tierName.trim()) {
          const name = tierName.trim().toLowerCase();
          config.models[name] = { ...currentModels };
          config.tier = name;
          saveConfig(ctx.cwd, config);
          process.env.SDLC_TIER = name;
          ctx.ui.notify(`✅ Saved as tier: ${name}`, "success");
        }
        return;
      }
    },
  });

  // Register /sdlc-tier shortcut for quick tier switching
  pi.registerCommand("sdlc-tier", {
    description: "Quick switch SDLC tier (high/medium/budget)",
    handler: async (args, ctx) => {
      if (!args) {
        const config = loadConfig(ctx.cwd);
        const current = process.env.SDLC_TIER || config.tier || "medium";
        ctx.ui.notify(`Current tier: ${current}\n\nUsage: /sdlc-tier <high|medium|budget>`, "info");
        return;
      }

      const tier = args.trim().toLowerCase();
      if (["high", "medium", "budget"].includes(tier)) {
        const config = loadConfig(ctx.cwd);
        config.tier = tier;
        saveConfig(ctx.cwd, config);
        process.env.SDLC_TIER = tier;
        ctx.ui.notify(`✅ Tier: ${tier}`, "success");
      } else {
        ctx.ui.notify(`Invalid tier: ${tier}\nValid: high, medium, budget`, "error");
      }
    },
  });

  // Show current tier on session start
  pi.on("session_start", async (_event, ctx) => {
    const config = loadConfig(ctx.cwd);
    const tier = process.env.SDLC_TIER || config.tier;
    if (tier && existsSync(join(ctx.cwd, "sdlc.config.json"))) {
      ctx.ui.setStatus("sdlc", `SDLC: ${tier}`);
    }
  });
}
