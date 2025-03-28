# SynCodeX2 Mobile

Mobile version of SynCodeX2 built with React Native.

## Prerequisites

- Node.js >= 18
- JDK 17
- Android Studio and Android SDK
- React Native CLI

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Metro bundler:
   ```bash
   npm start
   ```

3. Run on Android:
   ```bash
   npm run android
   ```

## Project Structure

The mobile app follows a similar structure to the web version, with adaptations for React Native:

- `/src/components` - React Native components
- `/src/navigation` - Navigation configuration
- `/src/hooks` - Custom hooks
- `/src/firebase` - Firebase configuration

## Features

- Real-time code collaboration
- Team management
- User authentication
- Dark mode support
- Native mobile UI

## Building for Production

To create a release build for Android:

```bash
npm run build:android
```

The APK will be available in `android/app/build/outputs/apk/release/`