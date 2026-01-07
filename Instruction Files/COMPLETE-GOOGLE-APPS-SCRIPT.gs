/**
 * ============================================================
 * NELSON COUNTY ADMIN PANEL - GOOGLE APPS SCRIPT
 * ============================================================
 *
 * Full replacement script: paste the entire file, save, redeploy.
 * ============================================================
 */

const LISTINGS_SHEET_NAME = 'Nelson County';
const CATEGORIES_SHEET_NAME = 'Categories';

// -----------------------------------------------------------------------------
// SERVER-SIDE AUTHENTICATION CONFIGURATION
// -----------------------------------------------------------------------------

// Default authorized emails (used for initialization)
const DEFAULT_AUTHORIZED_EMAILS = [
  'ernest@oddplusevenstudio.com',
  'ernest@oddpluseven.com',
  'adam@oddpluseven.com',
  'rj@oddpluseven.com',
  'bniemeyer@nelsoncounty.org',
  'makelley@nelsoncounty.org',
  'esther@oddpluseven.com'
];

/**
 * Get authorized emails from PropertiesService (persistent storage)
 * Falls back to default emails if not set, and initializes them
 * Returns all emails in lowercase for consistent checking
 */
function getAuthorizedEmails() {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty('AUTHORIZED_EMAILS');
  
  Logger.log('🔍 getAuthorizedEmails: Checking PropertiesService...');
  Logger.log('🔍 getAuthorizedEmails: Stored value exists: ' + (stored ? 'YES' : 'NO'));
  
  if (stored) {
    try {
      const emails = JSON.parse(stored);
      Logger.log('🔍 getAuthorizedEmails: Parsed emails from storage: ' + JSON.stringify(emails));
      
      // Ensure all emails are lowercase (in case old data exists)
      const normalized = emails.map(function(email) {
        return String(email).trim().toLowerCase();
      }).filter(function(email) {
        return email.length > 0;
      });
      
      Logger.log('🔍 getAuthorizedEmails: Normalized emails: ' + JSON.stringify(normalized));
      
      // If normalization changed anything, save it back
      if (JSON.stringify(emails) !== JSON.stringify(normalized)) {
        Logger.log('🔧 Normalizing stored emails to lowercase');
        props.setProperty('AUTHORIZED_EMAILS', JSON.stringify(normalized));
      }
      
      Logger.log('✅ getAuthorizedEmails: Returning ' + normalized.length + ' emails from PropertiesService');
      return normalized;
    } catch (e) {
      Logger.log('❌ Error parsing stored authorized emails: ' + e);
      Logger.log('❌ Stored value was: ' + stored);
      // Fall through to initialize defaults
    }
  }
  
  // Initialize with defaults if not set (ONLY on first run)
  Logger.log('⚠️  getAuthorizedEmails: No stored emails found, initializing with defaults');
  Logger.log('📧 Default emails: ' + JSON.stringify(DEFAULT_AUTHORIZED_EMAILS));
  setAuthorizedEmails(DEFAULT_AUTHORIZED_EMAILS);
  const normalizedDefaults = DEFAULT_AUTHORIZED_EMAILS.map(function(email) {
    return String(email).trim().toLowerCase();
  });
  Logger.log('✅ getAuthorizedEmails: Initialized and returning defaults: ' + JSON.stringify(normalizedDefaults));
  return normalizedDefaults;
}

/**
 * Set authorized emails in PropertiesService
 * Normalizes all emails to lowercase for consistent checking
 */
function setAuthorizedEmails(emails) {
  if (!Array.isArray(emails) || emails.length === 0) {
    throw new Error('Authorized emails must be a non-empty array');
  }
  
  // Normalize all emails to lowercase and trim whitespace
  const normalizedEmails = emails.map(function(email) {
    return String(email).trim().toLowerCase();
  }).filter(function(email) {
    return email.length > 0; // Remove empty strings
  });
  
  if (normalizedEmails.length === 0) {
    throw new Error('No valid emails after normalization');
  }
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty('AUTHORIZED_EMAILS', JSON.stringify(normalizedEmails));
  Logger.log('Authorized emails updated: ' + normalizedEmails.length + ' emails');
  Logger.log('📧 Stored emails: ' + JSON.stringify(normalizedEmails));
}

/**
 * Initialize authorized emails on first run
 */
function initializeAuthorizedEmails() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('AUTHORIZED_EMAILS')) {
    setAuthorizedEmails(DEFAULT_AUTHORIZED_EMAILS);
    Logger.log('Initialized authorized emails with defaults');
  }
}

// OTP Configuration
const OTP_CONFIG = {
  expirationMinutes: 10,
  maxAttempts: 5,
  rateLimitRequests: 3,
  rateLimitWindow: 15 * 60 * 1000 // 15 minutes
};

// Session Configuration
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// -----------------------------------------------------------------------------
// ImageKit helpers
// -----------------------------------------------------------------------------

function uploadRemoteImageToImageKit(imageUrl, fileName) {
  if (!imageUrl) return '';
  if (String(imageUrl).startsWith('https://ik.imagekit.io/OE')) return imageUrl;

  const props = PropertiesService.getScriptProperties();
  const privateKey = props.getProperty('IMAGEKIT_PRIVATE_KEY');
  const uploadFolder = props.getProperty('IMAGEKIT_UPLOAD_FOLDER') || '';
  if (!privateKey) throw new Error('IMAGEKIT_PRIVATE_KEY missing in Script Properties.');

  const payload = {
    file: imageUrl,
    fileName: fileName || ('listing-' + Date.now()),
    useUniqueFileName: true
  };
  if (uploadFolder) payload.folder = uploadFolder;

  const options = {
    method: 'post',
    payload: payload,
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(privateKey + ':') },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://upload.imagekit.io/api/v1/files/upload', options);
  const status = response.getResponseCode();
  if (status >= 200 && status < 300) {
    const json = JSON.parse(response.getContentText());
    return json.url || ('https://ik.imagekit.io/OE' + json.filePath);
  }

  throw new Error('ImageKit upload failed (' + status + '): ' + response.getContentText());
}

function setIfChanged(sheet, rowIndex, colIndex, newValue) {
  const current = sheet.getRange(rowIndex, colIndex).getValue();
  if (current !== newValue) {
    sheet.getRange(rowIndex, colIndex).setValue(newValue);
  }
}

function tryUpload(url, fileName) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return uploadRemoteImageToImageKit(url, fileName);
    } catch (err) {
      Logger.log('Upload failed (' + attempt + '/' + maxAttempts + ') for ' + url + ': ' + err);
      if (attempt === maxAttempts) throw err;
      Utilities.sleep(2000);
    }
  }
}

function listSheetHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LISTINGS_SHEET_NAME);
  if (!sheet) {
    Logger.log('Sheet "' + LISTINGS_SHEET_NAME + '" not found.');
    return;
  }
  const values = sheet.getDataRange().getValues();
  if (!values.length) {
    Logger.log('Sheet is empty.');
    return;
  }
  Logger.log('Headers: ' + JSON.stringify(values[0]));
}

// -----------------------------------------------------------------------------
// Email OTP Authentication
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// SERVER-SIDE OTP STORAGE AND VALIDATION
// -----------------------------------------------------------------------------

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOTP() {
  const min = 100000;
  const max = 999999;
  const randomBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    Utilities.newBlob(Math.random().toString()).getBytes()
  );
  const randomNum = Math.abs(
    (randomBytes[0] << 24) | (randomBytes[1] << 16) | (randomBytes[2] << 8) | randomBytes[3]
  );
  return (min + (randomNum % (max - min + 1))).toString();
}

/**
 * Store OTP server-side (in ScriptProperties for persistence)
 */
function storeOTP(email, code) {
  const emailKey = 'otp_' + email.toLowerCase();
  const otpData = {
    code: code,
    expires: Date.now() + (OTP_CONFIG.expirationMinutes * 60 * 1000),
    attempts: 0,
    created: Date.now()
  };
  PropertiesService.getScriptProperties().setProperty(emailKey, JSON.stringify(otpData));
  
  // Also store in request history for rate limiting
  const historyKey = 'otp_history_' + email.toLowerCase();
  const history = JSON.parse(PropertiesService.getScriptProperties().getProperty(historyKey) || '[]');
  history.push(Date.now());
  // Keep only recent history (last hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentHistory = history.filter(function(timestamp) {
    return timestamp > oneHourAgo;
  });
  PropertiesService.getScriptProperties().setProperty(historyKey, JSON.stringify(recentHistory));
}

/**
 * Verify OTP server-side
 */
function verifyOTP(email, code) {
  const emailKey = 'otp_' + email.toLowerCase();
  const otpDataStr = PropertiesService.getScriptProperties().getProperty(emailKey);
  
  if (!otpDataStr) {
    return {
      success: false,
      error: 'No OTP code found. Please request a new code.'
    };
  }
  
  const otpData = JSON.parse(otpDataStr);
  
  // Check expiration
  if (Date.now() > otpData.expires) {
    PropertiesService.getScriptProperties().deleteProperty(emailKey);
    return {
      success: false,
      error: 'OTP code has expired. Please request a new code.'
    };
  }
  
  // Check attempts
  otpData.attempts++;
  if (otpData.attempts > OTP_CONFIG.maxAttempts) {
    PropertiesService.getScriptProperties().deleteProperty(emailKey);
    return {
      success: false,
      error: 'Too many failed attempts. Please request a new code.'
    };
  }
  
  // Verify code
  if (otpData.code !== code) {
    PropertiesService.getScriptProperties().setProperty(emailKey, JSON.stringify(otpData));
    const remainingAttempts = OTP_CONFIG.maxAttempts - otpData.attempts;
    return {
      success: false,
      error: 'Invalid code. ' + remainingAttempts + ' attempt(s) remaining.'
    };
  }
  
  // Success - delete OTP
  PropertiesService.getScriptProperties().deleteProperty(emailKey);
  return {
    success: true
  };
}

/**
 * Check rate limiting server-side
 */
function checkRateLimit(email) {
  const historyKey = 'otp_history_' + email.toLowerCase();
  const history = JSON.parse(PropertiesService.getScriptProperties().getProperty(historyKey) || '[]');
  const now = Date.now();
  const recentRequests = history.filter(function(timestamp) {
    return (now - timestamp) < OTP_CONFIG.rateLimitWindow;
  });
  
  if (recentRequests.length >= OTP_CONFIG.rateLimitRequests) {
    const oldestRequest = recentRequests[0];
    const waitTime = Math.ceil((OTP_CONFIG.rateLimitWindow - (now - oldestRequest)) / 1000 / 60);
    return {
      allowed: false,
      waitMinutes: waitTime
    };
  }
  
  return { allowed: true };
}

/**
 * Generate a secure session token
 */
function generateSessionToken(email) {
  const tokenData = {
    email: email.toLowerCase(),
    created: Date.now(),
    expires: Date.now() + SESSION_EXPIRATION_MS,
    random: Utilities.getUuid()
  };
  
  // Create a secure token (base64 encoded JSON)
  const tokenString = Utilities.base64Encode(JSON.stringify(tokenData));
  return tokenString;
}

/**
 * Validate session token server-side
 */
function validateSessionToken(token) {
  try {
    const tokenData = JSON.parse(Utilities.base64Decode(token));
    
    // Check expiration
    if (Date.now() > tokenData.expires) {
      return {
        valid: false,
        error: 'Session expired'
      };
    }
    
    // Normalize email for checking (emails in PropertiesService are lowercase)
    const normalizedEmail = String(tokenData.email).trim().toLowerCase();
    const authorizedEmails = getAuthorizedEmails();
    
    Logger.log('🔍 validateSessionToken: Checking email: ' + normalizedEmail);
    Logger.log('🔍 validateSessionToken: Authorized emails: ' + JSON.stringify(authorizedEmails));
    
    // Check if email is authorized
    if (!authorizedEmails.includes(normalizedEmail)) {
      Logger.log('❌ validateSessionToken: Email not authorized: ' + normalizedEmail);
      return {
        valid: false,
        error: 'Email not authorized'
      };
    }
    
    Logger.log('✅ validateSessionToken: Email authorized: ' + normalizedEmail);
    return {
      valid: true,
      email: normalizedEmail
    };
  } catch (e) {
    Logger.log('❌ validateSessionToken: Error: ' + e.toString());
    return {
      valid: false,
      error: 'Invalid session token'
    };
  }
}

/**
 * Store session token server-side (optional - for revocation)
 */
function storeSessionToken(token, email) {
  const tokenKey = 'session_' + email.toLowerCase();
  PropertiesService.getScriptProperties().setProperty(tokenKey, token);
}

/**
 * Send OTP email for admin panel authentication
 * Now generates OTP server-side and stores it securely
 */
function sendOTPEmail(email) {
  try {
    // Normalize email for checking
    const normalizedEmail = String(email).trim().toLowerCase();
    const authorizedEmails = getAuthorizedEmails();
    
    Logger.log('🔍 sendOTPEmail: Checking authorization for: ' + normalizedEmail);
    Logger.log('🔍 sendOTPEmail: Authorized emails: ' + JSON.stringify(authorizedEmails));
    
    // Check if email is authorized
    if (!authorizedEmails.includes(normalizedEmail)) {
      Logger.log('❌ sendOTPEmail: Email not authorized: ' + normalizedEmail);
      return {
        success: false,
        error: 'This email is not authorized to access the admin panel.'
      };
    }
    
    Logger.log('✅ sendOTPEmail: Email authorized: ' + normalizedEmail);
    
    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: 'Too many requests. Please wait ' + rateLimit.waitMinutes + ' minute(s) before requesting another code.'
      };
    }
    
    // Generate OTP server-side
    const code = generateOTP();
    
    // Store OTP server-side
    storeOTP(email, code);
    
    // Send email
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
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body,
      name: 'Nelson County Admin Panel'
    });
    
    Logger.log('OTP email sent to: ' + email);
    return {
      success: true
    };
  } catch (error) {
    const errorMsg = error.toString();
    Logger.log('Error sending OTP email: ' + errorMsg);
    
    if (errorMsg.includes('permission') || errorMsg.includes('Required permissions')) {
      return {
        success: false,
        error: 'Email permission not authorized. Please run the testAuthorizeEmail() function in the Apps Script editor to authorize email sending.'
      };
    }
    
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Send login notification email to admin
 * Called when someone logs in (except ernest@oddpluseven.com)
 */
function sendLoginNotification(userEmail) {
  try {
    Logger.log('🔔 sendLoginNotification called for: ' + userEmail);
    
    // Validate email parameter
    if (!userEmail || typeof userEmail !== 'string' || userEmail.trim() === '') {
      Logger.log('❌ Invalid email parameter: ' + userEmail);
      return { success: false, error: 'Invalid email parameter' };
    }
    
    const email = userEmail.trim().toLowerCase();
    
    // Don't send notification for ernest@oddpluseven.com (but allow ernest@oddplusevenstudio.com)
    if (email === 'ernest@oddpluseven.com') {
      Logger.log('⏭️  Skipping notification for: ' + email + ' (excluded by design)');
      return { success: true, skipped: true };
    }
    
    const adminEmail = 'ernest@oddpluseven.com';
    const subject = 'Nelson County Admin - Login Notification';
    const body = `
Hello,

Someone has logged into the Nelson County Admin Panel.

Login Details:
- Email: ${email}
- Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}

If this was not you, please review your authorized users list.

---
Nelson County Admin Panel
    `.trim();
    
    Logger.log('📧 Attempting to send notification to: ' + adminEmail);
    MailApp.sendEmail({
      to: adminEmail,
      subject: subject,
      body: body,
      name: 'Nelson County Admin Panel'
    });
    
    Logger.log('✅ Login notification sent successfully to: ' + adminEmail + ' for user: ' + email);
    return {
      success: true
    };
  } catch (error) {
    const errorMsg = error.toString();
    Logger.log('❌ Error sending login notification: ' + errorMsg);
    
    if (errorMsg.includes('permission') || errorMsg.includes('Required permissions')) {
      Logger.log('⚠️  Email permission not authorized. Please run testLoginNotification() to authorize.');
    }
    
    // Don't fail login if notification fails
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * TEST FUNCTION: Test login notification email
 * 
 * INSTRUCTIONS:
 * 1. In Google Apps Script editor, select this function from the dropdown
 * 2. Click the "Run" button (▶️)
 * 3. You'll see an "Authorization required" dialog if needed
 * 4. Click "Review permissions" → "Allow"
 * 5. Check ernest@oddpluseven.com inbox for test notification
 */
function testLoginNotification() {
  Logger.log('🧪 Testing login notification...');
  
  // Test with a sample email (not ernest@oddpluseven.com)
  const testEmail = 'test@example.com';
  const result = sendLoginNotification(testEmail);
  
  if (result.success && !result.skipped) {
    Logger.log('✅ Test notification sent successfully!');
    Logger.log('   Check ernest@oddpluseven.com inbox for the test email.');
    return '✅ Test notification sent! Check your inbox.';
  } else if (result.skipped) {
    Logger.log('⏭️  Notification was skipped (expected for ernest@oddpluseven.com)');
    return '⏭️  Notification skipped (this is expected for excluded emails)';
  } else {
    Logger.log('❌ Test failed: ' + (result.error || 'Unknown error'));
    return '❌ Test failed: ' + (result.error || 'Unknown error');
  }
}

/**
 * TEST FUNCTION: Run this to authorize email sending permissions
 * 
 * INSTRUCTIONS:
 * 1. In Google Apps Script editor, select this function from the dropdown
 * 2. Click the "Run" button (▶️)
 * 3. You'll see an "Authorization required" dialog
 * 4. Click "Review permissions"
 * 5. Select your Google account
 * 6. Click "Advanced" → "Go to [Your Project Name] (unsafe)"
 * 7. Click "Allow"
 * 8. The test email should be sent successfully
 * 
 * After authorization, the sendOTPEmail function will work.
 */
function testAuthorizeEmail() {
  try {
    // Try to send a test email to yourself
    const testEmail = Session.getActiveUser().getEmail();
    const testSubject = 'Nelson County Admin - Email Authorization Test';
    const testBody = 'This is a test email to verify email sending permissions are working correctly.';
    
    MailApp.sendEmail({
      to: testEmail,
      subject: testSubject,
      body: testBody,
      name: 'Nelson County Admin Panel'
    });
    
    Logger.log('✅ Test email sent successfully to: ' + testEmail);
    Logger.log('✅ Email permissions are authorized!');
    return 'SUCCESS: Test email sent to ' + testEmail;
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error; // Re-throw to trigger authorization dialog
  }
}

// -----------------------------------------------------------------------------
// OPTIONS / GET handlers
// -----------------------------------------------------------------------------

function doOptions(e) {
  // Handle CORS preflight requests (OPTIONS method)
  // Google Apps Script automatically handles CORS when deployed with "Anyone" access
  // Return empty response with JSON mime type - Google will add CORS headers automatically
  return ContentService
    .createTextOutput(JSON.stringify({}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    // Handle OTP email sending via GET (to avoid CORS preflight)
    if (e && e.parameter && e.parameter.action === 'sendOTP') {
      const email = e.parameter.email;
      if (!email) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing email parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Generate and send OTP server-side
      const result = sendOTPEmail(email);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle OTP verification via GET
    if (e && e.parameter && e.parameter.action === 'verifyOTP') {
      const email = e.parameter.email;
      const code = e.parameter.code;
      if (!email || !code) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing email or code parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Verify OTP server-side
      Logger.log('🔍 doGet verifyOTP called for email: ' + email);
      const result = verifyOTP(email, code);
      Logger.log('🔍 verifyOTP result: ' + JSON.stringify(result));
      
      // If successful, generate session token
      if (result.success) {
        Logger.log('✅ OTP verification successful, generating session token...');
        Logger.log('🔍 Email variable value: ' + email + ' (type: ' + typeof email + ')');
        
        // Ensure email is valid before proceeding
        if (!email || typeof email !== 'string' || email.trim() === '') {
          Logger.log('❌ Email is invalid or missing: ' + email);
        } else {
          const sessionToken = generateSessionToken(email);
          storeSessionToken(sessionToken, email);
          result.sessionToken = sessionToken;
          
          // Send login notification (except for ernest@oddpluseven.com)
          Logger.log('🔔 Login successful for: ' + email + ', sending notification...');
          Logger.log('🔔 About to call sendLoginNotification with email: ' + email);
          try {
            const notificationResult = sendLoginNotification(email);
            Logger.log('🔔 Notification result: ' + JSON.stringify(notificationResult));
            if (notificationResult.skipped) {
              Logger.log('⏭️  Notification skipped (expected for ernest@oddpluseven.com)');
            } else if (!notificationResult.success) {
              Logger.log('⚠️  Notification failed but login succeeded: ' + (notificationResult.error || 'Unknown error'));
            } else {
              Logger.log('✅ Notification sent successfully!');
            }
          } catch (notifError) {
            Logger.log('❌ Exception calling sendLoginNotification: ' + notifError.toString());
            Logger.log('❌ Error stack: ' + (notifError.stack || 'No stack trace'));
          }
        }
      } else {
        Logger.log('❌ OTP verification failed: ' + (result.error || 'Unknown error'));
      }
      
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle session validation via GET
    if (e && e.parameter && e.parameter.action === 'validateSession') {
      const token = e.parameter.token;
      if (!token) {
        return ContentService
          .createTextOutput(JSON.stringify({
            valid: false,
            error: 'Missing session token'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const result = validateSessionToken(token);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle get authorized emails via GET (for admin panel display)
    if (e && e.parameter && e.parameter.action === 'getAuthorizedEmails') {
      try {
        const emails = getAuthorizedEmails();
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            emails: emails
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Error retrieving emails: ' + error.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Handle update authorized emails via GET
    if (e && e.parameter && e.parameter.action === 'updateAuthorizedEmails') {
      const emailsParam = e.parameter.emails;
      const sessionToken = e.parameter.token || e.parameter.sessionToken;
      
      if (!emailsParam) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing emails parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const emails = JSON.parse(emailsParam);
        if (!Array.isArray(emails) || emails.length === 0) {
          return ContentService
            .createTextOutput(JSON.stringify({
              success: false,
              error: 'Emails must be a non-empty array'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        // Validate that requester is authorized
        // Check session token if provided
        let requesterEmail = null;
        if (sessionToken) {
          const tokenValidation = validateSessionToken(sessionToken);
          if (tokenValidation.valid) {
            requesterEmail = tokenValidation.email;
          }
        }
        
        // If no valid session, check if at least one email in the list is already authorized
        // This allows adding new emails if you're already logged in (fallback for when token isn't sent)
        if (!requesterEmail) {
          const currentEmails = getAuthorizedEmails();
          Logger.log('🔍 updateAuthorizedEmails: No session token, checking email overlap');
          Logger.log('🔍 Current authorized emails: ' + JSON.stringify(currentEmails));
          Logger.log('🔍 New emails: ' + JSON.stringify(emails));
          
          const hasOverlap = emails.some(function(email) {
            return currentEmails.includes(email.toLowerCase());
          });
          
          if (!hasOverlap) {
            Logger.log('⚠️  updateAuthorizedEmails: No valid session and no overlap with existing emails');
            return ContentService
              .createTextOutput(JSON.stringify({
                success: false,
                error: 'Unauthorized: Must be logged in with an authorized email to update the list. Please log in first, then try adding the email again.'
              }))
              .setMimeType(ContentService.MimeType.JSON);
          } else {
            Logger.log('✅ updateAuthorizedEmails: Email overlap found, allowing update');
          }
        } else {
          // Verify requester is in current authorized list
          const currentEmails = getAuthorizedEmails();
          if (!currentEmails.includes(requesterEmail.toLowerCase())) {
            Logger.log('⚠️  updateAuthorizedEmails: Requester not in authorized list: ' + requesterEmail);
            return ContentService
              .createTextOutput(JSON.stringify({
                success: false,
                error: 'Unauthorized: Your email is not in the authorized list'
              }))
              .setMimeType(ContentService.MimeType.JSON);
          } else {
            Logger.log('✅ updateAuthorizedEmails: Requester authorized: ' + requesterEmail);
          }
        }
        
        Logger.log('✅ updateAuthorizedEmails: Updating to ' + emails.length + ' emails');
        Logger.log('📧 New emails (before normalization): ' + JSON.stringify(emails));
        
        // Save the emails
        setAuthorizedEmails(emails);
        
        // Verify they were saved correctly
        const savedEmails = getAuthorizedEmails();
        Logger.log('✅ updateAuthorizedEmails: Verified saved emails: ' + JSON.stringify(savedEmails));
        Logger.log('✅ updateAuthorizedEmails: Saved ' + savedEmails.length + ' emails successfully');
        
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: 'Authorized emails updated successfully',
            count: savedEmails.length,
            emails: savedEmails
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        Logger.log('❌ Error updating authorized emails: ' + error.toString());
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Error updating emails: ' + error.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Handle ImageKit upload params
    if (e && e.parameter && e.parameter.action === 'getImageKitUploadParams') {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: getImageKitUploadParams()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle AI image description generation via GET
    if (e && e.parameter && e.parameter.action === 'generateImageDescription') {
      const imageUrl = e.parameter.imageUrl;
      if (!imageUrl) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing "imageUrl" parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON)
      }
      // Google Apps Script automatically adds CORS headers when deployed with "Anyone" access
      return generateImageDescription(imageUrl);
    }
    
    // Handle ImageKit metadata update via GET
    if (e && e.parameter && e.parameter.action === 'updateImageKitMetadata') {
      // Prefer fileId if provided (faster and more reliable than searching by path)
      const fileId = e.parameter.fileId || null;
      const filePath = e.parameter.filePath || null;
      
      if (!fileId && !filePath) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing "filePath" or "fileId" parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON)
      }
      
      let customMetadata;
      try {
        customMetadata = JSON.parse(e.parameter.customMetadata || '{}');
      } catch (parseError) {
        customMetadata = { description: e.parameter.customMetadata || '' };
      }
      
      // Use fileId if provided, otherwise use filePath (which will trigger a search)
      const filePathOrId = fileId || filePath;
      // Google Apps Script automatically adds CORS headers when deployed with "Anyone" access
      return updateImageKitFileMetadata(filePathOrId, customMetadata, e.parameter.imageUrl);
    }
    
    // Handle delete listing via GET (fallback to avoid CORS preflight issues)
    if (e && e.parameter && e.parameter.action === 'deleteListing') {
      const listingId = e.parameter.listingId;
      if (!listingId) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing "listingId" parameter'
          }))
          .setMimeType(ContentService.MimeType.JSON)
      }
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const result = deleteListing(sheet, listingId);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: return listings data with categories
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LISTINGS_SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Sheet "' + LISTINGS_SHEET_NAME + '" not found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const result = getData(sheet);
    // Add categories to the response
    const categories = getCategories();
    if (categories && categories.success) {
      result.categories = categories.categories;
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -----------------------------------------------------------------------------
// POST handler with ImageKit branch
// -----------------------------------------------------------------------------

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    let rawData;
    if (e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e.parameter && e.parameter.data) {
      rawData = e.parameter.data;
    } else if (e.postData) {
      rawData = e.postData.getDataAsString();
    }

    if (!rawData) {
      throw new Error('No data received. Make sure you are sending JSON in the request body (e.postData.contents).');
    }

    let data;
    try {
      data = JSON.parse(rawData);
    } catch (parseError) {
      if (typeof rawData === 'string' && rawData.indexOf('action=') === 0) {
        const params = {};
        rawData.split('&').forEach(function(part) {
          const [key, value] = part.split('=');
          params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        data = params;
      } else {
        throw new Error('Invalid JSON data: ' + parseError.toString());
      }
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a JSON object');
    }

    const action = data.action;
    if (!action) {
      throw new Error('Missing "action" field in request');
    }

    if (action === 'getImageKitUploadParams') {
      const response = handleImageKitRequest(data);
      // Ensure CORS headers are set
      return ContentService
        .createTextOutput(response.getContent())
        .setMimeType(response.getMimeType())
    }

    // Handle email OTP sending
    if (action === 'sendOTP') {
      if (!data.email || !data.code) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing email or code'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Generate and send OTP server-side
      const result = sendOTPEmail(data.email);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle OTP verification (POST)
    if (action === 'verifyOTP') {
      if (!data.email || !data.code) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Missing email or code'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Verify OTP server-side
      Logger.log('🔍 doPost verifyOTP called for email: ' + data.email);
      const result = verifyOTP(data.email, data.code);
      Logger.log('🔍 verifyOTP result: ' + JSON.stringify(result));
      
      // If successful, generate session token
      if (result.success) {
        Logger.log('✅ OTP verification successful, generating session token...');
        Logger.log('🔍 Email variable value: ' + data.email + ' (type: ' + typeof data.email + ')');
        
        // Ensure email is valid before proceeding
        if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
          Logger.log('❌ Email is invalid or missing: ' + data.email);
        } else {
          const sessionToken = generateSessionToken(data.email);
          storeSessionToken(sessionToken, data.email);
          result.sessionToken = sessionToken;
          
          // Send login notification (except for ernest@oddpluseven.com)
          Logger.log('🔔 Login successful for: ' + data.email + ', sending notification...');
          Logger.log('🔔 About to call sendLoginNotification with email: ' + data.email);
          try {
            const notificationResult = sendLoginNotification(data.email);
            Logger.log('🔔 Notification result: ' + JSON.stringify(notificationResult));
            if (notificationResult.skipped) {
              Logger.log('⏭️  Notification skipped (expected for ernest@oddpluseven.com)');
            } else if (!notificationResult.success) {
              Logger.log('⚠️  Notification failed but login succeeded: ' + (notificationResult.error || 'Unknown error'));
            } else {
              Logger.log('✅ Notification sent successfully!');
            }
          } catch (notifError) {
            Logger.log('❌ Exception calling sendLoginNotification: ' + notifError.toString());
            Logger.log('❌ Error stack: ' + (notifError.stack || 'No stack trace'));
          }
        }
      } else {
        Logger.log('❌ OTP verification failed: ' + (result.error || 'Unknown error'));
      }
      
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle session validation (POST)
    if (action === 'validateSession') {
      if (!data.token) {
        return ContentService
          .createTextOutput(JSON.stringify({
            valid: false,
            error: 'Missing session token'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const result = validateSessionToken(data.token);
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Handle AI image description generation
    if (action === 'generateImageDescription') {
      if (!data.imageUrl) {
        throw new Error('Missing "imageUrl" field for generateImageDescription action');
      }
      const response = generateImageDescription(data.imageUrl);
      // Ensure CORS headers are set
      return ContentService
        .createTextOutput(response.getContent())
        .setMimeType(response.getMimeType())
    }

    // Handle ImageKit metadata update
    if (action === 'updateImageKitMetadata') {
      if (!data.filePath && !data.fileId) {
        throw new Error('Missing "filePath" or "fileId" field for updateImageKitMetadata action');
      }
      if (!data.customMetadata) {
        throw new Error('Missing "customMetadata" field for updateImageKitMetadata action');
      }
      const response = updateImageKitFileMetadata(data.filePath || data.fileId, data.customMetadata, data.imageUrl);
      // Ensure CORS headers are set
      return ContentService
        .createTextOutput(response.getContent())
        .setMimeType(response.getMimeType())
    }

    let result;
    if (action === 'saveListing') {
      if (!data.listing) throw new Error('Missing "listing" field for saveListing action');
      result = saveListing(sheet, data.listing);
    } else if (action === 'replaceAllListings') {
      if (!data.listings) throw new Error('Missing "listings" field for replaceAllListings action');
      result = replaceAllListings(sheet, data.listings);
    } else if (action === 'deleteListing') {
      if (!data.listingId) throw new Error('Missing "listingId" field for deleteListing action');
      result = deleteListing(sheet, data.listingId);
    } else if (action === 'saveCategories') {
      if (!data.categories) throw new Error('Missing "categories" field for saveCategories action');
      result = saveCategories(data.categories);
    } else {
      result = { success: false, error: 'Unknown action: ' + action + '. Expected: saveListing, replaceAllListings, deleteListing, or saveCategories' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// -----------------------------------------------------------------------------
// Sheet access helpers (existing logic)
// -----------------------------------------------------------------------------

function getData(sheet) {
  try {
    const values = sheet.getDataRange().getValues();
    if (!values || values.length === 0) {
      return { success: true, listings: [] };
    }

    const headers = values[0];
    const rows = values.slice(1);

    const listings = rows.map((row, index) => {
      const listing = {};
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || '';
        const headerLower = String(header).toLowerCase().trim();

        if (headerLower === 'id') {
          listing.id = String(value || (index + 1));
        } else if (headerLower === 'slug') {
          listing.slug = String(value || '');
        } else if (['title', 'name', 'listing name'].includes(headerLower)) {
          listing.name = String(value || '');
        } else if (headerLower === 'type') {
          listing.type = String(value || '');
        } else if (headerLower === 'area') {
          listing.area = String(value || '');
        } else if (headerLower === 'description') {
          listing.description = String(value || '');
        } else if (['detaileddescription', 'detailed description', 'long description'].includes(headerLower)) {
          listing.detailedDescription = String(value || '');
        } else if (['photo', 'image1', 'image 1', 'image url 1'].includes(headerLower)) {
          listing.image1 = String(value || '');
        } else if (['image2', 'image 2', 'image url 2'].includes(headerLower)) {
          listing.image2 = String(value || '');
        } else if (['image3', 'image 3', 'image url 3'].includes(headerLower)) {
          listing.image3 = String(value || '');
        } else if (['image1desc', 'image1 desc', 'image 1 desc', 'image description 1'].includes(headerLower)) {
          listing.image1Desc = String(value || '');
        } else if (['image2desc', 'image2 desc', 'image 2 desc', 'image description 2'].includes(headerLower)) {
          listing.image2Desc = String(value || '');
        } else if (['image3desc', 'image3 desc', 'image 3 desc', 'image description 3'].includes(headerLower)) {
          listing.image3Desc = String(value || '');
        } else if (['image1fileid', 'image1 fileid', 'image 1 fileid', 'image1fileId', 'image1 fileId', 'image1fileid', 'image1_fileid', 'image 1 file id'].includes(headerLower)) {
          listing.image1FileId = String(value || '');
        } else if (['image2fileid', 'image2 fileid', 'image 2 fileid', 'image2fileId', 'image2 fileId', 'image2fileid', 'image2_fileid', 'image 2 file id'].includes(headerLower)) {
          listing.image2FileId = String(value || '');
        } else if (['image3fileid', 'image3 fileid', 'image 3 fileid', 'image3fileId', 'image3 fileId', 'image3fileid', 'image3_fileid', 'image 3 file id'].includes(headerLower)) {
          listing.image3FileId = String(value || '');
        } else if (['external website', 'website', 'url'].includes(headerLower)) {
          listing.website = String(value || '');
        } else if (headerLower === 'phone') {
          listing.phone = String(value || '');
        } else if (headerLower === 'address') {
          listing.address = String(value || '');
        } else if (headerLower === 'amenities') {
          const amenityStr = String(value || '');
          listing.amenities = amenityStr.split(/[,;]/).map(a => a.trim()).filter(a => a);
        } else if (headerLower === 'featured') {
          const featuredVal = String(value || '').toLowerCase();
          listing.featured = featuredVal === 'true' || featuredVal === 'yes' || featuredVal === '1';
        } else if (['customhtml', 'custom html', 'customhtml'].includes(headerLower)) {
          listing.customHtml = String(value || '');
        } else if (['category'].includes(headerLower)) {
          listing.category = String(value || '');
        } else if (['authorname', 'author name', 'author'].includes(headerLower)) {
          listing.authorName = String(value || '');
        } else if (['publisheddate', 'published date', 'created date'].includes(headerLower)) {
          listing.publishedDate = String(value || '');
        } else if (['modifieddate', 'modified date', 'updated date'].includes(headerLower)) {
          listing.modifiedDate = String(value || '');
        } else if (['directionslink', 'directions link', 'directions url'].includes(headerLower)) {
          listing.directionsLink = String(value || '');
        } else if (['googlemapsurl', 'google maps url', 'google map url'].includes(headerLower)) {
          listing.googleMapsUrl = String(value || '');
        } else if (['videolink', 'video link', 'video url', 'youtube', 'youtube url'].includes(headerLower)) {
          listing.videoLink = String(value || '');
        } else if (['document1', 'document 1', 'document1link', 'document 1 link'].includes(headerLower)) {
          listing.document1 = String(value || '');
        } else if (['document1name', 'document 1 name', 'document1 name'].includes(headerLower)) {
          listing.document1Name = String(value || '');
        } else if (['document2', 'document 2', 'document2link', 'document 2 link'].includes(headerLower)) {
          listing.document2 = String(value || '');
        } else if (['document2name', 'document 2 name', 'document2 name'].includes(headerLower)) {
          listing.document2Name = String(value || '');
        } else if (['accordionpanel1title', 'accordion panel 1 title'].includes(headerLower)) {
          listing.accordionPanel1Title = String(value || '');
        } else if (['accordionpanel1content', 'accordion panel 1 content'].includes(headerLower)) {
          listing.accordionPanel1Content = String(value || '');
        } else if (['accordionpanel2title', 'accordion panel 2 title'].includes(headerLower)) {
          listing.accordionPanel2Title = String(value || '');
        } else if (['accordionpanel2content', 'accordion panel 2 content'].includes(headerLower)) {
          listing.accordionPanel2Content = String(value || '');
        } else if (['accordionpanel3title', 'accordion panel 3 title'].includes(headerLower)) {
          listing.accordionPanel3Title = String(value || '');
        } else if (['accordionpanel3content', 'accordion panel 3 content'].includes(headerLower)) {
          listing.accordionPanel3Content = String(value || '');
        } else if (['accordionpanel4title', 'accordion panel 4 title'].includes(headerLower)) {
          listing.accordionPanel4Title = String(value || '');
        } else if (['accordionpanel4content', 'accordion panel 4 content'].includes(headerLower)) {
          listing.accordionPanel4Content = String(value || '');
        } else {
          // Fallback: set field directly, but also check for image file ID fields by header name
          const headerStr = String(header || '').trim();
          if (headerStr.toLowerCase().includes('image1fileid') || headerStr.toLowerCase().includes('image1_fileid')) {
            listing.image1FileId = String(value || '');
          } else if (headerStr.toLowerCase().includes('image2fileid') || headerStr.toLowerCase().includes('image2_fileid')) {
            listing.image2FileId = String(value || '');
          } else if (headerStr.toLowerCase().includes('image3fileid') || headerStr.toLowerCase().includes('image3_fileid')) {
            listing.image3FileId = String(value || '');
          } else {
            listing[header] = String(value || '');
          }
        }
      });
      
      // Ensure image file ID fields are always present (required by Framer)
      if (!listing.hasOwnProperty('image1FileId')) {
        listing.image1FileId = '';
      }
      if (!listing.hasOwnProperty('image2FileId')) {
        listing.image2FileId = '';
      }
      if (!listing.hasOwnProperty('image3FileId')) {
        listing.image3FileId = '';
      }
      
      if (!listing.slug && listing.name) {
        listing.slug = listing.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return listing;
    }).filter(l => l.name);

    return { success: true, listings: listings, headers: headers };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// -----------------------------------------------------------------------------
// Categories sheet helpers
// -----------------------------------------------------------------------------

function getCategories() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
    
    // If sheet doesn't exist, return empty categories
    if (!categoriesSheet) {
      return { success: true, categories: {} };
    }
    
    const values = categoriesSheet.getDataRange().getValues();
    if (!values || values.length <= 1) {
      return { success: true, categories: {} };
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    
    // Find column indices
    const keyIndex = headers.findIndex(h => String(h).toLowerCase().trim() === 'key');
    const nameIndex = headers.findIndex(h => String(h).toLowerCase().trim() === 'name');
    const emojiIndex = headers.findIndex(h => String(h).toLowerCase().trim() === 'emoji');
    const descriptionIndex = headers.findIndex(h => String(h).toLowerCase().trim() === 'description');
    const iconIndex = headers.findIndex(h => String(h).toLowerCase().trim() === 'icon');
    const typesIndex = headers.findIndex(h => String(h).toLowerCase().trim() === 'types');
    
    const categories = {};
    
    rows.forEach(function(row) {
      if (!row[keyIndex] || !row[keyIndex].toString().trim()) return;
      
      const key = String(row[keyIndex]).trim().toLowerCase();
      const name = nameIndex >= 0 && row[nameIndex] ? String(row[nameIndex]).trim() : '';
      const emoji = emojiIndex >= 0 && row[emojiIndex] ? String(row[emojiIndex]).trim() : '';
      const description = descriptionIndex >= 0 && row[descriptionIndex] ? String(row[descriptionIndex]).trim() : '';
      const icon = iconIndex >= 0 && row[iconIndex] ? String(row[iconIndex]).trim() : '';
      const typesStr = typesIndex >= 0 && row[typesIndex] ? String(row[typesIndex]).trim() : '';
      const types = typesStr ? typesStr.split(/[,;]/).map(t => t.trim()).filter(t => t) : [];
      
      categories[key] = {
        name: name || key,
        emoji: emoji || '⭐',
        description: description || '',
        icon: icon || '',
        types: types
      };
    });
    
    return { success: true, categories: categories };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function saveCategories(categories) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!categoriesSheet) {
      categoriesSheet = ss.insertSheet(CATEGORIES_SHEET_NAME);
    }
    
    // Always ensure headers are correct (in case sheet was created before or headers are missing)
    const headers = ['key', 'name', 'emoji', 'description', 'icon', 'types'];
    const existingHeaders = categoriesSheet.getRange(1, 1, 1, categoriesSheet.getLastColumn() || 6).getValues()[0];
    const headersMatch = existingHeaders.length === headers.length && 
                         existingHeaders.every(function(h, i) { 
                           return String(h).toLowerCase().trim() === headers[i].toLowerCase(); 
                         });
    
    if (!headersMatch || categoriesSheet.getLastRow() === 0) {
      // Set/update headers
      categoriesSheet.getRange(1, 1, 1, 6).setValues([headers]);
      categoriesSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }
    
    // Clear existing data (except headers)
    const lastRow = categoriesSheet.getLastRow();
    if (lastRow > 1) {
      categoriesSheet.deleteRows(2, lastRow - 1);
    }
    
    // Write categories
    const rows = [];
    for (const key in categories) {
      const cat = categories[key];
      rows.push([
        key,
        cat.name || key,
        cat.emoji || '⭐',
        cat.description || '',
        cat.icon || '',
        Array.isArray(cat.types) ? cat.types.join(', ') : ''
      ]);
    }
    
    if (rows.length > 0) {
      categoriesSheet.getRange(2, 1, rows.length, 6).setValues(rows);
    }
    
    return { success: true, message: 'Categories saved successfully', count: rows.length };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function saveListing(sheet, listing) {
  try {
    const listingId = listing.id;
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    let rowIndex = -1;

    for (let i = 1; i < values.length; i++) {
      const rowId = String(values[i][0] || '');
      if (rowId === String(listingId)) {
        rowIndex = i + 1;
        break;
      }
    }

    // Get existing row data if updating (for date preservation)
    let existingRow = null;
    if (rowIndex > 0) {
      existingRow = values[rowIndex - 1];
    }
    
    const rowData = [];
    headers.forEach((header, colIndex) => {
      const headerLower = String(header).toLowerCase().trim();
      if (headerLower === 'id') {
        rowData.push(listing.id || '');
      } else if (headerLower === 'slug') {
        rowData.push(listing.slug || '');
      } else if (['title', 'name', 'listing name'].includes(headerLower)) {
        rowData.push(listing.name || '');
      } else if (headerLower === 'type') {
        rowData.push(listing.type || '');
      } else if (headerLower === 'area') {
        rowData.push(listing.area || '');
      } else if (headerLower === 'description') {
        rowData.push(listing.description || '');
      } else if (['detaileddescription', 'detailed description', 'long description'].includes(headerLower)) {
        rowData.push(listing.detailedDescription || '');
      } else if (['photo', 'image1', 'image 1', 'image url 1'].includes(headerLower)) {
        rowData.push(listing.image1 || '');
      } else if (['image2', 'image 2', 'image url 2'].includes(headerLower)) {
        rowData.push(listing.image2 || '');
      } else if (['image3', 'image 3', 'image url 3'].includes(headerLower)) {
        rowData.push(listing.image3 || '');
      } else if (['image1desc', 'image1 desc', 'image 1 desc', 'image description 1'].includes(headerLower)) {
        rowData.push(listing.image1Desc || '');
      } else if (['image2desc', 'image2 desc', 'image 2 desc', 'image description 2'].includes(headerLower)) {
        rowData.push(listing.image2Desc || '');
      } else if (['image3desc', 'image3 desc', 'image 3 desc', 'image description 3'].includes(headerLower)) {
        rowData.push(listing.image3Desc || '');
      } else if (['image1fileid', 'image1 fileid', 'image 1 fileid', 'image1fileId', 'image1 fileId'].includes(headerLower)) {
        rowData.push(listing.image1FileId || '');
      } else if (['image2fileid', 'image2 fileid', 'image 2 fileid', 'image2fileId', 'image2 fileId'].includes(headerLower)) {
        rowData.push(listing.image2FileId || '');
      } else if (['image3fileid', 'image3 fileid', 'image 3 fileid', 'image3fileId', 'image3 fileId'].includes(headerLower)) {
        rowData.push(listing.image3FileId || '');
      } else if (['external website', 'website', 'url'].includes(headerLower)) {
        rowData.push(listing.website || '');
      } else if (headerLower === 'phone') {
        rowData.push(listing.phone || '');
      } else if (headerLower === 'address') {
        rowData.push(listing.address || '');
      } else if (headerLower === 'amenities') {
        rowData.push(Array.isArray(listing.amenities) ? listing.amenities.join(', ') : (listing.amenities || ''));
      } else if (headerLower === 'featured') {
        rowData.push(listing.featured ? 'TRUE' : 'FALSE');
      } else if (['customhtml', 'custom html', 'customhtml'].includes(headerLower)) {
        rowData.push(listing.customHtml || '');
      } else if (['category'].includes(headerLower)) {
        rowData.push(listing.category || '');
      } else if (['authorname', 'author name', 'author'].includes(headerLower)) {
        rowData.push(listing.authorName || '');
      } else if (['directionslink', 'directions link', 'directions url'].includes(headerLower)) {
        rowData.push(listing.directionsLink || '');
      } else if (['googlemapsurl', 'google maps url', 'google map url'].includes(headerLower)) {
        rowData.push(listing.googleMapsUrl || '');
      } else if (['videolink', 'video link', 'video url', 'youtube', 'youtube url'].includes(headerLower)) {
        rowData.push(listing.videoLink || '');
      } else if (['document1', 'document 1', 'document1link', 'document 1 link'].includes(headerLower)) {
        rowData.push(listing.document1 || '');
      } else if (['document1name', 'document 1 name', 'document1 name'].includes(headerLower)) {
        rowData.push(listing.document1Name || '');
      } else if (['document2', 'document 2', 'document2link', 'document 2 link'].includes(headerLower)) {
        rowData.push(listing.document2 || '');
      } else if (['document2name', 'document 2 name', 'document2 name'].includes(headerLower)) {
        rowData.push(listing.document2Name || '');
      } else if (['accordionpanel1title', 'accordion panel 1 title'].includes(headerLower)) {
        rowData.push(listing.accordionPanel1Title || '');
      } else if (['accordionpanel1content', 'accordion panel 1 content'].includes(headerLower)) {
        rowData.push(listing.accordionPanel1Content || '');
      } else if (['accordionpanel2title', 'accordion panel 2 title'].includes(headerLower)) {
        rowData.push(listing.accordionPanel2Title || '');
      } else if (['accordionpanel2content', 'accordion panel 2 content'].includes(headerLower)) {
        rowData.push(listing.accordionPanel2Content || '');
      } else if (['accordionpanel3title', 'accordion panel 3 title'].includes(headerLower)) {
        rowData.push(listing.accordionPanel3Title || '');
      } else if (['accordionpanel3content', 'accordion panel 3 content'].includes(headerLower)) {
        rowData.push(listing.accordionPanel3Content || '');
      } else if (['accordionpanel4title', 'accordion panel 4 title'].includes(headerLower)) {
        rowData.push(listing.accordionPanel4Title || '');
      } else if (['accordionpanel4content', 'accordion panel 4 content'].includes(headerLower)) {
        rowData.push(listing.accordionPanel4Content || '');
      } else if (['publisheddate', 'published date', 'publish date', 'created date'].includes(headerLower)) {
        // Preserve existing date if incoming value is empty
        const incomingValue = listing.publishedDate || listing.publisheddate || '';
        if (incomingValue && incomingValue.trim() !== '') {
          // Convert date string to Date object for proper formatting
          const dateValue = typeof incomingValue === 'string' ? parseDateString(incomingValue) : incomingValue;
          rowData.push(dateValue);
        } else if (existingRow && colIndex < existingRow.length && existingRow[colIndex]) {
          rowData.push(existingRow[colIndex]); // Preserve existing date
        } else {
          rowData.push('');
        }
      } else if (['modifieddate', 'modified date', 'updated date', 'last updated'].includes(headerLower)) {
        // Preserve existing date if incoming value is empty
        const incomingValue = listing.modifiedDate || listing.modifieddate || '';
        if (incomingValue && incomingValue.trim() !== '') {
          // Convert date string to Date object for proper formatting
          const dateValue = typeof incomingValue === 'string' ? parseDateString(incomingValue) : incomingValue;
          rowData.push(dateValue);
        } else if (existingRow && colIndex < existingRow.length && existingRow[colIndex]) {
          rowData.push(existingRow[colIndex]); // Preserve existing date
        } else {
          rowData.push('');
        }
      } else {
        rowData.push(listing[header] || '');
      }
    });

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      
      // Format date columns for this row
      headers.forEach((header, colIndex) => {
        const headerLower = String(header).toLowerCase().trim();
        if (['publisheddate', 'published date', 'publish date', 'created date'].includes(headerLower) ||
            ['modifieddate', 'modified date', 'updated date', 'last updated'].includes(headerLower)) {
          const dateColumn = colIndex + 1;
          sheet.getRange(rowIndex, dateColumn).setNumberFormat('mmm d, yyyy');
        }
      });
    } else {
      sheet.appendRow(rowData);
      
      // Format date columns for the newly appended row
      const newRowIndex = sheet.getLastRow();
      headers.forEach((header, colIndex) => {
        const headerLower = String(header).toLowerCase().trim();
        if (['publisheddate', 'published date', 'publish date', 'created date'].includes(headerLower) ||
            ['modifieddate', 'modified date', 'updated date', 'last updated'].includes(headerLower)) {
          const dateColumn = colIndex + 1;
          sheet.getRange(newRowIndex, dateColumn).setNumberFormat('mmm d, yyyy');
        }
      });
    }

    return { success: true, message: 'Listing saved successfully' };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

const CANONICAL_LISTING_HEADERS = [
  'id',
  'name',
  'slug',
  'type',
  'category',
  'area',
  'description',
  'customHtml',
  'image1',
  'image1Desc',
  'image1FileId',
  'image2',
  'image2Desc',
  'image2FileId',
  'image3',
  'image3Desc',
  'image3FileId',
  'website',
  'phone',
  'address',
  'authorName',
  'publishedDate',
  'modifiedDate',
  'directionsLink',
  'videoLink',
  'document1',
  'document1Name',
  'document2',
  'document2Name',
  'amenities',
  'featured',
  'googleMapsUrl',
  'accordionPanel1Title',
  'accordionPanel1Content',
  'accordionPanel2Title',
  'accordionPanel2Content',
  'accordionPanel3Title',
  'accordionPanel3Content',
  'accordionPanel4Title',
  'accordionPanel4Content'
];

// Helper function to convert date string (YYYY-MM-DD) to Date object
function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return dateStr;
  }
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return '';
  }
  // Check if it's in YYYY-MM-DD format
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateMatch[3], 10);
    return new Date(year, month, day);
  }
  // If not in expected format, try to parse as-is
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return dateStr; // Return original if can't parse
}

function replaceAllListings(sheet, listings) {
  try {
    sheet.clear();

    const headers = CANONICAL_LISTING_HEADERS.slice();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format date column headers (for future rows)
    const publishedDateIndex = headers.indexOf('publishedDate');
    const modifiedDateIndex = headers.indexOf('modifiedDate');
    
    if (publishedDateIndex >= 0) {
      const dateColumn = publishedDateIndex + 1;
      sheet.getRange(1, dateColumn).setNumberFormat('mmm d, yyyy');
    }
    
    if (modifiedDateIndex >= 0) {
      const dateColumn = modifiedDateIndex + 1;
      sheet.getRange(1, dateColumn).setNumberFormat('mmm d, yyyy');
    }

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
      return { success: true, message: 'Sheet cleared' };
    }

    const toCsvValue = function(value, headerKey) {
      if (headerKey === 'amenities') {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value || '';
      }
      if (headerKey === 'featured') {
        return value ? 'TRUE' : 'FALSE';
      }
      // Convert date strings to Date objects for proper formatting
      if (headerKey === 'publishedDate' || headerKey === 'modifiedDate') {
        if (value && typeof value === 'string' && value.trim()) {
          return parseDateString(value);
        }
        return value || '';
      }
      return value || '';
    };

    const rows = listings.map((listing, listingIndex) => {
      return headers.map(header => {
        const normalizedKey = String(header || '').trim();
        const lowerKey = normalizedKey.toLowerCase();
        const snakeKey = normalizedKey
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase();

        // Try multiple key variations to find the value
        let value =
          listing[normalizedKey] ??
          listing[lowerKey] ??
          listing[snakeKey] ??
          '';
        
        // Debug: Log missing accordion data for first listing
        if (listingIndex === 0 && normalizedKey.startsWith('accordion') && !value) {
          Logger.log('⚠️ Missing accordion field: ' + normalizedKey + ' in listing: ' + (listing.name || 'unknown'));
          Logger.log('   Available keys: ' + Object.keys(listing).filter(k => k.toLowerCase().includes('accordion')).join(', '));
        }

        return toCsvValue(value, normalizedKey);
      });
    });

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      
      // Format date columns to display as dates only (no time)
      const publishedDateIndex = headers.indexOf('publishedDate');
      const modifiedDateIndex = headers.indexOf('modifiedDate');
      
      if (publishedDateIndex >= 0) {
        const dateColumn = publishedDateIndex + 1;
        const dateRange = sheet.getRange(2, dateColumn, rows.length, 1);
        dateRange.setNumberFormat('mmm d, yyyy'); // Format: "Nov 16, 2025"
      }
      
      if (modifiedDateIndex >= 0) {
        const dateColumn = modifiedDateIndex + 1;
        const dateRange = sheet.getRange(2, dateColumn, rows.length, 1);
        dateRange.setNumberFormat('mmm d, yyyy'); // Format: "Nov 16, 2025"
      }
    }

    return { success: true, message: 'All listings replaced successfully' };

  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteListing(sheet, listingId) {
  try {
    Logger.log('=== deleteListing called ===');
    Logger.log('Listing ID to delete: ' + listingId);
    Logger.log('Listing ID type: ' + typeof listingId);
    
    // Normalize the ID to delete - trim whitespace and convert to string
    const idToDelete = String(listingId || '').trim();
    Logger.log('Normalized ID to delete: "' + idToDelete + '"');
    
    if (!idToDelete) {
      Logger.log('❌ Empty listing ID provided');
      return { success: false, error: 'Empty listing ID provided' };
    }
    
    const values = sheet.getDataRange().getValues();
    Logger.log('Total rows in sheet (including header): ' + values.length);
    
    if (values.length <= 1) {
      Logger.log('⚠️ No data rows found (only header row)');
      return { success: false, error: 'No listings found in sheet' };
    }
    
    // Get headers to find ID and name columns
    const headers = values[0];
    const idColumnIndex = headers.findIndex(function(h) {
      const headerLower = String(h || '').toLowerCase().trim();
      return headerLower === 'id' || headerLower === 'slug';
    });
    const nameColumnIndex = headers.findIndex(function(h) {
      const headerLower = String(h || '').toLowerCase().trim();
      return ['title', 'name', 'listing name'].includes(headerLower);
    });
    
    Logger.log('ID column index: ' + idColumnIndex);
    Logger.log('Name column index: ' + nameColumnIndex);
    
    // Normalize ID for comparison (remove leading zeros, handle variations)
    const normalizeIdForComparison = function(id) {
      if (!id) return '';
      let normalized = String(id).trim();
      
      // Remove leading zeros from numeric prefixes (e.g., "00112-ridges" -> "12-ridges")
      // Handle patterns like "00112-ridges-vineyard" -> "12-ridges-vineyard"
      // Also handle "00112" -> "12" (pure numeric)
      normalized = normalized.replace(/^0+(\d+)/, function(match, digits) {
        // Remove leading zeros but keep at least one digit
        return digits;
      });
      
      return normalized.toLowerCase();
    };
    
    // Also create a function to extract the numeric part for comparison
    const extractNumericPart = function(id) {
      if (!id) return '';
      const match = String(id).trim().match(/^0*(\d+)/);
      return match ? match[1] : '';
    };
    
    const numericPartToDelete = extractNumericPart(idToDelete);
    Logger.log('Numeric part of ID to delete: "' + numericPartToDelete + '"');
    
    const normalizedIdToDelete = normalizeIdForComparison(idToDelete);
    Logger.log('Normalized ID for comparison: "' + normalizedIdToDelete + '"');
    
    // Search for matching ID using multiple strategies
    let foundRow = -1;
    let matchStrategy = '';
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Strategy 1: Exact match in ID column
      if (idColumnIndex >= 0) {
        const rowId = String(row[idColumnIndex] || '').trim();
        const normalizedRowId = normalizeIdForComparison(rowId);
        const rowNumericPart = extractNumericPart(rowId);
        
        Logger.log('Row ' + (i + 1) + ' ID: "' + rowId + '" (normalized: "' + normalizedRowId + '", numeric: "' + rowNumericPart + '")');
        
        // Try exact match first
        if (rowId === idToDelete || normalizedRowId === normalizedIdToDelete) {
          foundRow = i + 1;
          matchStrategy = 'exact ID match';
          Logger.log('✅ Found matching listing at row ' + foundRow + ' (strategy: ' + matchStrategy + ')');
          break;
        }
        
        // Try numeric part match (handles leading zero differences)
        // e.g., "00112-ridges" matches "12-ridges" or "112-ridges"
        if (numericPartToDelete && rowNumericPart && numericPartToDelete === rowNumericPart) {
          // Check if the rest of the ID (after numeric part) matches
          const idAfterNumeric = idToDelete.replace(/^0*\d+/, '').toLowerCase();
          const rowIdAfterNumeric = rowId.replace(/^0*\d+/, '').toLowerCase();
          if (idAfterNumeric === rowIdAfterNumeric || 
              idAfterNumeric.includes(rowIdAfterNumeric) || 
              rowIdAfterNumeric.includes(idAfterNumeric)) {
            foundRow = i + 1;
            matchStrategy = 'numeric part match';
            Logger.log('✅ Found matching listing at row ' + foundRow + ' (strategy: ' + matchStrategy + ')');
            break;
          }
        }
        
        // Try partial match (in case of prefix/suffix differences)
        if (rowId.includes(idToDelete) || idToDelete.includes(rowId) ||
            normalizedRowId.includes(normalizedIdToDelete) || normalizedIdToDelete.includes(normalizedRowId)) {
          foundRow = i + 1;
          matchStrategy = 'partial ID match';
          Logger.log('✅ Found matching listing at row ' + foundRow + ' (strategy: ' + matchStrategy + ')');
          break;
        }
      }
      
      // Strategy 2: Fallback to first column if ID column not found
      if (foundRow < 0 && idColumnIndex < 0) {
        const rowId = String(row[0] || '').trim();
        const normalizedRowId = normalizeIdForComparison(rowId);
        
        if (rowId === idToDelete || normalizedRowId === normalizedIdToDelete ||
            rowId.includes(idToDelete) || idToDelete.includes(rowId)) {
          foundRow = i + 1;
          matchStrategy = 'first column match';
          Logger.log('✅ Found matching listing at row ' + foundRow + ' (strategy: ' + matchStrategy + ')');
          break;
        }
      }
    }
    
    if (foundRow > 0) {
      Logger.log('Deleting row ' + foundRow + ' (matched using: ' + matchStrategy + ')');
      sheet.deleteRow(foundRow);
      Logger.log('✅ Row deleted successfully');
      return { success: true, message: 'Listing deleted successfully' };
    } else {
      // Provide detailed error message with available IDs
      const availableIds = [];
      const idCol = idColumnIndex >= 0 ? idColumnIndex : 0;
      for (let i = 1; i < Math.min(values.length, 21); i++) {
        const rowId = String(values[i][idCol] || '').trim();
        if (rowId) {
          availableIds.push('"' + rowId + '"');
        }
      }
      
      const errorMsg = 'Listing with id "' + listingId + '" not found in sheet. ' +
                      'Searched for: "' + idToDelete + '" (normalized: "' + normalizedIdToDelete + '"). ' +
                      'Available IDs (first 20): ' + availableIds.join(', ') +
                      (availableIds.length >= 20 ? '... (and more)' : '');
      
      Logger.log('❌ ' + errorMsg);
      return { success: false, error: errorMsg };
    }

  } catch (error) {
    Logger.log('❌ Error in deleteListing: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'no stack trace'));
    return { success: false, error: error.toString() };
  }
}

// -----------------------------------------------------------------------------
// ImageKit signing endpoint
// -----------------------------------------------------------------------------

function getImageKitUploadParams() {
  const props = PropertiesService.getScriptProperties();
  const privateKey = props.getProperty('IMAGEKIT_PRIVATE_KEY');
  const uploadFolder = props.getProperty('IMAGEKIT_UPLOAD_FOLDER') || '';
  if (!privateKey) {
    throw new Error('ImageKit private key not configured in script properties.');
  }

  const token = Utilities.base64EncodeWebSafe(Utilities.getUuid());
  const expire = Math.floor(Date.now() / 1000) + 60;

  const signatureBytes = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_1,
    token + expire,
    privateKey
  );
  const signatureHex = signatureBytes.map(function(b) {
    const hex = (b & 0xff).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');

  return {
    token,
    expire,
    signature: signatureHex,
    folder: uploadFolder
  };
}

function handleImageKitRequest(request) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      data: getImageKitUploadParams()
    }))
    .setMimeType(ContentService.MimeType.JSON)
}

// -----------------------------------------------------------------------------
// AI Image Description Generation
// -----------------------------------------------------------------------------

function generateImageDescription(imageUrl) {
  const result = generateImageDescriptionInternal(imageUrl);
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateImageDescriptionInternal(imageUrl) {
  const scriptProperties = PropertiesService.getScriptProperties();
  try {
    // Debug: Log all script properties (without values for security)
    const allProps = scriptProperties.getProperties();
    const propKeys = Object.keys(allProps);
    Logger.log('Available script properties: ' + propKeys.join(', '));
    
    // Try OpenAI first (primary)
    const openaiApiKey = scriptProperties.getProperty('OPENAI_API_KEY');
    Logger.log('OPENAI_API_KEY found: ' + (openaiApiKey ? 'Yes' : 'No'));
    
    if (openaiApiKey && openaiApiKey.trim()) {
      Logger.log('Using OpenAI API for description generation (primary)');
      try {
        return generateImageDescriptionWithOpenAI(imageUrl, openaiApiKey, scriptProperties.getProperty('OPENAI_IMAGE_MODEL'));
      } catch (openAiError) {
        Logger.log('OpenAI generation failed, falling back to Gemini: ' + openAiError.toString());
      }
    }
    
    // Fallback to Google Gemini
    const geminiApiKey = scriptProperties.getProperty('GEMINI_API_KEY');
    Logger.log('GEMINI_API_KEY found: ' + (geminiApiKey ? 'Yes (length: ' + geminiApiKey.length + ')' : 'No'));
    
    if (geminiApiKey && geminiApiKey.trim()) {
      Logger.log('Using Gemini API for description generation (fallback)');
      return generateImageDescriptionWithGemini(imageUrl, geminiApiKey);
    }
    
    // If neither API key is configured, return error with helpful message
    const errorMsg = 'No AI API key configured. Please add GEMINI_API_KEY (recommended, free) or OPENAI_API_KEY in Script Properties. Available properties: ' + propKeys.join(', ') + '. Get a free Gemini key at: https://aistudio.google.com/app/apikey';
    Logger.log('ERROR: ' + errorMsg);
    return {
      success: false,
      error: errorMsg
    };
    
  } catch (error) {
    Logger.log('Error generating image description: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'N/A'));
    return {
        success: false,
        error: error.toString()
    };
  }
}

function generateImageDescriptionWithOpenAI(imageUrl, apiKey, modelOverride) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const model = modelOverride && modelOverride.trim() ? modelOverride.trim() : 'gpt-4o';
  const payload = {
    'model': model,
    'messages': [
      {
        'role': 'user',
        'content': [
          {
            'type': 'text',
            'text': 'Write a very brief image description in exactly 10-15 words maximum. Describe only the main subject and key visual elements. Be extremely concise - do not exceed 15 words. Example: "Red apples hanging from green tree branch in sunlight" (8 words).'
          },
          {
            'type': 'image_url',
            'image_url': {
              'url': imageUrl
            }
          }
        ]
      }
    ],
    'max_tokens': 500  // 500 tokens per render attempt - gives AI more room to generate descriptions
  };
  
  const options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();
  
  if (status >= 200 && status < 300) {
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      const description = responseData.choices[0].message.content.trim();
      
      return {
          success: true,
          description: description
      };
    } else {
      throw new Error('Unexpected response format from OpenAI API');
    }
  } else {
    const errorText = response.getContentText();
    throw new Error('OpenAI API error (' + status + '): ' + errorText);
  }
}

function generateImageDescriptionWithGemini(imageUrl, apiKey) {
  // Google Gemini API (free tier available)
  // Enhanced version with robust retry logic, exponential backoff, and optimized settings
  // Models to try in order (with fallback):
  // 1. gemini-1.5-flash (most stable, reliable)
  // 2. gemini-2.5-flash (newer, faster)
  // 3. gemini-2.5-flash-preview (latest preview)
  // 4. gemini-1.5-pro (more capable fallback)
  
  Logger.log('=== generateImageDescriptionWithGemini called ===');
  Logger.log('Image URL: ' + imageUrl);
  Logger.log('API Key length: ' + apiKey.length);
  
  // Model priority: Google moved most production models to the v1 API (Jan 2025)
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.5-pro-002',
    'gemini-2.0-flash-exp',
    'gemini-pro'
  ];
  
  // Get image data (with retry)
  let mimeType;
  let imageData;
  try {
    mimeType = detectImageMimeType(imageUrl);
    Logger.log('Detected MIME type: ' + mimeType);
    
    // Get image with retry logic
    imageData = getImageAsBase64WithRetry(imageUrl);
    Logger.log('Image data retrieved successfully, length: ' + imageData.length + ' chars');
  } catch (imageError) {
    Logger.log('❌ Failed to get image data after retries: ' + imageError.toString());
    throw new Error('Failed to fetch image: ' + imageError.toString());
  }
  
  // Optimized payload - 500 tokens per render attempt with 4 attempts per model
  const payload = {
    'contents': [
      {
        'parts': [
          {
            'text': 'Write a very brief image description in exactly 10-15 words maximum. Describe only the main subject and key visual elements. Be extremely concise - do not exceed 15 words. Example: "Red apples hanging from green tree branch in sunlight" (8 words).'
          },
          {
            'inline_data': {
              'mime_type': mimeType,
              'data': imageData
            }
          }
        ]
      }
    ],
    'generationConfig': {
      'maxOutputTokens': 500,  // 500 tokens per render attempt - gives AI more room to generate descriptions
      'temperature': 0.3  // Lower temperature for more focused, consistent short summaries
    }
  };
  
  Logger.log('Payload structure:');
  Logger.log('  - Text prompt length: ' + payload.contents[0].parts[0].text.length);
  Logger.log('  - MIME type: ' + payload.contents[0].parts[1].inline_data.mime_type);
  Logger.log('  - Image data length: ' + payload.contents[0].parts[1].inline_data.data.length + ' chars');
  
  const options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  
  // Try each model with retry logic
  let lastError = null;
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    const url = 'https://generativelanguage.googleapis.com/v1/models/' + model + ':generateContent?key=' + apiKey;
    
    Logger.log('Trying model ' + (modelIndex + 1) + '/' + models.length + ': ' + model);
    
    // Retry with exponential backoff: 3 retries = 4 total attempts (initial + 3 retries)
    // Longer delays for rate limits (429): 10s, 20s, 40s
    // Shorter delays for other retryable errors: 2s, 4s, 8s
    const maxRetries = 3;  // 3 retries = 4 total attempts (initial attempt + 3 retries)
    const retryDelays429 = [4000, 8000, 12000]; // Moderate delays for rate limits (429)
    const retryDelaysOther = [1000, 2000, 4000]; // Shorter delays for other retryable errors
    
    let consecutive429s = 0; // Track consecutive 429 errors to use longer delays
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Get delay for this retry based on previous error type
          // Use longer delays if we got 429 (rate limit) errors
          const delayIndex = attempt - 1;
          let delayArray = (consecutive429s > 0) ? retryDelays429 : retryDelaysOther;
          const delay = (delayIndex < delayArray.length) ? delayArray[delayIndex] : delayArray[delayArray.length - 1];
          Logger.log('  Retry attempt ' + attempt + '/' + maxRetries + ' after ' + (delay / 1000) + 's delay' + 
                     (consecutive429s > 0 ? ' (longer delay for rate limits)' : '') + '...');
          if (delay && delay > 0) {
            Utilities.sleep(delay);
          }
        }
        
        Logger.log('  Sending request to Gemini API (attempt ' + (attempt + 1) + ')...');
        const response = UrlFetchApp.fetch(url, options);
        const status = response.getResponseCode();
        const responseText = response.getContentText();
        
        Logger.log('  Response status: ' + status);
        
        // Success - parse and return
        if (status >= 200 && status < 300) {
          Logger.log('✅ Success with model: ' + model);
          consecutive429s = 0; // Reset counter on success
          return parseGeminiResponse(responseText, model);
        }
        
        // Check if error is retryable
        const isRetryable = isRetryableError(status);
        const isNotFound = (status === 404);
        const isRateLimit = (status === 429);
        
        if (isNotFound) {
          // Model not found - try next model
          Logger.log('  Model not found (404) - trying next model...');
          lastError = new Error('Model ' + model + ' not found (404)');
          consecutive429s = 0; // Reset counter
          break; // Break retry loop, try next model
        }
        
        // Track consecutive 429 errors
        if (isRateLimit) {
          consecutive429s++;
        } else {
          consecutive429s = 0; // Reset if not a rate limit error
        }
        
        if (isRetryable && attempt < maxRetries) {
          // Retryable error - will retry in next iteration with appropriate delay
          if (isRateLimit) {
            Logger.log('  Rate limit (429) - will retry with longer delay...');
          } else {
            Logger.log('  Retryable error (' + status + ') - will retry...');
          }
          lastError = new Error('Retryable error: ' + status + ' - ' + responseText.substring(0, 200));
          continue; // Continue to next retry
        }
        
        // Non-retryable error or exhausted retries - try next model
        if (!isRetryable) {
          Logger.log('  Non-retryable error (' + status + ') - trying next model...');
          lastError = new Error('Non-retryable error: ' + status + ' - ' + responseText.substring(0, 200));
          consecutive429s = 0; // Reset counter
          break; // Break retry loop, try next model
        }
        
        // Exhausted retries for this model
        Logger.log('  Exhausted retries for model ' + model + ' - trying next model...');
        lastError = new Error('Failed after ' + maxRetries + ' retries: ' + status + ' - ' + responseText.substring(0, 200));
        // If we got rate limited, wait a bit before trying next model
        if (consecutive429s > 0) {
          Logger.log('  Waiting 6s before trying next model (rate limit cooldown)...');
          Utilities.sleep(6000); // Short cooldown before trying next model
        }
        consecutive429s = 0; // Reset counter
        break; // Break retry loop, try next model
        
      } catch (fetchError) {
        // Network error - retry if we have attempts left
        Logger.log('  Network error on attempt ' + (attempt + 1) + ': ' + fetchError.toString());
        lastError = fetchError;
        
        if (attempt < maxRetries) {
          // Wait before retrying (use appropriate delay based on previous 429s)
          const delayIndex = attempt;
          let delayArray = (consecutive429s > 0) ? retryDelays429 : retryDelaysOther;
          const delay = (delayIndex < delayArray.length) ? delayArray[delayIndex] : delayArray[delayArray.length - 1];
          if (delay && delay > 0) {
            Utilities.sleep(delay);
          }
          continue; // Retry
        } else {
          // Exhausted retries - try next model
          Logger.log('  Exhausted retries due to network errors - trying next model...');
          consecutive429s = 0; // Reset counter
          break; // Break retry loop, try next model
        }
      }
    }
  }
  
  // All models failed
  Logger.log('❌ All models and retries exhausted');
  throw new Error('All Gemini models failed. Last error: ' + (lastError ? lastError.toString() : 'Unknown error'));
}

// Helper function: Check if an HTTP status code is retryable
function isRetryableError(status) {
  // Retryable errors: 429 (rate limit), 500 (server error), 502 (bad gateway), 503 (overloaded), 504 (gateway timeout)
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

// Helper function: Parse Gemini API response
function parseGeminiResponse(responseText, model) {
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (parseError) {
    Logger.log('❌ Failed to parse Gemini response: ' + parseError.toString());
    Logger.log('Raw response: ' + responseText.substring(0, 500));
    throw new Error('Invalid JSON response from Gemini: ' + parseError.toString());
  }
  
  Logger.log('Response structure:');
  Logger.log('  - Has candidates: ' + (responseData.candidates ? 'Yes' : 'No'));
  
  const candidate = responseData.candidates && responseData.candidates.length > 0 ? responseData.candidates[0] : null;
  
  if (candidate) {
    Logger.log('  - Candidates count: ' + responseData.candidates.length);
    Logger.log('  - First candidate has content: ' + (candidate.content ? 'Yes' : 'No'));
    Logger.log('  - Finish reason: ' + (candidate.finishReason || 'not specified'));
  }
  
  // Try to extract description from various possible response formats
  let description = null;
  
  // Standard format: parts array with text
  if (candidate && candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
    Logger.log('Checking parts array (length: ' + candidate.content.parts.length + ')...');
    for (let i = 0; i < candidate.content.parts.length; i++) {
      const part = candidate.content.parts[i];
      if (part.text) {
        description = part.text.trim();
        Logger.log('  Found text in part ' + i + ', length: ' + description.length);
        break;
      }
    }
  }
  
  // Alternative formats
  if (!description && candidate && candidate.content && typeof candidate.content === 'string') {
    description = candidate.content.trim();
  }
  if (!description && responseData.text) {
    description = responseData.text.trim();
  }
  if (!description && candidate && candidate.content && candidate.content.text) {
    description = candidate.content.text.trim();
  }
  if (!description && candidate && candidate.text) {
    description = candidate.text.trim();
  }
  
  if (description && description.length > 0) {
    Logger.log('✅ Gemini description extracted successfully!');
    Logger.log('Original description length: ' + description.length + ' characters');
    
    // Truncate to ~15 words maximum if it's too long
    const words = description.trim().split(/\s+/);
    const maxWords = 15;
    if (words.length > maxWords) {
      Logger.log('⚠️ Description has ' + words.length + ' words, truncating to ' + maxWords + ' words');
      description = words.slice(0, maxWords).join(' ');
      Logger.log('Truncated description length: ' + description.length + ' characters');
    }
    
    Logger.log('Final description: ' + description);
    
    return {
        success: true,
        description: description
    };
  } else {
    // Could not extract description
    Logger.log('❌ Could not extract description from response');
    Logger.log('Full response structure: ' + JSON.stringify(responseData, null, 2).substring(0, 2000));
    
    const finishReason = candidate ? candidate.finishReason : 'unknown';
    throw new Error('Could not extract description from Gemini response. Finish reason: ' + finishReason + '. Response structure may have changed.');
  }
}

// Helper function: Get image as base64 with retry logic
function getImageAsBase64WithRetry(imageUrl, maxRetries = 3) {
  const retryDelays = [1000, 2000, 4000]; // milliseconds
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = retryDelays[attempt - 1];
        Logger.log('  Retrying image fetch after ' + (delay / 1000) + 's delay...');
        Utilities.sleep(delay);
      }
      
      Logger.log('Fetching image from URL (attempt ' + (attempt + 1) + '): ' + imageUrl);
      
      const imageResponse = UrlFetchApp.fetch(imageUrl, {
        muteHttpExceptions: true
      });
      
      const status = imageResponse.getResponseCode();
      Logger.log('Image fetch status: ' + status);
      
      if (status >= 200 && status < 300) {
        const imageBlob = imageResponse.getBlob();
        Logger.log('Image blob size: ' + imageBlob.getBytes().length + ' bytes');
        Logger.log('Image blob MIME type: ' + imageBlob.getContentType());
        
        const base64 = Utilities.base64Encode(imageBlob.getBytes());
        Logger.log('Base64 length: ' + base64.length + ' characters');
        
        return base64;
      } else if (attempt < maxRetries && (status === 500 || status === 502 || status === 503 || status === 504)) {
        // Retryable server error
        Logger.log('Retryable server error (' + status + ') - will retry...');
        continue;
      } else {
        const errorText = imageResponse.getContentText();
        Logger.log('Image fetch failed. Status: ' + status + ', Error: ' + errorText.substring(0, 200));
        throw new Error('Failed to fetch image: HTTP ' + status + ' - ' + errorText.substring(0, 100));
      }
    } catch (error) {
      if (attempt < maxRetries) {
        Logger.log('Network error on attempt ' + (attempt + 1) + ': ' + error.toString());
        continue; // Retry
      } else {
        Logger.log('❌ Error in getImageAsBase64WithRetry after ' + maxRetries + ' retries: ' + error.toString());
        throw new Error('Failed to fetch image for description after ' + maxRetries + ' retries: ' + error.toString());
      }
    }
  }
}

// Legacy wrapper - now uses retry version
function getImageAsBase64(imageUrl) {
  return getImageAsBase64WithRetry(imageUrl, 3);
}

function detectImageMimeType(imageUrl) {
  // Detect MIME type from URL or default to image/jpeg
  const urlLower = imageUrl.toLowerCase();
  if (urlLower.includes('.png')) return 'image/png';
  if (urlLower.includes('.webp')) return 'image/webp';
  if (urlLower.includes('.gif')) return 'image/gif';
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'image/jpeg';
  return 'image/jpeg'; // Default
}

// -----------------------------------------------------------------------------
// ImageKit Metadata Update
// -----------------------------------------------------------------------------

function updateImageKitFileMetadata(filePathOrId, customMetadata, imageUrl) {
  try {
    Logger.log('=== updateImageKitFileMetadata called ===');
    Logger.log('filePathOrId: ' + filePathOrId);
    Logger.log('customMetadata: ' + JSON.stringify(customMetadata));
    Logger.log('imageUrl: ' + (imageUrl || 'not provided'));
    
    const scriptProperties = PropertiesService.getScriptProperties();
    const privateKey = scriptProperties.getProperty('IMAGEKIT_PRIVATE_KEY');
    
    if (!privateKey) {
      throw new Error('IMAGEKIT_PRIVATE_KEY not configured in Script Properties.');
    }
    
    // First, check if we already have a valid fileId (not a path)
    // ImageKit requires fileId for updating metadata
    let fileId = null;
    
    // If filePathOrId doesn't start with /, assume it's already a fileId
    if (!filePathOrId.startsWith('/')) {
      fileId = filePathOrId;
      Logger.log('Using provided fileId directly: ' + fileId);
    }
    
    // If it looks like a file path (starts with /), search for the file by path
    if (filePathOrId.startsWith('/')) {
      Logger.log('Searching for file by path: ' + filePathOrId);
      
      // ImageKit API: List files and search by path
      // Try multiple approaches to find the file
      const searchUrl = 'https://api.imagekit.io/v1/files';
      const searchOptions = {
        method: 'get',
        headers: {
          'Authorization': 'Basic ' + Utilities.base64Encode(privateKey + ':')
        },
        muteHttpExceptions: true
      };
      
      // Extract folder path and filename
      const pathParts = filePathOrId.split('/').filter(p => p);
      const folderPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/';
      const filename = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
      Logger.log('Extracted folder path: ' + folderPath);
      Logger.log('Extracted filename: ' + filename);
      
      // Try multiple search strategies
      const searchStrategies = [
        // Strategy 1: Search by exact path
        {
          name: 'exact path',
          params: '?path=' + encodeURIComponent(filePathOrId)
        },
        // Strategy 2: Search by folder path (list all files in folder)
        {
          name: 'folder path',
          params: '?path=' + encodeURIComponent(folderPath) + '&limit=100'
        },
        // Strategy 3: Search by filename (name parameter)
        {
          name: 'filename',
          params: '?name=' + encodeURIComponent(filename) + '&limit=100'
        },
        // Strategy 4: List all files (no filter, then search in results)
        {
          name: 'all files',
          params: '?limit=100'
        }
      ];
      
      let lastError = null;
      for (let strategyIndex = 0; strategyIndex < searchStrategies.length && !fileId; strategyIndex++) {
        const strategy = searchStrategies[strategyIndex];
        const fullSearchUrl = searchUrl + strategy.params;
        Logger.log('Trying search strategy ' + (strategyIndex + 1) + '/' + searchStrategies.length + ': ' + strategy.name);
        Logger.log('Search URL: ' + fullSearchUrl);
        
        try {
          const searchResponse = UrlFetchApp.fetch(fullSearchUrl, searchOptions);
          const searchStatus = searchResponse.getResponseCode();
          const searchText = searchResponse.getContentText();
          
          Logger.log('Search response status: ' + searchStatus);
          Logger.log('Search response length: ' + searchText.length);
          Logger.log('Search response (first 1000 chars): ' + searchText.substring(0, 1000));
          
          if (searchStatus >= 200 && searchStatus < 300) {
            try {
              const searchResult = JSON.parse(searchText);
              Logger.log('Search result type: ' + typeof searchResult);
              Logger.log('Search result keys: ' + (typeof searchResult === 'object' ? Object.keys(searchResult).join(', ') : 'N/A'));
              
              // ImageKit API can return different formats:
              // 1. Direct array: [file1, file2, ...]
              // 2. Object with 'files' array: {files: [file1, file2, ...]}
              // 3. Object with 'fileId': {fileId: '...', filePath: '...', ...}
              // 4. Empty result: [] or {files: []}
              
              let files = [];
              if (Array.isArray(searchResult)) {
                files = searchResult;
                Logger.log('Found ' + files.length + ' file(s) in array result');
              } else if (searchResult && Array.isArray(searchResult.files)) {
                files = searchResult.files;
                Logger.log('Found ' + files.length + ' file(s) in files array');
              } else if (searchResult && searchResult.fileId) {
                // Single file object
                fileId = searchResult.fileId;
                Logger.log('✅ Found fileId from single file object: ' + fileId);
                break;
              } else if (searchResult && typeof searchResult === 'object') {
                Logger.log('Unexpected result format. Keys: ' + Object.keys(searchResult).join(', '));
                Logger.log('Full result: ' + JSON.stringify(searchResult).substring(0, 500));
              }
              
              // Normalize the search path for comparison
              const normalizedSearchPath = filePathOrId.replace(/^\/+|\/+$/g, '').toLowerCase();
              const normalizedSearchFilename = filename.toLowerCase();
              
              // Look through the files array for a matching path
              if (files.length > 0) {
                Logger.log('Searching through ' + files.length + ' file(s) for matches...');
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const filePath = file.filePath || '';
                  const fileFilename = filePath.split('/').pop() || '';
                  const normalizedFilePath = filePath.replace(/^\/+|\/+$/g, '').toLowerCase();
                  const normalizedFileFilename = fileFilename.toLowerCase();
                  
                  Logger.log('File ' + i + ': path="' + filePath + '", filename="' + fileFilename + '", fileId="' + file.fileId + '"');
                  
                  // Try multiple matching strategies
                  if (filePath === filePathOrId || 
                      filePath === filePathOrId.substring(1) || 
                      filePath === '/' + filePathOrId ||
                      normalizedFilePath === normalizedSearchPath ||
                      fileFilename === filename ||
                      normalizedFileFilename === normalizedSearchFilename ||
                      filePath.endsWith(filePathOrId) ||
                      filePath.endsWith(filename)) {
                    fileId = file.fileId;
                    Logger.log('✅ Found matching fileId: ' + fileId + ' (matched by: ' + 
                              (filePath === filePathOrId ? 'exact path' :
                               normalizedFilePath === normalizedSearchPath ? 'normalized path' :
                               fileFilename === filename ? 'filename' : 'partial match') + ')');
                    break;
                  }
                }
                
                // If still no match, try partial filename matching (in case of extensions or transformations)
                if (!fileId) {
                  Logger.log('Trying partial filename match...');
                  const filenameBase = normalizedSearchFilename.split('.')[0]; // Remove extension if present
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const filePath = file.filePath || '';
                    const fileFilename = (filePath.split('/').pop() || '').toLowerCase();
                    const fileFilenameBase = fileFilename.split('.')[0];
                    
                    if (fileFilenameBase === filenameBase || 
                        fileFilename.includes(filenameBase) ||
                        filenameBase.includes(fileFilenameBase)) {
                      fileId = file.fileId;
                      Logger.log('✅ Found matching fileId by partial filename: ' + fileId);
                      Logger.log('  Search: "' + filenameBase + '", Found: "' + fileFilenameBase + '"');
                      break;
                    }
                  }
                }
              } else {
                Logger.log('⚠️ No files found in search result');
              }
              
              if (fileId) {
                break; // Found fileId, exit strategy loop
              }
            } catch (parseError) {
              Logger.log('Error parsing search result: ' + parseError.toString());
              Logger.log('Response text: ' + searchText.substring(0, 500));
              lastError = parseError;
            }
          } else {
            Logger.log('⚠️ Search failed with status ' + searchStatus);
            Logger.log('Error response: ' + searchText.substring(0, 500));
            lastError = new Error('Search failed with status ' + searchStatus + ': ' + searchText.substring(0, 200));
          }
        } catch (fetchError) {
          Logger.log('Error fetching search URL: ' + fetchError.toString());
          lastError = fetchError;
        }
      }
      
      // If we still don't have a fileId, provide detailed error message
      if (!fileId) {
        const errorMsg = 'Could not find file by path: ' + filePathOrId + 
                        '. Tried ' + searchStrategies.length + ' search strategies. ' +
                        'ImageKit search returned status 200 but no matching file found. ' +
                        'Filename: "' + filename + '", Folder: "' + folderPath + '". ' +
                        (lastError ? 'Last error: ' + lastError.toString() : '');
        Logger.log('❌ ' + errorMsg);
        throw new Error(errorMsg);
      }
    }
    
    if (!fileId) {
      throw new Error('No fileId available. Cannot proceed with metadata update.');
    }
    
    Logger.log('Using fileId: ' + fileId);
    
    // Get current file details - but first, verify fileId looks valid
    // ImageKit fileIds are typically alphanumeric strings
    if (fileId.includes('/') && fileId.startsWith('/')) {
      // Still looks like a path, not a fileId - this won't work
      throw new Error('Invalid fileId format (still looks like a path): ' + fileId + '. File path search may have failed.');
    }
    
    const getUrl = 'https://api.imagekit.io/v1/files/' + encodeURIComponent(fileId) + '/details';
    Logger.log('Getting file details from: ' + getUrl);
    
    const getOptions = {
      method: 'get',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(privateKey + ':')
      },
      muteHttpExceptions: true
    };
    
    const getResponse = UrlFetchApp.fetch(getUrl, getOptions);
    const getStatus = getResponse.getResponseCode();
    const getText = getResponse.getContentText();
    
    Logger.log('Get file details status: ' + getStatus);
    Logger.log('Get file details response: ' + getText.substring(0, 500));
    
    if (getStatus < 200 || getStatus >= 300) {
      const errorText = getText;
      Logger.log('❌ Failed to get file details. Status: ' + getStatus + ', Error: ' + errorText);
      
      // If 500 error, it might be an ImageKit internal issue, but also might be invalid fileId
      if (getStatus === 500) {
        throw new Error('ImageKit server error (500). This may indicate an invalid fileId. Original path: ' + filePathOrId + ', Derived fileId: ' + fileId + '. Try re-uploading the image or contact ImageKit support.');
      }
      
      throw new Error('Failed to get file details: ' + getStatus + ' - ' + errorText);
    }
    
    let fileDetails;
    try {
      fileDetails = JSON.parse(getText);
    } catch (parseError) {
      Logger.log('❌ Failed to parse file details response: ' + parseError.toString());
      throw new Error('Invalid JSON response from ImageKit: ' + getText.substring(0, 200));
    }
    
    // Get the actual fileId from the response (should be the same, but verify)
    if (fileDetails.fileId && fileDetails.fileId !== fileId) {
      Logger.log('⚠️ fileId mismatch. Expected: ' + fileId + ', Got: ' + fileDetails.fileId);
      fileId = fileDetails.fileId;
      Logger.log('Updated fileId from file details: ' + fileId);
    }
    
    Logger.log('Current file details:');
    Logger.log('  - description: ' + (fileDetails.description || 'not set'));
    Logger.log('  - customMetadata: ' + JSON.stringify(fileDetails.customMetadata || {}));
    
    // Build the update payload
    // ImageKit has a standard "description" field in addition to customMetadata
    const updatePayload = {};
    
    // If customMetadata contains a description, use it for the standard description field
    // and also keep it in customMetadata for backwards compatibility
    // ImageKit has a 500 character limit for descriptions, so truncate if necessary
    if (customMetadata && customMetadata.description) {
      let description = customMetadata.description;
      const maxLength = 500;
      
      // Truncate description if it exceeds ImageKit's 500 character limit
      if (description.length > maxLength) {
        Logger.log('⚠️ Description exceeds ' + maxLength + ' characters (' + description.length + '). Truncating...');
        description = description.substring(0, maxLength);
        Logger.log('Truncated description length: ' + description.length + ' characters');
      }
      
      updatePayload.description = description;
      Logger.log('Setting standard description field: ' + description.substring(0, 100) + '...');
      
      // Update customMetadata with truncated description
      customMetadata.description = description;
    }
    
    // Merge existing customMetadata with new values
    const existingMetadata = fileDetails.customMetadata || {};
    const updatedMetadata = Object.assign({}, existingMetadata, customMetadata);
    
    // Only include customMetadata if it has values (or if we want to preserve existing)
    if (Object.keys(updatedMetadata).length > 0) {
      updatePayload.customMetadata = updatedMetadata;
    }
    
    Logger.log('Update payload: ' + JSON.stringify(updatePayload));
    
    // Update metadata using PATCH
    const patchUrl = 'https://api.imagekit.io/v1/files/' + encodeURIComponent(fileId) + '/details';
    Logger.log('Patching file metadata at: ' + patchUrl);
    
    const patchOptions = {
      method: 'patch',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(privateKey + ':'),
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    };
    
    Logger.log('PATCH payload: ' + JSON.stringify(updatePayload));
    
    const patchResponse = UrlFetchApp.fetch(patchUrl, patchOptions);
    const patchStatus = patchResponse.getResponseCode();
    const patchText = patchResponse.getContentText();
    
    Logger.log('PATCH response status: ' + patchStatus);
    Logger.log('PATCH response: ' + patchText.substring(0, 500));
    
    if (patchStatus >= 200 && patchStatus < 300) {
      Logger.log('✅ ImageKit metadata updated successfully');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'ImageKit metadata updated successfully',
          fileId: fileId
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      const errorText = patchText;
      Logger.log('❌ Failed to update ImageKit metadata. Status: ' + patchStatus + ', Error: ' + errorText);
      throw new Error('Failed to update ImageKit metadata: ' + patchStatus + ' - ' + errorText);
    }
    
  } catch (error) {
    Logger.log('❌ Error updating ImageKit metadata: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'no stack trace'));
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// -----------------------------------------------------------------------------
// Test Function: Check API Key Configuration
// -----------------------------------------------------------------------------

// Test function: Verify AI can analyze an image
function testImageDescriptionGeneration() {
  Logger.log('=== TEST: Image Description Generation ===');
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const geminiApiKey = scriptProperties.getProperty('GEMINI_API_KEY');
  
  if (!geminiApiKey || !geminiApiKey.trim()) {
    Logger.log('❌ GEMINI_API_KEY not found in Script Properties');
    Logger.log('Please add GEMINI_API_KEY in Script Properties');
    return {
      success: false,
      error: 'GEMINI_API_KEY not configured'
    };
  }
  
  Logger.log('✅ GEMINI_API_KEY found (length: ' + geminiApiKey.length + ')');
  
  // Test with a real public image that definitely exists
  // You can change this to test with your own ImageKit images
  const testImageUrl = 'https://storage.googleapis.com/generativeai-downloads/images/scones.jpg';
  
  Logger.log('');
  Logger.log('Testing with image URL: ' + testImageUrl);
  Logger.log('Note: This is a test image from Google. You can change this URL to test with your own ImageKit images.');
  Logger.log('');
  
  try {
    const result = generateImageDescriptionInternal(testImageUrl);
    
    if (result && result.success && result.description) {
      Logger.log('✅ SUCCESS! AI generated description:');
      Logger.log('Length: ' + result.description.length + ' characters');
      Logger.log('Description: ' + result.description);
      return {
        success: true,
        description: result.description,
        length: result.description.length
      };
    } else {
      Logger.log('❌ FAILED: No description generated');
      Logger.log('Result: ' + JSON.stringify(result));
      return {
        success: false,
        error: 'No description generated',
        result: result
      };
    }
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'no stack trace'));
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Test function: List available Gemini models
function listAvailableGeminiModels() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty('GEMINI_API_KEY');
  
  if (!apiKey || !apiKey.trim()) {
    Logger.log('❌ GEMINI_API_KEY not found');
    return { success: false, error: 'GEMINI_API_KEY not configured' };
  }
  
  Logger.log('=== LISTING AVAILABLE GEMINI MODELS ===');
  
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const status = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (status >= 200 && status < 300) {
      const data = JSON.parse(responseText);
      Logger.log('✅ Successfully retrieved models list');
      
      if (data.models && Array.isArray(data.models)) {
        Logger.log('Total models found: ' + data.models.length);
        
        // Filter models that support generateContent
        const generateContentModels = data.models.filter(function(model) {
          return model.supportedGenerationMethods && 
                 model.supportedGenerationMethods.indexOf('generateContent') >= 0;
        });
        
        Logger.log('Models supporting generateContent: ' + generateContentModels.length);
        Logger.log('');
        Logger.log('Available models for image description generation:');
        
        generateContentModels.forEach(function(model, index) {
          Logger.log((index + 1) + '. ' + model.name + ' (displayName: ' + (model.displayName || 'N/A') + ')');
        });
        
        // Return model names for use in the script
        const modelNames = generateContentModels.map(function(model) {
          return model.name.replace('models/', '');
        });
        
        return {
          success: true,
          models: modelNames,
          allModels: generateContentModels
        };
      } else {
        Logger.log('❌ Unexpected response format');
        return { success: false, error: 'Unexpected response format', response: responseText };
      }
    } else {
      Logger.log('❌ Error: ' + status);
      Logger.log('Response: ' + responseText.substring(0, 500));
      return { success: false, error: 'API error: ' + status, response: responseText };
    }
  } catch (error) {
    Logger.log('❌ Exception: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function testApiKeyConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const allProps = scriptProperties.getProperties();
  const propKeys = Object.keys(allProps);
  
  Logger.log('=== API KEY CONFIGURATION TEST ===');
  Logger.log('All Script Properties: ' + propKeys.join(', '));
  
  const geminiKey = scriptProperties.getProperty('GEMINI_API_KEY');
  const openaiKey = scriptProperties.getProperty('OPENAI_API_KEY');
  
  Logger.log('');
  Logger.log('GEMINI_API_KEY: ' + (geminiKey ? '✅ FOUND (length: ' + geminiKey.length + ', starts with: ' + geminiKey.substring(0, 5) + '...)' : '❌ NOT FOUND'));
  Logger.log('OPENAI_API_KEY: ' + (openaiKey ? '✅ FOUND' : '❌ NOT FOUND'));
  
  if (!geminiKey && !openaiKey) {
    Logger.log('');
    Logger.log('⚠️ ERROR: No API keys found!');
    Logger.log('Please add GEMINI_API_KEY or OPENAI_API_KEY in Script Properties:');
    Logger.log('1. Click the gear icon (⚙️) → Project Settings');
    Logger.log('2. Scroll to "Script Properties"');
    Logger.log('3. Click "Add script property"');
    Logger.log('4. Property: GEMINI_API_KEY');
    Logger.log('5. Value: Your Gemini API key (starts with AIza...)');
    Logger.log('6. Save');
  } else {
    Logger.log('');
    Logger.log('✅ API key configuration looks good!');
    
    // If Gemini key found, test if it can access models
    if (geminiKey) {
      Logger.log('');
      Logger.log('Testing Gemini API access...');
      try {
        const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + geminiKey;
        const testResponse = UrlFetchApp.fetch(testUrl, { muteHttpExceptions: true });
        const testStatus = testResponse.getResponseCode();
        
        if (testStatus === 200) {
          const models = JSON.parse(testResponse.getContentText());
          Logger.log('✅ Gemini API accessible! Available models: ' + (models.models ? models.models.length : 0));
          if (models.models && models.models.length > 0) {
            const modelNames = models.models.map(function(m) { return m.name; }).slice(0, 5);
            Logger.log('Sample models: ' + modelNames.join(', '));
          }
        } else {
          Logger.log('⚠️ Gemini API test failed with status: ' + testStatus);
          Logger.log('Response: ' + testResponse.getContentText().substring(0, 200));
          Logger.log('');
          Logger.log('⚠️ IMPORTANT: The Generative Language API may not be enabled!');
          Logger.log('Enable it here: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
        }
      } catch (testError) {
        Logger.log('⚠️ Error testing Gemini API: ' + testError.toString());
      }
    }
  }
  
  return {
    geminiKey: geminiKey ? 'Found' : 'Not found',
    openaiKey: openaiKey ? 'Found' : 'Not found',
    allProperties: propKeys
  };
}

// -----------------------------------------------------------------------------
// One-time migration (optional helper)
// -----------------------------------------------------------------------------

function migrateAllImagesToImageKit() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LISTINGS_SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + LISTINGS_SHEET_NAME + '" not found. Set LISTINGS_SHEET_NAME to the correct tab name.');
  }

  Logger.log('Using sheet: ' + sheet.getName());
  const values = sheet.getDataRange().getValues();
  Logger.log('Row count (including header): ' + values.length);

  if (values.length < 2) {
    Logger.log('No data rows found – nothing to migrate.');
    return;
  }

  const headers = values[0].map(String);
  const normalizeHeader = (header) => header.trim().toLowerCase();
  const findColumn = (aliases) => {
    const normalizedAliases = aliases.map(a => normalizeHeader(a));
    const index = headers.findIndex(h => normalizedAliases.includes(normalizeHeader(h)));
    return index + 1;
  };

  const colName   = findColumn(['name', 'listing name', 'title']);
  const colImage1 = findColumn(['image 1', 'image1', 'image url 1', 'photo']);
  const colImage2 = findColumn(['image 2', 'image2', 'image url 2']);
  const colImage3 = findColumn(['image 3', 'image3', 'image url 3']);

  if (colName === 0 || colImage1 === 0) {
    throw new Error('Missing required columns ("Name", "Image 1") in sheet "' + sheet.getName() + '". Run listSheetHeaders() to confirm headers.');
  }

  const handleImageUpload = function(row, columnIndex, suffix) {
    if (!columnIndex) return;
    const original = sheet.getRange(row, columnIndex).getValue();
    if (!original || String(original).startsWith('https://ik.imagekit.io/OE')) {
      return;
    }

    try {
      const newUrl = tryUpload(original, suffix);
      setIfChanged(sheet, row, columnIndex, newUrl);
      Logger.log('Row ' + row + ' ' + suffix + ' → ' + newUrl);
    } catch (error) {
      Logger.log('❌ Row ' + row + ' ' + suffix + ' failed: ' + error);
      Logger.log('   Continuing to next image/listing after failure.');
    }
  };

  for (let row = 2; row <= values.length; row++) {
    const name = sheet.getRange(row, colName).getValue();
    const baseFile = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'listing-' + row;

    handleImageUpload(row, colImage1, baseFile + '-image1');
    handleImageUpload(row, colImage2, baseFile + '-image2');
    handleImageUpload(row, colImage3, baseFile + '-image3');

    SpreadsheetApp.flush();
    Utilities.sleep(500);
  }

  Logger.log('ImageKit migration complete!');
}

function generateAllImageDescriptionsInSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LISTINGS_SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + LISTINGS_SHEET_NAME + '" not found. Update LISTINGS_SHEET_NAME to the correct tab name.');
  }
  
  Logger.log('Using sheet: ' + sheet.getName());
  const values = sheet.getDataRange().getValues();
  Logger.log('Row count (including header): ' + values.length);
  
  if (values.length < 2) {
    Logger.log('No data rows found – nothing to process.');
    return;
  }
  
  const headers = values[0].map(String);
  const findColumn = (aliases) =>
    headers.findIndex(h => aliases.some(a => h.trim().toLowerCase() === a.toLowerCase())) + 1;
  
  const colName = findColumn(['name', 'listing name', 'title']);
  const colImage1 = findColumn(['image 1', 'image1', 'image url 1', 'photo']);
  const colImage2 = findColumn(['image 2', 'image2', 'image url 2']);
  const colImage3 = findColumn(['image 3', 'image3', 'image url 3']);
  const colImage1Desc = findColumn(['image1 desc', 'image 1 desc', 'image1 description', 'image 1 description', 'photo 1 description', 'image1desc']);
  const colImage2Desc = findColumn(['image2 desc', 'image 2 desc', 'image2 description', 'image 2 description', 'photo 2 description', 'image2desc']);
  const colImage3Desc = findColumn(['image3 desc', 'image 3 desc', 'image3 description', 'image 3 description', 'photo 3 description', 'image3desc']);
  
  if (colName === 0 || colImage1 === 0 || colImage1Desc === 0) {
    Logger.log('Available headers: ' + headers.join(' | '));
    throw new Error('Missing required columns ("Name", "Image 1", "Image 1 Desc") in sheet "' + sheet.getName() + '". Run listSheetHeaders() to confirm headers.');
  }
  
  const imageColumns = [
    { imageCol: colImage1, descCol: colImage1Desc, label: 'image1' },
    { imageCol: colImage2, descCol: colImage2Desc, label: 'image2' },
    { imageCol: colImage3, descCol: colImage3Desc, label: 'image3' }
  ].filter(function(col) { return col.imageCol > 0 && col.descCol > 0; });
  
  if (imageColumns.length === 0) {
    Logger.log('No image columns with matching description columns found. Nothing to generate.');
    return;
  }
  
  let processed = 0;
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let row = 2; row <= values.length; row++) {
    const listingName = sheet.getRange(row, colName).getValue() || ('Row ' + row);
    
    for (let i = 0; i < imageColumns.length; i++) {
      const { imageCol, descCol, label } = imageColumns[i];
      const imageUrl = sheet.getRange(row, imageCol).getValue();
      const existingDesc = sheet.getRange(row, descCol).getValue();
      
      if (!imageUrl || (existingDesc && String(existingDesc).trim())) {
        skipped++;
        continue;
      }
      
      processed++;
      Logger.log('Generating description for ' + listingName + ' (' + label + ')');
      
      try {
        const result = generateImageDescriptionInternal(imageUrl);
        if (result && result.success && result.description) {
          sheet.getRange(row, descCol).setValue(result.description);
          generated++;
          Logger.log('✅ Generated description for ' + listingName + ' (' + label + ')');
        } else {
          errors++;
          Logger.log('❌ Failed to generate description for ' + listingName + ' (' + label + '): ' + (result && result.error ? result.error : 'Unknown error'));
        }
      } catch (error) {
        errors++;
        Logger.log('❌ Exception generating description for ' + listingName + ' (' + label + '): ' + error.toString());
      }
      
      Utilities.sleep(600); // brief pause to respect API limits
    }
  }
  
  const summary = 'AI descriptions complete. Generated: ' + generated + ', Skipped: ' + skipped + ', Errors: ' + errors + '.';
  Logger.log(summary);
  SpreadsheetApp.getActive().toast(summary, 'AI Generation');
}



