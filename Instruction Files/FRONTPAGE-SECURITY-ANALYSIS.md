# Security Analysis: How to Modify Content on frontpage_framer.html

**Date:** December 11, 2024  
**Target:** `frontpage_framer.html` (Public-facing directory page)

---

## Executive Summary

To modify content displayed on `frontpage_framer.html`, an attacker would need to compromise one of the following:

1. **Admin Panel Access** (Most Likely Attack Vector)
2. **Google Sheets Direct Access**
3. **Google Apps Script Access**
4. **File System Access** (if hosted on GitHub Pages)
5. **Client-Side XSS Attack** (Temporary, visible only to victim)

**Current Protection Level:** Medium (7/10) - Protected by admin authentication, but vulnerable to several attack vectors.

---

## Attack Vectors (Ranked by Likelihood)

### 1. Admin Panel Compromise ⚠️ **MOST LIKELY**

**What an attacker needs:**
- Access to authorized email account (one of the 7 authorized emails)
- OR ability to bypass admin authentication

**How it works:**
1. Attacker gains access to admin panel (`index-sheets.html`)
2. Attacker modifies listings via admin interface
3. Changes are saved to Google Sheets
4. `frontpage_framer.html` loads data from Google Sheets
5. Modified content appears on public page

**Attack Steps:**
```
1. Attacker needs:
   - Access to authorized email (ernest@oddpluseven.com, etc.)
   - OR ability to bypass authentication

2. Methods to gain access:
   a) Email account compromise (phishing, password reset, etc.)
   b) Session token theft (XSS, malware, etc.)
   c) Authentication bypass (if vulnerabilities exist)

3. Once in admin panel:
   - Navigate to listings
   - Edit any listing
   - Change name, description, images, etc.
   - Save changes
   - Changes appear on frontpage_framer.html immediately
```

**Protection:**
- ✅ Email OTP authentication (requires email access)
- ✅ Server-side validation
- ✅ Authorization list (only 7 authorized emails)
- ⚠️ Vulnerable to email account compromise
- ⚠️ Vulnerable to session token theft (XSS)

**Risk Level:** Medium-High  
**Difficulty:** Medium (requires email access or auth bypass)

---

### 2. Google Sheets Direct Access ⚠️ **HIGH RISK**

**What an attacker needs:**
- Direct access to Google Sheets document
- OR Google account with edit permissions

**How it works:**
1. Attacker gains access to Google Sheets
2. Attacker modifies data directly in spreadsheet
3. `frontpage_framer.html` loads from Google Sheets
4. Modified content appears immediately

**Attack Steps:**
```
1. Attacker needs:
   - Google account with edit access to the sheet
   - OR shared link with edit permissions
   - OR compromised Google account

2. Methods to gain access:
   a) Shared link with edit permissions (if accidentally shared)
   b) Google account compromise
   c) Social engineering to get added as collaborator
   d) Access via Google Apps Script (if permissions too broad)

3. Once in Google Sheets:
   - Open the "Nelson County" sheet
   - Modify any row (name, description, images, etc.)
   - Changes appear on frontpage_framer.html immediately
```

**Protection:**
- ❌ **No authentication on Google Sheets** (if shared link exists)
- ❌ **No audit trail** (unless Google Sheets version history is checked)
- ⚠️ Depends on Google account security
- ⚠️ Depends on sharing settings

**Risk Level:** High  
**Difficulty:** Low-Medium (depends on sharing settings)

**Recommendations:**
1. ✅ Check Google Sheets sharing settings
2. ✅ Ensure only authorized accounts have edit access
3. ✅ Remove any public edit links
4. ✅ Enable version history
5. ✅ Set up email notifications for changes

---

### 3. Google Apps Script Compromise ⚠️ **HIGH RISK**

**What an attacker needs:**
- Access to Google Apps Script project
- OR ability to modify the script

**How it works:**
1. Attacker modifies Google Apps Script
2. Script could:
   - Return modified data
   - Inject malicious content
   - Redirect to different data source
3. `frontpage_framer.html` calls Apps Script
4. Modified/malicious content is returned

**Attack Steps:**
```
1. Attacker needs:
   - Google account with edit access to Apps Script
   - OR ability to deploy new version

2. Methods to gain access:
   a) Google account compromise
   b) Shared Apps Script project (if accidentally shared)
   c) Social engineering

3. Once in Apps Script:
   - Modify doGet() function
   - Return modified data
   - OR inject malicious JavaScript
   - Deploy new version
   - frontpage_framer.html loads malicious content
```

**Protection:**
- ⚠️ Depends on Google account security
- ⚠️ Depends on Apps Script sharing settings
- ❌ No code signing or integrity checks
- ❌ No version control (unless manually tracked)

**Risk Level:** High  
**Difficulty:** Medium (requires Google account access)

**Recommendations:**
1. ✅ Check Apps Script sharing settings
2. ✅ Ensure only authorized accounts have edit access
3. ✅ Enable version history
4. ✅ Set up deployment restrictions
5. ✅ Monitor for unexpected deployments

---

### 4. File System Access (GitHub Pages) ⚠️ **MEDIUM RISK**

**What an attacker needs:**
- Write access to GitHub repository
- OR ability to modify files in repository

**How it works:**
1. Attacker modifies `frontpage_framer.html` file
2. Changes are committed to repository
3. GitHub Pages serves modified file
4. Modified content appears on public site

**Attack Steps:**
```
1. Attacker needs:
   - GitHub account with write access
   - OR compromised GitHub account
   - OR ability to push to repository

2. Methods to gain access:
   a) GitHub account compromise
   b) Stolen GitHub token/SSH key
   c) Social engineering to get added as collaborator
   d) Compromised CI/CD pipeline

3. Once in repository:
   - Modify frontpage_framer.html
   - Change hardcoded data
   - OR modify JavaScript to load different data
   - Commit and push
   - Changes appear on GitHub Pages
```

**Protection:**
- ⚠️ Depends on GitHub account security
- ⚠️ Depends on repository access controls
- ✅ GitHub Pages deployment (automatic)
- ⚠️ No code review requirement (unless enabled)

**Risk Level:** Medium  
**Difficulty:** Medium (requires GitHub access)

**Recommendations:**
1. ✅ Enable branch protection rules
2. ✅ Require pull request reviews
3. ✅ Use two-factor authentication on GitHub
4. ✅ Limit repository collaborators
5. ✅ Monitor repository for unexpected changes

---

### 5. Client-Side XSS Attack ⚠️ **LOW RISK (Temporary)**

**What an attacker needs:**
- Ability to inject malicious JavaScript
- OR exploit XSS vulnerability in the page

**How it works:**
1. Attacker injects malicious JavaScript
2. Script modifies DOM content
3. Changes are visible only to the victim
4. Changes are not persistent (lost on page reload)

**Attack Steps:**
```
1. Attacker needs:
   - XSS vulnerability in frontpage_framer.html
   - OR ability to inject script via URL parameters
   - OR compromised data source (Google Sheets)

2. Methods:
   a) Inject script via URL parameters (if not sanitized)
   b) Inject via Google Sheets data (if not sanitized)
   c) Exploit existing XSS vulnerability

3. Once injected:
   - Script modifies DOM
   - Changes visible to victim only
   - Not persistent (lost on reload)
```

**Protection:**
- ⚠️ No Content Security Policy (CSP)
- ⚠️ No input sanitization visible
- ✅ Changes not persistent (only affects victim)
- ✅ Server-side data source (Google Sheets) is separate

**Risk Level:** Low (temporary, affects only victim)  
**Difficulty:** Medium (requires XSS vulnerability)

**Recommendations:**
1. ✅ Implement Content Security Policy (CSP)
2. ✅ Sanitize all user inputs
3. ✅ Sanitize data from Google Sheets
4. ✅ Use innerText instead of innerHTML where possible

---

### 6. Man-in-the-Middle (MITM) Attack ⚠️ **LOW RISK**

**What an attacker needs:**
- Ability to intercept HTTPS traffic
- OR compromise network infrastructure

**How it works:**
1. Attacker intercepts traffic between browser and server
2. Attacker modifies responses
3. Modified content appears in victim's browser
4. Changes are not persistent (only affects victim)

**Attack Steps:**
```
1. Attacker needs:
   - Network access (compromised router, etc.)
   - OR ability to perform SSL stripping
   - OR compromised certificate authority

2. Methods:
   a) Compromise local network
   b) SSL stripping (if HTTPS not enforced)
   c) Compromise certificate authority (extremely difficult)

3. Once intercepting:
   - Modify responses from Google Apps Script
   - Inject malicious content
   - Changes visible to victim only
```

**Protection:**
- ✅ HTTPS should be used (enforce in code)
- ✅ Google Apps Script uses HTTPS
- ⚠️ No certificate pinning
- ✅ Changes not persistent

**Risk Level:** Low (temporary, requires network compromise)  
**Difficulty:** High (requires network infrastructure compromise)

---

## Data Flow Analysis

### How Content Gets to frontpage_framer.html

```
1. frontpage_framer.html loads
   ↓
2. JavaScript calls: loadDataFromGoogleSheets()
   ↓
3. Fetches from: GOOGLE_APPS_SCRIPT_URL (GET request)
   ↓
4. Google Apps Script doGet() function executes
   ↓
5. Reads data from: Google Sheets ("Nelson County" sheet)
   ↓
6. Returns JSON data to frontpage_framer.html
   ↓
7. JavaScript renders listings from JSON data
   ↓
8. Content appears on page
```

### Attack Points in Data Flow

1. **Google Sheets** - Source of truth
   - ✅ Protected by Google account security
   - ⚠️ Vulnerable if sharing settings allow public edit
   - ⚠️ Vulnerable if authorized account is compromised

2. **Google Apps Script** - Data transformation layer
   - ✅ Protected by Google account security
   - ⚠️ Vulnerable if script is modified
   - ⚠️ Vulnerable if script permissions are too broad

3. **Network Transport** - HTTPS connection
   - ✅ Protected by HTTPS
   - ⚠️ Vulnerable to MITM (if network compromised)

4. **Client-Side Rendering** - JavaScript execution
   - ⚠️ Vulnerable to XSS
   - ⚠️ No CSP protection
   - ✅ Changes not persistent (only affects victim)

---

## Current Security Measures

### ✅ What's Protected

1. **Admin Panel Authentication**
   - Email OTP required
   - Server-side validation
   - Authorization list (7 emails)

2. **Data Source**
   - Google Sheets (protected by Google account)
   - Google Apps Script (protected by Google account)

3. **Network Transport**
   - HTTPS (assumed)
   - Google services use HTTPS

### ⚠️ What's Not Protected

1. **No Content Security Policy (CSP)**
   - Vulnerable to XSS attacks
   - No protection against script injection

2. **No Input Sanitization**
   - Data from Google Sheets not sanitized
   - Could contain malicious scripts

3. **No Audit Logging**
   - No tracking of who modified what
   - No alerts for suspicious changes

4. **No Version Control**
   - No rollback mechanism
   - No change history (except Google Sheets version history)

5. **No Integrity Checks**
   - No verification that data hasn't been tampered with
   - No checksums or signatures

---

## Recommendations

### Priority 1: Immediate Actions

1. **Check Google Sheets Sharing Settings**
   - Ensure no public edit links
   - Limit to authorized accounts only
   - Enable version history

2. **Check Google Apps Script Sharing**
   - Ensure only authorized accounts have edit access
   - Review deployment permissions

3. **Check GitHub Repository Access**
   - Review collaborators
   - Enable branch protection
   - Require pull request reviews

4. **Implement Content Security Policy (CSP)**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  script-src 'self' 'unsafe-inline' https://script.google.com https://maps.googleapis.com; 
                  style-src 'self' 'unsafe-inline'; 
                  img-src 'self' data: https:; 
                  connect-src 'self' https://script.google.com;">
   ```

### Priority 2: Short-Term Improvements

5. **Sanitize Data from Google Sheets**
   - Escape HTML in all text fields
   - Validate URLs before rendering
   - Use `innerText` instead of `innerHTML` where possible

6. **Add Audit Logging**
   - Log all admin panel changes
   - Send email alerts for modifications
   - Track who made what changes

7. **Enable Google Sheets Version History**
   - Review changes regularly
   - Set up email notifications

### Priority 3: Long-Term Enhancements

8. **Add Data Integrity Checks**
   - Generate checksums for data
   - Verify integrity on load
   - Alert on tampering

9. **Implement Change Approval Workflow**
   - Require approval for major changes
   - Review changes before publishing

10. **Add Monitoring**
    - Monitor for unexpected changes
    - Alert on suspicious activity
    - Track data source modifications

---

## Attack Difficulty Summary

| Attack Vector | Difficulty | Risk Level | Impact |
|--------------|------------|------------|--------|
| Admin Panel Compromise | Medium | Medium-High | High (persistent) |
| Google Sheets Direct Access | Low-Medium | High | High (persistent) |
| Google Apps Script Compromise | Medium | High | High (persistent) |
| GitHub Repository Access | Medium | Medium | High (persistent) |
| Client-Side XSS | Medium | Low | Low (temporary) |
| MITM Attack | High | Low | Low (temporary) |

---

## Conclusion

**Most Likely Attack:** Admin panel compromise or Google Sheets direct access

**Current Protection:** Medium (7/10)
- ✅ Protected by authentication
- ✅ Protected by Google account security
- ⚠️ Vulnerable to account compromise
- ⚠️ Vulnerable to XSS
- ⚠️ No CSP protection

**Recommendation:** Implement Priority 1 recommendations immediately, especially:
1. Review all sharing settings (Google Sheets, Apps Script, GitHub)
2. Implement Content Security Policy
3. Add input sanitization

The system is **reasonably secure** for a public-facing directory, but improvements in XSS protection and access controls would significantly enhance security.

---

**Report Generated:** December 11, 2024
