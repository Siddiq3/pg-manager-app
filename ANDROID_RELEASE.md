# Android production release

The committed project does not contain a release keystore or signing password.

For a production upload build, inject all four variables through the secure build environment:

- `PG_UPLOAD_STORE_FILE` — absolute or workspace-relative path to the Play upload keystore
- `PG_UPLOAD_STORE_PASSWORD`
- `PG_UPLOAD_KEY_ALIAS`
- `PG_UPLOAD_KEY_PASSWORD`
- `EXPO_PUBLIC_API_URL` — production HTTPS API base, including `/api/v1`

If none of the signing variables are set, `:app:bundleRelease` intentionally builds an unsigned AAB for CI/configuration verification. If only some signing variables are present, Gradle fails instead of silently falling back to the debug key. When all signing variables are present, Gradle also requires `EXPO_PUBLIC_API_URL` to be an explicit HTTPS URL so a signed build cannot silently embed the localhost fallback.

The Expo Doctor `appConfigFieldsNotSyncedCheck` is disabled intentionally because `android/` is committed and is the native source of truth. This only disables that specific known CNG warning; all other Expo Doctor checks remain enabled and failures still fail CI.

Before Play upload, verify Play App Signing/upload-key configuration in Play Console and run a signed release build in the secure release environment. Never commit the keystore.
