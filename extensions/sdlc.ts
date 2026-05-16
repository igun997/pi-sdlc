import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text, Spacer } from "@earendil-works/pi-tui";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

// ============================================================
// Types
// ============================================================

interface ModelTier {
  model: string;
  thinking?: string;
}

interface CommandConfig {
  autoAdvance?: boolean;
  useMemctx?: boolean;
  useTDD?: boolean;
  gates?: string[];
  onFail?: string;
}

interface SDLCConfig {
  sdlc: {
    tools?: string[];
    commands?: Record<string, CommandConfig>;
    modelTiers?: Record<string, ModelTier>;
    rules?: Record<string, string[]>;
  };
}

interface AgentFrontmatter {
  name: string;
  description?: string;
  kind?: string;
  execution?: string;
  command?: string;
  model?: string;
  skills?: string;
}

interface DiscoveredAgent extends AgentFrontmatter {
  filePath: string;
  content: string;
}

// ============================================================
// Config Store
// ============================================================

function resolvePackageRoot(): string {
  const entryDir = dirname(fileURLToPath(import.meta.url));
  let current = entryDir;
  while (true) {
    if (existsSync(join(current, "default-config.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return entryDir;
    current = parent;
  }
}

function loadDefaultConfig(): SDLCConfig {
  const pkgRoot = resolvePackageRoot();
  const defaultPath = join(pkgRoot, "default-config.json");
  if (existsSync(defaultPath)) {
    return JSON.parse(readFileSync(defaultPath, "utf-8"));
  }
  return { sdlc: {} };
}

function loadUserConfig(cwd: string): Partial<SDLCConfig> {
  // Check project-level config first
  const projectConfig = join(cwd, "sdlc.config.json");
  if (existsSync(projectConfig)) {
    try {
      const raw = JSON.parse(readFileSync(projectConfig, "utf-8"));
      // Convert old format to new format
      if (raw.tier && raw.models) {
        return {
          sdlc: {
            modelTiers: Object.fromEntries(
              Object.entries(raw.models).map(([tier, models]: [string, any]) => [
                tier === raw.tier ? "current" : tier,
                { model: models.spec || models.execute || models.verify }
              ])
            )
          }
        };
      }
      return raw;
    } catch {
      return {};
    }
  }
  return {};
}

function mergeConfig(base: SDLCConfig, override: Partial<SDLCConfig>): SDLCConfig {
  return {
    sdlc: {
      ...base.sdlc,
      ...override.sdlc,
      commands: { ...base.sdlc.commands, ...override.sdlc?.commands },
      modelTiers: { ...base.sdlc.modelTiers, ...override.sdlc?.modelTiers },
      rules: { ...base.sdlc.rules, ...override.sdlc?.rules },
    }
  };
}

// ============================================================
// Agent Discovery
// ============================================================

function discoverAgents(pkgRoot: string): DiscoveredAgent[] {
  const agentsDir = join(pkgRoot, "agents");
  if (!existsSync(agentsDir)) return [];

  const agents: DiscoveredAgent[] = [];
  const files = readdirSync(agentsDir).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const filePath = join(agentsDir, file);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      if (data.name && data.kind === "entrypoint") {
        agents.push({
          ...data as AgentFrontmatter,
          filePath,
          content: content.trim(),
        });
      }
    } catch {
      // Skip invalid agent files
    }
  }

  return agents;
}

// ============================================================
// Model Management
// ============================================================

function findModel(pi: ExtensionAPI, modelId: string): any | null {
  const registry = (pi as any).modelRegistry ?? (pi as any).getModelRegistry?.();
  if (!registry?.getAllModels) return null;

  const models = registry.getAllModels();

  // Try exact match (provider/model)
  if (modelId.includes("/")) {
    const [provider, id] = modelId.split("/", 2);
    const exact = models.find((m: any) => m.provider === provider && m.id === id);
    if (exact) return exact;
  }

  // Try partial match
  return models.find((m: any) => 
    m.id === modelId || m.id?.includes(modelId) || modelId.includes(m.id)
  ) || null;
}

async function switchModel(pi: ExtensionAPI, ctx: any, modelId: string): Promise<boolean> {
  const model = findModel(pi, modelId);
  if (!model) {
    ctx.ui?.notify?.(`Model not found: ${modelId}`, "error");
    return false;
  }

  try {
    const success = await (pi as any).setModel(model);
    if (success) {
      ctx.ui?.notify?.(`Model: ${model.provider}/${model.id}`, "info");
      return true;
    }
    ctx.ui?.notify?.(`No API key for: ${model.provider}/${model.id}`, "error");
    return false;
  } catch (e) {
    ctx.ui?.notify?.(`Model switch failed: ${e}`, "error");
    return false;
  }
}

function getAvailableModels(pi: ExtensionAPI): Array<{ provider: string; id: string; fullId: string }> {
  const registry = (pi as any).modelRegistry ?? (pi as any).getModelRegistry?.();
  if (!registry?.getAllModels) return [];

  return registry.getAllModels().map((m: any) => ({
    provider: m.provider || "unknown",
    id: m.id || m.name || String(m),
    fullId: m.provider && m.id ? `${m.provider}/${m.id}` : m.id || String(m),
  }));
}

// ============================================================
// Skill Resolution
// ============================================================

function resolveSkillPath(skillName: string): string | null {
  // Check common skill locations
  const locations = [
    join(process.env.HOME || "", ".pi", "agent", "git", "github.com", "coctostan", "pi-superpowers", "skills", skillName, "SKILL.md"),
    join(process.env.HOME || "", ".pi", "skills", skillName, "SKILL.md"),
  ];

  for (const loc of locations) {
    if (existsSync(loc)) return loc;
  }
  return null;
}

function buildSkillPrompt(skills: string): string {
  const skillNames = skills.split(",").map(s => s.trim()).filter(Boolean);
  const prompts: string[] = [];

  for (const name of skillNames) {
    const path = resolveSkillPath(name);
    if (path) {
      prompts.push(`Read and follow skill: ${path}`);
    }
  }

  return prompts.join("\n");
}

// ============================================================
// Rule Loading
// ============================================================

function loadRules(pkgRoot: string, ruleKeys: string[]): string {
  const rulesDir = join(pkgRoot, "docs", "rules");
  const contents: string[] = [];

  for (const key of ruleKeys) {
    const rulePath = join(rulesDir, key);
    if (existsSync(rulePath)) {
      try {
        contents.push(`## Rules: ${key}\n\n${readFileSync(rulePath, "utf-8")}`);
      } catch {
        // Skip unreadable rules
      }
    }
  }

  return contents.join("\n\n---\n\n");
}

// ============================================================
// Extension Entry
// ============================================================

export default function registerSDLCExtension(pi: ExtensionAPI): void {
  const pkgRoot = resolvePackageRoot();
  const defaultConfig = loadDefaultConfig();
  const agents = discoverAgents(pkgRoot);

  let currentConfig = defaultConfig;

  // Reload config on session start
  const reloadConfig = (cwd: string) => {
    const userConfig = loadUserConfig(cwd);
    currentConfig = mergeConfig(defaultConfig, userConfig);
  };

  // ============================================================
  // Register Slash Commands from Agent Frontmatter
  // ============================================================

  for (const agent of agents) {
    const commandName = agent.command || agent.name;
    if (!commandName) continue;

    pi.registerCommand(commandName, {
      description: agent.description || `Run ${agent.name}`,
      handler: async (args, ctx) => {
        reloadConfig(ctx.cwd);

        // Switch model based on agent tier
        if (agent.model && currentConfig.sdlc.modelTiers) {
          const tier = currentConfig.sdlc.modelTiers[agent.model];
          if (tier?.model) {
            await switchModel(pi, ctx, tier.model);
          }
        }

        // Build prompt with skills
        const parts: string[] = [];

        // Add agent instructions
        parts.push(agent.content);

        // Add skill references
        if (agent.skills) {
          parts.push(buildSkillPrompt(agent.skills));
        }

        // Add task from args
        if (args) {
          parts.push(`\n## Task\n\n${args}`);
        }

        // Send as user message
        ctx.ui?.appendEntry?.({
          type: "user",
          message: { role: "user", content: parts.join("\n\n") },
          timestamp: Date.now(),
        });
      },
    });
  }

  // ============================================================
  // /sdlc-settings Command
  // ============================================================

  pi.registerCommand("sdlc-settings", {
    description: "Configure SDLC model tiers and behavior",
    handler: async (args, ctx) => {
      reloadConfig(ctx.cwd);

      if (args === "show") {
        const tiers = currentConfig.sdlc.modelTiers || {};
        const lines = Object.entries(tiers)
          .map(([name, tier]) => `${name}: ${tier.model}`)
          .join("\n");
        ctx.ui?.notify?.(`Model Tiers:\n${lines}`, "info");
        return;
      }

      // Interactive menu
      const menuItems: SelectItem[] = [
        { value: "tiers", label: "🎯 Model Tiers", description: "Configure model per tier" },
        { value: "show", label: "📋 Show Config", description: "Display current configuration" },
        { value: "cancel", label: "❌ Cancel", description: "Exit" },
      ];

      const choice = await ctx.ui?.custom?.<string | null>((tui, theme, _kb, done) => {
        const container = new Container();
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
        container.addChild(new Text(theme.fg("accent", theme.bold("⚙️ SDLC Settings")), 1, 0));
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

      if (choice === "show") {
        const tiers = currentConfig.sdlc.modelTiers || {};
        const lines = Object.entries(tiers)
          .map(([name, tier]) => `${name}: ${tier.model} (thinking: ${tier.thinking || "off"})`)
          .join("\n");
        ctx.ui?.notify?.(`Model Tiers:\n${lines}`, "info");
      }

      if (choice === "tiers") {
        const tiers = Object.keys(currentConfig.sdlc.modelTiers || {});
        const tierItems: SelectItem[] = tiers.map(t => ({
          value: t,
          label: t,
          description: currentConfig.sdlc.modelTiers?.[t]?.model || "not set",
        }));

        const tierChoice = await ctx.ui?.custom?.<string | null>((tui, theme, _kb, done) => {
          const container = new Container();
          container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
          container.addChild(new Text(theme.fg("accent", theme.bold("🎯 Select Tier to Edit")), 1, 0));
          container.addChild(new Spacer(1));

          const selectList = new SelectList(tierItems, Math.min(tierItems.length, 8), {
            selectedPrefix: (t) => theme.fg("accent", t),
            selectedText: (t) => theme.fg("accent", t),
            description: (t) => theme.fg("muted", t),
          });
          selectList.onSelect = (item) => done(item.value);
          selectList.onCancel = () => done(null);
          container.addChild(selectList);

          container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

          return {
            render: (w) => container.render(w),
            invalidate: () => container.invalidate(),
            handleInput: (data) => { selectList.handleInput(data); tui.requestRender(); },
          };
        });

        if (tierChoice) {
          const models = getAvailableModels(pi);
          const modelItems: SelectItem[] = models.slice(0, 50).map(m => ({
            value: m.fullId,
            label: m.fullId,
            description: m.provider,
          }));

          const modelChoice = await ctx.ui?.custom?.<string | null>((tui, theme, _kb, done) => {
            const container = new Container();
            container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
            container.addChild(new Text(theme.fg("accent", theme.bold(`🔧 Select Model for ${tierChoice}`)), 1, 0));
            container.addChild(new Spacer(1));

            const selectList = new SelectList(modelItems, 15, {
              selectedPrefix: (t) => theme.fg("accent", t),
              selectedText: (t) => theme.fg("accent", t),
              description: (t) => theme.fg("muted", t),
              scrollInfo: (t) => theme.fg("dim", t),
            });
            selectList.onSelect = (item) => done(item.value);
            selectList.onCancel = () => done(null);
            container.addChild(selectList);

            container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

            return {
              render: (w) => container.render(w),
              invalidate: () => container.invalidate(),
              handleInput: (data) => { selectList.handleInput(data); tui.requestRender(); },
            };
          });

          if (modelChoice) {
            // Save to project config
            const configPath = join(ctx.cwd, "sdlc.config.json");
            let projectConfig: any = {};
            if (existsSync(configPath)) {
              try {
                projectConfig = JSON.parse(readFileSync(configPath, "utf-8"));
              } catch {}
            }

            if (!projectConfig.sdlc) projectConfig.sdlc = {};
            if (!projectConfig.sdlc.modelTiers) projectConfig.sdlc.modelTiers = {};
            projectConfig.sdlc.modelTiers[tierChoice] = { model: modelChoice };

            writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));
            ctx.ui?.notify?.(`✅ ${tierChoice} → ${modelChoice}`, "success");
            reloadConfig(ctx.cwd);
          }
        }
      }
    },
  });

  // ============================================================
  // Input Interception for Model Switching
  // ============================================================

  pi.on("input", async (event, ctx) => {
    const text = event.text?.trim() || "";

    // Match /sdlc-* or /skill:sdlc-* commands
    const cmdMatch = text.match(/^\/(sdlc-(?:spec|plan|execute|verify))(?:\s|$)/);
    const skillMatch = text.match(/^\/skill:(sdlc-(?:spec|plan|execute|verify))(?:\s|$)/);

    const commandName = cmdMatch?.[1] || skillMatch?.[1];
    if (!commandName) return { action: "continue" as const };

    reloadConfig(ctx.cwd);

    // Find agent for this command
    const agent = agents.find(a => (a.command || a.name) === commandName);
    if (!agent?.model) return { action: "continue" as const };

    // Switch to agent's model tier
    const tier = currentConfig.sdlc.modelTiers?.[agent.model];
    if (tier?.model) {
      await switchModel(pi, ctx, tier.model);
    }

    return { action: "continue" as const };
  });

  // ============================================================
  // Session Lifecycle
  // ============================================================

  pi.on("session_start", async (_event, ctx) => {
    reloadConfig(ctx.cwd);

    // Show status if config exists
    if (existsSync(join(ctx.cwd, "sdlc.config.json"))) {
      const reasoning = currentConfig.sdlc.modelTiers?.reasoning?.model || "default";
      ctx.ui?.setStatus?.("sdlc", `SDLC: ${reasoning.split("/").pop()}`);
    }
  });
}
