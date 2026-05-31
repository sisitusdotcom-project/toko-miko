// js/guard.js
(function() {
    // Workaround untuk Firefox file:/// protocol localStorage isolation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('logout_sync')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserEmail');
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserWhatsapp');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.has('role_sync')) {
        localStorage.setItem('userRole', urlParams.get('role_sync'));
        if (urlParams.has('email_sync')) localStorage.setItem('currentUserEmail', urlParams.get('email_sync'));
        if (urlParams.has('name_sync')) localStorage.setItem('currentUserName', urlParams.get('name_sync'));
        if (urlParams.has('whatsapp_sync')) localStorage.setItem('currentUserWhatsapp', urlParams.get('whatsapp_sync'));
        // Hapus parameter dari URL agar lebih bersih (opsional)
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const path = window.location.pathname;
    const role = localStorage.getItem('userRole');

    if (path.endsWith('admin.html')) {
        if (role !== 'admin') {
            window.location.replace('404.html');
        }
    } else if (path.endsWith('dashboard.html') || path.endsWith('profile.html')) {
        if (!role) {
            window.location.replace('login.html');
        }
    } else if (path.endsWith('login.html') || path.endsWith('register.html')) {
        if (role) {
            const email = localStorage.getItem('currentUserEmail') || '';
            const name = localStorage.getItem('currentUserName') || '';
            
            let redirectUrl = role === 'admin' ? 'admin.html' : 'dashboard.html';
            
            if (window.location.protocol === 'file:') {
                redirectUrl += `?role_sync=${role}&email_sync=${encodeURIComponent(email)}&name_sync=${encodeURIComponent(name)}`;
            }
            
            window.location.replace(redirectUrl);
        }
    }
})();

// Global Custom Alert Override
(function() {
    window.alert = function(message, callback) {
        const renderAlert = () => {
            // Remove existing alert overlays to prevent duplicates
            const existingAlerts = document.querySelectorAll('.custom-alert-overlay');
            existingAlerts.forEach(el => el.remove());

            const modal = document.createElement('div');
            modal.className = 'custom-alert-overlay';
            
            let iconClass = 'fa-circle-info text-info';
            let title = 'Informasi';
            
            const msgLower = String(message).toLowerCase();
            if (msgLower.includes('gagal') || msgLower.includes('error') || msgLower.includes('salah') || msgLower.includes('ditolak') || msgLower.includes('kesalahan')) {
                iconClass = 'fa-circle-xmark text-danger';
                title = 'Gagal';
            } else if (msgLower.includes('berhasil') || msgLower.includes('sukses') || msgLower.includes('lunas') || msgLower.includes('disetujui')) {
                iconClass = 'fa-circle-check text-success';
                title = 'Berhasil';
            } else if (msgLower.includes('mohon') || msgLower.includes('pilih') || msgLower.includes('silakan') || msgLower.includes('perhatian') || msgLower.includes('ukuran')) {
                iconClass = 'fa-circle-exclamation text-warning';
                title = 'Perhatian';
            }

            modal.innerHTML = `
                <div class="custom-alert-box">
                    <div class="custom-alert-icon">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="custom-alert-title">${title}</div>
                    <div class="custom-alert-message">${message}</div>
                    <button class="custom-alert-btn">OK</button>
                </div>
            `;

            document.body.appendChild(modal);

            // Trigger animation
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);

            const btn = modal.querySelector('.custom-alert-btn');
            btn.focus();

            const closeAlert = () => {
                modal.classList.remove('show');
                document.removeEventListener('keydown', handleKeyDown);
                setTimeout(() => {
                    modal.remove();
                    if (typeof callback === 'function') {
                        callback();
                    }
                }, 250);
            };

            btn.addEventListener('click', closeAlert);
            
            function handleKeyDown(e) {
                if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
                    e.preventDefault();
                    closeAlert();
                }
            }
            document.addEventListener('keydown', handleKeyDown);
        };

        if (document.body) {
            renderAlert();
        } else {
            document.addEventListener('DOMContentLoaded', renderAlert);
        }
    };

    // Intercept clicks to login/register to propagate logout_sync under file protocol
    if (window.location.protocol === 'file:') {
        document.addEventListener('DOMContentLoaded', () => {
            const role = localStorage.getItem('userRole');
            if (!role) {
                document.querySelectorAll('a[href^="login.html"], a[href^="register.html"]').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        let href = link.getAttribute('href');
                        href += (href.includes('?') ? '&' : '?') + 'logout_sync=true';
                        window.location.href = href;
                    });
                });
            }
        });
    }
})();
