# Android subscription plans

The catalog in `src/lib/subscriptionPlans.js` defines Starter (₹299/month,
1 property, 150 beds, no co-owners), Pro (₹699/month, 3 properties, 450 beds,
2 co-owners), and Growth (₹999/month, 10 properties, 1,000 beds, 4 co-owners).
Starter and Pro have Standard support; Growth has Priority support. Every plan
includes the same management features and web and Android access.

Account and the subscription-required screen share this catalog. The latter
scrolls to accommodate all plans on small screens. Registration describes the
existing 10-day trial. Trial capacity is unchanged because no trial resource
limits were specified. Purchases still use the existing web billing flow;
this change adds no checkout or external payment link to Android.

Before the primary owner adds a property, bed, or co-owner, the app reads fresh
billing status and aggregates resources across their owned properties. Borrowed
properties are excluded. Active and pending co-owner emails count once across
the subscription, excluding the primary owner. Adding an existing co-owner to
another property consumes no extra place. Unknown paid plans and failed reads
stop additions with an error. Existing records remain available at the limit.

The backend now enforces these quotas in the same DynamoDB transaction as each
resource addition/deletion, including co-owner bed additions and requests from other
clients. It exposes plan limits and support tiers in billing status. The app checks
provide earlier feedback; the API remains authoritative. See
`../pg-manager-backend/BILLING.md` for provider billing and migration behavior.
The app-only UI change does not add Android checkout or modify the website.

Run `npm test` for boundary and aggregate-limit checks. Verify Android bundling
with `npx expo export --platform android --output-dir <temporary-directory>`.
