# Login Notification Setup

## ✅ What's Been Implemented

The admin panel now sends email notifications to `ernest@oddpluseven.com` whenever someone logs in, **except** when `ernest@oddpluseven.com` logs in (notifications will be sent for `ernest@oddplusevenstudio.com` and all other emails).

## 📧 Notification Details

- **Recipient:** `ernest@oddpluseven.com`
- **Subject:** "Nelson County Admin - Login Notification"
- **Content:** Includes the user's email and login time
- **Excluded:** No notification sent for `ernest@oddpluseven.com` only

## 🔧 Implementation

The notification is automatically sent from the Google Apps Script when:
1. A user successfully verifies their OTP code
2. A session token is generated
3. The user's email is NOT `ernest@oddpluseven.com` (all other emails, including `ernest@oddplusevenstudio.com`, will trigger notifications)

## 📋 Setup Instructions

### Step 1: Update Google Apps Script

1. **Open your Google Apps Script project**
   - Go to: https://script.google.com/
   - Open your Nelson County Apps Script project

2. **Copy the updated code**
   - Open: `Instruction Files/COMPLETE-GOOGLE-APPS-SCRIPT.gs`
   - Copy the entire file contents
   - Paste into your Google Apps Script editor

3. **Save and deploy**
   - Click "Save" (Ctrl+S / Cmd+S)
   - Your existing deployment will automatically use the new function

### Step 2: Verify Email Permissions

The notification uses the same email permissions as OTP emails. If OTP emails are working, notifications will work too.

If you need to authorize email permissions:
1. In Google Apps Script editor, select `testAuthorizeEmail` from the function dropdown
2. Click the **Run** button (▶️)
3. Click **"Review permissions"** → **"Allow"**

## 📝 Notification Email Format

```
Hello,

Someone has logged into the Nelson County Admin Panel.

Login Details:
- Email: user@example.com
- Time: 1/6/2026, 3:45:23 PM

If this was not you, please review your authorized users list.

---
Nelson County Admin Panel
```

## 🔒 Security Notes

- **Non-blocking:** If the notification email fails to send, the login will still succeed
- **Privacy:** Only the user's email and login time are included
- **No IP tracking:** IP addresses are not available in Google Apps Script

## ✅ Testing

### Option 1: Test Function (Recommended)
1. In Google Apps Script editor, select `testLoginNotification` from the function dropdown
2. Click the **Run** button (▶️)
3. If prompted, authorize email permissions
4. Check `ernest@oddpluseven.com` inbox for the test notification
5. Check the execution log (View → Logs) for detailed output

### Option 2: Real Login Test
1. Log in with any authorized email (except `ernest@oddpluseven.com` - `ernest@oddplusevenstudio.com` will trigger notifications)
2. Check `ernest@oddpluseven.com` inbox for the notification
3. Verify the email contains the correct user email and timestamp
4. Check Apps Script execution logs (View → Logs) to see if notification was sent

## 🐛 Troubleshooting

### No notification received

**Step 1: Check if you updated the script**
- Make sure you copied the entire updated `COMPLETE-GOOGLE-APPS-SCRIPT.gs` file
- Verify the `sendLoginNotification()` function exists in your Apps Script

**Step 2: Check what email you logged in with**
- If you logged in with `ernest@oddpluseven.com`, no notification will be sent (this is by design). `ernest@oddplusevenstudio.com` will trigger notifications.
- Try logging in with a different authorized email (e.g., `adam@oddpluseven.com`)

**Step 3: Check Apps Script execution logs**
- Go to Google Apps Script editor
- Click **View → Logs** (or **Execution log**)
- Look for messages starting with `🔔` or `📧` or `❌`
- This will show if the function was called and if there were any errors

**Step 4: Test the notification function directly**
- In Apps Script editor, select `testLoginNotification` from the function dropdown
- Click **Run** (▶️)
- Check the execution log for results
- Check your inbox for the test email

**Step 5: Verify email permissions**
- If you see permission errors in the logs, run `testLoginNotification()` to authorize
- Or run `testAuthorizeEmail()` if that's available

**Step 6: Check spam folder**
- Sometimes notification emails go to spam

### Notification sent for ernest@oddpluseven.com
- This shouldn't happen - check the email address comparison logic in `sendLoginNotification()`
- Verify the email is exactly `ernest@oddpluseven.com` (case-insensitive). Note: `ernest@oddplusevenstudio.com` will trigger notifications.

## 📚 Code Location

- **Function:** `sendLoginNotification(userEmail)` in `COMPLETE-GOOGLE-APPS-SCRIPT.gs`
- **Called from:** `doGet()` and `doPost()` handlers after successful OTP verification

**You're all set!** Login notifications are now active. 🎉
