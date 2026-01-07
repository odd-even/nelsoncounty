# Debugging Login Notification

## Issue: Test function works, but notification doesn't fire during login

## Steps to Debug

### Step 1: Verify the Script is Updated
1. Open Google Apps Script editor
2. Search for `sendLoginNotification` - the function should exist
3. Search for `🔔 Login successful` - you should see the Logger.log statements
4. If these don't exist, you need to copy the updated `COMPLETE-GOOGLE-APPS-SCRIPT.gs` file

### Step 2: Check Execution Logs During Login
1. Open Google Apps Script editor
2. Go to **View → Logs** (or **Execution log**)
3. Clear the log
4. Log in to the admin panel with a different email (not `ernest@oddpluseven.com`)
5. Immediately check the logs - you should see:
   - `🔍 doGet verifyOTP called for email: [email]`
   - `🔍 verifyOTP result: {"success":true}`
   - `✅ OTP verification successful, generating session token...`
   - `🔔 Login successful for: [email], sending notification...`
   - `🔔 sendLoginNotification called for: [email]`
   - `📧 Attempting to send notification to: ernest@oddpluseven.com`
   - `✅ Login notification sent successfully...`

### Step 3: Check What Email You're Logging In With
- If you log in with `ernest@oddpluseven.com` or `ernest@oddplusevenstudio.com`, the notification will be **skipped** (this is by design)
- Try logging in with a different authorized email like:
  - `adam@oddpluseven.com`
  - `rj@oddpluseven.com`
  - `bniemeyer@nelsoncounty.org`

### Step 4: Verify Deployment
1. In Google Apps Script, go to **Deploy → Manage deployments**
2. Check the deployment version number
3. Make sure you've saved the script after adding the notification code
4. If needed, create a new deployment version

### Step 5: Check for Errors
Look for these in the logs:
- `❌ OTP verification failed` - means login didn't succeed
- `⚠️  Notification failed but login succeeded` - means notification had an error
- `⏭️  Skipping notification for: [email]` - means you logged in with excluded email

## Common Issues

### Issue 1: Script Not Updated
**Symptom:** No `🔔` or `🔍` messages in logs
**Solution:** Copy the entire updated `COMPLETE-GOOGLE-APPS-SCRIPT.gs` file to Apps Script

### Issue 2: Logging In With Excluded Email
**Symptom:** See `⏭️  Skipping notification` in logs
**Solution:** This is expected - try with a different email

### Issue 3: Email Permission Not Authorized
**Symptom:** See permission errors in logs
**Solution:** Run `testLoginNotification()` function to authorize

### Issue 4: Old Deployment Version
**Symptom:** Code looks correct but doesn't execute
**Solution:** Create a new deployment or update existing deployment

## Quick Test

Run this in Apps Script to verify everything is set up:
```javascript
function quickTest() {
  Logger.log('Testing notification system...');
  const result = testLoginNotification();
  Logger.log('Test result: ' + result);
}
```

Then check the logs and your inbox.
