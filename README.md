This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Progressive Web App (PWA)

QuickGrab is a fully-featured PWA that can be installed on any device:

### PWA Features
- **Offline Support**: Service worker caches essential resources for offline access
- **Installable**: Can be installed on desktop and mobile devices
- **App-like Experience**: Runs in standalone mode without browser UI

### PWA Files
- `public/manifest.json` - Web app manifest with app metadata
- `public/service-worker.js` - Service worker for caching and offline support
- `public/icons/` - App icons (192x192 and 512x512)

## Building Android App

QuickGrab can be packaged as a native Android app using Bubblewrap (Trusted Web Activity).

### Quick Start

1. Install Bubblewrap CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. Deploy your PWA to a production domain with HTTPS

3. Update `bubblewrap-config.json` with your production domain

4. Initialize and build:
   ```bash
   bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.json
   bubblewrap build
   ```

### Output Files
- **APK**: `app-release-signed.apk` - For sideloading or alternative stores
- **AAB**: `app-release-bundle.aab` - For Google Play Store submission

### Digital Asset Links

For Trusted Web Activity verification, configure `.well-known/assetlinks.json` with your signing key fingerprint:

```bash
keytool -list -v -keystore android.keystore -alias quickgrab
```

For detailed instructions, see [Android Build Guide](./docs/ANDROID_BUILD.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
