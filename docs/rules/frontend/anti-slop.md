# Anti-Slop Rules

> Prevent generic AI-generated UI. Build distinctive, category-aware designs.

## What is AI Slop?

Low-quality AI-generated UI that ignores project context:

| Slop Pattern | Why Bad | Instead |
|--------------|---------|---------|
| Purple-blue gradients | Generic, no brand | Project color tokens |
| Glassmorphism everywhere | Trend-driven | Match existing cards |
| Inter/Roboto/Arial fonts | Default, lazy | Project typography |
| Three-column card grids | Statistical median | Category-appropriate layout |
| Emoji as icons | Unprofessional | Real SVG icons |
| "Modern and clean" | Meaningless | Specific tone |
| Blob clusters (purple/pink/cyan) | Template UI | Category-specific texture |
| Fake social proof | Deceptive | Real testimonials or none |

## Secondary Slop (Soft Bans)

- **Glass stacks**: Multiple nested `backdrop-blur` panels
- **Motion soup**: Everything fades in with same delay
- **Generic copy**: "Welcome!", "Something went wrong" with no next step
- **Identical rhythm**: Every section is `py-24` + headline + subtitle + grid

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

Projects MAY have design system in `_references/`:

```
_references/
├── README.md              # Brand voice, visual foundations
├── SKILL.md               # Quick rules for AI
├── colors_and_type.css    # Design tokens
└── ui_kits/               # Reference components
```

**If exists:** Read first, use tokens, copy patterns.

---

## Category Design Guide

Match project to category. Use as starting point, then push further.

### SaaS / Developer Tools

| Aspect | Guidance |
|--------|----------|
| **Palette** | Slate base (`#0f172a`, `#1e293b`), accent (teal `#14b8a6`, blue `#3b82f6`), surface `#f8fafc` |
| **Fonts** | Display: Plus Jakarta Sans, Geist, Satoshi. Body: DM Sans |
| **Tone** | Precise, confident, developer-friendly |
| **Patterns** | Product screenshot above fold, code snippets, transparent pricing, dark mode primary |
| **Avoid** | Marketing fluff, stock photos of people pointing at screens |

### E-commerce / Retail

| Aspect | Guidance |
|--------|----------|
| **Palette** | Warm neutrals (`#faf9f6`, `#292524`), CTA accent (coral `#f97316`, rose `#e11d48`) |
| **Fonts** | Display: Playfair Display, Fraunces. Body: DM Sans, Outfit |
| **Tone** | Product-led. Merchandise is hero, not UI chrome |
| **Patterns** | Large product imagery, quick-add-to-cart, real stock counts, social proof near buy |
| **Avoid** | Fake countdown timers, cluttered sidebars, tiny product images |

### Fintech / Banking

| Aspect | Guidance |
|--------|----------|
| **Palette** | Deep navy (`#0b1f33`), trust teal (`#0d9488`), muted gold (`#b8860b`) |
| **Fonts** | Display: Newsreader, Instrument Serif. Body: Geist, DM Sans |
| **Tone** | Authoritative, calm, trustworthy |
| **Patterns** | Compliance badges, transparent fees, monospace for figures, security indicators |
| **Avoid** | Flashy animations, hiding fees, crypto-bro neon |

### Healthcare / Medical

| Aspect | Guidance |
|--------|----------|
| **Palette** | Clinical blue (`#1e40af`), calming teal (`#0d9488`), soft green (`#86efac`) |
| **Fonts** | Display: Source Serif 4. Body: Source Sans 3 |
| **Tone** | Calm, trustworthy, accessible. Reduce cognitive load |
| **Patterns** | Clear appointment CTAs, HIPAA badges, large touch targets, high contrast |
| **Avoid** | Red as primary (triggers alarm), dense data for patients, small text |

### Portfolio / Personal

| Aspect | Guidance |
|--------|----------|
| **Palette** | Achromatic (`#0a0a0a`, `#fafafa`) with one signature accent |
| **Fonts** | Display: Cormorant Garamond, Instrument Serif. Body: Satoshi |
| **Tone** | Work speaks. Minimal chrome, maximum project visibility |
| **Patterns** | Project grid, hover reveals, smooth transitions, concise bio |
| **Avoid** | Walls of text before showing work, skill-bar charts |

### Blog / Editorial

| Aspect | Guidance |
|--------|----------|
| **Palette** | Rich ink (`#1a1a2e`), warm paper (`#fefce8`), accent for links |
| **Fonts** | Display: Lora, Libre Baskerville. Body: Source Serif 4, Merriweather |
| **Tone** | Typographic excellence. Reading experience is product |
| **Patterns** | 65-75 char line length, 1.6-1.8 line-height, pull quotes, reading time |
| **Avoid** | Sidebar clutter, auto-playing media, infinite scroll only |

### Restaurant / Food

| Aspect | Guidance |
|--------|----------|
| **Palette** | Warm earth (terracotta `#c2703e`, olive `#606c38`, cream `#fefae0`) |
| **Fonts** | Display: Cormorant Garamond, Playfair Display. Body: DM Sans |
| **Tone** | Appetizing. Food and atmosphere are stars |
| **Patterns** | Menu with prices (not PDF), reservation CTA visible, hours + location prominent |
| **Avoid** | PDF-only menus, auto-playing music, hiding phone number |

### Agency / Creative Studio

| Aspect | Guidance |
|--------|----------|
| **Palette** | Bold and opinionated. Achromatic + electric accent, or full maximalist |
| **Fonts** | Display: Oversized sans (Neue Montreal, Satoshi 80px+). Body: matching |
| **Tone** | Website IS the portfolio. Every interaction demonstrates capability |
| **Patterns** | Case study scroll, dramatic transitions, cursor effects, bold typography |
| **Avoid** | Template layouts, stock imagery, conservative corporate feel |

---

## Taste Layer Principles

### Typography
- Distinctive font pairings mandatory
- Hierarchy through weight and color, not just size
- Left-align body text. Center only short headlines

### Color
- CSS variables for palette
- Tinted grays (slate, zinc, stone), never pure neutral
- Dark mode: rich deep (`#0A0A0B`), not `#000`
- Light mode: warm/cool off-white, not `#FFF`

### Spacing
- Start with too much whitespace, then tighten
- 4px-based scale
- All sections share same max-width

### Icons
- Real SVG only: Lucide, Heroicons, Phosphor
- Never emoji
- 16-20px inline, 24px nav, 32-48px features

---

## Pre-Delivery Checklist

```
[ ] Category identified, tone stated
[ ] No banned patterns (Inter, purple gradients, emoji icons)
[ ] Font pairing distinctive, matches category
[ ] Icons from real SVG library
[ ] Hero has imagery or decorative fills
[ ] Colors use CSS variables, tinted grays
[ ] Responsive: 375px, 768px, 1024px, 1440px
[ ] prefers-reduced-motion respected
[ ] 4.5:1 contrast, visible focus states
[ ] Hover states provide feedback
[ ] Empty/error/loading states are specific
```

## Violations

- Inventing new design patterns without reference
- Ignoring existing components
- Generic placeholder copy
- "Looks modern" without evidence
- Hardcoding colors instead of tokens
- Ignoring `_references/` when exists
