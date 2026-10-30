# HomeKeeper design tokens

Source: Penpot file "New File 1", exported to `docs/design/*.png` (one 1440px board per page:
`welcome`, `home`, `tasks`, `schedule`, `inventory`, `vendors`, `settings`). Match these exports; don't invent colors.

## Colors

| Token | Hex | Use |
|---|---|---|
| ink | `#111827` | headings, primary text, dark avatars |
| sidebar | `#111827` | app sidebar background, landing footer |
| sidebar-active | `#1F2937` | active nav item, sidebar user card |
| bg | `#F3F4F6` | app body background, landing features band |
| card | `#FFFFFF` | cards, inputs, list containers |
| border | `#E5E7EB` | card/input borders |
| divider | `#F0F1F3` | rows inside cards |
| muted | `#6B7280` | subtitles, secondary text |
| muted-2 | `#9CA3AF` | inactive nav text, placeholders, meta |
| primary | `#2563EB` | primary buttons, active chips, links, logo tile, active nav dot |

### Status pills (fg / bg)

| Status | fg | bg |
|---|---|---|
| overdue / danger | `#DC2626` | `#FEE2E2` |
| due_soon / needs_service / needs attention | `#D97706` | `#FEF3C7` |
| scheduled / plumbing trade | `#2563EB` | `#DBEAFE` |
| completed / good / hvac trade / landscaping trade | `#16A34A` | `#DCFCE7` |
| electrical trade | `#D97706` | `#FEF3C7` |
| general trade | `#6B7280` | `#F3F4F6` |

List rows show a 36px rounded square "icon tile" tinted with the row's status bg color.
Home Systems pills show a leading 6px dot in the fg color.

## Type

Font: **Inter Tight** (`next/font/google`).

| Role | Size / weight |
|---|---|
| Landing hero | 42 / 800 |
| Landing section title | 28 / 700 |
| Page title | 28–30 / 700 |
| Page subtitle | 14 / 400, muted |
| Card title | 15–16 / 700 |
| Stat value | 30 / 700 (color by meaning: ink, overdue red, completed green, primary blue) |
| Body | 13–14 / 400–500 |
| Meta line ("Basement • Overdue by 2 days") | 13 / 400, muted |
| Pill / chip | 11–12 / 600 |
| Calendar weekday header | 12 / 600 uppercase, muted |

## Shape and layout

- Radii: inputs/buttons 8, cards 12, pills/chips 20 (fully rounded), icon tiles 8, avatars round.
- Sidebar 240px fixed, dark; logo tile 32px primary + "HomeKeeper" 18/700 white; nav item height 36, radius 8,
  6px dot before label (primary when active); user card pinned bottom (avatar 32px primary, name 13/600, address 11 muted).
- Main area: padding 40px; card gap 20px; page header = title + subtitle left, search + primary action right.
- Filter chips: white with border, label + count in muted; active chip = primary bg, white text.
- Under 768px the sidebar becomes a top bar with a menu button; grids collapse to one column.
- Buttons: primary = primary bg / white text; secondary = white bg / border / ink or primary text ("Contact");
  danger = white bg / red border + red text ("Delete Account").
- Toggles: 40×22 pill, primary when on, `#E5E7EB` when off.
