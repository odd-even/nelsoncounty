window.NELSON_ADMIN_BUILD = '20260611a';
console.info(
    '%c[Nelson Admin] BUILD ' + window.NELSON_ADMIN_BUILD + ' — admin-auth.js',
    'color:#4E6B52;font-weight:bold'
);

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

    function applyEarlyAuthState() {
        const overlay = document.getElementById('loginOverlay');
        if (hasValidSession()) {
            if (overlay) {
                overlay.style.display = 'none';
                overlay.setAttribute('style', 'display: none !important;');
            }
            if (document.body) document.body.classList.add('logged-in');
            return;
        }
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.zIndex = '10000';
        }
        if (document.body) document.body.classList.remove('logged-in');
    }

    applyEarlyAuthState();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyEarlyAuthState);
    }
})();
