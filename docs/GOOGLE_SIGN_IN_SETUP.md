# Google Sign-In Setup Guide for QuickGrab

This guide provides step-by-step instructions to set up Google Sign-In for QuickGrab. Google Sign-In allows students to authenticate using their Google accounts with .edu or .org email addresses.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Google Cloud Project](#creating-a-google-cloud-project)
3. [Configuring OAuth Consent Screen](#configuring-oauth-consent-screen)
4. [Creating OAuth 2.0 Credentials](#creating-oauth-20-credentials)
5. [Configuring QuickGrab Environment Variables](#configuring-quickgrab-environment-variables)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

---

## Prerequisites

Before you begin, ensure you have:

- A Google account (personal or Google Workspace)
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- QuickGrab application set up and running locally
- Node.js and npm installed

---

## Creating a Google Cloud Project

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### Step 2: Create a New Project

1. Click on the project dropdown at the top of the page (next to "Google Cloud")
2. Click **New Project** in the modal that appears
3. Enter the following details:
   - **Project name**: `QuickGrab` (or your preferred name)
   - **Organization**: Select your organization (if applicable)
   - **Location**: Leave as default or select your organization
4. Click **Create**
5. Wait for the project to be created (you'll see a notification when complete)
6. Select your new project from the project dropdown

---

## Configuring OAuth Consent Screen

### Step 1: Navigate to OAuth Consent Screen

1. In the Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Or navigate directly to: https://console.cloud.google.com/apis/credentials/consent

### Step 2: Choose User Type

1. Select **External** (allows any Google user to sign in)
   - Choose **Internal** only if you're using Google Workspace and want to restrict to your organization
2. Click **Create**

### Step 3: Configure App Information

Fill in the following fields:

**App Information:**
- **App name**: `QuickGrab`
- **User support email**: Select your email from the dropdown
- **App logo** (optional): Upload your app logo (120x120 to 1024x1024 pixels)

**App Domain:**
- **Application home page**: `http://localhost:3000` (for development) or your production URL
- **Application privacy policy link**: Your privacy policy URL (required for production)
- **Application terms of service link**: Your terms of service URL (optional)

**Authorized domains:**
- Add your domain (e.g., `localhost` for development, your production domain for live)

**Developer contact information:**
- Add your email address

Click **Save and Continue**

### Step 4: Configure Scopes

1. Click **Add or Remove Scopes**
2. Select the following scopes:
   - `email` - See your primary Google Account email address
   - `profile` - See your personal info, including any personal info you've made publicly available
   - `openid` - Associate you with your personal info on Google
3. Click **Update**
4. Click **Save and Continue**

### Step 5: Add Test Users (Development Mode)

While your app is in development (unverified):

1. Click **Add Users**
2. Add email addresses of users who should be able to test the app
3. Click **Add**
4. Click **Save and Continue**

### Step 6: Review and Submit

1. Review all the information you've entered
2. Click **Back to Dashboard**

> **Note**: For production use, you'll need to submit your app for verification by Google. This requires privacy policy and terms of service URLs.

---

## Creating OAuth 2.0 Credentials

### Step 1: Navigate to Credentials

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Or navigate directly to: https://console.cloud.google.com/apis/credentials

### Step 2: Create OAuth Client ID

1. Click **Create Credentials** at the top of the page
2. Select **OAuth client ID**

### Step 3: Configure the OAuth Client

1. **Application type**: Select **Web application**
2. **Name**: `QuickGrab Web Client` (or your preferred name)

**Authorized JavaScript origins:**
Add the following origins (adjust for your environment):

For development:
```
http://localhost:3000
http://localhost
```

For production:
```
https://your-domain.com
```

**Authorized redirect URIs:**
Add the following URIs (adjust for your environment):

For development:
```
http://localhost:3000
http://localhost:3000/api/auth/google
```

For production:
```
https://your-domain.com
https://your-domain.com/api/auth/google
```

3. Click **Create**

### Step 4: Save Your Credentials

After creation, a modal will display your credentials:

- **Client ID**: `xxxxxxxxxx-xxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxx`

**Important**: 
- Copy both values and store them securely
- Click **Download JSON** to save a backup of your credentials
- Never commit these values to version control

---

## Configuring QuickGrab Environment Variables

### Step 1: Create or Update .env File

1. In your QuickGrab project root, create a `.env` file if it doesn't exist:
   ```bash
   cp .env.example .env
   ```

2. Add the following environment variables:
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   ```

   > **Note**: Both variables should have the same Client ID value. The `NEXT_PUBLIC_` prefix makes it available in the browser for the Google Sign-In button.

### Step 2: Verify Environment Variables

Your complete `.env` file should look like this:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/quickgrab"

# JWT Authentication
JWT_SECRET="your-secure-jwt-secret-min-32-chars"

# Google OAuth (Sign in with Google)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"

# Optional: Other configurations
ANTHROPIC_API_KEY=""
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### Step 3: Restart Your Development Server

After updating environment variables, restart your Next.js development server:

```bash
npm run dev
```

---

## Testing the Integration

### Step 1: Verify Button Appears

1. Navigate to the sign-in page: `http://localhost:3000/signin`
2. You should see a "Sign in with Google" button below the email/password form
3. Navigate to the sign-up page: `http://localhost:3000/signup`
4. You should see a "Sign up with Google" button below the registration form

### Step 2: Test Sign-In Flow

1. Click the "Sign in with Google" button
2. A Google sign-in popup should appear
3. Select a Google account with a `.edu` or `.org` email address
4. Grant the requested permissions
5. You should be redirected to the home page after successful authentication

### Step 3: Verify User Creation

1. Check your database to verify the user was created:
   ```bash
   npx prisma studio
   ```
2. Navigate to the User table
3. Verify the user has:
   - `googleId` field populated
   - `emailVerified` set to `true`
   - `password` field empty (for Google-only users)

### Step 4: Test Account Linking

1. If a user already exists with the same email:
   - The Google account will be linked to the existing account
   - The `googleId` field will be updated
2. Users can then sign in with either Google or email/password

---

## Troubleshooting

### Common Issues and Solutions

#### Button Not Appearing

**Problem**: The Google Sign-In button doesn't appear on the page.

**Solutions**:
1. Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in your `.env` file
2. Restart the development server after adding environment variables
3. Check the browser console for JavaScript errors
4. Verify the Google Sign-In script is loading (check Network tab)

#### "Invalid Client" Error

**Problem**: Google shows an "Invalid client" or "Error 400: invalid_request" message.

**Solutions**:
1. Verify your Client ID is correct
2. Check that `http://localhost:3000` is in your authorized JavaScript origins
3. Ensure there are no trailing spaces in your environment variables
4. Clear browser cache and cookies

#### "Access Blocked" Error

**Problem**: Google shows "Access blocked: This app's request is invalid".

**Solutions**:
1. Ensure your OAuth consent screen is properly configured
2. Add test users if your app is in development mode
3. Verify all required scopes are selected
4. Check authorized redirect URIs match exactly

#### "Email Not Allowed" Error

**Problem**: User sees "Only student emails (.edu) or organization emails (.org) are allowed".

**Solution**: This is expected behavior. QuickGrab only allows:
- `.edu` email addresses (educational institutions)
- `.org` email addresses (organizations)

Users must sign in with an email that ends in `.edu` or `.org`.

#### CORS Errors

**Problem**: Browser console shows CORS-related errors.

**Solutions**:
1. Ensure your origin is listed in authorized JavaScript origins
2. Check that you're accessing the app via `http://localhost:3000`, not `127.0.0.1`
3. Clear browser cache and try again

#### Token Verification Fails

**Problem**: Server returns "Invalid Google credential".

**Solutions**:
1. Check server logs for detailed error messages
2. Verify `GOOGLE_CLIENT_ID` is set on the server
3. Ensure the token hasn't expired (tokens are short-lived)
4. Check network connectivity to Google's token verification endpoint

---

## Security Considerations

### Best Practices

1. **Never expose Client Secret on the client-side**
   - Only use the Client ID in browser code
   - Client Secret is not needed for this implementation

2. **Validate tokens server-side**
   - Always verify Google tokens on your server
   - Never trust client-side claims without verification

3. **Use HTTPS in production**
   - Google requires HTTPS for production applications
   - Use proper SSL certificates

4. **Restrict authorized origins**
   - Only add origins you control
   - Remove development origins in production

5. **Keep credentials secure**
   - Never commit `.env` files to version control
   - Use environment variable management in production (e.g., Vercel, Heroku config vars)

6. **Monitor for suspicious activity**
   - Log authentication attempts
   - Implement rate limiting

### Email Domain Restrictions

QuickGrab restricts sign-in to educational and organizational emails:

- `.edu` - Educational institutions
- `.org` - Non-profit organizations

This helps ensure that users are students or members of legitimate organizations.

---

## Production Deployment

### Before Going to Production

1. **Verify your app** with Google (required for production)
2. **Update OAuth consent screen** with production URLs
3. **Add production domains** to authorized origins and redirect URIs
4. **Remove development/localhost** origins if not needed
5. **Use secure environment variable storage** (not `.env` files)
6. **Enable HTTPS** on your production domain

### Verifying Your App with Google

For apps accessed by more than 100 users or using sensitive scopes:

1. Go to OAuth consent screen
2. Click **Publish App**
3. Submit for verification
4. Provide required documentation (privacy policy, homepage, etc.)
5. Wait for Google's review (can take several weeks)

---

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/your-repo/quickgrab/issues)
2. Review Google's [troubleshooting guide](https://developers.google.com/identity/sign-in/web/troubleshooting)
3. Open a new issue with detailed error information
