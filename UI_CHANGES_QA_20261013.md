# Calendar, room choices and rent reminders QA

Validated on 13 October 2026 using a dedicated Android 36.1 ARM64 emulator, the isolated `.staffreview` debug app, Metro on 8092 and a dummy-data local backend on 4012. Verified the served bundle used localhost before signing in. Original environment configuration was restored after stopping the test app and services; existing Android branding work remains stashed.

## Results

- All 29 unit/regression tests passed (`npm test`).
- Android JavaScript export passed (`npx expo export --platform android`).
- Tenant joining calendar: selected 5 October 2026 and confirmed the form displayed it.
- Staff creation: chose 15 September 2026 through the month/day calendar, saved Calendar Cook and reopened the record; joining date persisted as 2026-09-15.
- Finance month selector: selected November and confirmed navigation continued successfully.
- Expense: selected 9 October 2026 and actual payment date 10 October 2026; saved ₹125 and verified both dates on the resulting expense row.
- Room: selected 3 sharing and 2nd floor, saved room 202 and reopened it; both values persisted and displayed correctly.
- Rent and tenant-history reminders: both preview sheets displayed the dummy tenant's normalized Indian number, property, October bill, ₹6,000 remaining balance and 13 October due date.
- Open WhatsApp handed the URL to Android's external browser. WhatsApp is not installed on this emulator; no message was sent and actual WhatsApp delivery remains untested.
- Runtime capture contained a development-server connection warning during initial startup; no fatal exception was found. Functional checks proceeded with the verified local bundle.
- `git diff --check` passed.

## Limits

One emulator in portrait was tested. This is not a physical-device, landscape, large-text or complete Android version matrix. Other date fields share the tested calendar and have automated date-boundary, confirmation, cancellation, clearing and read-only coverage; not every screen combination was exercised manually in this run. Existing saved tenant dates cannot be cleared because the current backend does not support clearing them. The emulator run does not certify native release signing or distribution; PR CI separately checks the unsigned release build.

Temporary evidence: `/private/tmp/pg-reminder-emulator.png`, `/private/tmp/pg-staff-app-logcat.log`, `/private/tmp/pg-ui-merge-tests.log`, `/private/tmp/pg-ui-merge-export.log`. The operating system may remove these files.
