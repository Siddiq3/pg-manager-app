# Android production release

The committed project does not contain a release keystore or signing password.

## Expo EAS builds

`eas.json` contains three Android release profiles:

| Profile | Artifact | Purpose | EAS environment |
| --- | --- | --- | --- |
| `preview` | Signed APK | Install directly on a device for testing | `preview` |
| `apk` | Signed APK | Install the production configuration directly | `production` |
| `production` | Signed AAB | Upload to Google Play | `production` |

All profiles use EAS-managed signing. Like Stitchbook, `apk` extends `production`,
inheriting its production environment and automatic Android version-code increments
while overriding the artifact format to APK and distribution to internal.
The production profile also uses EAS remote version management. The committed `android/`
directory remains the native source of truth; EAS builds it without regenerating it.

One-time setup, from `pg-manager-app`:

```sh
npm install --global eas-cli
eas login
eas init
```

Link the existing PG Manager EAS project if one already exists. `eas init` adds the
real `extra.eas.projectId` to app configuration; no placeholder project ID is
committed. Commit that project link before using CI.

Set `EXPO_PUBLIC_API_URL` in each EAS environment. Use the real HTTPS API base URL
including `/api/v1`. The following commands prompt for the value:

```sh
eas env:create --environment preview --name EXPO_PUBLIC_API_URL --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_API_URL --visibility plaintext
```

The API URL is embedded in the application and is not a secret. EAS builds fail if
it is absent or does not start with `https://`. Do not put backend credentials in
`EXPO_PUBLIC_*` variables.

PG Manager reads `EXPO_PUBLIC_API_URL` (not Stitchbook's
`EXPO_PUBLIC_API_BASE_URL`). Set it to the PG Manager backend. This value stays in
EAS environments until the real PG Manager production URL is supplied; no
Stitchbook URL or placeholder is embedded in the build profile.

Build on Expo's servers:

```sh
npm run build:apk
npm run build:aab
```

These commands select `apk` and `production` respectively. Use
`eas build --platform android --profile preview` for the separate preview environment.
The `submit.production` profile is also configured for a later `eas submit
--platform android --profile production` once Google Play submission credentials
are set up. Building an AAB does not automatically submit it.

The CLI returns a build link where the completed APK or AAB can be downloaded.
The APK contains the JS bundle and runs without Metro or Expo Go. During the first
build, EAS prompts for signing credentials. For an existing Play app, provide its
existing upload keystore instead of generating a replacement. If the app already
has a Play version code, initialize EAS with that code using `eas build:version:set`
before the first production build.

To build locally using the same profiles, install the Android SDK/NDK and JDK,
export the HTTPS `EXPO_PUBLIC_API_URL` in your shell, then run:

```sh
npm run build:apk:local
npm run build:aab:local
```

Local EAS builds still require an Expo project and signing credentials. EAS secret
environment values are not fetched for local builds; supply any required values
locally. Generated binaries and signing files are ignored by Git.

References: [APK build profiles](https://docs.expo.dev/build-reference/apk/),
[Android signing integration](https://docs.expo.dev/build-reference/android-builds/),
[remote app versions](https://docs.expo.dev/build-reference/app-versions/).

## Direct Gradle builds and CI

For a production upload build, inject all four variables through the secure build environment:

- `PG_UPLOAD_STORE_FILE` — absolute or workspace-relative path to the Play upload keystore
- `PG_UPLOAD_STORE_PASSWORD`
- `PG_UPLOAD_KEY_ALIAS`
- `PG_UPLOAD_KEY_PASSWORD`
- `EXPO_PUBLIC_API_URL` — production HTTPS API base, including `/api/v1`

If none of the signing variables are set, `:app:bundleRelease` intentionally builds an unsigned AAB for CI/configuration verification. If only some signing variables are present, Gradle fails instead of silently falling back to the debug key. When all signing variables are present, Gradle also requires `EXPO_PUBLIC_API_URL` to be an explicit HTTPS URL so a signed build cannot silently embed the localhost fallback.

The Expo Doctor `appConfigFieldsNotSyncedCheck` is disabled intentionally because `android/` is committed and is the native source of truth. This only disables that specific known CNG warning; all other Expo Doctor checks remain enabled and failures still fail CI.

Before Play upload, verify Play App Signing/upload-key configuration in Play Console and run a signed release build in the secure release environment. Never commit the keystore.
