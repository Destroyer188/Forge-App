# Forge validation record

## Passed in this sandbox

- All TypeScript/TSX source files passed a TypeScript parser/transpile syntax check.
- 30-day Calisthenics plan invariants passed: 30 days, Foundation rest days 2/5/8, Build rest day 11, GTG day 14, Deload day 17, Test days, Peak rest day 21, and final day 30 target test.
- Local-date streak tests passed, including the case where today is not yet logged and the streak continues from yesterday.
- Project tree/package/config/assets were sanity-checked.
- The dependency graph includes the native Expo modules used by the implementation, plus the Expo SDK 57 baseline.

## Not executable in this sandbox

The sandbox could not complete `npm install` within the available execution window, so Expo could not be launched on a real Android/iOS runtime here. That means device-only checks (notification delivery while force-closed/backgrounded, biometric prompts, native calendar UI, media permissions, and screen-reader behavior on actual devices) are not claimed as passed.

## Run locally

```bash
npm install
npx expo install --fix
npm run check
npm run self-check
npx expo start
```

For real native validation, use a development build or a platform simulator/device:

```bash
npx expo run:android
npx expo run:ios
```
