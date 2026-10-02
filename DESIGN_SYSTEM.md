# PG Manager — production mobile UI

Applies the latest StitchBook production-app redesign principles to the PG app: compact operational screens, practical hierarchy, consistent shared components and clear states. Existing APIs, payloads, validation, permissions, billing and authentication remain in place.

## Visual system

| Role | Token |
| --- | --- |
| Primary / pressed / subtle | `#146650` / `#0d4b3a` / `#e9f4ef` |
| Canvas / surface / muted surface | `#f5f7f6` / `#ffffff` / `#edf1ef` |
| Main / secondary / muted text | `#182923` / `#43544e` / `#61716a` |
| Border / strong border | `#dde5e1` / `#bdcbc4` |
| Success / warning / error / info | `#15803d` / `#b45309` / `#be123c` / `#1d4ed8` |

System typography avoids added font dependencies. Operational page headings use 24 px, body 15 px, labels 13 px; numbers use tabular figures. Spacing uses 4/8/12/16/24/32/48 px. Radii use 4/8/12/16/20 px. Buttons retain 48 px minimum height, inputs 50 px, and interactive rows 68 px. Controls grow with text.

## Layout and interaction

- Shared Screen centers content to a maximum 720 px on tablets, retains safe areas, avoids duplicate native header/tab insets, and supports keyboard avoidance and scrolling.
- Dashboard shows four compact operational metrics, a primary tenant action and contextual room/rent links. Dashboard requests have their own loading/error presentation.
- Rooms use one header action and compact occupancy rows. Bed-query loading/errors are visible before reporting vacancy.
- Rent groups each tenant, cycle status and payment/contact actions on one surface. Payment sheets identify the tenant, month and outstanding amount.
- Tenant and room forms group personal details, rent/deposit, and dates/documents into readable sections. Every field, mutation and confirmation is retained. Bed selection includes a visible selected state.
- Auth inherits the same controls and spacing; welcome and entitlement/support screens scroll on short displays. Sample welcome content does not imply real account metrics.
- Settings, profile, security, help, support, legal and account deletion consume the same tokens. User copy avoids backend or platform implementation explanations.
- Native stack and sheet animations respect reduced motion. Status text retains meaning independent of color and presents API enums in readable sentence case.

## Validation

See the pull request for checks actually run. Source parsing/build checks do not substitute for native visual QA or authenticated backend testing. Review Android/iOS phones and tablets with a keyboard, larger text, long tenant names and large rupee amounts before release.
