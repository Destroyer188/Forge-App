# Forge — Native Fitness Tracker

Forge is a React Native + Expo managed-workflow fitness tracker covering the Calisthenics 30-day progressive-plan flow, Gym weekly templates, local reminders, rest timers, multi-profile storage, progress, backup/restore, biometric lock, and an offline-first coach.

## Run

```bash
npm install
npx expo install --fix
npx expo start
```

For native notification, calendar, biometric, and media testing, use a development build when the selected Expo module requires it:

```bash
npx expo run:android
npx expo run:ios
```

## Architecture

- `src/context/AppProvider.tsx` — persistent app state, active profile, settings, mode state.
- `src/services/notifications.ts` — permission handling and all local notification scheduling/cancellation.
- `src/services/storage.ts` — AsyncStorage persistence with error handling.
- `src/services/backup.ts` — JSON export/import through the native share/file picker.
- `src/utils/plans.ts` — the specified 30-day plan formulas and phase logic.
- `src/navigation/RootNavigator.tsx` — onboarding/auth gate, tabs, and deep-link routes.

## Native limitations

The home-screen widget and Health/Google Fit integration are isolated as documented extension points. They need additional native modules/extensions and platform-specific entitlements beyond the core Expo managed JS app. The rest of the core product is implemented in this project.

## Validation

```bash
npm run check
npm run self-check
```

The self-check validates the plan generator, local-date streak calculations, reminder date generation, and key data invariants without requiring a device.

See `VALIDATION.md` for the checks completed in the build environment and the native checks that still require an actual Expo runtime/device.
