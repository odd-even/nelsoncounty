# Email OTP Authentication Setup Guide

## ✅ What's Been Implemented

Your admin panel now uses **Email OTP (One-Time Password)** authentication instead of Google OAuth. This provides:
- ✅ **No third-party dependencies** - Works with any email provider
- ✅ **Government-friendly** - No Google account required
- ✅ **Secure** - Time-limited codes with rate limiting
- ✅ **Easy user management** - Just add emails to the authorized list

## 📋 Step-by-Step Setup Instructions

### Step 1: Add Email Sending Function to Google Apps Script

1. **Open your Google Apps Script project**
   - Go to: https://script.google.com/
   - Open your existing Nelson County Apps Script project

2. **Add the email sending function**
   - In your Apps Script editor, add this function to your existing script:

```javascript
/**
 * Send OTP email for admin panel authentication
 * Called from: admin.js -> sendOTP()
 */
function sendOTPEmail(email, code) {
  try {
    const subject = 'Nelson County Admin - Verification Code';
    const body = `
Hello,

Your verification code for the Nelson County Admin Panel is:

${code}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.

---
Nelson County Admin Panel
    `.trim();
    
    // Send email using Gmail service
    GmailApp.sendEmail(
      email,
      subject,
      body,
      {
        name: 'Nelson County Admin Panel',
        noReply: true
      }
    );
    
    Logger.log('OTP email sent to: ' + email);
    return {
      success: true
    };
  } catch (error) {
    Logger.log('Error sending OTP email: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}
```

3. **Update your doPost function**
   - Find your existing `doPost` function
   - Add this case to handle OTP requests:

```javascript
function doPost(e) {
  try {
    // ... your existing code ...
    
    // Parse the request
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }
    
    const action = data.action;
    
    // ADD THIS NEW CASE:
    if (action === 'sendOTP') {
      if (!data.email || !data.code) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing email or code'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const result = sendOTPEmail(data.email, data.code);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ... rest of your existing code ...
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. **Authorize Gmail access (first time only)**
   - Click "Run" on the `sendOTPEmail` function
   - Google will ask for authorization
   - Click "Review Permissions"
   - Select your Google account
   - Click "Allow" to grant Gmail sending permissions

5. **Save and deploy**
   - Click "Save" (Ctrl+S / Cmd+S)
   - Your existing deployment will automatically use the new function

### Step 2: Configure Authorized Emails

1. **Open `admin.js`**
   - Find the `AUTHORIZED_EMAILS` array (around line 3933)
   - Add authorized email addresses:

```javascript
const AUTHORIZED_EMAILS = [
    'ernest@oddplusevenstudio.com',
    'admin@example.com',        // Add your emails here
    'user@example.com',
    // Add more authorized emails...
];
```

### Step 3: Test the Authentication

1. **Open your admin panel**
   - Navigate to `index-sheets.html`
   - You should see the email login form

2. **Enter an authorized email**
   - Type an email from your `AUTHORIZED_EMAILS` list
   - Click "Send Verification Code"

3. **Check your email**
   - You should receive an email with a 6-digit code
   - The code expires in 10 minutes

4. **Enter the code**
   - Type the 6-digit code
   - Click "Verify Code"
   - You should be logged in!

## 🔒 Security Features

The email OTP implementation includes:

- ✅ **6-digit codes** - Cryptographically secure random generation
- ✅ **10-minute expiration** - Codes expire automatically
- ✅ **Rate limiting** - Max 3 requests per 15 minutes per email
- ✅ **Attempt limiting** - Max 5 failed attempts before requiring new code
- ✅ **Email validation** - Only authorized emails can request codes
- ✅ **No password storage** - No passwords to leak or crack

## 🐛 Troubleshooting

### "Failed to send OTP email"
- **Problem:** Gmail permissions not authorized
- **Solution:** Run the `sendOTPEmail` function once in Apps Script to authorize

### "This email is not authorized"
- **Problem:** Email not in `AUTHORIZED_EMAILS` list
- **Solution:** Add the email to the `AUTHORIZED_EMAILS` array in `admin.js`

### "Too many requests"
- **Problem:** Rate limit exceeded (3 requests per 15 minutes)
- **Solution:** Wait 15 minutes or use a different authorized email

### "OTP code has expired"
- **Problem:** Code expired (10 minutes)
- **Solution:** Click "Resend Code" to get a new one

### Email not received
- **Check spam folder**
- **Verify email address is correct**
- **Check Apps Script execution logs** (View → Logs in Apps Script)

## 📝 Configuration Options

You can customize the OTP settings in `admin.js`:

```javascript
const OTP_CONFIG = {
    length: 6,              // OTP code length (6 digits)
    expirationMinutes: 10,  // Code expiration time
    maxAttempts: 5,         // Max failed attempts
    rateLimitRequests: 3,   // Max requests per window
    rateLimitWindow: 15 * 60 * 1000 // Rate limit window (15 minutes)
};
```

## 🔄 Disabling Authentication (Testing)

To disable authentication for testing:

1. **Open `admin.js`**
2. **Find `ENABLE_EMAIL_OTP`** (around line 3920)
3. **Set to `false`:**

```javascript
const ENABLE_EMAIL_OTP = false; // 👈 Disable authentication
```

## 📚 Additional Notes

- **Email delivery:** Uses Gmail service (requires Gmail permissions)
- **Code storage:** Currently client-side (for production, move to server-side)
- **Session management:** Uses sessionStorage (cleared on browser close)
- **Multiple devices:** Each device needs separate login

## ✅ Checklist

- [ ] Added `sendOTPEmail()` function to Apps Script
- [ ] Updated `doPost()` to handle `sendOTP` action
- [ ] Authorized Gmail permissions
- [ ] Added authorized emails to `AUTHORIZED_EMAILS` array
- [ ] Tested email delivery
- [ ] Tested OTP verification
- [ ] Tested rate limiting
- [ ] Tested expiration

**You're all set!** Your admin panel now uses secure email OTP authentication. 🎉
