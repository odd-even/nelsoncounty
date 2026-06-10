window.NELSON_ADMIN_BUILD = '20260610d';
console.info(
    '%c[Nelson Admin] BUILD ' + window.NELSON_ADMIN_BUILD + ' — admin-auth.js',
    'color:#4E6B52;font-weight:bold'
);

// Keep login visible until admin.js confirms auth — do not toggle logged-in here.
(function() {
    'use strict';

    function hasValidSession() {
        try {
            const sessionData = localStorage.getItem('adminAuthSession');
            if (!sessionData) return false;
            const session = JSON.parse(sessionData);
            return !!(session.token && session.email && session.expires && Date.now() < session.expires);
        } catch (e) {
            return false;
        }
    }

    sessionStorage.clear();
    localStorage.removeItem('skipAuth');
    localStorage.removeItem('adminLoggedIn');

    function showLoginOverlayIfNeeded() {
        if (hasValidSession()) return;
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.zIndex = '10000';
        }
        if (document.body) {
            document.body.classList.remove('logged-in');
        }
    }

    showLoginOverlayIfNeeded();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showLoginOverlayIfNeeded);
    }
})();
