        // IMMEDIATE: Check for valid session before showing login overlay
        // This allows sessions to persist across page reloads
        (function() {
            'use strict';
            
            // Check for valid session in localStorage FIRST
            function hasValidSession() {
                try {
                    const sessionData = localStorage.getItem('adminAuthSession');
                    if (!sessionData) {
                        return false;
                    }
                    
                    const session = JSON.parse(sessionData);
                    
                    // Check if session has required fields and is not expired
                    if (session.token && session.email && session.expires) {
                        if (Date.now() < session.expires) {
                            // Session exists and is not expired
                            return true;
                        }
                    }
                } catch (e) {
                    // If parsing fails, assume no valid session
                }
                return false;
            }
            
            // Clear old auth data (but preserve adminAuthSession)
            sessionStorage.clear();
            localStorage.removeItem('skipAuth');
            localStorage.removeItem('adminLoggedIn');
            // DON'T clear adminAuthSession - that's the persistent session!
            
            // Check if we have a valid session
            const hasSession = hasValidSession();
            
            // Only show login overlay if NO valid session exists
            function showLoginOverlay() {
                // Re-check session in case it was just created
                if (!hasValidSession()) {
                const overlay = document.getElementById('loginOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                    overlay.style.zIndex = '10000';
                }
                    
                    // Force body to not have logged-in class
                    if (document.body) {
                        document.body.classList.remove('logged-in');
                    }
                } else {
                    // Valid session exists - hide overlay and add logged-in class
                    const overlay = document.getElementById('loginOverlay');
                    if (overlay) {
                        overlay.style.display = 'none';
                        overlay.setAttribute('style', 'display: none !important;');
                    }
                    
                    if (document.body) {
                        document.body.classList.add('logged-in');
                    }
                }
            }
            
            // Check immediately
            showLoginOverlay();
            
            // Also check when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', showLoginOverlay);
            } else {
                // DOM already ready, check now
                showLoginOverlay();
            }
            
            // Also check on load (in case session was created between DOMContentLoaded and load)
            window.addEventListener('load', showLoginOverlay);
            
            // REMOVED: Old continuous enforcement - replaced by new server-validated monitoring below
            // This old code was checking sessionStorage every 100ms and interfering with new auth system
        })();

        // Make functions available immediately (before IIFE)
        window.handleEmailSubmit = null;
        window.handleOTPSubmit = null;
        window.resendOTP = null;
        window.logout = null;
        
        (function() {
            'use strict';
            
            // =========================================== EMAIL OTP AUTHENTICATION
            const ENABLE_EMAIL_OTP = true; // Set to false to disable
            
            // Load authorized emails from localStorage or use defaults
            // NOTE: This is ONLY for display purposes in the UI
            // Actual authorization is checked by the SERVER when sendOTP() is called
            window.loadAuthorizedEmails = function loadAuthorizedEmails() {
                const stored = localStorage.getItem('adminAllowedEmails');
                console.log('📥 Loading emails from localStorage (for display only). Raw value:', stored);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        console.log('✅ Successfully parsed emails from localStorage (for display):', parsed);
                        return parsed;
                    } catch (e) {
                        console.error('❌ Error parsing stored emails:', e);
                    }
                } else {
                    console.log('⚠️ No emails found in localStorage, using defaults (for display only)');
                    console.log('ℹ️  NOTE: Server has the actual authorization list - localStorage is just for UI display');
                }
                // Default emails (fallback for display only).
                // Intentionally empty: the authorized list lives server-side in the
                // Google Apps Script (PropertiesService) and is the source of truth for
                // login. This client-side array only pre-populates the admin "manage
                // emails" panel for display and is NOT used to grant access.
                const defaults = [];
                console.log('📋 Returning default emails (for display only):', defaults);
                console.log('ℹ️  Server will check actual authorization when you try to log in');
                return defaults;
            }
            
            // Initialize AUTHORIZED_EMAILS from localStorage
            // Debug: Check localStorage on initialization
            console.log('🔍 Page load: Checking localStorage...');
            console.log('🔍 localStorage.getItem("adminAllowedEmails"):', localStorage.getItem('adminAllowedEmails'));
            console.log('🔍 All localStorage keys:', Object.keys(localStorage));
            
            let AUTHORIZED_EMAILS = window.loadAuthorizedEmails();
            console.log('🔐 Initialized AUTHORIZED_EMAILS on page load:', AUTHORIZED_EMAILS);
            console.log('🔐 Number of emails loaded:', AUTHORIZED_EMAILS.length);
            
            // Make it accessible globally and update it when emails change
            window.AUTHORIZED_EMAILS = AUTHORIZED_EMAILS;
            
            const OTP_CONFIG = {
                length: 6,
                expirationMinutes: 10,
                maxAttempts: 5,
                rateLimitRequests: 3,
                rateLimitWindow: 15 * 60 * 1000
            };
            
            // Session expiration: 1 day (24 hours)
            const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

            // Build/deployment marker — bump this string whenever you deploy so you
            // can confirm (via console) the browser loaded the latest version.
            const ADMIN_BUILD_VERSION = 'v2026.05.29-secure-6 (clean build, token auth working)';
            console.log('%c🚀 NELSON COUNTY ADMIN BUILD ' + ADMIN_BUILD_VERSION, 'background:#4E6B52;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;font-size:13px;');
            
            // Helper functions for persistent session storage with SERVER-VALIDATED tokens
            function setAuthSession(email, sessionToken) {
                const sessionData = {
                    email: email,
                    name: email.split('@')[0],
                    token: sessionToken, // Server-generated token
                    expires: Date.now() + SESSION_EXPIRATION_MS
                };
                localStorage.setItem('adminAuthSession', JSON.stringify(sessionData));
            }

            // Synchronously read the current session token (for authenticated requests).
            // Returns the token string, or null if there is no stored session.
            function getAdminSessionToken() {
                try {
                    const raw = localStorage.getItem('adminAuthSession');
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    return (parsed && parsed.token) ? parsed.token : null;
                } catch (e) {
                    return null;
                }
            }
            window.getAdminSessionToken = getAdminSessionToken;
            
            async function getAuthSession() {
                try {
                    const sessionData = localStorage.getItem('adminAuthSession');
                    if (!sessionData) {
                        return null;
                    }
                    
                    const session = JSON.parse(sessionData);
                    
                    // Check if expired (client-side check first)
                    if (Date.now() > session.expires) {
                        localStorage.removeItem('adminAuthSession');
                        return null;
                    }
                    
                    // CRITICAL: Validate session token with server (non-blocking)
                    // If validation fails due to network error, still allow session through
                    // Only clear session if server explicitly says token is invalid
                    if (session.token) {
                        if (typeof validateSessionWithServer === 'function') {
                            try {
                                const validation = await validateSessionWithServer(session.token);
                                if (validation.valid) {
                                    // Server validated - update email from server response
                                    session.email = validation.email || session.email;
                                    console.log('✅ Session validated by server');
                                } else {
                                    // Server says token is invalid
                                    // BUT: Only clear if it's a specific "not authorized" or "expired" error
                                    // Allow through on network errors, missing responses, or other temporary issues
                                    const errorMsg = (validation.error || '').toLowerCase();
                                    if (errorMsg.includes('network error') || 
                                        errorMsg.includes('no response') || 
                                        errorMsg.includes('session validation failed') ||
                                        errorMsg === '') {
                                        // Network error or ambiguous error - allow session through
                                        // Token might still be valid, just couldn't verify
                                        console.warn('Session validation failed (network/ambiguous error), allowing session through');
                                    } else if (errorMsg.includes('not authorized') || 
                                               errorMsg.includes('email not authorized')) {
                                        // Server explicitly rejected email authorization - clear it
                                        console.warn('Server rejected email authorization (' + validation.error + '), clearing session');
                                    localStorage.removeItem('adminAuthSession');
                                    sessionStorage.clear();
                                    return null;
                                    } else if (errorMsg.includes('session expired')) {
                                        // Session expired - clear it
                                        console.warn('Session expired, clearing session');
                                        localStorage.removeItem('adminAuthSession');
                                        sessionStorage.clear();
                                        return null;
                                    } else if (errorMsg.includes('invalid session token')) {
                                        // "Invalid session token" might be a server-side parsing issue
                                        // Don't clear immediately - allow session through
                                        // Suppress warning in monitoring (only log in getAuthSession if called directly)
                                        // Don't clear - allow session to persist
                                    } else {
                                        // Unknown error - be conservative and allow through
                                        console.warn('Session validation returned unknown error, allowing session through:', validation.error);
                                    }
                                }
                            } catch (validationError) {
                                // Network error or other exception - allow session through but log error
                                console.warn('Session validation failed (exception), allowing session through:', validationError);
                                // Don't clear session on network error - allow through
                                // Session is still valid, just couldn't verify with server
                            }
                        } else {
                            // validateSessionWithServer not available - allow session through
                            console.warn('validateSessionWithServer not available, allowing session through');
                        }
                    } else {
                        // Old session without token - invalidate it
                        console.warn('Session has no token, invalidating');
                        localStorage.removeItem('adminAuthSession');
                        return null;
                    }
                    
                    return session;
                } catch (e) {
                    console.error('Error in getAuthSession:', e);
                    localStorage.removeItem('adminAuthSession');
                    return null;
                }
            }
            // Expose to the outer scope: deleteListing/saveListing etc. live outside
            // this IIFE, so without this they see `typeof getAuthSession !== 'function'`
            // and silently send requests with no session token.
            window.getAuthSession = getAuthSession;
            
            function clearAuthSession() {
                localStorage.removeItem('adminAuthSession');
                sessionStorage.removeItem('adminLoggedIn');
                sessionStorage.removeItem('adminEmail');
                sessionStorage.removeItem('adminName');
            }
            
            // Get GOOGLE_APPS_SCRIPT_URL from the page (defined later in script)
            function getGoogleAppsScriptURL() {
                // Wait for GOOGLE_APPS_SCRIPT_URL to be defined
                if (typeof GOOGLE_APPS_SCRIPT_URL !== 'undefined') {
                    return GOOGLE_APPS_SCRIPT_URL;
                }
                // Try to find it in the page by checking all script tags
                const scripts = document.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const scriptText = scripts[i].textContent || scripts[i].innerHTML;
                    const match = scriptText.match(/GOOGLE_APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
                    if (match) return match[1];
                }
                // Fallback URL - use the same URL as defined in the page
                // This should match GOOGLE_APPS_SCRIPT_URL defined later in the script
                // If you get 404 errors, make sure your Google Apps Script is deployed as a Web App
                return 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec';
            }
            
            // SERVER-SIDE OTP: Request OTP from server (no client-side generation)
            window.sendOTP = async function sendOTP(email) {
                try {
                    // Server is the source of truth for authorization
                    // Let the server check authorization - it has the most up-to-date list
                    // (Client-side check removed to avoid localStorage sync issues)
                    console.log('📧 sendOTP: Requesting OTP for email:', email);
                    console.log('📧 sendOTP: Server will check authorization (not using localStorage)');
                    
                    // Request OTP from server (server generates, stores, and sends it)
                    const scriptUrl = getGoogleAppsScriptURL();
                    const params = new URLSearchParams({
                        action: 'sendOTP',
                        email: email
                    });
                    console.log('📧 sendOTP: Calling server at:', scriptUrl);
                    
                    let response;
                    let result;
                    
                    try {
                        // Use GET to avoid CORS preflight
                        response = await fetch(scriptUrl + '?' + params.toString(), {
                            method: 'GET',
                            mode: 'cors'
                        });
                        
                        if (!response.ok) {
                            throw new Error('Response not OK: ' + response.status);
                        }
                        
                        const responseText = await response.text();
                        result = responseText ? JSON.parse(responseText) : { success: false, error: 'No response from server' };
                    } catch (fetchError) {
                        console.error('Fetch error:', fetchError);
                        const errorMsg = fetchError.message || 'Unknown error';
                        if (errorMsg.includes('404') || errorMsg.includes('Failed to fetch')) {
                            result = { 
                                success: false, 
                                error: 'Email service not found (404). Please make sure your Google Apps Script is deployed as a Web App with "Execute as: Me" and "Who has access: Anyone".' 
                            };
                        } else if (errorMsg.includes('CORS') || errorMsg.includes('405')) {
                            result = { 
                                success: false, 
                                error: 'CORS error. The script is using GET requests now, but please ensure your Google Apps Script is deployed correctly.' 
                            };
                        } else {
                            result = { 
                                success: false, 
                                error: 'Unable to connect to email service: ' + errorMsg 
                            };
                        }
                    }
                    
                    // Server handles all validation - just return the result
                    // Note: Server checks authorization using PropertiesService (most up-to-date list)
                    // Client-side localStorage is only for display purposes, not for blocking login
                    console.log('📧 sendOTP server response:', result);
                    if (!result.success) {
                        console.log('❌ Server rejected email:', result.error);
                    } else {
                        console.log('✅ Server accepted email, OTP sent');
                    }
                    return result;
                } catch (error) {
                    return { success: false, error: 'Network error. Please check your connection and try again.' };
                }
            }
            
            // SERVER-SIDE OTP: Verify OTP with server and get session token
            window.verifyOTP = async function verifyOTP(email, code) {
                try {
                    const scriptUrl = getGoogleAppsScriptURL();
                    const params = new URLSearchParams({
                        action: 'verifyOTP',
                        email: email,
                        code: code
                    });
                    
                    const response = await fetch(scriptUrl + '?' + params.toString(), {
                        method: 'GET',
                        mode: 'cors'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Response not OK: ' + response.status);
                    }
                    
                    const responseText = await response.text();
                    const result = responseText ? JSON.parse(responseText) : { success: false, error: 'No response from server' };
                    
                    return result;
                } catch (error) {
                    console.error('Error verifying OTP:', error);
                    return {
                        success: false,
                        error: 'Network error. Please check your connection and try again.'
                    };
                }
            }
            
            // Validate session token with server
            async function validateSessionWithServer(token) {
                try {
                    const scriptUrl = getGoogleAppsScriptURL();
                    if (!scriptUrl || scriptUrl.includes('YOUR_SCRIPT_ID')) {
                        // No valid script URL - can't validate, but don't fail
                        console.warn('No valid Google Apps Script URL configured, skipping validation');
                        return { valid: true }; // Allow through if no script URL
                    }
                    
                    const params = new URLSearchParams({
                        action: 'validateSession',
                        token: token
                    });
                    
                    // Add timeout to prevent hanging
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                    
                    try {
                    const response = await fetch(scriptUrl + '?' + params.toString(), {
                        method: 'GET',
                            mode: 'cors',
                            signal: controller.signal
                    });
                        
                        clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                            // HTTP error - treat as network/ambiguous error, not explicit rejection
                            console.warn('Session validation HTTP error:', response.status);
                            return { valid: false, error: 'Network error' };
                    }
                    
                    const responseText = await response.text();
                        if (!responseText) {
                            return { valid: false, error: 'No response from server' };
                        }
                    
                        const result = JSON.parse(responseText);
                    return result;
                    } catch (fetchError) {
                        clearTimeout(timeoutId);
                        if (fetchError.name === 'AbortError') {
                            console.warn('Session validation timeout');
                            return { valid: false, error: 'Network error' };
                        }
                        throw fetchError;
                    }
                } catch (error) {
                    console.error('Error validating session:', error);
                    // Treat all errors as network errors - don't reject session
                    return { valid: false, error: 'Network error' };
                }
            }
            
            window.handleEmailSubmit = async function handleEmailSubmit() {
                const emailInput = document.getElementById('emailInput');
                const errorDiv = document.getElementById('loginError');
                const errorText = document.getElementById('loginErrorText');
                const emailForm = document.getElementById('emailForm');
                const otpForm = document.getElementById('otpForm');
                
                try {
                    console.log('📧 handleEmailSubmit called');
                    
                    if (!emailInput) {
                        console.error('❌ emailInput not found');
                        alert('Email input field not found. Please refresh the page.');
                        return;
                    }
                    
                    if (!emailInput.value) {
                        if (errorText) errorText.textContent = 'Please enter your email address.';
                        if (errorDiv) errorDiv.style.display = 'block';
                        return;
                    }
                    
                    const email = emailInput.value.trim().toLowerCase();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        if (errorText) errorText.textContent = 'Please enter a valid email address.';
                        if (errorDiv) errorDiv.style.display = 'block';
                        return;
                    }
                    
                    if (errorDiv) errorDiv.style.display = 'none';
                    const submitBtn = emailForm ? emailForm.querySelector('button[type="submit"]') : null;
                    const originalBtnText = submitBtn ? submitBtn.textContent : 'Send Verification Code';
                    
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Sending code...';
                    }
                    
                    try {
                        const result = await sendOTP(email);
                        if (result.success) {
                            if (emailForm) emailForm.style.display = 'none';
                            if (otpForm) otpForm.style.display = 'block';
                            const emailDisplay = document.getElementById('emailDisplay');
                            if (emailDisplay) emailDisplay.textContent = email;
                            if (otpForm) otpForm.dataset.email = email;
                            const otpInput = document.getElementById('otpInput');
                            if (otpInput) otpInput.focus();
                            if (errorText) {
                                errorText.textContent = `Verification code sent to ${email}`;
                                errorText.style.color = '#22c55e';
                            }
                            if (errorDiv) errorDiv.style.display = 'block';
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalBtnText;
                            }
                        } else {
                            if (errorText) {
                                errorText.textContent = result.error || 'Failed to send verification code.';
                                errorText.style.color = '#dc3545';
                            }
                            if (errorDiv) errorDiv.style.display = 'block';
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalBtnText;
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error sending OTP:', error);
                        if (errorText) {
                            errorText.textContent = 'An error occurred: ' + (error.message || 'Please try again.');
                            errorText.style.color = '#dc3545';
                        }
                        if (errorDiv) errorDiv.style.display = 'block';
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalBtnText;
                        }
                    }
                } catch (error) {
                    console.error('❌ Error in handleEmailSubmit:', error);
                    if (errorText) {
                        errorText.textContent = 'An error occurred: ' + (error.message || 'Please try again.');
                        errorText.style.color = '#dc3545';
                    }
                    if (errorDiv) errorDiv.style.display = 'block';
                }
            };
            
            window.handleOTPSubmit = async function handleOTPSubmit() {
                const otpInput = document.getElementById('otpInput');
                const errorDiv = document.getElementById('loginError');
                const errorText = document.getElementById('loginErrorText');
                const otpForm = document.getElementById('otpForm');
                if (!otpInput || !otpInput.value) {
                    errorText.textContent = 'Please enter the verification code.';
                    errorText.style.color = '#dc3545';
                    errorDiv.style.display = 'block';
                    return;
                }
                const code = otpInput.value.trim();
                const email = otpForm.dataset.email;
                if (!email) {
                    errorText.textContent = 'Session expired. Please start over.';
                    errorText.style.color = '#dc3545';
                    errorDiv.style.display = 'block';
                    return;
                }
                errorDiv.style.display = 'none';
                const submitBtn = otpForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Verifying...';
                try {
                    // Verify OTP with server (returns session token if successful)
                    console.log('🔍 Verifying OTP code for:', email);
                    const result = await verifyOTP(email, code);
                    console.log('🔍 verifyOTP result:', result);
                    
                    if (result.success && result.sessionToken) {
                        // Set persistent session with SERVER-GENERATED token
                        setAuthSession(email, result.sessionToken);
                        console.log('✅ OTP verified successfully for:', email);
                        console.log('✅ Server-validated session token saved to localStorage');
                        
                        // Also set sessionStorage for backward compatibility
                        sessionStorage.setItem('adminLoggedIn', 'true');
                        sessionStorage.setItem('adminEmail', email);
                        sessionStorage.setItem('adminName', email.split('@')[0]);
                        console.log('✅ Session also saved to sessionStorage');
                        
                        // Show success message briefly, then reload
                        errorText.textContent = '✅ Login successful! Loading admin panel...';
                        errorText.style.color = '#22c55e';
                        errorDiv.style.display = 'block';
                        
                        // Immediately hide overlay (before reload) and add class to body
                        const overlay = document.getElementById('loginOverlay');
                        if (overlay) {
                            overlay.style.display = 'none';
                            overlay.setAttribute('style', 'display: none !important;');
                            console.log('✅ Login overlay hidden immediately');
                        }
                        document.body.classList.add('logged-in');
                        console.log('✅ Added logged-in class to body after OTP verification');
                        showAdminPanelContent();

                        try {
                            if (typeof window.enforceAuth === 'function') {
                                await window.enforceAuth();
                            } else if (typeof window.requestAdminBootstrap === 'function') {
                                await window.requestAdminBootstrap();
                            } else {
                                window._pendingAdminBootstrap = true;
                            }
                        } catch (bootstrapError) {
                            console.error('❌ Post-login bootstrap error:', bootstrapError);
                        }
                    } else {
                        errorText.textContent = result.error || 'Invalid verification code.';
                        errorText.style.color = '#dc3545';
                        errorDiv.style.display = 'block';
                        otpInput.value = '';
                        otpInput.focus();
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                } catch (error) {
                    errorText.textContent = 'An error occurred. Please try again.';
                    errorText.style.color = '#dc3545';
                    errorDiv.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            };
            
            window.resendOTP = async function resendOTP() {
                const otpForm = document.getElementById('otpForm');
                const email = otpForm.dataset.email;
                if (!email) {
                    alert('Session expired. Please start over.');
                    return;
                }
                const result = await sendOTP(email);
                const errorDiv = document.getElementById('loginError');
                const errorText = document.getElementById('loginErrorText');
                if (result.success) {
                    errorText.textContent = `New verification code sent to ${email}`;
                    errorText.style.color = '#22c55e';
                    errorDiv.style.display = 'block';
                } else {
                    errorText.textContent = result.error || 'Failed to resend code.';
                    errorText.style.color = '#dc3545';
                    errorDiv.style.display = 'block';
                }
            };
            
            window.logout = function logout() {
                clearAuthSession();
                localStorage.removeItem('skipAuth');
                document.body.classList.remove('logged-in');
                const overlay = document.getElementById('loginOverlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }
                location.reload();
            };
            
            function showAdminPanelContent() {
                const header = document.querySelector('.header');
                const tabsStack = document.querySelector('.tabs-sticky-stack');
                const tabs = document.querySelector('.tabs');
                const tabContent = document.querySelectorAll('.tab-content');
                if (header) header.style.display = '';
                if (tabsStack) tabsStack.style.display = '';
                if (tabs) tabs.style.display = '';
                tabContent.forEach(function(tab) {
                    tab.style.removeProperty('display');
                });
            }

            window.requestAdminBootstrap = function requestAdminBootstrap() {
                if (typeof window.bootstrapAdminAppIfNeeded === 'function') {
                    return window.bootstrapAdminAppIfNeeded();
                }
                window._pendingAdminBootstrap = true;
                return Promise.resolve();
            };

            // CRITICAL: Enforce authentication immediately (with server validation)
            async function enforceAuth() {
                try {
                    if (!ENABLE_EMAIL_OTP) {
                        localStorage.setItem('skipAuth', 'true');
                        document.body.classList.add('logged-in');
                        const overlay = document.getElementById('loginOverlay');
                        if (overlay) overlay.style.display = 'none';
                        window.requestAdminBootstrap();
                        return;
                    }
                    
                    // ALWAYS clear old auth data first (but preserve adminAuthSession if it exists)
                    localStorage.removeItem('skipAuth');
                    localStorage.removeItem('adminLoggedIn');
                    // DON'T clear adminAuthSession here - it contains the valid session token
                    
                    // Check for valid session (SERVER-VALIDATED)
                    console.log('🔍 Checking for session in localStorage...');
                    const sessionData = localStorage.getItem('adminAuthSession');
                    console.log('🔍 Raw sessionData from localStorage:', sessionData ? 'exists' : 'null');
                    
                    // Try to get session - this will validate with server if possible
                    let session = null;
                    try {
                        session = await getAuthSession();
                    } catch (e) {
                        console.warn('⚠️ getAuthSession threw error, checking localStorage directly:', e);
                        // If getAuthSession fails, check localStorage directly
                        if (sessionData) {
                            try {
                                const parsedSession = JSON.parse(sessionData);
                                if (parsedSession.token && parsedSession.email && Date.now() < parsedSession.expires) {
                                    console.log('⚠️ Using session from localStorage directly (getAuthSession failed)');
                                    session = parsedSession;
                                }
                            } catch (parseError) {
                                console.error('Error parsing session data:', parseError);
                            }
                        }
                    }
                    
                    const adminEmail = session ? session.email : null;
                    const isLoggedIn = session !== null;
                
                console.log('🔍 enforceAuth check:', {
                    session: session,
                    sessionToken: session ? (session.token ? 'exists' : 'missing') : 'no session',
                    adminEmail: adminEmail,
                    isLoggedIn: isLoggedIn,
                    sessionExpired: session ? (Date.now() > session.expires) : 'N/A'
                });
                
                // Also check sessionStorage for backward compatibility (but server validation is primary)
                const sessionStorageLoggedIn = sessionStorage.getItem('adminLoggedIn');
                const sessionStorageEmail = sessionStorage.getItem('adminEmail');
                
                console.log('🔍 sessionStorage check:', {
                    sessionStorageLoggedIn: sessionStorageLoggedIn,
                    sessionStorageEmail: sessionStorageEmail
                });
                
                // Server-validated session takes priority
                // Fallback to sessionStorage if server validation failed but sessionStorage exists
                let finalIsLoggedIn = isLoggedIn;
                let finalAdminEmail = adminEmail;
                
                // If server validation didn't find a session, but sessionStorage has one, use it
                // This handles cases where server validation fails due to network issues
                if (!finalIsLoggedIn && sessionStorageLoggedIn === 'true' && sessionStorageEmail) {
                    console.log('⚠️ enforceAuth: Server validation failed, but sessionStorage has session - using it');
                    finalIsLoggedIn = true;
                    finalAdminEmail = sessionStorageEmail;
                }
                
                // Also check if we have a session token in localStorage even if validation failed
                if (!finalIsLoggedIn && sessionData) {
                    try {
                        const parsedSession = JSON.parse(sessionData);
                        if (parsedSession.token && parsedSession.email && Date.now() < parsedSession.expires) {
                            console.log('⚠️ enforceAuth: Found valid session token in localStorage, using it despite validation failure');
                            console.log('⚠️ enforceAuth: Session token exists, email:', parsedSession.email, 'expires:', new Date(parsedSession.expires));
                            finalIsLoggedIn = true;
                            finalAdminEmail = parsedSession.email;
                        } else {
                            console.log('⚠️ enforceAuth: Session token found but invalid:', {
                                hasToken: !!parsedSession.token,
                                hasEmail: !!parsedSession.email,
                                expired: parsedSession.expires ? (Date.now() > parsedSession.expires) : 'no expiry'
                            });
                        }
                    } catch (e) {
                        console.error('⚠️ enforceAuth: Error parsing session data:', e);
                    }
                }
                
                const overlay = document.getElementById('loginOverlay');
                
                // If user has a valid server-validated session token, that's proof of authorization
                // Don't check against localStorage email list (it may be out of sync with server)
                // Server already validated the email when it issued the session token
                console.log('🔍 Final auth check:', {
                    finalIsLoggedIn: finalIsLoggedIn,
                    finalAdminEmail: finalAdminEmail,
                    hasSessionToken: session ? !!session.token : false,
                    note: 'Server-validated session token is proof of authorization'
                });
                
                // ONLY allow login if BOTH conditions are met:
                // 1. Valid session (localStorage or sessionStorage)
                // 2. AND there's a valid email
                // (Server-validated session token is proof of authorization - no need to check email list)
                if (finalIsLoggedIn && finalAdminEmail) {
                    // Valid authenticated session
                    console.log('✅ enforceAuth: Valid authenticated session - showing admin panel');
                    console.log('✅ enforceAuth: Email:', finalAdminEmail);
                    console.log('✅ enforceAuth: Hiding login overlay and showing admin content');
                    
                    // Hide overlay FIRST - use !important to override any inline styles
                    if (overlay) {
                        overlay.style.display = 'none';
                        overlay.setAttribute('style', 'display: none !important;');
                        console.log('✅ enforceAuth: Login overlay hidden (with !important)');
                    } else {
                        console.error('❌ enforceAuth: Login overlay element not found!');
                    }
                    
                    // Add logged-in class
                    document.body.classList.add('logged-in');
                    console.log('✅ Added logged-in class to body');
                    
                    // Ensure sessionStorage is also set for backward compatibility
                    if (!sessionStorageLoggedIn) {
                        sessionStorage.setItem('adminLoggedIn', 'true');
                        sessionStorage.setItem('adminEmail', finalAdminEmail);
                        sessionStorage.setItem('adminName', finalAdminEmail.split('@')[0]);
                        console.log('✅ SessionStorage updated');
                    }
                    
                    showAdminPanelContent();
                    console.log('✅ Admin panel content shown');
                    await window.requestAdminBootstrap();
                } else {
                    // NOT logged in - show login overlay
                    console.log('❌ Not authenticated - showing login overlay');
                    console.log('❌ Auth check details:', {
                        finalIsLoggedIn: finalIsLoggedIn,
                        finalAdminEmail: finalAdminEmail,
                        hasEmail: !!finalAdminEmail,
                        inAuthorizedList: finalAdminEmail ? loadAuthorizedEmails().includes(finalAdminEmail.toLowerCase()) : false,
                        sessionExists: !!session,
                        sessionStorageExists: sessionStorageLoggedIn === 'true',
                        sessionStorageEmail: sessionStorageEmail
                    });
                    
                    // Only clear session if we're absolutely sure there's no valid session
                    // Don't clear on network errors - session might still be valid
                    if (!sessionStorageLoggedIn && !session) {
                        console.log('❌ No session found anywhere - clearing auth');
                        clearAuthSession();
                    } else {
                        console.log('⚠️ Session might exist but validation failed - keeping session for retry');
                    }
                    
                    if (overlay) {
                        overlay.style.display = 'flex';
                        console.log('✅ Login overlay shown');
                    } else {
                        console.error('❌ Login overlay element not found!');
                    }
                    document.body.classList.remove('logged-in');
                    
                    // Hide all admin content
                    const header = document.querySelector('.header');
                    const tabsStack = document.querySelector('.tabs-sticky-stack');
                    const tabs = document.querySelector('.tabs');
                    const tabContent = document.querySelectorAll('.tab-content');
                    if (header) header.style.display = 'none';
                    if (tabsStack) tabsStack.style.display = 'none';
                    if (tabs) tabs.style.display = 'none';
                    tabContent.forEach(function(tab) { tab.style.display = 'none'; });
                }
                } catch (error) {
                    console.error('❌ Error in enforceAuth:', error);
                    // On error, show login overlay to be safe
                    const overlay = document.getElementById('loginOverlay');
                    if (overlay) overlay.style.display = 'flex';
                    document.body.classList.remove('logged-in');
                }
            }
            
            window.enforceAuth = enforceAuth;

            // Run once when DOM is ready (avoid duplicate runs on window load)
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    enforceAuth();
                });
            } else {
                enforceAuth();
            }
            
            // Verify functions are accessible
            console.log('🔍 Authentication functions loaded:', {
                handleEmailSubmit: typeof window.handleEmailSubmit,
                handleOTPSubmit: typeof window.handleOTPSubmit,
                resendOTP: typeof window.resendOTP,
                logout: typeof window.logout,
                getAuthSession: typeof getAuthSession,
                setAuthSession: typeof setAuthSession,
                clearAuthSession: typeof clearAuthSession
            });
            
            // Attach event listeners to forms (instead of inline handlers)
            function attachFormListeners() {
                const emailForm = document.getElementById('emailForm');
                const otpForm = document.getElementById('otpForm');
                
                if (emailForm) {
                    // Remove any existing listeners first
                    const newEmailForm = emailForm.cloneNode(true);
                    emailForm.parentNode.replaceChild(newEmailForm, emailForm);
                    
                    newEmailForm.addEventListener('submit', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('📧 Form submitted, calling handleEmailSubmit');
                        if (window.handleEmailSubmit && typeof window.handleEmailSubmit === 'function') {
                            window.handleEmailSubmit();
                        } else {
                            console.error('❌ handleEmailSubmit not available:', typeof window.handleEmailSubmit);
                            alert('Authentication system is loading. Please wait a moment and try again.');
                        }
                    });
                    console.log('✅ Email form listener attached to:', newEmailForm);
                }
                
                if (otpForm) {
                    // Remove any existing listeners first
                    const newOtpForm = otpForm.cloneNode(true);
                    otpForm.parentNode.replaceChild(newOtpForm, otpForm);
                    
                    newOtpForm.addEventListener('submit', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔐 OTP form submitted, calling handleOTPSubmit');
                        if (window.handleOTPSubmit && typeof window.handleOTPSubmit === 'function') {
                            window.handleOTPSubmit();
                        } else {
                            console.error('❌ handleOTPSubmit not available:', typeof window.handleOTPSubmit);
                            alert('Authentication system is loading. Please wait a moment and try again.');
                        }
                    });
                    console.log('✅ OTP form listener attached to:', newOtpForm);
                }
            }
            
            // Attach listeners when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', attachFormListeners);
            } else {
                attachFormListeners();
            }
            
            // Attach resend button listener
            function attachResendButtonListener() {
                const resendBtn = document.getElementById('resendOTPButton');
                if (resendBtn) {
                    resendBtn.addEventListener('click', function() {
                        if (window.resendOTP) {
                            window.resendOTP();
                        } else {
                            console.error('resendOTP not available');
                            alert('Authentication system is loading. Please wait a moment and try again.');
                        }
                    });
                    console.log('✅ Resend button listener attached');
                }
            }
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', attachResendButtonListener);
            } else {
                attachResendButtonListener();
            }
            
            // Continuous monitoring to prevent bypass (with server validation)
            let lastServerValidation = 0;
            const SERVER_VALIDATION_INTERVAL = 60000; // Only validate with server every 60 seconds
            
            setInterval(async function() {
                if (ENABLE_EMAIL_OTP) {
                    const overlay = document.getElementById('loginOverlay');
                    
                    // Check multiple sources for session (with fallbacks)
                    let isLoggedIn = false;
                    let adminEmail = null;
                    
                    // 1. Try session from localStorage (client-side check only, no server validation)
                    try {
                        const sessionData = localStorage.getItem('adminAuthSession');
                        if (sessionData) {
                            const session = JSON.parse(sessionData);
                            // Check if expired (client-side check only)
                            if (session.token && session.email && Date.now() < session.expires) {
                            isLoggedIn = true;
                            adminEmail = session.email;
                            }
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                    
                    // 2. Only validate with server occasionally (every 60 seconds) to reduce noise
                    const now = Date.now();
                    if (isLoggedIn && (now - lastServerValidation) > SERVER_VALIDATION_INTERVAL) {
                        lastServerValidation = now;
                        try {
                            const sessionData = localStorage.getItem('adminAuthSession');
                            if (sessionData) {
                                const session = JSON.parse(sessionData);
                                if (session.token && typeof validateSessionWithServer === 'function') {
                                    // Validate with server silently (don't log warnings if it fails)
                                    const validation = await validateSessionWithServer(session.token);
                                    if (validation.valid) {
                                        // Server validated - update email from server response
                                        session.email = validation.email || session.email;
                                        localStorage.setItem('adminAuthSession', JSON.stringify(session));
                                    } else if (validation.error && !validation.error.includes('temporary')) {
                                        // Only log if it's a real error, not a temporary server issue
                                        // Don't clear session - allow it to persist
                                    }
                                }
                            }
                        } catch (e) {
                            // Silently ignore validation errors - session is still valid client-side
                        }
                    }
                    
                    // 3. Fallback to sessionStorage if localStorage check failed
                    if (!isLoggedIn) {
                        const sessionStorageLoggedIn = sessionStorage.getItem('adminLoggedIn');
                        const sessionStorageEmail = sessionStorage.getItem('adminEmail');
                        if (sessionStorageLoggedIn === 'true' && sessionStorageEmail) {
                            isLoggedIn = true;
                            adminEmail = sessionStorageEmail;
                        }
                    }
                    
                    // Check if properly authenticated
                    const isValidAuth = isLoggedIn && adminEmail;
                    
                    // Check if session exists in storage (even if validation hasn't completed)
                    const sessionStorageLoggedIn = sessionStorage.getItem('adminLoggedIn');
                    const sessionData = localStorage.getItem('adminAuthSession');
                    const hasSessionData = sessionStorageLoggedIn || sessionData;
                    
                    // If valid, ensure overlay is hidden and logged-in class is set
                    if (isValidAuth) {
                        // Only log once when first detected, not every 5 seconds
                        if (overlay && overlay.style.display !== 'none') {
                            console.log('✅ Monitoring: Valid session found, hiding login overlay');
                        }
                        if (overlay) {
                            overlay.style.display = 'none';
                            overlay.setAttribute('style', 'display: none !important;');
                        }
                        document.body.classList.add('logged-in');
                        // Don't clear session - it's valid!
                    } else if (hasSessionData) {
                        // Session data exists but might be expired - keep overlay hidden if data exists
                        if (overlay && overlay.style.display !== 'none') {
                            overlay.style.display = 'none';
                            overlay.setAttribute('style', 'display: none !important;');
                        }
                        document.body.classList.add('logged-in');
                    } else {
                            // No session anywhere - show login
                        // Only log and show if overlay isn't already showing (avoid spam)
                        const overlayCurrentlyShowing = overlay && overlay.style.display === 'flex';
                        if (!overlayCurrentlyShowing) {
                            console.log('⚠️ Monitoring: No session found anywhere - showing login');
                            if (overlay) overlay.style.display = 'flex';
                            document.body.classList.remove('logged-in');
                            // Hide all admin content
                            const header = document.querySelector('.header');
                            const tabsStack = document.querySelector('.tabs-sticky-stack');
                            const tabs = document.querySelector('.tabs');
                            const tabContent = document.querySelectorAll('.tab-content');
                            if (header) header.style.display = 'none';
                            if (tabsStack) tabsStack.style.display = 'none';
                            if (tabs) tabs.style.display = 'none';
                            tabContent.forEach(function(tab) { tab.style.display = 'none'; });
                        }
                    }
                }
            }, 5000); // Check every 5 seconds (but only validate with server every 60 seconds)
        })();
