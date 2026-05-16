import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@earendil-works/pi-tui";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

// ============================================================
// Types
// ============================================================

interface ModelTierConfig {
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
    modelTiers?: Record<string, ModelTierConfig>;
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
  const projectConfig = join(cwd, "sdlc.config.json");
  if (existsSync(projectConfig)) {
    try {
      return JSON.parse(readFileSync(projectConfig, "utf-8"));
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

function saveUserConfig(cwd: string, config: Partial<SDLCConfig>): void {
  const configPath = join(cwd, "sdlc.config.json");
  writeFileSync(configPath, JSON.stringify(config, null, 2));
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
// Model Helpers (using native pi API)
// ============================================================

async function switchModelByTier(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  config: SDLCConfig,
  tierName: string
): Promise<boolean> {
  const tier = config.sdlc.modelTiers?.[tierName];
  if (!tier?.model) return false;

  const modelId = tier.model;
  
  // Parse provider/id - handle multi-part paths like "local-llm/cx/gpt-5.5"
  const parts = modelId.split("/");
  const provider = parts.length > 1 ? parts[0] : null;
  const id = parts.length > 1 ? parts.slice(1).join("/") : modelId;

  // Use native pi modelRegistry
  const registry = (ctx as any).modelRegistry;
  if (!registry) return false;

  let model = null;
  
  // Try exact match first
  if (provider && id) {
    model = registry.find(provider, id);
  }
  
  // Fallback: search available models
  if (!model) {
    const availableModels = await registry.getAvailable?.() || registry.getAllModels?.() || [];
    model = availableModels.find((m: any) => 
      m.id === modelId || 
      m.id === id ||
      `${m.provider}/${m.id}` === modelId
    );
  }

  if (!model) {
    // Debug: show what we tried
    ctx.ui?.notify?.(`Model "${modelId}" not found (provider=${provider}, id=${id})`, "warning");
    return false;
  }

  try {
    const success = await (pi as any).setModel(model);
    if (success) {
      // Set thinking level if configured
      if (tier.thinking && tier.thinking !== "off") {
        (pi as any).setThinkingLevel?.(tier.thinking);
      }
      ctx.ui?.notify?.(`✅ ${tierName}: ${model.provider}/${model.id}`, "info");
      return true;
    }
    ctx.ui?.notify?.(`No API key for: ${modelId}`, "error");
    return false;
  } catch (e) {
    ctx.ui?.notify?.(`Model switch failed: ${e}`, "error");
    return false;
  }
}

async function selectModelInteractive(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  title: string
): Promise<string | null> {
  const registry = (ctx as any).modelRegistry;
  if (!registry) {
    ctx.ui?.notify?.("Model registry not available", "error");
    return null;
  }

  // Use getAvailable() for models with valid API keys
  let models: Array<{ provider: string; id: string; name?: string }> = [];
  
  if (typeof registry.getAvailable === "function") {
    models = await registry.getAvailable();
  } else if (typeof registry.getAllModels === "function") {
    models = registry.getAllModels();
  } else {
    ctx.ui?.notify?.("Cannot list models", "error");
    return null;
  }

  if (models.length === 0) {
    ctx.ui?.notify?.("No models available", "error");
    return null;
  }

  // Build selection list with search support
  const items: SelectItem[] = models.map((m) => ({
    value: `${m.provider}/${m.id}`,
    label: `${m.provider}/${m.id}`,
    description: m.name || m.provider,
  }));

  // Use custom SelectList with type-to-filter
  const result = await (ctx.ui as any)?.custom?.((tui: any, theme: any, _kb: any, done: (val: string | null) => void) => {
    const container = new Container();
    container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
    container.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));

    const selectList = new SelectList(items, Math.min(items.length, 15), {
      selectedPrefix: (t: string) => theme.fg("accent", t),
      selectedText: (t: string) => theme.fg("accent", t),
      description: (t: string) => theme.fg("muted", t),
      scrollInfo: (t: string) => theme.fg("dim", t),
      noMatch: (t: string) => theme.fg("warning", t),
    });
    selectList.onSelect = (item: SelectItem) => done(item.value as string);
    selectList.onCancel = () => done(null);
    container.addChild(selectList);

    container.addChild(new Text(theme.fg("dim", "↑↓ navigate • type to filter • enter select • esc cancel"), 1, 0));
    container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

    return {
      render: (w: number) => container.render(w),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => { selectList.handleInput(data); tui.requestRender(); },
    };
  });

  return result || null;
}

// ============================================================
// Skill Resolution
// ============================================================

function resolveSkillPath(skillName: string): string | null {
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
// Extension Entry
// ============================================================

export default function registerSDLCExtension(pi: ExtensionAPI): void {
  const pkgRoot = resolvePackageRoot();
  const defaultConfig = loadDefaultConfig();
  const agents = discoverAgents(pkgRoot);

  let currentConfig = defaultConfig;

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

        // Switch model based on agent tier using native pi API
        if (agent.model) {
          await switchModelByTier(pi, ctx, currentConfig, agent.model);
        }

        // Build prompt with skills
        const parts: string[] = [];
        parts.push(agent.content);

        if (agent.skills) {
          parts.push(buildSkillPrompt(agent.skills));
        }

        if (args) {
          parts.push(`\n## Task\n\n${args}`);
        }

        // Send as user message
        (ctx.ui as any)?.appendEntry?.({
          type: "user",
          message: { role: "user", content: parts.join("\n\n") },
          timestamp: Date.now(),
        });
      },
    });
  }

  // ============================================================
  // Command Aliases (shorthand invocations)
  // ============================================================

  const aliases: Record<string, string> = {
    "brainstorm": "sdlc-spec",
    "spec": "sdlc-spec",
    "plan": "sdlc-plan",
    "execute": "sdlc-execute",
    "exec": "sdlc-execute",
    "verify": "sdlc-verify",
    "check": "sdlc-verify",
  };

  for (const [alias, target] of Object.entries(aliases)) {
    const targetAgent = agents.find(a => (a.command || a.name) === target);
    if (!targetAgent) continue;

    pi.registerCommand(alias, {
      description: `Alias for /${target}`,
      handler: async (args, ctx) => {
        reloadConfig(ctx.cwd);

        if (targetAgent.model) {
          await switchModelByTier(pi, ctx, currentConfig, targetAgent.model);
        }

        const parts: string[] = [];
        parts.push(targetAgent.content);

        if (targetAgent.skills) {
          parts.push(buildSkillPrompt(targetAgent.skills));
        }

        if (args) {
          parts.push(`\n## Task\n\n${args}`);
        }

        (ctx.ui as any)?.appendEntry?.({
          type: "user",
          message: { role: "user", content: parts.join("\n\n") },
          timestamp: Date.now(),
        });
      },
    });
  }

  // ============================================================
  // /sdlc-tier - Quick tier switching using native pi select
  // ============================================================

  pi.registerCommand("sdlc-tier", {
    description: "Switch SDLC model tier",
    handler: async (args, ctx) => {
      reloadConfig(ctx.cwd);

      const tiers = Object.keys(currentConfig.sdlc.modelTiers || {});
      if (tiers.length === 0) {
        ctx.ui?.notify?.("No model tiers configured", "error");
        return;
      }

      // If tier name provided as arg, switch directly
      if (args && tiers.includes(args)) {
        const success = await switchModelByTier(pi, ctx, currentConfig, args);
        if (success) {
          const model = currentConfig.sdlc.modelTiers?.[args]?.model || "unknown";
          ctx.ui?.notify?.(`✅ Tier: ${args} → ${model}`, "success");
        }
        return;
      }

      // Otherwise show native pi select
      const tierLabels = tiers.map(t => {
        const model = currentConfig.sdlc.modelTiers?.[t]?.model || "not set";
        return `${t} (${model})`;
      });

      const choice = await ctx.ui?.select?.("Select SDLC Tier:", tierLabels);
      if (!choice) return;

      // Extract tier name from choice
      const tierName = choice.split(" (")[0];
      const success = await switchModelByTier(pi, ctx, currentConfig, tierName);
      if (success) {
        const model = currentConfig.sdlc.modelTiers?.[tierName]?.model || "unknown";
        ctx.ui?.notify?.(`✅ Tier: ${tierName} → ${model}`, "success");
      }
    },
  });

  // ============================================================
  // /sdlc-config - Configure tier models using native pi select
  // ============================================================

  pi.registerCommand("sdlc-config", {
    description: "Configure SDLC model tiers (saved to sdlc.config.json)",
    handler: async (_args, ctx) => {
      reloadConfig(ctx.cwd);

      const tiers = Object.keys(currentConfig.sdlc.modelTiers || {});
      if (tiers.length === 0) {
        ctx.ui?.notify?.("No model tiers to configure", "error");
        return;
      }

      // Select tier to configure
      const tierLabels = tiers.map(t => {
        const model = currentConfig.sdlc.modelTiers?.[t]?.model || "not set";
        return `${t}: ${model}`;
      });

      const tierChoice = await ctx.ui?.select?.("Select tier to configure:", tierLabels);
      if (!tierChoice) return;

      const tierName = tierChoice.split(":")[0].trim();

      // Select new model using native pi select
      const modelId = await selectModelInteractive(pi, ctx, `Select model for ${tierName}:`);
      if (!modelId) return;

      // Save to project config
      const userConfig = loadUserConfig(ctx.cwd);
      if (!userConfig.sdlc) userConfig.sdlc = {};
      if (!userConfig.sdlc.modelTiers) userConfig.sdlc.modelTiers = {};
      userConfig.sdlc.modelTiers[tierName] = { model: modelId };

      saveUserConfig(ctx.cwd, userConfig);
      reloadConfig(ctx.cwd);

      ctx.ui?.notify?.(`✅ ${tierName} → ${modelId}\nSaved to sdlc.config.json`, "success");
    },
  });

  // ============================================================
  // /sdlc-status - Show current configuration
  // ============================================================

  pi.registerCommand("sdlc-status", {
    description: "Show current SDLC configuration",
    handler: async (_args, ctx) => {
      reloadConfig(ctx.cwd);

      const tiers = currentConfig.sdlc.modelTiers || {};
      const lines = Object.entries(tiers)
        .map(([name, tier]) => `  ${name}: ${tier.model}`)
        .join("\n");

      const hasProjectConfig = existsSync(join(ctx.cwd, "sdlc.config.json"));

      ctx.ui?.notify?.(
        `SDLC Model Tiers:\n${lines}\n\nConfig: ${hasProjectConfig ? "sdlc.config.json" : "defaults"}`,
        "info"
      );
    },
  });

  // ============================================================
  // Input Interception for Auto Model Switching
  // ============================================================

  // Natural language triggers: "let brainstorm", "let plan", etc.
  const nlTriggers: Record<string, string> = {
    "brainstorm": "sdlc-spec",
    "spec": "sdlc-spec",
    "plan": "sdlc-plan",
    "execute": "sdlc-execute",
    "exec": "sdlc-execute",
    "implement": "sdlc-execute",
    "verify": "sdlc-verify",
    "check": "sdlc-verify",
  };

  pi.on("input", async (event, ctx) => {
    const text = event.text?.trim() || "";

    // Check for natural language trigger: "let <keyword> ..." or "lets <keyword> ..."
    const nlMatch = text.match(/^lets?\s+(brainstorm|spec|plan|execute|exec|implement|verify|check)(?:\s+(.*))?$/i);
    if (nlMatch) {
      const keyword = nlMatch[1].toLowerCase();
      const rest = nlMatch[2] || "";
      const targetCommand = nlTriggers[keyword];

      if (targetCommand) {
        reloadConfig(ctx.cwd);
        const agent = agents.find(a => (a.command || a.name) === targetCommand);
        
        if (agent) {
          // Switch model tier
          if (agent.model) {
            await switchModelByTier(pi, ctx, currentConfig, agent.model);
          }

          // Transform to slash command
          return {
            action: "transform" as const,
            text: `/${targetCommand} ${rest}`.trim(),
          };
        }
      }
    }

    // Match /sdlc-* commands for model switching
    const cmdMatch = text.match(/^\/(sdlc-(?:spec|plan|execute|verify))(?:\s|$)/);
    if (!cmdMatch) return { action: "continue" as const };

    const commandName = cmdMatch[1];
    reloadConfig(ctx.cwd);

    // Find agent for this command
    const agent = agents.find(a => (a.command || a.name) === commandName);
    if (!agent?.model) return { action: "continue" as const };

    // Switch to agent's model tier
    await switchModelByTier(pi, ctx, currentConfig, agent.model);

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

  // ============================================================
  // Inject Rules Path into System Prompt
  // ============================================================

  pi.on("before_agent_start", async (_event, ctx) => {
    const rulesPath = join(pkgRoot, "docs", "rules");
    
    // Only inject if rules exist
    if (!existsSync(rulesPath)) return;

    const rulesNote = `
## SDLC Rules Location

When skills reference \`docs/rules/\`, use this absolute path:
\`${rulesPath}\`

Example: \`docs/rules/frontend/anti-slop.md\` → \`${rulesPath}/frontend/anti-slop.md\`

Available rule categories:
- frontend/ (anti-slop, components, accessibility, security, performance)
- backend/ (tdd, api-design, error-handling, security, solid, observability)
- general/ (clean-code, git, verification, ai-craftsmanship)
- golang/ (patterns, performance)
- rust/ (patterns, async, performance)
- performance/ (architecture, low-latency, database, profiling)
`;

    return {
      systemPromptOptions: {
        sections: {
          sdlcRules: rulesNote,
        },
      },
    };
  });
}
