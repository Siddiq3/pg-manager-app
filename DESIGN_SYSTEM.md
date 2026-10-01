# PG Manager visual system

PG Manager uses a restrained teal identity for property, room, tenant, and rent management. Slate typography and neutral surfaces keep dense operational information readable. Both applications retain their existing light-only theme and product workflows.

## Semantic palette

| Role | Color | Usage |
| --- | --- | --- |
| Primary / pressed / subtle | `#176b70` / `#105257` / `#e8f3f3` | Main actions, active selection, focus |
| Secondary | `#465c72` | Supporting controls and icons |
| Background | `#f5f7f9` | Screen canvas |
| Surface / elevated / muted | `#ffffff` / `#ffffff` / `#eef2f5` | Content, raised forms, quiet grouping |
| Text primary / secondary / muted / disabled | `#1b2a36` / `#526370` / `#5c6d7a` / `#7f8d98` | Information hierarchy |
| Border / subtle / strong | `#dce4e9` / `#eaf0f3` / `#8294a1` | Groups, dividers, input boundaries |
| Success / subtle | `#26704e` / `#edf6f0` | Paid, active, vacant |
| Warning / subtle | `#8a5b16` / `#fbf3e5` | Pending, partial, upcoming vacancy |
| Error / subtle | `#ad3e3e` / `#fbeeee` | Validation errors, overdue, destructive actions |
| Info / subtle | `#365f91` / `#edf3fb` | Occupied and informational statuses |

Checked normal text combinations exceed 4.5:1: primary on white 6.23, primary text on white 14.67, secondary on white 6.22, muted on page background 4.98, success/warning/error/info on their subtle surfaces 5.25–5.87. This is a palette check, not a claim of a complete accessibility audit. Status labels always remain visible; meaning does not depend on color alone.

## Typography and layout

Use system fonts for familiar rendering, language coverage, and no font-loading dependency. Use regular body text, medium labels, and semibold headings. Use a 4/8/12/16/24/32 spacing scale and 8–12 pixel control/group radii. Display type belongs to branding; operational headings are smaller. Use tabular numerals for financial and occupancy metrics.

Keep meaningful groups, such as rent tables and room management, on a single surface. Avoid nested floating cards. Separate rows with whitespace and subtle dividers. Use color for selected actions and semantic status, not decorative saturation.

## Controls and feedback

Primary actions are teal, secondary actions use neutral borders, tertiary actions use minimal emphasis, and destructive actions use subdued red. Inputs have persistent labels, visible focus, and inline error feedback. Buttons retain disabled/loading behavior and touch targets. Keep existing confirmation dialogs and mutation feedback.

Motion is short and purposeful. Respect reduced-motion preferences. Avoid scaling operational metric cards on hover. Loading remains visible independently of animation.

## Product boundaries

Authentication, authorization, API clients, request payloads, validation, calculations, query invalidation, and route destinations are preserved. No dark-mode feature, new navigation destination, settings page, or subscription behavior was added. The current repositories do not contain a dedicated settings screen or custom modal/bottom-sheet component; existing native confirmation alerts remain native.

## Validation and remaining review

The web production build and Android/iOS Metro exports pass. Shared web controls were rendered to verify loading/disabled semantics, field-error associations, semantic statuses, and empty-table behavior. Source comparison confirmed that all ten screen components retain the same non-render business logic. API and authentication modules were not changed.

A rendered screenshot comparison remains pending: the cloud browser rejected access to the workspace's localhost preview, and a local Chromium installation was unavailable. Builds do not substitute for device or browser visual review. Live API workflows were not exercised because the backend was unavailable in this session.

Before merging, compare the actual login, registration/password reset, dashboard, room list/details, create/edit form, empty/error state, and confirmation alert at desktop/phone widths or on Android/iOS. Check keyboard focus, larger text settings, long names and currency amounts, reduced motion, and successful/error responses using a development backend.

## Implementation

Semantic tokens, typography, spacing, inputs, buttons, statuses, segmented selection, and reduced-motion preferences live in `src/components/ui.js`. Screen headings consume the same scale; navigation chrome consumes the same colors. Existing component aliases remain compatible. React Native system alerts are intentionally preserved.
