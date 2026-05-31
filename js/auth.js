// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // 0. Fungsi Toast Notifikasi
    window.showToast = function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if(!container) {
            alert(message);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-info-circle';
        if(type === 'success') icon = 'fa-check-circle';
        if(type === 'error' || type === 'danger') icon = 'fa-exclamation-circle';
        if(type === 'warning') icon = 'fa-exclamation-triangle';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Bersihkan form autofill dari browser (opsional tapi disarankan)
    setTimeout(() => {
        const forms = document.querySelectorAll('.auth-form input');
        forms.forEach(input => {
            // Hanya kosongkan jika bukan checkbox
            if (input.type !== 'checkbox') {
                input.value = '';
            }
        });
    }, 50);

    // Autopopulate email if redirected from register page (email already exists)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const alreadyRegistered = urlParams.get('already_registered');
    if (alreadyRegistered === 'true' && emailParam) {
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.value = emailParam;
            }
            showToast('Email sudah terdaftar, silakan login', 'warning');
        }, 100);
    }

    // 1. Pengaturan Toggle Visibilitas Password
    const setupToggle = (toggleId, inputId) => {
        const toggleBtn = document.getElementById(toggleId);
        const inputField = document.getElementById(inputId);
        if(toggleBtn && inputField) {
            toggleBtn.addEventListener('click', function () {
                const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
                inputField.setAttribute('type', type);
                this.classList.toggle('fa-eye-slash');
            });
        }
    };

    setupToggle('togglePassword', 'password');
    setupToggle('togglePassword1', 'password');
    setupToggle('togglePassword2', 'confirm-password');

    // 2. Logika Formulir Login
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value.toLowerCase().trim();
            const passwordInput = document.getElementById('password').value;

            if(emailInput === 'admin@dinascustom.com') {
                if (passwordInput === 'admin123') {
                    localStorage.setItem('userRole', 'admin');
                    localStorage.setItem('currentUserEmail', 'admin@dinascustom.com');
                    localStorage.setItem('pendingToast', JSON.stringify({ message: 'Login berhasil sebagai Admin Utama', type: 'success' }));
                    let redirectUrl = 'admin.html';
                    if (window.location.protocol === 'file:') redirectUrl += '?role_sync=admin';
                    window.location.href = redirectUrl;
                } else {
                    showToast('Password salah!', 'danger');
                }
            } else {
                const urlEncodedData = new URLSearchParams();
                urlEncodedData.append('action', 'login');
                urlEncodedData.append('email', emailInput);
                urlEncodedData.append('password', passwordInput);

                const btnSubmit = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
                btnSubmit.disabled = true;

                fetch(CONFIG.GAS_URL, {
                    method: 'POST',
                    body: urlEncodedData,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.result === 'success') {
                        localStorage.setItem('userRole', 'user');
                        localStorage.setItem('currentUserEmail', data.user.email);
                        localStorage.setItem('currentUserName', data.user.nama);
                        if (data.user.whatsapp) localStorage.setItem('currentUserWhatsapp', data.user.whatsapp);
                        localStorage.setItem('pendingToast', JSON.stringify({ message: 'Login berhasil! Selamat datang di DinasCustom.', type: 'success' }));
                        let redirectUrl = 'dashboard.html';
                        if (window.location.protocol === 'file:') {
                            redirectUrl += `?role_sync=user&email_sync=${encodeURIComponent(data.user.email)}&name_sync=${encodeURIComponent(data.user.nama)}`;
                            if (data.user.whatsapp) redirectUrl += `&whatsapp_sync=${encodeURIComponent(data.user.whatsapp)}`;
                        }
                        window.location.href = redirectUrl;
                    } else {
                        showToast(data.message || 'Login gagal!', 'danger');
                        btnSubmit.innerHTML = originalBtnText;
                        btnSubmit.disabled = false;
                    }
                })
                .catch(error => {
                    console.error('Error Fetch:', error);
                    showToast('Terjadi kesalahan jaringan atau koneksi ke server.', 'danger');
                    btnSubmit.innerHTML = originalBtnText;
                    btnSubmit.disabled = false;
                });
            }
        });
    }

    // 3. Logika Formulir Registrasi (Kirim ke GAS)
    const registerForm = document.getElementById('registerForm');
    const registerWaInput = document.getElementById('whatsapp');
    
    if (registerWaInput) {
        registerWaInput.addEventListener('input', (e) => {
            registerWaInput.value = registerWaInput.value.replace(/[^0-9]/g, '');
        });
    }

    if(registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const whatsapp = document.getElementById('whatsapp').value.trim();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const pw = document.getElementById('password').value;
            const confirmPw = document.getElementById('confirm-password').value;

            if (whatsapp.length < 10 || whatsapp.length > 15) {
                showToast('Nomor WhatsApp harus terdiri dari 10 sampai 15 digit!', 'warning');
                return;
            }

            if (pw.length < 8) {
                showToast('Password minimal harus terdiri dari 8 karakter!', 'warning');
                return;
            }

            if(pw !== confirmPw) {
                showToast('Konfirmasi password tidak cocok!', 'warning');
                return;
            }

            const urlEncodedData = new URLSearchParams();
            urlEncodedData.append('action', 'register');
            urlEncodedData.append('nama', name);
            urlEncodedData.append('whatsapp', whatsapp);
            urlEncodedData.append('email', email);
            urlEncodedData.append('password', pw);

            const btnSubmit = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
            btnSubmit.disabled = true;

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: urlEncodedData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    localStorage.setItem('userRole', 'user');
                    localStorage.setItem('currentUserEmail', email);
                    localStorage.setItem('currentUserName', name);
                    localStorage.setItem('currentUserWhatsapp', whatsapp);
                    localStorage.setItem('pendingToast', JSON.stringify({ message: 'Pendaftaran berhasil! Selamat datang di Dashboard User.', type: 'success' }));
                    let redirectUrl = 'dashboard.html';
                    if (window.location.protocol === 'file:') {
                        redirectUrl += `?role_sync=user&email_sync=${encodeURIComponent(email)}&name_sync=${encodeURIComponent(name)}&whatsapp_sync=${encodeURIComponent(whatsapp)}`;
                    }
                    window.location.href = redirectUrl;
                } else {
                    if (data.message && data.message.toLowerCase().includes('email sudah terdaftar')) {
                        showToast('Email sudah terdaftar, silakan login', 'warning');
                        setTimeout(() => {
                            window.location.href = `login.html?email=${encodeURIComponent(email)}&already_registered=true`;
                        }, 1500);
                    } else {
                        showToast(data.message || 'Pendaftaran gagal!', 'danger');
                        btnSubmit.innerHTML = originalBtnText;
                        btnSubmit.disabled = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error Fetch:', error);
                showToast('Terjadi kesalahan jaringan atau koneksi ke server.', 'danger');
                btnSubmit.innerHTML = originalBtnText;
                btnSubmit.disabled = false;
            });
        });
    }
    // 4. Load Pengaturan Tampilan dari GAS (Brand & Background)
    function applyTampilanAuth(tampilanData) {
        if (!tampilanData) return;

        // Update brand logo (kiri & mobile)
        const brandText = tampilanData['Footer Brand'] || tampilanData['Nama Brand'] || 'Dinas<span>Custom.</span>';
        const logoUrl = tampilanData['Logo Brand'];
        
        // Perbarui favicon global
        if (logoUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = logoUrl;
        }
        
        const logoLeft = document.getElementById('authLogoLeft');
        if (logoLeft) {
            let logoHtml = '';
            if (logoUrl) {
                logoHtml = `<img src="${logoUrl}" alt="Logo" style="height: 38px; object-fit: contain; margin-right: 8px;">`;
            }
            logoLeft.innerHTML = `${logoHtml}<span>${brandText}</span>`;
        }

        const logoMobile = document.getElementById('authLogoMobile');
        if (logoMobile) {
            let logoHtml = '';
            if (logoUrl) {
                logoHtml = `<img src="${logoUrl}" alt="Logo" style="height: 32px; object-fit: contain; margin-right: 8px;">`;
            }
            logoMobile.innerHTML = `${logoHtml}<span>${brandText}</span>`;
        }

        // Update background gambar panel kiri
        const heroBg = tampilanData['Hero Background'];
        const authLeft = document.getElementById('authLeftBg');
        if (authLeft && heroBg && heroBg.startsWith('http')) {
            authLeft.style.backgroundImage = `linear-gradient(135deg, rgba(26, 35, 126, 0.85) 0%, rgba(55, 71, 79, 0.7) 100%), url('${heroBg}')`;
        }
    }

    // Coba load dari cache dulu agar tampilan langsung muncul
    const cachedTampilan = localStorage.getItem('cachedTampilanData');
    if (cachedTampilan) {
        try { applyTampilanAuth(JSON.parse(cachedTampilan)); } catch(e) {}
    }

    // Fetch segar dari GAS (JSONP fallback untuk file://)
    if (typeof CONFIG !== 'undefined' && CONFIG.GAS_URL) {
        const callbackName = 'authTampilanCallback_' + Math.round(1e6 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            if (data.result === 'success' && data.data_tampilan) {
                localStorage.setItem('cachedTampilanData', JSON.stringify(data.data_tampilan));
                applyTampilanAuth(data.data_tampilan);
            }
        };
        const script = document.createElement('script');
        script.src = `${CONFIG.GAS_URL}?callback=${callbackName}&t=${Date.now()}`;
        script.onerror = function() { delete window[callbackName]; };
        document.body.appendChild(script);
    }
});
