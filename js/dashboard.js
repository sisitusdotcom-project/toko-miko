document.addEventListener('DOMContentLoaded', () => {

    // 0. Fungsi Toast Notifikasi & Cek Pending Toast
    window.showToast = function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if(!container) return;

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

    const pendingToast = localStorage.getItem('pendingToast');
    if (pendingToast) {
        try {
            const toastData = JSON.parse(pendingToast);
            showToast(toastData.message, toastData.type);
        } catch(e) {}
        localStorage.removeItem('pendingToast');
    }

    // Klik User Profile widget untuk menuju halaman edit profile
    const userProfileWidget = document.querySelector('.user-profile');
    if (userProfileWidget) {
        userProfileWidget.addEventListener('click', () => {
            const role = localStorage.getItem('userRole') || 'user';
            const email = localStorage.getItem('currentUserEmail') || '';
            const name = localStorage.getItem('currentUserName') || '';
            const whatsapp = localStorage.getItem('currentUserWhatsapp') || '';
            
            let url = 'profile.html';
            let params = [];
            if (role) params.push(`role_sync=${role}`);
            if (email) params.push(`email_sync=${encodeURIComponent(email)}`);
            if (name) params.push(`name_sync=${encodeURIComponent(name)}`);
            if (whatsapp) params.push(`whatsapp_sync=${encodeURIComponent(whatsapp)}`);
            
            if (window.location.protocol === 'file:' && params.length > 0) {
                url += '?' + params.join('&');
            }
            window.location.href = url;
        });
    }

    // 1. Tab Navigation Logic (SPA Feel)
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            if (targetId !== 'history-section') {
                // Notice cleared
            }
        });
    });

    // Logika Keluar / Logout
    const logoutBtn = document.querySelector('.logout-btn');
    const logoutModal = document.getElementById('logoutChoiceModal');
    
    if(logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('show');
        });
        
        const btnFullLogout = document.getElementById('btnFullLogout');
        
        if (btnFullLogout) {
            btnFullLogout.addEventListener('click', () => {
                localStorage.removeItem('userRole');
                localStorage.removeItem('currentUserEmail');
                localStorage.removeItem('currentUserName');
                localStorage.removeItem('currentUserWhatsapp');
                
                let redirectUrl = 'index.html';
                if (window.location.protocol === 'file:') {
                    redirectUrl += '?logout_sync=true';
                }
                window.location.href = redirectUrl;
            });
        }
    }

    // Sync parameters for index.html links under file:/// protocol
    if (window.location.protocol === 'file:') {
        document.querySelectorAll('a[href^="index.html"]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.classList.contains('logout-btn')) return;
                
                e.preventDefault();
                const role = localStorage.getItem('userRole');
                const email = localStorage.getItem('currentUserEmail');
                const name = localStorage.getItem('currentUserName');
                const whatsapp = localStorage.getItem('currentUserWhatsapp');
                
                let originalHref = link.getAttribute('href');
                let hash = '';
                if (originalHref.includes('#')) {
                    const parts = originalHref.split('#');
                    originalHref = parts[0];
                    hash = '#' + parts[1];
                }
                
                let params = [];
                if (role) params.push(`role_sync=${role}`);
                if (email) params.push(`email_sync=${encodeURIComponent(email)}`);
                if (name) params.push(`name_sync=${encodeURIComponent(name)}`);
                if (whatsapp) params.push(`whatsapp_sync=${encodeURIComponent(whatsapp)}`);
                
                let newHref = originalHref;
                if (params.length > 0) {
                    newHref += '?' + params.join('&');
                }
                newHref += hash;
                
                window.location.href = newHref;
            });
        });
    }

    // 2. Drag and Drop Image Upload Logic
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Mohon upload file gambar (JPG/PNG).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'inline-block';
            
            const icon = uploadArea.querySelector('i');
            if (icon) icon.style.display = 'none';
            const text = uploadArea.querySelector('p');
            if (text) text.innerText = 'Klik untuk mengganti gambar';
        };
        reader.readAsDataURL(file);
    }

    // 3. Fetch Real Data from Backend (GAS) dengan Cache Buster
    let globalPaymentsData = [];

    function fetchDashboardData(preFetchedData = null) {
        if (typeof CONFIG === 'undefined' || !CONFIG.GAS_URL) {
            console.error('GAS URL tidak ditemukan. Pastikan js/config.js telah dimuat.');
            return;
        }

        if (preFetchedData && preFetchedData.result === 'success' && preFetchedData.data_po) {
            localStorage.setItem('userCachedData', JSON.stringify(preFetchedData));
            handleIncomingData(preFetchedData);
            return;
        }

        const cached = localStorage.getItem('userCachedData');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                handleIncomingData(parsed);
            } catch(e) {}
        }

        const url = `${CONFIG.GAS_URL}?t=${new Date().getTime()}`;

        fetch(url, { redirect: 'follow' })
            .then(response => response.json())
            .then(data => {
                if(data.result === 'success') {
                    localStorage.setItem('userCachedData', JSON.stringify(data));
                }
                handleIncomingData(data);
            })
            .catch(error => {
                console.warn('Fetch standard diblokir CORS peramban. Mencoba fallback JSONP...');
                fetchViaJSONP();
            });
    }

    function handleIncomingData(data) {
        if(data.result === 'success') {
            // Sync Event & Discount from API data
            let eventActive = false;
            let eventDiskon = 0;
            const eventData = data.data_event;
            if (eventData && eventData['Status'] === 'Aktif') {
                let hasPassed = false;
                if (eventData['Batas Waktu']) {
                    const targetTime = new Date(eventData['Batas Waktu']).getTime();
                    if (!isNaN(targetTime) && targetTime - Date.now() <= 0) {
                        hasPassed = true;
                    }
                }
                if (!hasPassed) {
                    eventActive = true;
                    eventDiskon = parseInt(eventData['Diskon (%)'], 10) || 0;
                }
            }
            localStorage.setItem('eventActive', eventActive ? 'true' : 'false');
            localStorage.setItem('eventDiskon', eventDiskon.toString());

            let currentUser = { 'Nama Lengkap': localStorage.getItem('currentUserName') || 'User' };
            const loggedInEmail = localStorage.getItem('currentUserEmail');
            if (data.data_users && data.data_users.length > 0) {
                const found = data.data_users.find(u => String(u['Email']).toLowerCase() === String(loggedInEmail).toLowerCase());
                if (found) {
                    currentUser = found;
                    if (currentUser['Nama Lengkap']) localStorage.setItem('currentUserName', currentUser['Nama Lengkap']);
                    if (currentUser['Nomor WhatsApp']) localStorage.setItem('currentUserWhatsapp', currentUser['Nomor WhatsApp']);
                } else {
                    currentUser = data.data_users[data.data_users.length - 1];
                }
            }

            const userNameDisplay = document.getElementById('userNameDisplay');
            if(userNameDisplay) {
                userNameDisplay.innerText = currentUser['Nama Lengkap'] || 'User';
                const pageTitle = document.querySelector('#dashboard-section .page-title');
                if (pageTitle) {
                    const firstName = (currentUser['Nama Lengkap'] || 'User').split(' ')[0];
                    pageTitle.innerText = `Halo, ${firstName}! 👋`;
                }
            }

            globalPaymentsData = data.data_pembayaran || [];
            const allPO = data.data_po || [];
            const userPO = allPO.filter(row => row['Nama Lengkap'] === currentUser['Nama Lengkap']);

            if (data.data_tampilan) {
                const dt = data.data_tampilan;
                const brandText = dt['Footer Brand'] || 'Dinas<span>Custom.</span>';
                const logoUrl = dt['Logo Brand'];
                const el = document.getElementById('dynUserBrand');
                if (el) {
                    let logoHtml = '';
                    if (logoUrl) {
                        logoHtml = `<img id="dynUserLogo" src="${logoUrl}" alt="Logo" style="height: 32px; object-fit: contain; margin-right: 8px;">`;
                        
                        // Perbarui favicon global
                        let link = document.querySelector("link[rel~='icon']");
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.getElementsByTagName('head')[0].appendChild(link);
                        }
                        link.href = logoUrl;
                    }
                    el.innerHTML = `${logoHtml}<span>${brandText}</span>`;
                }
            }

            renderDashboardWidgets(userPO, globalPaymentsData);
            renderHistoryTable(userPO, globalPaymentsData);
            renderDashboardCatalog(data.data_produk || []);
            renderNotifications(userPO, globalPaymentsData);

            // Update info bank dan ongkir dari pengaturan admin
            if (data.data_pengaturan) {
                window._pengaturanData = data.data_pengaturan;
                applyPengaturan(data.data_pengaturan);
            }
        } else {
            const container = document.getElementById('historyCardsContainer');
            if(container) container.innerHTML = `<div class="card-box text-center text-danger py-4" style="grid-column: 1 / -1; width: 100%;">Gagal memuat data: ${data.message}</div>`;
        }
    }

    function applyPengaturan(pg, isPending = true, customOngkir = 0) {
        if (!pg) return;

        // Update info bank
        const elBankNama = document.getElementById('invBankNama');
        const elBankPemilik = document.getElementById('invBankPemilik');
        const elRekNumber = document.getElementById('rekNumber');

        if (elBankNama && pg['Bank Nama']) elBankNama.textContent = 'BANK ' + pg['Bank Nama'].toUpperCase();
        if (elBankPemilik && pg['Bank Pemilik']) elBankPemilik.textContent = pg['Bank Pemilik'].toUpperCase();
        if (elRekNumber && pg['Bank Nomor']) elRekNumber.textContent = pg['Bank Nomor'];

        // Update baris ongkir di invoice
        const elOngkirLabel = document.getElementById('invOngkirLabel');
        const elOngkirHarga = document.getElementById('invOngkirHarga');
        const elOngkirRow = document.getElementById('invOngkirRow');

        const ongkirJudul = pg['Ongkir Judul'] || 'Ongkos Kirim';
        let ongkirBiaya = 0;

        if (isPending) {
            const ongkirAktif = pg['Ongkir Status'] === 'Aktif';
            ongkirBiaya = ongkirAktif ? (parseInt(pg['Ongkir Biaya']) || 0) : 0;
        } else {
            ongkirBiaya = customOngkir;
        }

        if (elOngkirLabel) elOngkirLabel.textContent = ongkirJudul;
        if (elOngkirHarga) {
            elOngkirHarga.textContent = ongkirBiaya > 0
                ? 'Rp ' + ongkirBiaya.toLocaleString('id-ID')
                : 'Gratis';
        }
        if (elOngkirRow) elOngkirRow.style.display = 'flex';
    }

    function fetchViaJSONP() {
        const callbackName = 'gasUserCallback_' + Math.round(1000000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            if(data.result === 'success') {
                localStorage.setItem('userCachedData', JSON.stringify(data));
            }
            handleIncomingData(data);
        };

        const script = document.createElement('script');
        script.src = `${CONFIG.GAS_URL}?callback=${callbackName}&t=${Date.now()}`;
        script.onerror = function() {
            delete window[callbackName];
            const container = document.getElementById('historyCardsContainer');
            if(container) container.innerHTML = `<div class="card-box text-center text-danger py-4" style="grid-column: 1 / -1; width: 100%;">Terjadi kesalahan jaringan atau CORS. Pastikan skrip backend gas.js terbaru telah di-deploy.</div>`;
        };
        document.body.appendChild(script);
    }

    function renderDashboardWidgets(userPO, paymentsData) {
        let activeCount = 0;
        let pendingPayment = 0;
        
        userPO.forEach(row => {
            const status = (row['Status'] || '').toLowerCase();
            const paymentRecord = paymentsData.find(p => p['ID Order'] === row['ID Order']);
            const pemStatus = paymentRecord ? (paymentRecord['Status Verifikasi'] || '').toLowerCase() : '';

            if (status === 'pending' || status === 'disetujui' || pemStatus === 'menunggu verifikasi') {
                activeCount++;
                if (status === 'disetujui' && pemStatus !== 'menunggu verifikasi' && pemStatus !== 'selesai') {
                    pendingPayment++;
                }
            }
        });

        const elActive = document.getElementById('activePOCount');
        if (elActive) elActive.innerText = activeCount;
        const elPending = document.getElementById('pendingPaymentCount');
        if (elPending) elPending.innerText = pendingPayment;
        const elHistory = document.getElementById('historyCount');
        if (elHistory) elHistory.innerText = userPO.length;
    }

    function renderHistoryTable(userPO, paymentsData) {
        const container = document.getElementById('historyCardsContainer');
        if (!container) return;
        container.innerHTML = '';

        if (userPO.length === 0) {
            container.innerHTML = `<div class="card-box text-center text-muted py-4" style="grid-column: 1 / -1; width: 100%;">Belum ada riwayat pesanan.</div>`;
            return;
        }

        for (let i = userPO.length - 1; i >= 0; i--) {
            const row = userPO[i];
            const paymentRecord = paymentsData.find(p => p['ID Order'] === row['ID Order']);
            
            let status = row['Status'] || 'Pending';

            // Client-side deadline evaluation (fallback check)
            if (status.toLowerCase() === 'disetujui' && row['Batas Pembayaran']) {
                const batasDate = new Date(row['Batas Pembayaran']);
                if (!isNaN(batasDate.getTime())) {
                    batasDate.setHours(23, 59, 59, 999);
                    if (new Date() > batasDate) {
                        status = 'Dibatalkan';
                    }
                }
            }

            if (paymentRecord && paymentRecord['Status Verifikasi'] === 'Menunggu Verifikasi') {
                status = 'Menunggu Verifikasi';
            } else if (paymentRecord && paymentRecord['Status Verifikasi'] === 'Selesai') {
                status = 'Selesai';
            }

            let badgeClass = 'badge-warning';
            let cardClass = 'po-card clickable-card';
            let displayStatus = status;

            if (status.toLowerCase() === 'pending') {
                displayStatus = 'Menunggu Verifikasi Pesanan';
                cardClass = 'po-card'; // Not clickable
            } else if (status.toLowerCase() === 'menunggu verifikasi') {
                displayStatus = 'Menunggu Verifikasi Pembayaran';
            }
            
            if (status.toLowerCase() === 'disetujui') badgeClass = 'badge-primary';
            else if (status.toLowerCase() === 'menunggu verifikasi') badgeClass = 'badge-info';
            else if (status.toLowerCase() === 'selesai') badgeClass = 'badge-success';
            else if (status.toLowerCase() === 'ditolak') {
                badgeClass = 'badge-danger';
                cardClass = 'po-card rejected-card';
            } else if (status.toLowerCase() === 'dibatalkan') {
                badgeClass = 'badge-danger';
                cardClass = 'po-card';
            }

            let dateStr = row['Timestamp'] || '-';
            if (dateStr !== '-') {
                const d = new Date(dateStr);
                if (!isNaN(d)) dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            }

            let targetDateStr = '-';
            const rawTargetDate = row['Tanggal PO'] || row[''] || (Object.keys(row).length > 10 ? row[Object.keys(row)[10]] : '-');
            if (rawTargetDate && rawTargetDate !== '-') {
                const td = new Date(rawTargetDate);
                if (!isNaN(td)) {
                    targetDateStr = td.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                } else {
                    targetDateStr = rawTargetDate;
                }
            }

            // Get total price
            let harga = row['Harga Total'] || row[''] || 0;
            let formattedHarga = '-';
            if (status.toLowerCase() === 'pending') {
                formattedHarga = '-';
            } else if (harga && !isNaN(harga) && parseInt(harga) > 0) {
                formattedHarga = 'Rp ' + parseInt(harga).toLocaleString('id-ID');
            } else {
                // Fallback default price if not set
                const defaultHarga = (row['Produk'] || '').toLowerCase().includes('pdl') ? 350000 : 250000;
                formattedHarga = 'Rp ' + defaultHarga.toLocaleString('id-ID');
            }

            const card = document.createElement('div');
            card.className = cardClass;
            card.setAttribute('data-target', 'payment-section');
            card.setAttribute('data-index', i);

            let footerHTML = '';
            if (status.toLowerCase() === 'disetujui') {
                footerHTML = `
                    <div class="po-card-footer">
                        <button class="po-card-btn-pay btn-bayar-sekarang" data-index="${i}">
                            <i class="fa-solid fa-wallet"></i> Lakukan Pembayaran
                        </button>
                    </div>
                `;
            } else if (status.toLowerCase() === 'menunggu verifikasi') {
                let waAdmin = '';
                if (window._pengaturanData && window._pengaturanData['Whatsapp Admin']) {
                    waAdmin = String(window._pengaturanData['Whatsapp Admin']).replace(/[^0-9]/g, '');
                }
                if (!waAdmin) waAdmin = '628123456789';
                const waText = encodeURIComponent(`Halo Admin, saya ingin konfirmasi verifikasi pembayaran untuk PO dengan ID Order: ${row['ID Order'] || '-'}. Mohon segera diverifikasi. Terima kasih!`);
                const waLink = `https://wa.me/${waAdmin}?text=${waText}`;
                footerHTML = `
                    <div class="po-card-footer">
                        <a href="${waLink}" target="_blank" onclick="event.stopPropagation();" class="po-card-btn-pay" style="background: #25d366; text-decoration: none; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; border-radius: 6px; padding: 10px; width: 100%; border: none; box-sizing: border-box;">
                            <i class="fa-brands fa-whatsapp" style="font-size: 1.25rem;"></i> Hubungi Admin (Verifikasi Cepat)
                        </a>
                    </div>
                `;
            } else if (status.toLowerCase() === 'pending') {
                let waAdmin = '';
                if (window._pengaturanData && window._pengaturanData['Whatsapp Admin']) {
                    waAdmin = String(window._pengaturanData['Whatsapp Admin']).replace(/[^0-9]/g, '');
                }
                if (!waAdmin) waAdmin = '628123456789';
                const waText = encodeURIComponent(`Halo Admin, saya ingin konfirmasi verifikasi pesanan baru saya dengan ID Order: ${row['ID Order'] || '-'}. Mohon segera diverifikasi. Terima kasih!`);
                const waLink = `https://wa.me/${waAdmin}?text=${waText}`;
                footerHTML = `
                    <div class="po-card-footer">
                        <a href="${waLink}" target="_blank" onclick="event.stopPropagation();" class="po-card-btn-pay" style="background: #25d366; text-decoration: none; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; border-radius: 6px; padding: 10px; width: 100%; border: none; box-sizing: border-box;">
                            <i class="fa-brands fa-whatsapp" style="font-size: 1.25rem;"></i> Hubungi Admin (Verifikasi Cepat)
                        </a>
                    </div>
                `;
            }

            let alasanRowHTML = '';
            if (status.toLowerCase() === 'ditolak') {
                const alasan = row['Alasan Ditolak'] || 'Ukuran yang dimasukkan tidak sesuai format (Mohon lampirkan detail panjang lengan).';
                alasanRowHTML = `
                    <div class="po-card-row" style="color: #ef4444; font-weight: 600; background-color: #fee2e2; padding: 8px 10px; border-radius: 6px; margin-top: 10px; flex-direction: column; align-items: flex-start; gap: 4px; border: 1px solid #fecaca; width: 100%; box-sizing: border-box;">
                        <span class="po-card-label" style="color: #991b1b; font-size: 0.85rem; font-weight: bold; margin-bottom: 2px;"><i class="fa-solid fa-circle-exclamation"></i> Alasan Ditolak:</span>
                        <span class="po-card-value" style="color: #b91c1c; font-size: 0.88rem; line-height: 1.4; word-break: break-word; font-weight: 500;">${alasan}</span>
                    </div>
                `;
            }

            let deadlineRowHTML = '';
            if (status.toLowerCase() === 'disetujui' && row['Batas Pembayaran']) {
                let deadlineStr = row['Batas Pembayaran'];
                const d = new Date(deadlineStr);
                if (!isNaN(d.getTime())) {
                    deadlineStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                }
                deadlineRowHTML = `
                    <div class="po-card-row" style="color: #d97706; font-weight: 600; background-color: #fef3c7; padding: 8px 10px; border-radius: 6px; margin-top: 10px; flex-direction: column; align-items: flex-start; gap: 4px; border: 1px solid #fde68a; width: 100%; box-sizing: border-box;">
                        <span class="po-card-label" style="color: #92400e; font-size: 0.85rem; font-weight: bold; margin-bottom: 2px;"><i class="fa-solid fa-calendar-day"></i> Batas Pembayaran:</span>
                        <span class="po-card-value" style="color: #b45309; font-size: 0.88rem; line-height: 1.4; word-break: break-word; font-weight: 500;">Sebelum ${deadlineStr}</span>
                    </div>
                `;
            }

            let cancelRowHTML = '';
            if (status.toLowerCase() === 'dibatalkan') {
                cancelRowHTML = `
                    <div class="po-card-row" style="color: #ef4444; font-weight: 600; background-color: #fee2e2; padding: 8px 10px; border-radius: 6px; margin-top: 10px; flex-direction: column; align-items: flex-start; gap: 4px; border: 1px solid #fecaca; width: 100%; box-sizing: border-box;">
                        <span class="po-card-label" style="color: #991b1b; font-size: 0.85rem; font-weight: bold; margin-bottom: 2px;"><i class="fa-solid fa-ban"></i> Otomatis Dibatalkan:</span>
                        <span class="po-card-value" style="color: #b91c1c; font-size: 0.88rem; line-height: 1.4; word-break: break-word; font-weight: 500;">Melebihi batas waktu pembayaran.</span>
                    </div>
                `;
            }

            let payRejectRowHTML = '';
            if (paymentRecord && (paymentRecord['Status Verifikasi'] || '').toLowerCase() === 'ditolak') {
                const alasanPay = paymentRecord['Alasan Ditolak'] || 'Bukti transfer tidak valid atau nominal tidak sesuai.';
                payRejectRowHTML = `
                    <div class="po-card-row" style="color: #ef4444; font-weight: 600; background-color: #fee2e2; padding: 8px 10px; border-radius: 6px; margin-top: 10px; flex-direction: column; align-items: flex-start; gap: 4px; border: 1px solid #fecaca; width: 100%; box-sizing: border-box;">
                        <span class="po-card-label" style="color: #991b1b; font-size: 0.85rem; font-weight: bold; margin-bottom: 2px;"><i class="fa-solid fa-circle-exclamation"></i> Pembayaran Ditolak:</span>
                        <span class="po-card-value" style="color: #b91c1c; font-size: 0.88rem; line-height: 1.4; word-break: break-word; font-weight: 500;">${alasanPay}</span>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="po-card-header">
                    <span class="po-card-id">${row['ID Order'] || '-'}</span>
                    <span class="status-badge ${badgeClass}">${displayStatus}</span>
                </div>
                <div class="po-card-body">
                    <div class="po-card-row">
                        <span class="po-card-label">Tanggal PO:</span>
                        <span class="po-card-value">${dateStr}</span>
                    </div>
                    <div class="po-card-row">
                        <span class="po-card-label">Target Selesai:</span>
                        <span class="po-card-value" style="font-weight: 600; color: var(--primary-color);">${targetDateStr}</span>
                    </div>
                    <div class="po-card-row">
                        <span class="po-card-label">Produk:</span>
                        <span class="po-card-value">${row['Produk'] || '-'}</span>
                    </div>
                    <div class="po-card-row">
                        <span class="po-card-label">Ukuran:</span>
                        <span class="po-card-value">${row['Ukuran'] || '-'}</span>
                    </div>
                    <div class="po-card-row">
                        <span class="po-card-label">Total Biaya:</span>
                        <span class="po-card-value price">${formattedHarga}</span>
                    </div>
                    ${alasanRowHTML}
                    ${deadlineRowHTML}
                    ${cancelRowHTML}
                    ${payRejectRowHTML}
                </div>
                ${footerHTML}
            `;
            container.appendChild(card);
        }

        attachRowClickEvents(userPO, paymentsData);
    }

    function formatTimeAgo(date) {
        if (!date || isNaN(date.getTime())) return '-';
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} Menit yang lalu`;
        if (diffHours < 24) return `${diffHours} Jam yang lalu`;
        if (diffDays === 1) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function renderNotifications(userPO, paymentsData) {
        const listContainer = document.querySelector('.notification-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        let notifications = [];
        const email = localStorage.getItem('currentUserEmail') || 'guest';
        const lastReadTimeKey = `lastReadNotificationsTime_${email}`;
        const lastReadTime = parseInt(localStorage.getItem(lastReadTimeKey) || '0', 10);

        // 1. Proses Pre-orders (PO)
        userPO.forEach(po => {
            const status = (po['Status'] || '').toLowerCase();
            const date = po['Timestamp'] ? new Date(po['Timestamp']) : new Date();
            
            if (status === 'disetujui') {
                notifications.push({
                    title: 'Pesanan Disetujui!',
                    message: `Hore! Pesanan <strong>${po['ID Order']}</strong> (${po['Produk']}) telah disetujui admin. Silakan lakukan pembayaran.`,
                    icon: 'fa-check',
                    class: 'bg-success-light text-success',
                    time: date,
                    isUnread: date.getTime() > lastReadTime
                });
            } else if (status === 'ditolak') {
                notifications.push({
                    title: 'Pesanan Ditolak',
                    message: `Pesanan <strong>${po['ID Order']}</strong> (${po['Produk']}) ditolak admin. Alasan: ${po['Alasan Ditolak'] || '-'}`,
                    icon: 'fa-xmark',
                    class: 'bg-danger-light text-danger',
                    time: date,
                    isUnread: date.getTime() > lastReadTime
                });
            }
        });

        // 2. Proses Pembayaran
        paymentsData.forEach(pay => {
            const matchedPO = userPO.find(po => po['ID Order'] === pay['ID Order']);
            if (matchedPO) {
                const payStatus = (pay['Status Verifikasi'] || '').toLowerCase();
                const date = pay['Tanggal Verifikasi'] && pay['Tanggal Verifikasi'] !== '-' ? new Date(pay['Tanggal Verifikasi']) : (pay['Timestamp'] ? new Date(pay['Timestamp']) : new Date());
                
                if (payStatus === 'selesai' || payStatus === 'valid') {
                    notifications.push({
                        title: 'Pembayaran Berhasil',
                        message: `Terima kasih! Pembayaran untuk pesanan <strong>${pay['ID Order']}</strong> sebesar Rp ${parseInt(pay['Jumlah Bayar'] || 0).toLocaleString('id-ID')} telah diverifikasi. Seragam sedang diproses.`,
                        icon: 'fa-wallet',
                        class: 'bg-primary-light text-primary',
                        time: date,
                        isUnread: date.getTime() > lastReadTime
                    });
                } else if (payStatus === 'ditolak' || payStatus === 'tidak valid') {
                    notifications.push({
                        title: 'Pembayaran Ditolak',
                        message: `Bukti transfer untuk pesanan <strong>${pay['ID Order']}</strong> ditolak admin. Alasan: ${pay['Alasan Ditolak'] || 'Bukti transfer tidak valid'}. Silakan lakukan upload ulang bukti transfer yang valid.`,
                        icon: 'fa-triangle-exclamation',
                        class: 'bg-danger-light text-danger',
                        time: date,
                        isUnread: date.getTime() > lastReadTime
                    });
                }
            }
        });

        // 3. Sort berdasarkan waktu terbaru
        notifications.sort((a, b) => b.time - a.time);

        if (notifications.length === 0) {
            listContainer.innerHTML = `<div class="card-box text-center text-muted py-4">Belum ada notifikasi.</div>`;
            const badge = document.getElementById('notifBadgeCount');
            if (badge) badge.style.display = 'none';
            const topbarBadge = document.getElementById('topbarNotifBadgeCount');
            if (topbarBadge) topbarBadge.style.display = 'none';
            return;
        }

        notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `notif-item ${n.isUnread ? 'unread' : ''}`;
            item.innerHTML = `
                <div class="notif-icon ${n.class}"><i class="fa-solid ${n.icon}"></i></div>
                <div class="notif-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <span class="notif-time">${formatTimeAgo(n.time)}</span>
                </div>
            `;
            listContainer.appendChild(item);
        });

        // Update badge count
        const badge = document.getElementById('notifBadgeCount');
        const topbarBadge = document.getElementById('topbarNotifBadgeCount');
        const unreadCount = notifications.filter(n => n.isUnread).length;

        if (badge) {
            if (unreadCount > 0) {
                badge.innerText = unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }

        if (topbarBadge) {
            if (unreadCount > 0) {
                topbarBadge.innerText = '';
                topbarBadge.style.display = 'block';
            } else {
                topbarBadge.style.display = 'none';
            }
        }
    }

    let currentSelectedPO = null;

    function renderInvoice(poData, paymentsData) {
        currentSelectedPO = poData;
        const elTitle = document.getElementById('invOrderTitle');
        if (elTitle) elTitle.innerText = `Invoice ${poData['ID Order'] || '-'}`;
        
        const paymentRecord = paymentsData.find(p => p['ID Order'] === poData['ID Order']);
        let status = poData['Status'] || 'Pending';
        
        // Client-side deadline evaluation (fallback check)
        if (status.toLowerCase() === 'disetujui' && poData['Batas Pembayaran']) {
            const batasDate = new Date(poData['Batas Pembayaran']);
            if (!isNaN(batasDate.getTime())) {
                batasDate.setHours(23, 59, 59, 999);
                if (new Date() > batasDate) {
                    status = 'Dibatalkan';
                }
            }
        }

        if (paymentRecord && paymentRecord['Status Verifikasi'] === 'Menunggu Verifikasi') {
            status = 'Menunggu Verifikasi';
        } else if (paymentRecord && paymentRecord['Status Verifikasi'] === 'Selesai') {
            status = 'Selesai';
        }

        let displayStatus = status;
        if (status.toLowerCase() === 'pending') {
            displayStatus = 'Menunggu Verifikasi Pesanan';
        } else if (status.toLowerCase() === 'menunggu verifikasi') {
            displayStatus = 'Menunggu Verifikasi Pembayaran';
        }

        const badge = document.getElementById('invStatusBadge');
        if (badge) {
            badge.innerText = displayStatus;
            badge.className = 'status-badge';
            if (status.toLowerCase() === 'pending') badge.classList.add('badge-warning');
            else if (status.toLowerCase() === 'disetujui') badge.classList.add('badge-primary');
            else if (status.toLowerCase() === 'menunggu verifikasi') badge.classList.add('badge-info');
            else if (status.toLowerCase() === 'selesai') badge.classList.add('badge-success');
            else badge.classList.add('badge-danger');
        }

        // Render deadline row inside invoice
        const deadlineRow = document.getElementById('invDeadlineRow');
        const deadlineVal = document.getElementById('invDeadlineValue');
        if (status.toLowerCase() === 'disetujui' && poData['Batas Pembayaran']) {
            let deadlineStr = poData['Batas Pembayaran'];
            const d = new Date(deadlineStr);
            if (!isNaN(d.getTime())) {
                deadlineStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
            }
            if (deadlineRow && deadlineVal) {
                deadlineVal.innerText = deadlineStr;
                deadlineRow.style.display = 'block';
            }
        } else {
            if (deadlineRow) deadlineRow.style.display = 'none';
        }

        const elItemName = document.getElementById('invItemName');
        if (elItemName) elItemName.innerText = `${poData['Produk'] || 'Seragam'} (${poData['Ukuran'] || '-'})`;
        
        const isPending = status.toLowerCase() === 'pending';
        let nominal = parseFloat(poData['Harga Total']) || 0;
        if (nominal === 0) {
            nominal = (poData['Produk'] || '').toLowerCase().includes('pdl') ? 350000 : 250000;
        }
        
        let diskon = 0;
        let ongkir = 0;
        let total = nominal;

        if (isPending) {
            if (window._pengaturanData) {
                const statusOngkir = window._pengaturanData['Ongkir Status'] || 'Nonaktif';
                if (statusOngkir === 'Aktif') {
                    ongkir = parseFloat(window._pengaturanData['Ongkir Biaya']) || 0;
                }
            }
            total = nominal + ongkir;
        } else {
            diskon = parseFloat(poData['Diskon']) || 0;
            ongkir = parseFloat(poData['Ongkir']) || 0;
            total = parseFloat(poData['Harga Total']) || 0;
            if (diskon < 100) {
                nominal = Math.round((total - ongkir) / (1 - diskon / 100));
            } else {
                nominal = total - ongkir;
            }
        }
        
        const elPrice = document.getElementById('invItemPrice');
        if (elPrice) elPrice.innerText = 'Rp ' + nominal.toLocaleString('id-ID');
        
        const diskonRow = document.getElementById('invDiskonRow');
        const diskonHarga = document.getElementById('invDiskonHarga');
        if (diskon > 0) {
            const diskonVal = Math.round(nominal * (diskon / 100));
            if (diskonHarga) diskonHarga.innerText = '-Rp ' + diskonVal.toLocaleString('id-ID');
            if (diskonRow) diskonRow.style.display = 'flex';
        } else {
            if (diskonRow) diskonRow.style.display = 'none';
        }
        
        const elTotal = document.getElementById('invTotalPrice');
        if (elTotal) elTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');

        const imagePreviewDOM = document.getElementById('imagePreview');
        const uploadAreaDOM = document.getElementById('uploadArea');
        
        // Show/hide payment rejection reason in invoice
        const rejectAlert = document.getElementById('invPaymentRejectAlert');
        const rejectVal = document.getElementById('invPaymentRejectValue');
        const isPaymentRejected = paymentRecord && (paymentRecord['Status Verifikasi'] || '').toLowerCase() === 'ditolak';

        if (isPaymentRejected) {
            if (rejectAlert && rejectVal) {
                rejectVal.innerText = paymentRecord['Alasan Ditolak'] || 'Bukti transfer tidak valid atau nominal tidak sesuai.';
                rejectAlert.style.display = 'block';
            }
        } else {
            if (rejectAlert) rejectAlert.style.display = 'none';
        }

        if (paymentRecord && paymentRecord['Bukti Transfer'] && !isPaymentRejected) {
            if (imagePreviewDOM) {
                imagePreviewDOM.src = paymentRecord['Bukti Transfer'];
                imagePreviewDOM.style.display = 'inline-block';
            }
            if (uploadAreaDOM) {
                const icon = uploadAreaDOM.querySelector('i');
                if (icon) icon.style.display = 'none';
                const p = uploadAreaDOM.querySelector('p');
                if (p) p.innerText = 'Bukti Transfer Terkirim';
            }
        } else {
            if (imagePreviewDOM) {
                imagePreviewDOM.src = '';
                imagePreviewDOM.style.display = 'none';
            }
            if (uploadAreaDOM) {
                const icon = uploadAreaDOM.querySelector('i');
                if (icon) icon.style.display = 'inline-block';
                const p = uploadAreaDOM.querySelector('p');
                if (p) p.innerHTML = 'Drag & Drop bukti transfer Anda di sini atau <strong>Klik untuk browse</strong>';
            }
        }

        const btnSubmit = document.getElementById('btnSubmitPayment');
        const waContainer = document.getElementById('waQuickVerifyContainer');
        if (btnSubmit && uploadAreaDOM) {
            if (status.toLowerCase() === 'selesai' || status.toLowerCase() === 'menunggu verifikasi' || status.toLowerCase() === 'dibatalkan' || status.toLowerCase() === 'ditolak') {
                btnSubmit.disabled = true;
                if (status.toLowerCase() === 'selesai') {
                    btnSubmit.innerText = 'Pembayaran Lunas & Selesai';
                } else if (status.toLowerCase() === 'menunggu verifikasi') {
                    btnSubmit.innerText = 'Menunggu Verifikasi Pembayaran';
                } else if (status.toLowerCase() === 'dibatalkan') {
                    btnSubmit.innerText = 'Pesanan Dibatalkan';
                } else {
                    btnSubmit.innerText = 'Pesanan Ditolak';
                }
                uploadAreaDOM.style.pointerEvents = 'none';
                uploadAreaDOM.style.opacity = '0.6';
            } else {
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Kirim Bukti Pembayaran';
                uploadAreaDOM.style.pointerEvents = 'auto';
                uploadAreaDOM.style.opacity = '1';
            }
        }

        if (waContainer) {
            if (status.toLowerCase() === 'menunggu verifikasi') {
                let waAdmin = '';
                if (window._pengaturanData && window._pengaturanData['Whatsapp Admin']) {
                    waAdmin = String(window._pengaturanData['Whatsapp Admin']).replace(/[^0-9]/g, '');
                }
                if (!waAdmin) waAdmin = '628123456789';
                const waText = encodeURIComponent(`Halo Admin, saya ingin konfirmasi verifikasi pembayaran untuk PO dengan ID Order: ${poData['ID Order'] || '-'}. Mohon segera diverifikasi. Terima kasih!`);
                const waLink = `https://wa.me/${waAdmin}?text=${waText}`;
                waContainer.innerHTML = `
                    <a href="${waLink}" target="_blank" class="btn" style="background-color: #25d366; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; width: 100%; padding: 12px; border-radius: 8px; text-decoration: none; border: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.2); box-sizing: border-box;">
                        <i class="fa-brands fa-whatsapp" style="font-size: 1.3rem;"></i> Hubungi Admin (Verifikasi Cepat)
                    </a>
                `;
                waContainer.style.display = 'block';
            } else {
                waContainer.style.display = 'none';
                waContainer.innerHTML = '';
            }
        }

        // Re-apply info bank & ongkir setiap kali invoice dirender
        if (window._pengaturanData) {
            applyPengaturan(window._pengaturanData, isPending, ongkir);
        }
    }

    function attachRowClickEvents(userPO, paymentsData) {
        const clickableCards = document.querySelectorAll('.clickable-card');
        const sections = document.querySelectorAll('.content-section');
        const navItems = document.querySelectorAll('.nav-item');

        clickableCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const targetId = card.getAttribute('data-target');
                const idx = card.getAttribute('data-index');
                if (idx !== null && userPO[idx]) {
                    renderInvoice(userPO[idx], paymentsData);
                }

                sections.forEach(sec => sec.classList.remove('active'));
                const elTarget = document.getElementById(targetId);
                if (elTarget) elTarget.classList.add('active');
                navItems.forEach(nav => nav.classList.remove('active'));
            });
        });

    }

    const btnSubmitPaymentDOM = document.getElementById('btnSubmitPayment');
    if (btnSubmitPaymentDOM) {
        btnSubmitPaymentDOM.addEventListener('click', () => {
            if (!currentSelectedPO) {
                alert('Pilih pesanan dari Riwayat Pesanan terlebih dahulu.');
                return;
            }
            const imgPreview = document.getElementById('imagePreview');
            if (!imgPreview.src || imgPreview.src === window.location.href || imgPreview.style.display === 'none') {
                alert('Mohon masukkan foto bukti transfer terlebih dahulu.');
                return;
            }

            btnSubmitPaymentDOM.disabled = true;
            btnSubmitPaymentDOM.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim Bukti...';

            let harga = currentSelectedPO['Harga Total'] || currentSelectedPO[''] || 250000;
            if (isNaN(harga) || harga === 0) harga = (currentSelectedPO['Produk'] || '').toLowerCase().includes('pdl') ? 350000 : 250000;

            const payload = new URLSearchParams();
            payload.append('action', 'upload_payment');
            payload.append('id_order', currentSelectedPO['ID Order']);
            payload.append('nama_lengkap', currentSelectedPO['Nama Lengkap'] || 'User');
            payload.append('nama_produk', currentSelectedPO['Produk'] || '-');
            payload.append('jumlah_bayar', harga);
            payload.append('image_base64', imgPreview.src.split(',')[1] || imgPreview.src);
            payload.append('image_name', `payment_${currentSelectedPO['ID Order']}.jpg`);
            payload.append('image_mimetype', 'image/jpeg');

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload,
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    alert('Bukti transfer berhasil diunggah! Mohon tunggu verifikasi Admin.');
                    fetchDashboardData(data); 
                    const historyTab = document.querySelector('[data-target="history-section"]');
                    if (historyTab) historyTab.click();
                } else {
                    alert('Gagal mengunggah bukti: ' + data.message);
                    btnSubmitPaymentDOM.disabled = false;
                    btnSubmitPaymentDOM.innerText = 'Kirim Bukti Pembayaran';
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
                btnSubmitPaymentDOM.disabled = false;
                btnSubmitPaymentDOM.innerText = 'Kirim Bukti Pembayaran';
            });
        });
    }


    // ==========================================
    // SHOPPING CART & CATALOG SYSTEM
    // ==========================================
    function getCartStorageKey() {
        const email = localStorage.getItem('currentUserEmail') || 'guest';
        return `dashboardCart_${email}`;
    }

    let cart = [];
    try {
        const savedCart = localStorage.getItem(getCartStorageKey());
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Failed to parse dashboardCart from localStorage:', e);
    }

    function saveCart() {
        localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
        updateCartBadge();
    }

    function updateCartBadge() {
        const badge = document.getElementById('cartBadgeCount');
        if (!badge) return;
        if (cart.length > 0) {
            badge.innerText = cart.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // Initialize badge count immediately
    updateCartBadge();

    function renderDashboardCatalog(products) {
        const grid = document.getElementById('dashboardProductGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1 / -1;">Katalog produk kosong.</p>';
            return;
        }

        const categories = [...new Set(products.map(p => p['Kategori'] || 'PDH'))];

        const filterContainer = document.getElementById('dashboardFilterContainer');
        if (filterContainer) {
            filterContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Semua</button>';
            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.setAttribute('data-filter', cat.toLowerCase());
                btn.innerText = cat;
                filterContainer.appendChild(btn);
            });

            const filterBtns = filterContainer.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', () => {
                    document.querySelectorAll('#dashboardFilterContainer .filter-btn').forEach(b => b.classList.remove('active'));
                    newBtn.classList.add('active');

                    const filterValue = newBtn.getAttribute('data-filter');
                    const cards = grid.querySelectorAll('.product-card');
                    cards.forEach(card => {
                        if (filterValue === 'all') {
                            card.style.display = 'flex';
                        } else {
                            if (card.getAttribute('data-category').toLowerCase() === filterValue) {
                                card.style.display = 'flex';
                            } else {
                                card.style.display = 'none';
                            }
                        }
                    });
                });
            });
        }

        const eventActive = localStorage.getItem('eventActive') === 'true';
        const eventDiskon = parseFloat(localStorage.getItem('eventDiskon') || '0');

        products.forEach(p => {
            const cat = (p['Kategori'] || 'PDH').toLowerCase();
            const rawHarga = p['Harga Asli'];
            let hargaAsliStr = "Rp 0";
            let hargaInt = 0;
            
            if (typeof rawHarga === 'number') {
                hargaInt = rawHarga;
                hargaAsliStr = "Rp " + hargaInt.toLocaleString('id-ID');
            } else if (typeof rawHarga === 'string') {
                hargaAsliStr = rawHarga;
                hargaInt = parseInt(rawHarga.replace(/[^0-9]/g, ''), 10) || 0;
            } else {
                hargaInt = parseFloat(rawHarga || '0');
                hargaAsliStr = "Rp " + hargaInt.toLocaleString('id-ID');
            }
            
            let finalHargaInt = hargaInt;
            let priceHtml = `<p class="price font-weight-bold text-primary-color" style="font-size: 1.1rem; margin: 0;">${hargaAsliStr}</p>`;
            let badgeHtml = '';

            if (p['Badge']) {
                badgeHtml = `<span class="badge badge-hot">${p['Badge']}</span>`;
            }

            if (eventActive && eventDiskon > 0) {
                finalHargaInt = finalHargaInt - (finalHargaInt * eventDiskon / 100);
                priceHtml = `<p class="price" style="margin: 0;"><del style="font-size: 0.9rem; color: var(--text-muted);">${hargaAsliStr}</del> <span class="text-danger-color font-weight-bold" style="font-size: 1.1rem; margin-left: 5px;">Rp ${finalHargaInt.toLocaleString('id-ID')}</span></p>`;
                if (!badgeHtml) {
                    badgeHtml = `<span class="badge badge-discount">Diskon ${eventDiskon}%</span>`;
                }
            }

            let imageUrl = p['URL Gambar'] || 'https://via.placeholder.com/800x800?text=No+Image';
            if (imageUrl.includes('drive.google.com/uc?')) {
                const match = imageUrl.match(/id=([^&]+)/);
                if (match && match[1]) {
                    imageUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
                }
            }

            const cardHtml = `
                <div class="product-card" data-category="${cat}" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: var(--transition); height: 100%;">
                    <div class="product-img-wrap" style="position: relative; overflow: hidden; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
                        ${badgeHtml}
                        <img src="${imageUrl}" alt="${p['Nama Produk']}" class="product-img" style="width: 100%; height: 100%; object-fit: cover; transition: var(--transition);">
                    </div>
                    <div class="product-info" style="padding: 15px; display: flex; flex-direction: column; gap: 8px; flex-grow: 1; justify-content: space-between;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <h3 style="font-size: 1.05rem; font-weight: 600; color: var(--navy-color); margin: 0;">${p['Nama Produk'] || 'Produk'}</h3>
                            ${priceHtml}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                            <button class="btn btn-primary btn-block btn-add-to-cart" data-id="${p['ID Produk']}" data-nama="${p['Nama Produk']}" data-kategori="${p['Kategori']}" data-harga="${finalHargaInt}" data-image="${imageUrl}" data-ukuran="${p['Ukuran'] || ''}" style="margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.9rem; width: 100%;">
                                <i class="fa-solid fa-cart-plus"></i> Tambah ke Keranjang
                            </button>
                            ${p['URL Video'] ? `
                            <button class="btn btn-outline-primary btn-block btn-video-preview" onclick="playProductVideo('${p['URL Video']}')" style="margin-top: 5px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.9rem; width: 100%; border: 1px solid var(--primary-color); background: transparent; color: var(--primary-color); padding: 8px; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                <i class="fa-solid fa-circle-play"></i> Lihat Video
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += cardHtml;
        });

        grid.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-nama');
                const category = btn.getAttribute('data-kategori');
                const price = btn.getAttribute('data-harga');
                const imageUrl = btn.getAttribute('data-image');
                const ukuranList = btn.getAttribute('data-ukuran') || '';

                // Set values in the Add to Cart Modal
                const modal = document.getElementById('addToCartModal');
                const nameEl = document.getElementById('popupProductName');
                const priceEl = document.getElementById('popupProductPrice');
                const imgEl = document.getElementById('popupProductImg');
                const sizeSelect = document.getElementById('popupProductSize');
                const qtyInput = document.getElementById('popupProductQty');

                if (nameEl) nameEl.innerText = name;
                if (priceEl) priceEl.innerText = 'Rp ' + parseInt(price).toLocaleString('id-ID');
                if (imgEl) imgEl.src = imageUrl || 'https://via.placeholder.com/80';
                if (qtyInput) qtyInput.value = 1;

                if (sizeSelect) {
                    sizeSelect.innerHTML = '';
                    const sizesArray = ukuranList ? ukuranList.split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];
                    sizesArray.forEach(sz => {
                        const opt = document.createElement('option');
                        opt.value = sz;
                        opt.innerText = sz;
                        sizeSelect.appendChild(opt);
                    });
                }

                // Save temporary product context on the modal element
                modal.setAttribute('data-id', id);
                modal.setAttribute('data-kategori', category);
                modal.setAttribute('data-harga', price);
                modal.setAttribute('data-image', imageUrl);
                modal.setAttribute('data-ukuran', ukuranList);

                // Show modal
                modal.classList.add('show');
            });
        });
    }

    // Helper to update price dynamically in popup based on qty
    window.updatePopupPrice = function() {
        const modal = document.getElementById('addToCartModal');
        const qtyInput = document.getElementById('popupProductQty');
        const priceEl = document.getElementById('popupProductPrice');
        if (modal && qtyInput && priceEl) {
            const price = parseFloat(modal.getAttribute('data-harga')) || 0;
            const qty = parseInt(qtyInput.value) || 1;
            priceEl.innerText = 'Rp ' + (price * qty).toLocaleString('id-ID');
        }
    };

    // Setup Add to Cart Modal event listeners
    const addToCartModal = document.getElementById('addToCartModal');
    const closeAddToCartModal = document.getElementById('closeAddToCartModal');
    const btnQtyMinus = document.getElementById('btnQtyMinus');
    const btnQtyPlus = document.getElementById('btnQtyPlus');
    const popupProductQty = document.getElementById('popupProductQty');
    const btnConfirmAddToCart = document.getElementById('btnConfirmAddToCart');

    if (closeAddToCartModal && addToCartModal) {
        closeAddToCartModal.addEventListener('click', () => {
            addToCartModal.classList.remove('show');
        });
    }

    if (btnQtyMinus && popupProductQty) {
        btnQtyMinus.addEventListener('click', () => {
            let val = parseInt(popupProductQty.value) || 1;
            if (val > 1) {
                popupProductQty.value = val - 1;
                window.updatePopupPrice();
            }
        });
    }

    if (btnQtyPlus && popupProductQty) {
        btnQtyPlus.addEventListener('click', () => {
            let val = parseInt(popupProductQty.value) || 1;
            popupProductQty.value = val + 1;
            window.updatePopupPrice();
        });
    }

    if (popupProductQty) {
        popupProductQty.addEventListener('input', () => {
            window.updatePopupPrice();
        });
        popupProductQty.addEventListener('change', () => {
            window.updatePopupPrice();
        });
    }

    if (btnConfirmAddToCart && addToCartModal) {
        btnConfirmAddToCart.addEventListener('click', () => {
            const id = addToCartModal.getAttribute('data-id');
            const category = addToCartModal.getAttribute('data-kategori');
            const price = addToCartModal.getAttribute('data-harga');
            const imageUrl = addToCartModal.getAttribute('data-image');
            const ukuranList = addToCartModal.getAttribute('data-ukuran');
            
            const sizeSelect = document.getElementById('popupProductSize');
            const size = sizeSelect ? sizeSelect.value : 'M';
            const quantity = parseInt(popupProductQty.value) || 1;
            
            const nameEl = document.getElementById('popupProductName');
            const name = nameEl ? nameEl.innerText : 'Produk';

            // Check if item with same ID and Size already exists in cart
            const existingItemIdx = cart.findIndex(item => item.id === id && item.size === size);
            if (existingItemIdx > -1) {
                cart[existingItemIdx].quantity = (parseInt(cart[existingItemIdx].quantity) || 1) + quantity;
            } else {
                cart.push({ id, name, category, price, imageUrl, size, quantity, ukuran: ukuranList, checked: true });
            }

            saveCart();
            addToCartModal.classList.remove('show');
            
            alert(`${name} (${quantity} pcs, Ukuran ${size}) berhasil ditambahkan ke keranjang.`);
        });
    }

    const cartWidgetBtn = document.getElementById('cartWidgetBtn');
    const cartModal = document.getElementById('cartModal');
    const closeCartModal = document.getElementById('closeCartModal');
    const btnClearCart = document.getElementById('btnClearCart');
    const btnCheckoutCart = document.getElementById('btnCheckoutCart');

    if (cartWidgetBtn && cartModal) {
        cartWidgetBtn.addEventListener('click', () => {
            renderCart();
            
            // Set min date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yyyy = tomorrow.getFullYear();
            const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const dd = String(tomorrow.getDate()).padStart(2, '0');
            const tomorrowStr = `${yyyy}-${mm}-${dd}`;
            const poDateInput = document.getElementById('cartPoDate');
            if (poDateInput) {
                poDateInput.min = tomorrowStr;
            }

            cartModal.classList.add('show');
        });
    }

    const notifWidgetBtn = document.getElementById('notifWidgetBtn');
    if (notifWidgetBtn) {
        notifWidgetBtn.addEventListener('click', () => {
            const email = localStorage.getItem('currentUserEmail') || 'guest';
            const lastReadTimeKey = `lastReadNotificationsTime_${email}`;
            localStorage.setItem(lastReadTimeKey, Date.now().toString());

            const badge = document.getElementById('notifBadgeCount');
            if (badge) badge.style.display = 'none';
            const topbarBadge = document.getElementById('topbarNotifBadgeCount');
            if (topbarBadge) topbarBadge.style.display = 'none';

            document.querySelectorAll('.notif-item').forEach(item => {
                item.classList.remove('unread');
            });

            const navItems = document.querySelectorAll('.nav-menu .nav-item');
            const sections = document.querySelectorAll('.content-section');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));
            
            const notifSection = document.getElementById('notification-section');
            if (notifSection) notifSection.classList.add('active');
        });
    }

    if (closeCartModal && cartModal) {
        closeCartModal.addEventListener('click', () => {
            cartModal.classList.remove('show');
        });
    }

    if (btnClearCart) {
        btnClearCart.addEventListener('click', () => {
            if (cart.length === 0) return;
            cart = [];
            saveCart();
            renderCart();
        });
    }

    function renderCart() {
        const container = document.getElementById('cartItemsContainer');
        const emptyState = document.getElementById('cartEmptyState');
        const footer = document.getElementById('cartFooter');
        const totalPriceEl = document.getElementById('cartTotalPrice');

        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (footer) footer.style.display = 'none';
            if (totalPriceEl) totalPriceEl.innerText = 'Rp 0';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (footer) footer.style.display = 'block';

        container.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const isChecked = item.checked !== false;
            if (isChecked) {
                total += parseFloat(item.price) * parseInt(item.quantity || 1);
            }

            const sizesArray = item.ukuran ? item.ukuran.split(',').map(s => s.trim()) : ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];
            const sizeOptionsHtml = sizesArray.map(sz => `<option value="${sz}" ${item.size === sz ? 'selected' : ''}>${sz}</option>`).join('');

            const itemHtml = `
                <div class="cart-item" data-index="${index}" style="display: flex; align-items: center; gap: 15px; padding: 12px; border-bottom: 1px solid #f0f0f0;">
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" class="cart-item-checkbox" data-index="${index}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-color);">
                    </div>
                    <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;">
                    <div class="cart-item-info" style="flex: 1; min-width: 0;">
                        <h4 class="cart-item-title" style="margin: 0 0 5px 0; font-size: 0.95rem; color: var(--navy-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</h4>
                        <span class="cart-item-price" style="font-weight: 600; color: var(--primary-color, #1A237E); font-size: 0.9rem; display: block; margin-bottom: 5px;">
                            Rp ${parseInt(item.price * (item.quantity || 1)).toLocaleString('id-ID')}
                            <small style="color: #777; font-weight: normal;">(${item.quantity || 1} x Rp ${parseInt(item.price).toLocaleString('id-ID')})</small>
                        </span>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                            <div class="cart-item-size-select" style="display: flex; align-items: center; gap: 5px;">
                                <span style="font-size: 0.75rem; color: #777;">Ukuran:</span>
                                <select class="form-control cart-item-size" style="padding: 2px 5px; font-size: 0.8rem; height: auto; width: auto; min-width: 50px;" data-index="${index}">
                                    ${sizeOptionsHtml}
                                </select>
                            </div>
                            <div class="cart-item-qty-control" style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 0.75rem; color: #777;">Jumlah:</span>
                                <button type="button" class="btn-qty-minus-cart" data-index="${index}" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; border: 1px solid #ccc; background: #fff; border-radius: 4px; cursor: pointer; font-weight: bold; line-height: 1;">-</button>
                                <span style="font-weight: bold; font-size: 0.85rem; min-width: 15px; text-align: center;">${item.quantity || 1}</span>
                                <button type="button" class="btn-qty-plus-cart" data-index="${index}" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; border: 1px solid #ccc; background: #fff; border-radius: 4px; cursor: pointer; font-weight: bold; line-height: 1;">+</button>
                            </div>
                        </div>
                    </div>
                    <button class="btn-remove-cart" data-index="${index}" style="background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 5px; transition: color 0.2s;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            container.innerHTML += itemHtml;
        });

        if (totalPriceEl) totalPriceEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;

        // Bind checkbox listeners
        container.querySelectorAll('.cart-item-checkbox').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cart[idx].checked = e.target.checked;
                saveCart();
                renderCart();
            });
        });

        // Bind size selection listeners
        container.querySelectorAll('.cart-item-size').forEach(select => {
            select.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cart[idx].size = e.target.value;
                saveCart();
            });
        });

        // Bind qty minus listeners
        container.querySelectorAll('.btn-qty-minus-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'));
                let qty = parseInt(cart[idx].quantity) || 1;
                if (qty > 1) {
                    cart[idx].quantity = qty - 1;
                    saveCart();
                    renderCart();
                }
            });
        });

        // Bind qty plus listeners
        container.querySelectorAll('.btn-qty-plus-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'));
                let qty = parseInt(cart[idx].quantity) || 1;
                cart[idx].quantity = qty + 1;
                saveCart();
                renderCart();
            });
        });

        // Bind remove listeners
        container.querySelectorAll('.btn-remove-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'));
                cart.splice(idx, 1);
                saveCart();
                renderCart();
            });
        });
    }

    if (btnCheckoutCart) {
        btnCheckoutCart.addEventListener('click', () => {
            const checkedItems = cart.filter(item => item.checked !== false);
            if (checkedItems.length === 0) {
                alert('Pilih minimal satu produk untuk di pre-order.');
                return;
            }

            const name = localStorage.getItem('currentUserName') || 'User';
            
            const origText = btnCheckoutCart.innerHTML;
            
            const poDateInput = document.getElementById('cartPoDate');
            if (poDateInput) {
                if (!poDateInput.value) {
                    alert('Silakan tentukan Tanggal PO (Target Selesai) terlebih dahulu.');
                    return;
                }
                const selectedDate = new Date(poDateInput.value);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0,0,0,0);
                selectedDate.setHours(0,0,0,0);
                
                if (selectedDate < tomorrow) {
                    alert('Tanggal PO tidak boleh sebelum hari esok. Silakan pilih tanggal yang valid.');
                    return;
                }
            }
            const tanggalPO = poDateInput ? poDateInput.value : '-';

            btnCheckoutCart.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
            btnCheckoutCart.disabled = true;

            const promises = checkedItems.map(item => {
                const payload = new URLSearchParams();
                payload.append('action', 'preorder');
                payload.append('nama_lengkap', name);
                payload.append('kategori', item.category);
                payload.append('produk', `${item.name} (${item.quantity || 1} Pcs)`);
                payload.append('ukuran', item.size);
                payload.append('harga_total', parseFloat(item.price) * parseInt(item.quantity || 1));
                payload.append('tanggal_po', tanggalPO);

                return fetch(CONFIG.GAS_URL, {
                    method: 'POST',
                    body: payload,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).then(res => res.json());
            });

            Promise.all(promises)
            .then(results => {
                btnCheckoutCart.innerHTML = origText;
                btnCheckoutCart.disabled = false;
                
                const errors = results.filter(r => r.result !== 'success');
                if (errors.length > 0) {
                    alert('Beberapa pesanan gagal disimpan. Harap coba lagi.');
                } else {
                    // Keep only unchecked items
                    cart = cart.filter(item => item.checked === false);
                    saveCart();
                    if (cartModal) cartModal.classList.remove('show');
                    
                    const latestData = results[results.length - 1];
                    alert('Pre-Order Berhasil Dikirim!\nAdmin akan segera memverifikasi pesanan Anda dalam 1x24 jam.', () => {
                        fetchDashboardData(latestData);
                        const historyTab = document.querySelector('[data-target="history-section"]');
                        if (historyTab) historyTab.click();
                    });
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
                btnCheckoutCart.innerHTML = origText;
                btnCheckoutCart.disabled = false;
            });
        });
    }

    // ========================================
    // LOGIKA TESTIMONI KLIEN
    // ========================================
    const ratingStars = document.querySelectorAll('#ratingStars i');
    const selectedRatingInput = document.getElementById('selectedRating');
    const testimonialText = document.getElementById('testimonialText');
    const charCount = document.getElementById('charCount');
    const testimonialForm = document.getElementById('testimonialForm');
    const btnSubmitTestimonial = document.getElementById('btnSubmitTestimonial');

    if (ratingStars && ratingStars.length > 0) {
        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.getAttribute('data-value'));
                if (selectedRatingInput) selectedRatingInput.value = value;
                
                ratingStars.forEach(s => {
                    const sVal = parseInt(s.getAttribute('data-value'));
                    if (sVal <= value) {
                        s.classList.add('active');
                        s.classList.replace('fa-regular', 'fa-solid');
                    } else {
                        s.classList.remove('active');
                        s.classList.replace('fa-solid', 'fa-regular');
                    }
                });
            });
        });
    }

    if (testimonialText && charCount) {
        testimonialText.addEventListener('input', () => {
            charCount.textContent = testimonialText.value.length;
        });
    }

    if (testimonialForm) {
        testimonialForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (typeof CONFIG === 'undefined' || !CONFIG.GAS_URL) {
                alert('Konfigurasi GAS URL tidak ditemukan.');
                return;
            }

            const name = localStorage.getItem('currentUserName') || 'User';
            const rating = selectedRatingInput ? selectedRatingInput.value : '5';
            const ulasan = testimonialText ? testimonialText.value : '';

            const origText = btnSubmitTestimonial.innerHTML;
            btnSubmitTestimonial.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';
            btnSubmitTestimonial.disabled = true;

            const payload = new URLSearchParams();
            payload.append('action', 'add_testimoni');
            payload.append('nama_lengkap', name);
            payload.append('bintang', rating);
            payload.append('ulasan', ulasan);

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .then(res => res.json())
            .then(data => {
                btnSubmitTestimonial.innerHTML = origText;
                btnSubmitTestimonial.disabled = false;

                if (data.result === 'success') {
                    alert('Testimoni berhasil dikirim! Terima kasih atas ulasan Anda.');
                    testimonialForm.reset();
                    if (charCount) charCount.textContent = '0';
                    // Reset rating bintang ke 5 penuh
                    ratingStars.forEach(s => {
                        s.classList.add('active');
                        s.classList.replace('fa-regular', 'fa-solid');
                    });
                    if (selectedRatingInput) selectedRatingInput.value = '5';
                } else {
                    alert('Gagal mengirim testimoni: ' + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Terjadi kesalahan jaringan.');
                btnSubmitTestimonial.innerHTML = origText;
                btnSubmitTestimonial.disabled = false;
            });
        });
    }

    fetchDashboardData();

});

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const textToCopy = el.innerText;
    
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    
    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);
    document.execCommand("copy");
    
    document.body.removeChild(tempTextArea);

    const copyBtn = document.querySelector('.btn-copy');
    if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
        copyBtn.style.color = '#10B981';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.color = '';
        }, 2000);
    }
}

window.playProductVideo = function(videoUrl) {
    const modal = document.getElementById('videoPreviewModal');
    const playerTarget = document.getElementById('videoPlayerTarget');
    const loadingIndicator = document.getElementById('videoPlayerLoading');
    if (!modal || !playerTarget) return;
    
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    playerTarget.innerHTML = '';
    
    let isGoogleDrive = videoUrl.includes('drive.google.com');
    let fileId = '';
    
    if (isGoogleDrive) {
        const match = videoUrl.match(/id=([^&]+)/) || videoUrl.match(/\/file\/d\/([^\/]+)/);
        if (match && match[1]) {
            fileId = match[1];
        }
    }
    
    const playIframe = (embedUrl) => {
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        playerTarget.innerHTML = `<iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; background: #000;" allow="autoplay" allowfullscreen></iframe>`;
        const iframe = playerTarget.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('load', () => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            });
        }
    };
    
    if (isGoogleDrive && fileId) {
        // Coba gunakan tag <video> dengan direct link terlebih dahulu untuk performa lancar di mobile (bebas lag)
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        playerTarget.innerHTML = `<video src="${directUrl}" controls autoplay style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; background: #000; object-fit: contain;"></video>`;
        
        const video = playerTarget.querySelector('video');
        let fallbackTriggered = false;
        
        const triggerFallback = () => {
            if (fallbackTriggered) return;
            fallbackTriggered = true;
            console.log('Direct video link failed or blocked by CORS. Falling back to iframe...');
            const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            playIframe(embedUrl);
        };
        
        if (video) {
            // Jika berhasil memuat data video, matikan loading dan tetap gunakan tag video
            video.addEventListener('loadeddata', () => {
                if (!fallbackTriggered) {
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                }
            });
            
            // Jika error (misal CORS/CORP blocked atau butuh konfirmasi virus scan), beralih ke iframe
            video.addEventListener('error', () => {
                triggerFallback();
            });
            
            // Timeout keamanan: jika dalam 3 detik video belum memuat data, fallback ke iframe
            setTimeout(() => {
                if (!fallbackTriggered && video.readyState < 2) {
                    triggerFallback();
                }
            }, 3000);
        }
    } else {
        // Non-Google Drive (direct MP4)
        playerTarget.innerHTML = `<video src="${videoUrl}" controls autoplay style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; background: #000; object-fit: contain;"></video>`;
        const video = playerTarget.querySelector('video');
        if (video) {
            video.addEventListener('loadeddata', () => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            });
            video.addEventListener('error', () => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            });
        }
    }
    
    modal.classList.add('show');
};

window.closeVideoPreviewModal = function() {
    const modal = document.getElementById('videoPreviewModal');
    const playerTarget = document.getElementById('videoPlayerTarget');
    if (playerTarget) playerTarget.innerHTML = '';
    if (modal) modal.classList.remove('show');
};
