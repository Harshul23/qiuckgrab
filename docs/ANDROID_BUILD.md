# QuickGrab Android App Build Guide

This guide explains how to build a native Android app wrapper for the QuickGrab PWA using Bubblewrap.

## Prerequisites

1. **Node.js** (v14.0 or higher)
2. **Java Development Kit (JDK)** (v8 or higher)
3. **Android SDK** (can be installed via Android Studio)

## Setup Instructions

### 1. Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

### 2. Deploy Your PWA

Before building the Android app, deploy your PWA to a production domain. The domain must:
- Use HTTPS
- Serve the `manifest.json` file
- Serve the service worker
- Serve the `.well-known/assetlinks.json` file

### 3. Update Configuration Files

Update the following files with your production domain:

#### `bubblewrap-config.json`
Replace all instances of `https://your-production-domain.com` with your actual domain.

#### `public/.well-known/assetlinks.json`
Replace `YOUR_SHA256_CERT_FINGERPRINT_HERE` with your actual SHA256 certificate fingerprint (see step 5).

### 4. Initialize Bubblewrap Project

```bash
bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.json
```

This will:
- Download required Android SDK components
- Generate the Android project files
- Create a signing key (if one doesn't exist)

### 5. Get Your SHA256 Certificate Fingerprint

After initialization, get your signing key fingerprint:

```bash
keytool -list -v -keystore android.keystore -alias quickgrab
```

Update `public/.well-known/assetlinks.json` with this fingerprint.

### 6. Build the Android App

```bash
bubblewrap build
```

This generates:
- **APK file**: `app-release-signed.apk` - For sideloading or alternative app stores
- **AAB file**: `app-release-bundle.aab` - For Google Play Store submission

## Running in Android Studio

### Option A: Open the Generated Project

1. Open Android Studio
2. Select "Open an Existing Project"
3. Navigate to the Bubblewrap-generated folder (usually `./`)
4. Wait for Gradle sync to complete
5. Run on emulator or connected device

### Option B: Import APK for Testing

1. Enable Developer Mode on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Install APK:
   ```bash
   adb install app-release-signed.apk
   ```

## File Structure

```
project-root/
├── bubblewrap-config.json     # Bubblewrap configuration
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # Service worker for offline support
│   ├── icons/
│   │   ├── icon-192.png       # 192x192 app icon
│   │   └── icon-512.png       # 512x512 app icon
│   └── .well-known/
│       └── assetlinks.json    # Android Digital Asset Links
```

## Customizing Icons

Replace the placeholder icons in `public/icons/` with your actual app icons:

- `icon-192.png`: 192x192 pixels, PNG format
- `icon-512.png`: 512x512 pixels, PNG format

For best results, create maskable icons that work with Android's adaptive icon system.

## Google Play Store Submission

1. Build the AAB file:
   ```bash
   bubblewrap build
   ```

2. Create a Google Play Developer account (one-time $25 fee)

3. Create a new app in Google Play Console

4. Upload the AAB file

5. Complete store listing requirements:
   - App name, description
   - Screenshots
   - Privacy policy URL
   - Content rating questionnaire

6. Submit for review

## Troubleshooting

### "Digital Asset Links verification failed"

Ensure that:
1. Your domain serves `/.well-known/assetlinks.json` with correct MIME type (`application/json`)
2. The SHA256 fingerprint in `assetlinks.json` matches your signing key
3. The package name matches exactly

### "Service Worker registration failed"

Ensure that:
1. Your site uses HTTPS
2. The service worker file is served from the root path
3. The `Content-Type` header is `application/javascript`

### App shows browser UI

This indicates Trusted Web Activity verification failed. Check:
1. Digital Asset Links configuration
2. App is signed with the correct key
3. Domain is correctly configured in `bubblewrap-config.json`

## Useful Commands

```bash
# Update Bubblewrap CLI
npm update -g @bubblewrap/cli

# Validate Digital Asset Links
bubblewrap validate

# Update the TWA with a new manifest
bubblewrap update

# Build debug APK (faster, but unsigned)
bubblewrap build --debug
```

## Security Considerations

1. **Never commit your keystore file** to version control
2. Keep a secure backup of your keystore and passwords
3. Use the same keystore for all app updates
4. Consider using Google Play App Signing for production

## Additional Resources

- [Bubblewrap Documentation](https://github.com/nicorighi/nicorighi.github.io/blob/main/nicorighi.github.io/bubblewrap.md)
- [Trusted Web Activities Overview](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [PWA Builder](https://www.pwabuilder.com/) - Alternative tool for generating Android wrappers
- [Android Digital Asset Links](https://developers.google.com/digital-asset-links)
