# PG Manager mobile visual system

A light interface with cool neutral surfaces, restrained violet accents, deep ink overview cards, and generous spacing. Shared components carry this visual language through authentication, property management, billing, settings, support, and detail screens.

## Palette

| Role | Value |
| --- | --- |
| Primary / pressed / subtle / tint | `#7054DE` / `#563AB9` / `#F2EEFF` / `#E4DCFC` |
| Canvas / surface / muted surface | `#F6F7FB` / `#FFFFFF` / `#EDF0F6` |
| Ink hero / secondary hero text | `#202640` / `#BAC1D8` |
| Text primary / secondary / muted | `#202640` / `#495368` / `#626D82` |
| Border / strong | `#E3E7F0` / `#CDD4E2` |
| Success / warning / error / info | `#15803D` / `#B45309` / `#BE123C` / `#1D4ED8` |

## Layout and typography

- Urbanist 600/700 for display, titles and figures. Plus Jakarta Sans 400/500/600/700 for labels and body copy. Use separate font families in `fonts` instead of synthesized weights for custom fonts on Android.
- Screen gutters: 16 on narrow phones, 20 on phones, and 32 on tablets. General content is centered with a 960-point maximum width; welcome and auth content use 600 and 560 points respectively.
- Scroll content fills available height and remains scrollable on short screens, with the keyboard, and at larger text sizes. Bottom padding respects safe-area insets.
- Rounded white cards, tinted icon tiles, restrained borders, and platform-specific shadows distinguish actions from supporting information.

## Screens and motion

- `StartupScreen` uses system type while fonts load and while a session is being restored.
- Welcome presents the Sai Residency demo card in the app primary violet, with white labels and no decorative circles. Its rent summary includes an animated mini bar chart, occupancy shows the animated percentage and bed count, and three white statistic tiles add visual hierarchy. It uses synchronized counting for occupancy, rent collected, rooms and beds; gentle floating motion; and a rent-received badge after counting completes. Values settle after the entrance sequence. Animation pauses while another route is active, and reduced motion shows the final values immediately. The headline and supporting copy stay minimal.
- Dashboard emphasizes occupancy, then supporting statistics, quick actions, and actionable lists. Its data region uses explicit loading and error states.
- Rooms, tenants, and rent expose concise summaries before their lists. Tenant search is available whenever tenants exist.
- Authentication uses a centered heading and bordered form card. Bottom navigation pairs selected icon backgrounds with labels.
- Entrance fades, welcome motion, sheets, skeleton pulses, and route transitions respect the OS reduced-motion preference. Animation loops are cleaned up on unmount.

## Scope

API calls, authentication, validation, payment recording, subscription logic, query keys, and navigation destinations are preserved. New summaries derive from existing query data. The web app and backend are unchanged.
