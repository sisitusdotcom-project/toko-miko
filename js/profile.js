// js/profile.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data sesi dari localStorage
    const userName = localStorage.getItem('currentUserName') || 'Member';
    const userEmail = localStorage.getItem('currentUserEmail') || '';
    const userWhatsapp = localStorage.getItem('currentUserWhatsapp') || '';
    const userRole = localStorage.getItem('userRole') || 'user';

    // 2. Tampilkan data ke UI
    const elName = document.querySelector('.profile-name');
    if(elName) elName.innerText = userName;

    const elRole = document.querySelector('.profile-role');
    if(elRole) elRole.innerText = userRole.toUpperCase();

    // Set dynamic avatar based on name
    const avatarImg = document.querySelector('.profile-avatar img');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1A237E&color=fff&size=120`;
    }

    // Isi input form
    const inputNama = document.getElementById('profileNama');
    const inputEmail = document.getElementById('profileEmail');
    const inputWhatsapp = document.getElementById('profileWhatsapp');

    if(inputNama) inputNama.value = userName;
    if(inputEmail) inputEmail.value = userEmail;
    if(inputWhatsapp) {
        inputWhatsapp.value = userWhatsapp;
        inputWhatsapp.addEventListener('input', () => {
            inputWhatsapp.value = inputWhatsapp.value.replace(/[^0-9]/g, '');
        });
    }

    // 3. Simpan Perubahan Profil (Nama, Email, WA)
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    if(btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            const namaVal = inputNama.value.trim();
            const emailVal = inputEmail.value.trim().toLowerCase();
            const whatsappVal = inputWhatsapp.value.trim();

            if(!namaVal || !emailVal || !whatsappVal) {
                alert('Mohon isi semua data pribadi.');
                return;
            }

            if (whatsappVal.length < 10 || whatsappVal.length > 15) {
                alert('Nomor WhatsApp harus terdiri dari 10 sampai 15 digit!');
                return;
            }

            const originalBtnText = btnSaveProfile.innerHTML;
            btnSaveProfile.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSaveProfile.disabled = true;

            const payload = new URLSearchParams();
            payload.append('action', 'update_profile');
            payload.append('old_email', localStorage.getItem('currentUserEmail'));
            payload.append('nama', namaVal);
            payload.append('email', emailVal);
            payload.append('whatsapp', whatsappVal);

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload,
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    // Update local storage
                    localStorage.setItem('currentUserName', namaVal);
                    localStorage.setItem('currentUserEmail', emailVal);
                    localStorage.setItem('currentUserWhatsapp', whatsappVal);

                    alert('Profil berhasil diperbarui!', () => {
                        window.location.reload();
                    });
                } else {
                    alert('Gagal memperbarui profil: ' + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSaveProfile.innerHTML = originalBtnText;
                btnSaveProfile.disabled = false;
            });
        });
    }

    // 4. Ubah Keamanan & Password
    const btnSavePassword = document.getElementById('btnSavePassword');
    if(btnSavePassword) {
        btnSavePassword.addEventListener('click', () => {
            const inputCurrentPw = document.getElementById('profileCurrentPassword');
            const inputNewPw = document.getElementById('profileNewPassword');
            const inputConfirmPw = document.getElementById('profileConfirmPassword');

            const currentPw = inputCurrentPw.value;
            const newPw = inputNewPw.value;
            const confirmPw = inputConfirmPw.value;

            if(!currentPw || !newPw || !confirmPw) {
                alert('Mohon isi semua field password.');
                return;
            }

            if(newPw !== confirmPw) {
                alert('Konfirmasi password baru tidak cocok!');
                return;
            }

            if(newPw.length < 8) {
                alert('Password baru minimal harus terdiri dari 8 karakter!');
                return;
            }

            const originalBtnText = btnSavePassword.innerHTML;
            btnSavePassword.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSavePassword.disabled = true;

            const payload = new URLSearchParams();
            payload.append('action', 'update_password');
            payload.append('email', localStorage.getItem('currentUserEmail'));
            payload.append('current_password', currentPw);
            payload.append('new_password', newPw);

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload,
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    inputCurrentPw.value = '';
                    inputNewPw.value = '';
                    inputConfirmPw.value = '';
                    alert('Password berhasil diperbarui!');
                } else {
                    alert('Gagal memperbarui password: ' + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSavePassword.innerHTML = originalBtnText;
                btnSavePassword.disabled = false;
            });
        });
    }
});
