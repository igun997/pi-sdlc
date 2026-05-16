# Anti-Slop Rules

> Prevent generic AI-generated UI patterns.

## What is AI Slop?

Low-quality AI-generated UI that ignores project context:

| Slop Pattern | Why Bad | Instead |
|--------------|---------|---------|
| Purple-blue gradients | Generic, no brand | Project color tokens |
| Glassmorphism cards | Trend-driven | Match existing cards |
| Inter/system fonts | Default, lazy | Project typography |
| Excessive animations | Distracting | Match existing motion |
| "Modern" buzzwords | Meaningless | Clear, specific copy |
| Rounded everything | Generic | Project border-radius |

## The 3-Reference Rule

**Find 3+ existing patterns before creating anything new.**

```
BEFORE writing any component:

1. SEARCH codebase for similar components
2. FIND at least 3 examples
3. IDENTIFY which pattern to follow
4. ASK if none exist or conflict

If <3 references found → ASK user
```

## Check for `_references/` Folder

Projects MAY have a `_references/` folder with design system:

```
_references/
├── README.md              # Brand voice, visual foundations
├── SKILL.md               # Quick rules for AI
├── colors_and_type.css    # Design tokens
├── assets/                # Logos, icons
└── ui_kits/               # Reference components
```

**If exists:**
1. Read README.md first
2. Use tokens from colors_and_type.css
3. Copy patterns from ui_kits/
4. Use assets/ for logos

## Violations

- Inventing new design patterns
- Ignoring existing components
- Generic placeholder copy
- "Looks modern" without reference
- Hardcoding colors instead of tokens
- Ignoring `_references/` when it exists
