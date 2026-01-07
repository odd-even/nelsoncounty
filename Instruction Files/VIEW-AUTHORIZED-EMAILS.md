# How to View Authorized Emails in Google Apps Script

## 📧 Where Emails Are Stored

Authorized emails are **NOT stored in the code file**. They are stored in **Google Apps Script's PropertiesService** (persistent storage), which is separate from the code.

## ✅ How to View Authorized Emails

### Option 1: Use the Admin Panel (Easiest)
1. Log in to your admin panel
2. Go to the "Authorized Emails" section
3. You'll see the list of all authorized emails there

### Option 2: Use the Test Function in Apps Script
1. Open your Google Apps Script editor
2. Add this function to your script (or use the existing one):

```javascript
function viewAuthorizedEmails() {
  const emails = getAuthorizedEmails();
  Logger.log('📧 Authorized Emails:');
  emails.forEach(function(email, index) {
    Logger.log((index + 1) + '. ' + email);
  });
  return emails;
}
```

3. Select `viewAuthorizedEmails` from the function dropdown
4. Click **Run** (▶️)
5. Go to **View → Logs** to see the list

### Option 3: Check PropertiesService Directly
1. In Google Apps Script editor, go to **Project Settings** (gear icon)
2. Scroll down to **Script Properties**
3. Look for a property named `AUTHORIZED_EMAILS`
4. The value will be a JSON array of emails

### Option 4: Use the API Endpoint
You can also call the `getAuthorizedEmails` action:
```
https://your-script-url?action=getAuthorizedEmails
```

This will return a JSON response with the emails.

## 🔍 Why Not in the Code?

The emails are stored in PropertiesService because:
- ✅ **Security**: Not visible in the code file
- ✅ **Dynamic**: Can be updated without editing code
- ✅ **Persistent**: Survives code updates
- ✅ **Admin-friendly**: Can be managed from the admin panel

## 📝 Default Emails

The code has a `DEFAULT_AUTHORIZED_EMAILS` array that's used only for initialization. Once emails are stored in PropertiesService, that array is ignored.

## 🔄 How It Works

1. **First time**: Script initializes with `DEFAULT_AUTHORIZED_EMAILS`
2. **After that**: All emails are stored in PropertiesService
3. **Updates**: When you add emails via admin panel, they're saved to PropertiesService
4. **Reading**: `getAuthorizedEmails()` reads from PropertiesService

## ✅ Quick Check

To quickly see all authorized emails, run this in the Apps Script editor:

```javascript
function quickCheckEmails() {
  const emails = getAuthorizedEmails();
  console.log('Authorized Emails (' + emails.length + '):');
  emails.forEach(function(email) {
    console.log('  - ' + email);
  });
  return emails;
}
```

Then check the **Execution log** (View → Logs) to see the output.
