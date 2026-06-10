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
