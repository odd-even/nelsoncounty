# Debugging Authorized Emails Issue

## Problem: Only default emails work, new emails don't

## Quick Diagnostic Function

Add this to your Google Apps Script and run it:

```javascript
function debugAuthorizedEmails() {
  Logger.log('=== DEBUGGING AUTHORIZED EMAILS ===');
  
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty('AUTHORIZED_EMAILS');
  
  Logger.log('1. PropertiesService has AUTHORIZED_EMAILS: ' + (stored ? 'YES' : 'NO'));
  
  if (stored) {
    Logger.log('2. Stored value: ' + stored);
    try {
      const parsed = JSON.parse(stored);
      Logger.log('3. Parsed emails: ' + JSON.stringify(parsed));
      Logger.log('4. Number of emails: ' + parsed.length);
    } catch (e) {
      Logger.log('3. ERROR parsing: ' + e);
    }
  }
  
  Logger.log('5. Default emails: ' + JSON.stringify(DEFAULT_AUTHORIZED_EMAILS));
  
  const retrieved = getAuthorizedEmails();
  Logger.log('6. getAuthorizedEmails() returns: ' + JSON.stringify(retrieved));
  Logger.log('7. Number returned: ' + retrieved.length);
  
  Logger.log('=== END DEBUG ===');
}
```

## Common Issues

### Issue 1: PropertiesService Not Persisting
**Symptom:** Emails show in "see emails on server" but don't work for login
**Check:** Run `debugAuthorizedEmails()` - if stored is null, emails aren't being saved
**Fix:** Make sure `setAuthorizedEmails()` is being called and not throwing errors

### Issue 2: Case Sensitivity
**Symptom:** Email added as "User@Example.com" but login uses "user@example.com"
**Fix:** The code now normalizes all emails to lowercase - this should be fixed

### Issue 3: Email Format Issues
**Symptom:** Email has extra spaces or invalid format
**Fix:** The code now trims whitespace - check logs for normalization

### Issue 4: Caching
**Symptom:** Old emails still being used
**Fix:** Clear PropertiesService and re-add:
```javascript
function clearAuthorizedEmails() {
  PropertiesService.getScriptProperties().deleteProperty('AUTHORIZED_EMAILS');
  Logger.log('Cleared AUTHORIZED_EMAILS property');
}
```

## Step-by-Step Debugging

1. **Run `debugAuthorizedEmails()`** in Apps Script
2. **Check the logs** (View → Logs)
3. **Compare:**
   - What's in PropertiesService
   - What `getAuthorizedEmails()` returns
   - What the defaults are

4. **If PropertiesService is empty:**
   - The sync isn't working
   - Check browser console for sync errors
   - Check Apps Script logs for `updateAuthorizedEmails` errors

5. **If PropertiesService has emails but `getAuthorizedEmails()` returns defaults:**
   - There's a parsing error
   - Check the stored JSON format
   - Look for error messages in logs

6. **If emails are stored correctly but login still fails:**
   - Check case sensitivity
   - Check the exact email being used for login
   - Add logging to `sendOTPEmail()` to see what's being checked

## Manual Fix

If emails aren't syncing, you can manually set them:

```javascript
function manuallySetAuthorizedEmails() {
  const emails = [
    'ernest@oddpluseven.com',
    'ernest@oddplusevenstudio.com',
    'adam@oddpluseven.com',
    'rj@oddpluseven.com',
    'bniemeyer@nelsoncounty.org',
    'makelley@nelsoncounty.org',
    'esther@oddpluseven.com',
    // Add your new email here
    'newemail@example.com'
  ];
  
  setAuthorizedEmails(emails);
  Logger.log('Manually set ' + emails.length + ' emails');
  
  // Verify
  const retrieved = getAuthorizedEmails();
  Logger.log('Verified: ' + JSON.stringify(retrieved));
}
```

## Verify It's Working

After fixing, test with:

```javascript
function testEmailAuthorization(email) {
  const normalized = String(email).trim().toLowerCase();
  const authorized = getAuthorizedEmails();
  const isAuthorized = authorized.includes(normalized);
  
  Logger.log('Testing: ' + normalized);
  Logger.log('Authorized list: ' + JSON.stringify(authorized));
  Logger.log('Is authorized: ' + isAuthorized);
  
  return isAuthorized;
}
```

Run: `testEmailAuthorization('your-new-email@example.com')`
