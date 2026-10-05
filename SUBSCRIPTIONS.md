# Android subscription plans

The catalog in `src/lib/subscriptionPlans.js` defines Starter (₹299/month,
1 property, 150 beds, no co-owners), Pro (₹699/month, 3 properties, 450 beds,
2 co-owners), and Growth (₹999/month, 10 properties, 1,000 beds, 4 co-owners).
Starter and Pro have Standard support; Growth has Priority support. Every plan
includes the same management features and web and Android access.

Account and the subscription-required screen share this catalog. New accounts get a
30-day free trial with Starter's limits (1 property, 150 beds, no co-owners); more
capacity needs Pro or Growth. When the trial ends without a plan, access stops until
the owner subscribes. Purchases use the web billing flow; Android has no checkout or
external payment link.

Limits are enforced only by the backend, in the same DynamoDB transaction as each
addition (see `../pg-manager-backend/BILLING.md`). The app sends the addition and shows
the server's message when a limit is reached; it makes no extra pre-check requests,
which kept every addition to one API call. The co-owner form is hidden when the current
plan (or the trial) includes no co-owners.

Run `npm test` to check the catalog and trial plan. Verify Android bundling with
`npx expo export --platform android --output-dir <temporary-directory>`.
