// Global Toast & Alert Override
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'error' || type === 'danger') icon = 'fa-circle-xmark';
    if (type === 'info') icon = 'fa-circle-info';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.alert = function(message) {
    let type = 'info';
    const msg = String(message).toLowerCase();
    if (msg.includes('berhasil') || msg.includes('disimpan') || msg.includes('sukses')) {
        type = 'success';
    } else if (msg.includes('gagal') || msg.includes('kesalahan') || msg.includes('tidak ditemukan') || msg.includes('silakan') || msg.includes('pilih') || msg.includes('terjadi')) {
        type = 'error';
    }
    showToast(message, type);
};

document.addEventListener('DOMContentLoaded', () => {
    const pendingToast = localStorage.getItem('pendingToast');
    if (pendingToast) {
        try {
            const toastData = JSON.parse(pendingToast);
            window.showToast(toastData.message, toastData.type === 'danger' ? 'error' : toastData.type);
        } catch(e) {}
        localStorage.removeItem('pendingToast');
    }
});

window.showConfirm = function(message, onConfirmCallback) {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmModalMessage');
    const btnConfirm = document.getElementById('btnConfirmAction');
    
    if (modal && msgEl && btnConfirm) {
        msgEl.innerText = message;
        const newBtn = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
        
        newBtn.addEventListener('click', () => {
            closeConfirmModal();
            if (onConfirmCallback) onConfirmCallback();
        });
        
        modal.classList.add('show');
    }
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('show');
};

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for Verification Modal dynamic pricing
    const nominalInput = document.getElementById('modalNominalInput');
    const diskonInput = document.getElementById('modalDiskonInput');
    if (nominalInput) {
        nominalInput.addEventListener('input', () => {
            if (window.updateModalTotalAkhir) window.updateModalTotalAkhir();
        });
    }
    if (diskonInput) {
        diskonInput.addEventListener('input', () => {
            if (window.updateModalTotalAkhir) window.updateModalTotalAkhir();
        });
    }
    const ongkirInput = document.getElementById('modalOngkirInput');
    if (ongkirInput) {
        ongkirInput.addEventListener('input', () => {
            if (window.updateModalTotalAkhir) window.updateModalTotalAkhir();
        });
    }

    // 1. Mobile Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    if(openSidebarBtn && closeSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Current Date Display
    const dateDisplay = document.getElementById('currentDate');
    if(dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.innerText = new Date().toLocaleDateString('id-ID', options);
    }

    // Logika Keluar / Logout
    const logoutBtn = document.querySelector('.logout-btn');
    const logoutModal = document.getElementById('logoutChoiceModal');
    
    if(logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('show');
        });
        
        const btnFullLogout = document.getElementById('btnFullLogout');
        const btnGoToLanding = document.getElementById('btnGoToLanding');
        
        if (btnFullLogout) {
            btnFullLogout.addEventListener('click', () => {
                localStorage.removeItem('userRole');
                localStorage.removeItem('currentUserEmail');
                localStorage.removeItem('currentUserName');
                
                let redirectUrl = 'index.html';
                if (window.location.protocol === 'file:') {
                    redirectUrl += '?logout_sync=true';
                }
                window.location.href = redirectUrl;
            });
        }
        
        if (btnGoToLanding) {
            btnGoToLanding.addEventListener('click', () => {
                const role = localStorage.getItem('userRole') || 'admin';
                const email = localStorage.getItem('currentUserEmail') || '';
                const name = localStorage.getItem('currentUserName') || '';
                
                let redirectUrl = 'index.html';
                if (window.location.protocol === 'file:') {
                    redirectUrl += `?role_sync=${role}&email_sync=${encodeURIComponent(email)}&name_sync=${encodeURIComponent(name)}`;
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

    // 2. SPA Navigation Logic
    const navItems = document.querySelectorAll('.admin-nav .nav-item[data-target]');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if(targetId === 'payment-section') {
                const badge = document.getElementById('notifPaymentBadge');
                if(badge) badge.style.display = 'none';
            }

            if(window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // 3. Image Zoom Logic (Split View)
    const zoomContainer = document.getElementById('zoomContainer');
    const zoomImage = document.getElementById('zoomImage');

    if(zoomContainer && zoomImage) {
        zoomContainer.addEventListener('mousemove', (e) => {
            const rect = zoomContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            zoomImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            zoomImage.style.transform = 'scale(2)';
        });

        zoomContainer.addEventListener('mouseleave', () => {
            zoomImage.style.transformOrigin = 'center center';
            zoomImage.style.transform = 'scale(1)';
        });
    }

    // 4. Fetch Data from Google Apps Script dengan Cache Buster & Redirect Follow
    window.globalPOData = [];
    window.globalProductsData = [];

    window.fetchAllData = function(isSilent = false, preFetchedData = null) {
        if (typeof CONFIG === 'undefined' || !CONFIG.GAS_URL) return;

        if (preFetchedData && preFetchedData.result === 'success' && preFetchedData.data_po) {
            localStorage.setItem('adminCachedData', JSON.stringify(preFetchedData));
            handleIncomingData(preFetchedData, isSilent);
            return;
        }

        if (!isSilent) {
            const cached = localStorage.getItem('adminCachedData');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    handleIncomingData(parsed, false);
                } catch(e) {}
            }
        }

        const url = `${CONFIG.GAS_URL}?t=${new Date().getTime()}`;

        fetch(url, { redirect: 'follow' })
            .then(response => response.json())
            .then(data => {
                if(data.result === 'success') {
                    localStorage.setItem('adminCachedData', JSON.stringify(data));
                }
                handleIncomingData(data, isSilent);
            })
            .catch(error => {
                console.warn('Fetch standard gagal diblokir peramban. Beralih ke mode fallback JSONP...');
                fetchViaJSONP(isSilent);
            });
    };

    function handleIncomingData(data, isSilent) {
        if(data.result === 'success') {
            window.globalPOData = data.data_po || [];
            window.globalProductsData = data.data_produk || [];
            window.globalPengaturanData = data.data_pengaturan || {};
            const pembayaranData = data.data_pembayaran || [];
            window.globalPembayaranData = pembayaranData;
            const usersData = data.data_users || [];
            window.globalUsersData = usersData;
            const eventData = data.data_event || null;
            const klienData = data.data_klien || [];
            const testimoniData = data.data_testimoni || [];

            try { renderPOTable(window.globalPOData); } catch(e) { console.error(e); }
            try { updateWidgets(window.globalPOData, pembayaranData); } catch(e) { console.error(e); }
            try { renderChart(window.globalPOData); } catch(e) { console.error(e); }
            try { renderPaymentSection(pembayaranData, window.globalPOData); } catch(e) { console.error(e); }
            try { renderUsersTable(usersData); } catch(e) { console.error(e); }
            try { renderProductsTable(window.globalProductsData); } catch(e) { console.error(e); }
            try { renderKlienTable(klienData); } catch(e) { console.error(e); }
            try { renderTestimoniTable(testimoniData); } catch(e) { console.error(e); }
            
            if (!isSilent && data.data_pengaturan) {
                try { window.loadPengaturanData(data.data_pengaturan); } catch(e) { console.error(e); }
            }
            
            if (eventData && !isSilent) {
                const elNama = document.getElementById('eventNama');
                if (elNama) elNama.value = eventData['Nama Event'] || '';
                const elStatus = document.getElementById('eventStatus');
                if (elStatus) elStatus.value = eventData['Status'] || 'Nonaktif';
                const elDiskon = document.getElementById('eventDiskon');
                if (elDiskon) elDiskon.value = eventData['Diskon (%)'] || '0';
                const elBatas = document.getElementById('eventBatasWaktu');
                if (elBatas && eventData['Batas Waktu']) {
                    let bw = eventData['Batas Waktu'];
                    const d = new Date(bw);
                    if (!isNaN(d.getTime())) {
                        // Sesuaikan ke zona waktu lokal
                        const tzoffset = d.getTimezoneOffset() * 60000; 
                        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
                        elBatas.value = localISOTime;
                    } else {
                        elBatas.value = bw;
                    }
                } else if (elBatas) {
                    elBatas.value = '';
                }
            }

            if (data.data_tampilan) {
                const dt = data.data_tampilan;
                
                // Selalu perbarui preview gambar latar utama saat ini
                const imgContainer = document.getElementById('currentHeroImageContainer');
                const imgElement = document.getElementById('currentHeroImage');
                if (imgContainer && imgElement) {
                    if (dt['Hero Background']) {
                        imgElement.src = dt['Hero Background'];
                        imgContainer.style.display = 'block';
                    } else {
                        imgContainer.style.display = 'none';
                    }
                }

                // Selalu perbarui preview logo brand saat ini
                const logoContainer = document.getElementById('currentLogoContainer');
                const logoElement = document.getElementById('currentLogoImage');
                if (logoContainer && logoElement) {
                    if (dt['Logo Brand']) {
                        logoElement.src = dt['Logo Brand'];
                        logoContainer.style.display = 'block';
                    } else {
                        logoContainer.style.display = 'none';
                    }
                }

                const formatBrandText = (text) => {
                    if (!text) return '';
                    if (text.includes('<span>') || text.includes('<span') || text.includes('SPAN')) {
                        return text;
                    }
                    if (text.toLowerCase() === 'dinascustom.') {
                        return 'Dinas<span>Custom.</span>';
                    }
                    const spaceIdx = text.indexOf(' ');
                    if (spaceIdx !== -1) {
                        const first = text.substring(0, spaceIdx);
                        const rest = text.substring(spaceIdx);
                        return `${first}<span>${rest}</span>`;
                    }
                    const camelMatch = text.match(/^([A-Z][a-z0-9]+)([A-Z].*)$/);
                    if (camelMatch) {
                        return `${camelMatch[1]}<span>${camelMatch[2]}</span>`;
                    }
                    const half = Math.ceil(text.length / 2);
                    const first = text.substring(0, half);
                    const rest = text.substring(half);
                    return `${first}<span>${rest}</span>`;
                };

                // Perbarui logo brand di sidebar header
                const adminBrand = document.getElementById('dynAdminBrand');
                if (adminBrand) {
                    const brandText = dt['Footer Brand'] || 'Dinas<span>Custom.</span>';
                    const logoUrl = dt['Logo Brand'];
                    let logoHtml = '';
                    if (logoUrl) {
                        logoHtml = `<img id="dynAdminLogo" src="${logoUrl}" alt="Logo" style="max-height: 32px; object-fit: contain; margin-right: 8px;">`;
                    }
                    adminBrand.innerHTML = `${logoHtml}<span class="brand-text-wrapper">${formatBrandText(brandText)}</span>`;
                }

                // Perbarui favicon global
                if (dt['Logo Brand']) {
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                    link.href = dt['Logo Brand'];
                }

                if (!isSilent) {
                    const setVal = (id, key) => { const el = document.getElementById(id); if (el) el.value = dt[key] || ''; };
                    
                    setVal('teksHeroTitle', 'Hero Title');
                    setVal('teksHeroSubtitle', 'Hero Subtitle');
                    setVal('teksFooterBrand', 'Footer Brand');
                    setVal('teksFooterDesc', 'Footer Description');
                    setVal('teksFooterWA', 'Footer WhatsApp');
                    setVal('teksFooterWALink', 'Footer WhatsApp Link');
                    setVal('teksFooterIG', 'Footer Instagram');
                    setVal('teksFooterIGLink', 'Footer Instagram Link');
                    setVal('teksFooterEmail', 'Footer Email');
                    setVal('teksFooterEmailLink', 'Footer Email Link');
                    setVal('teksFooterCopy', 'Footer Copyright');
                }
            }

        } else {
            displayFetchError(`Gagal memuat data: ${data.message}`);
        }
    }

    function fetchViaJSONP(isSilent) {
        const callbackName = 'gasAdminCallback_' + Math.round(1000000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            if(data.result === 'success') {
                localStorage.setItem('adminCachedData', JSON.stringify(data));
            }
            handleIncomingData(data, isSilent);
        };

        const script = document.createElement('script');
        script.src = `${CONFIG.GAS_URL}?callback=${callbackName}&t=${Date.now()}`;
        script.onerror = function() {
            delete window[callbackName];
            displayFetchError('Terjadi kesalahan jaringan atau CORS. Pastikan skrip backend gas.js terbaru telah di-deploy ulang ke Google Apps Script Anda.');
        };
        document.body.appendChild(script);
    }

    function displayFetchError(msg) {
        const tbodyPO = document.getElementById('poTableBody');
        if (tbodyPO) tbodyPO.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4"><i class="fa-solid fa-triangle-exclamation mb-2" style="font-size:2rem;"></i><br>${msg}</td></tr>`;
        const tbodyProd = document.getElementById('productsTableBody');
        if (tbodyProd) tbodyProd.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4"><i class="fa-solid fa-triangle-exclamation mb-2" style="font-size:2rem;"></i><br>${msg}</td></tr>`;
        const tbodyUsers = document.getElementById('usersTableBody');
        if (tbodyUsers) tbodyUsers.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4"><i class="fa-solid fa-triangle-exclamation mb-2" style="font-size:2rem;"></i><br>${msg}</td></tr>`;
    }

    function renderUsersTable(usersArray) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if(usersArray.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Belum ada data Pengguna.</td></tr>`;
            return;
        }

        for (let i = usersArray.length - 1; i >= 0; i--) {
            const row = usersArray[i];
            
            let dateStr = row['Timestamp'] || '-';
            let timeAgo = 'Aktif hari ini';
            
            if(dateStr !== '-') {
                const d = new Date(dateStr);
                if(!isNaN(d)) {
                    dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    const diffTime = Math.abs(new Date() - d);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const diffMonths = Math.floor(diffDays / 30);
                    const diffYears = Math.floor(diffDays / 365);
                    
                    if (diffYears > 0) timeAgo = `Aktif ${diffYears} tahun`;
                    else if (diffMonths > 0) timeAgo = `Aktif ${diffMonths} bulan`;
                    else if (diffDays >= 7) timeAgo = `Aktif ${Math.floor(diffDays/7)} minggu`;
                    else if (diffDays > 0) timeAgo = `Aktif ${diffDays} hari`;
                }
            }

            const nama = row['Nama Lengkap'] || 'User';
            const email = row['Email'] || '-';
            let wa = row['Nomor WhatsApp'] || '-';
            let waLink = String(wa).replace(/[^0-9]/g, '');
            if(waLink.startsWith('0')) waLink = '62' + waLink.substring(1);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=random&color=fff&rounded=true" alt="Avatar" width="36" height="36" style="border-radius:50%;">
                        <div>
                            <strong>${nama}</strong>
                            <div style="font-size:12px; color:var(--success);"><i class="fa-solid fa-circle" style="font-size:8px;"></i> ${timeAgo}</div>
                        </div>
                    </div>
                </td>
                <td><a href="https://wa.me/${waLink}" target="_blank" style="color:var(--primary); text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> ${wa}</a></td>
                <td><a href="mailto:${email}" style="color:var(--text); text-decoration:none;"><i class="fa-regular fa-envelope"></i> ${email}</a></td>
                <td class="text-center">
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button class="btn-action btn-det" title="Lihat Detail" onclick="viewUser('${email}')"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-action btn-rej" title="Hapus Akun" onclick="deleteUser('${email}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    function renderKlienTable(klienArray) {
        const tbody = document.getElementById('klienTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if(klienArray.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Belum ada instansi yang ditambahkan.</td></tr>`;
            return;
        }

        klienArray.forEach((row, index) => {
            let dateStr = row['Timestamp'] || '-';
            if(dateStr !== '-') {
                const d = new Date(dateStr);
                if(!isNaN(d)) {
                    dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                }
            }
            
            const logoUrl = row['URL Gambar'] || '';
            const logoHtml = logoUrl ? `<img src="${logoUrl}" style="max-height: 40px; border-radius: 4px;">` : `<span class="text-muted"><i class="fa-regular fa-image"></i></span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td class="text-center">${logoHtml}</td>
                <td class="font-weight-bold">${row['Nama Instansi'] || '-'}</td>
                <td>${dateStr}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editKlien('${row['Nama Instansi']}')" style="margin-right: 5px;"><i class="fa-solid fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="hapusKlien('${row['Nama Instansi']}')"><i class="fa-solid fa-trash"></i> Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderTestimoniTable(testimoniArray) {
        const tbody = document.getElementById('testimoniTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!testimoniArray || testimoniArray.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Belum ada testimoni dari pelanggan.</td></tr>`;
            return;
        }

        testimoniArray.forEach((row, index) => {
            let dateStr = row['Timestamp'] || '-';
            let timestampMs = '';
            if (dateStr !== '-') {
                const d = new Date(dateStr);
                if (!isNaN(d)) {
                    timestampMs = d.getTime().toString();
                    dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
            }
            
            const ratingVal = parseInt(row['Bintang']) || 5;
            let starsHtml = '';
            for (let s = 1; s <= 5; s++) {
                if (s <= ratingVal) {
                    starsHtml += `<i class="fa-solid fa-star text-warning" style="margin-right:2px;"></i>`;
                } else {
                    starsHtml += `<i class="fa-regular fa-star text-muted" style="margin-right:2px;"></i>`;
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${dateStr}</td>
                <td><strong>${row['Nama Lengkap'] || '-'}</strong></td>
                <td class="text-center">${starsHtml} (${ratingVal}/5)</td>
                <td><p class="text-muted" style="margin: 0; word-break: break-word;">${row['Ulasan'] || '-'}</p></td>
                <td class="text-center">
                    <button class="btn btn-danger btn-sm" onclick="hapusTestimoni('${timestampMs}', \`${(row['Nama Lengkap'] || '').replace(/'/g, "\\'")}\`, \`${(row['Ulasan'] || '').replace(/'/g, "\\'")}\`)"><i class="fa-solid fa-trash"></i> Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    setInterval(() => {
        if (window.fetchAllData) window.fetchAllData(true);
    }, 30000);

    // Setup filter dan pencarian PO
    const searchPOInput = document.getElementById('searchPOInput');
    const filterPOSelect = document.getElementById('filterPOSelect');
    if (searchPOInput) searchPOInput.addEventListener('input', () => renderPOTable(window.globalPOData));
    if (filterPOSelect) filterPOSelect.addEventListener('change', () => renderPOTable(window.globalPOData));

    function renderPOTable(dataArray) {
        const tbody = document.getElementById('poTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!dataArray || dataArray.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada data Pre-Order.</td></tr>`;
            return;
        }

        const keyword = searchPOInput ? searchPOInput.value.toLowerCase() : '';
        const filterStatus = filterPOSelect ? filterPOSelect.value.toLowerCase() : 'all';

        const paymentsData = window.globalPembayaranData || [];
        let filteredData = dataArray.filter(row => {
            const idOrder = (row['ID Order'] || '').toLowerCase();
            const nama = (row['Nama Lengkap'] || '').toLowerCase();
            let status = (row['Status'] || '').toLowerCase();

            const paymentRecord = paymentsData.find(p => p['ID Order'] === row['ID Order']);
            if (paymentRecord && (paymentRecord['Status Verifikasi'] || '').toLowerCase() === 'menunggu verifikasi') {
                status = 'menunggu verifikasi';
            } else if (paymentRecord && (paymentRecord['Status Verifikasi'] || '').toLowerCase() === 'selesai') {
                status = 'selesai';
            }

            const matchKeyword = idOrder.includes(keyword) || nama.includes(keyword);
            const matchStatus = filterStatus === 'all' || status === filterStatus;

            return matchKeyword && matchStatus;
        });

        if (filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Tidak ada pesanan yang sesuai dengan filter/pencarian.</td></tr>`;
            return;
        }

        for (let i = filteredData.length - 1; i >= 0; i--) {
            const row = filteredData[i];
            let status = row['Status'] || 'Pending';
            
            const paymentRecord = paymentsData.find(p => p['ID Order'] === row['ID Order']);
            if (paymentRecord && (paymentRecord['Status Verifikasi'] || '').toLowerCase() === 'menunggu verifikasi') {
                status = 'Menunggu Verifikasi';
            } else if (paymentRecord && (paymentRecord['Status Verifikasi'] || '').toLowerCase() === 'selesai') {
                status = 'Selesai';
            }

            let badgeClass = 'badge-warning';
            let displayStatus = status;

            if (status.toLowerCase() === 'pending') {
                displayStatus = 'Menunggu Konfirmasi Pesanan';
                badgeClass = 'badge-warning';
            } else if (status.toLowerCase() === 'menunggu verifikasi') {
                displayStatus = 'Menunggu Konfirmasi Pembayaran';
                badgeClass = 'badge-info';
            } else if (status.toLowerCase() === 'disetujui') {
                displayStatus = 'Disetujui';
                badgeClass = 'badge-primary';
            } else if (status.toLowerCase() === 'selesai') {
                displayStatus = 'Selesai';
                badgeClass = 'badge-success';
            } else if (status.toLowerCase() === 'ditolak') {
                displayStatus = 'Ditolak';
                badgeClass = 'badge-danger';
            } else if (status.toLowerCase() === 'dibatalkan') {
                displayStatus = 'Dibatalkan';
                badgeClass = 'badge-danger';
            }

            let dateStr = row['Timestamp'] || '-';
            if (dateStr !== '-') {
                const d = new Date(dateStr);
                if (!isNaN(d)) dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            const hargaTotalRaw = row['Harga Total'] || '0';
            const hargaTotalInt = parseInt(String(hargaTotalRaw).replace(/[^0-9]/g, '')) || 0;
            const hargaTotalFormatted = 'Rp ' + hargaTotalInt.toLocaleString('id-ID');

            let targetDateVal = '-';
            const rawTargetDate = row['Tanggal PO'] || row[''] || (Object.keys(row).length > 10 ? row[Object.keys(row)[10]] : '-');
            if (rawTargetDate && rawTargetDate !== '-') {
                const td = new Date(rawTargetDate);
                if (!isNaN(td)) {
                    targetDateVal = td.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                } else {
                    targetDateVal = rawTargetDate;
                }
            }

            const tr = document.createElement('tr');

            let actionHtml = '';
            if (status.toLowerCase() === 'pending') {
                actionHtml = `
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button class="btn-action btn-acc" title="Setujui Pesanan" onclick="openVerifyModal('setuju', '${row['ID Order']}')"><i class="fa-solid fa-check"></i></button>
                        <button class="btn-action btn-rej" title="Tolak Pesanan" onclick="openVerifyModal('tolak', '${row['ID Order']}')"><i class="fa-solid fa-xmark"></i></button>
                        <button class="btn-action btn-rej" title="Hapus Pesanan" onclick="deletePO('${row['ID Order']}')" style="background: #6b7280;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
            } else if (status.toLowerCase() === 'menunggu verifikasi') {
                const imgUrl = paymentRecord ? (paymentRecord['Bukti Transfer'] || '') : '';
                let viewReceiptBtn = '';
                if (imgUrl) {
                    viewReceiptBtn = `<button class="btn-action btn-det" onclick="window.showReceiptPreview('${imgUrl}')" title="Lihat Bukti Transfer"><i class="fa-solid fa-image"></i></button>`;
                }
                actionHtml = `
                    <div style="display:flex; gap:8px; justify-content:center;">
                        ${viewReceiptBtn}
                        <button class="btn-action btn-acc" onclick="window.verifyPaymentRow('${row['ID Order']}', 'Selesai')" title="Setujui Pembayaran"><i class="fa-solid fa-check"></i></button>
                        <button class="btn-action btn-rej" onclick="window.verifyPaymentRow('${row['ID Order']}', 'Ditolak')" title="Tolak Pembayaran"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
            } else {
                actionHtml = `
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button class="btn-action btn-rej" title="Hapus Pesanan" onclick="deletePO('${row['ID Order']}')" style="background: #6b7280;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong>${row['ID Order'] || '-'}</strong></td>
                <td>${row['Nama Lengkap'] || 'User'}</td>
                <td>${row['Produk'] || '-'} (${row['Ukuran'] || '-'})</td>
                <td><strong>${hargaTotalFormatted}</strong></td>
                <td><strong>${targetDateVal}</strong></td>
                <td><span class="status-badge ${badgeClass}">${displayStatus}</span></td>
                <td class="text-center">
                    ${actionHtml}
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    function updateWidgets(poArray, paymentArray) {
        const totalPO = poArray.length;
        let pendingPO = 0;
        let rejectedPO = 0;
        let completedPO = 0;

        poArray.forEach(row => {
            const status = (row['Status'] || '').toLowerCase();
            if(status === 'pending') pendingPO++;
            else if(status === 'ditolak') rejectedPO++;
            else if(status === 'disetujui' || status === 'selesai') completedPO++;
        });

        let pendingPaymentCount = 0;
        paymentArray.forEach(p => {
            if ((p['Status Verifikasi'] || '').toLowerCase() === 'menunggu verifikasi') {
                pendingPaymentCount++;
            }
        });

        const elCountPO = document.getElementById('countPO');
        if (elCountPO) elCountPO.innerText = totalPO;
        const elPending = document.getElementById('countPending');
        if (elPending) elPending.innerText = pendingPaymentCount;
        const elRej = document.getElementById('countPayment');
        if (elRej) elRej.innerText = rejectedPO;
        const elComp = document.getElementById('countCompleted');
        if (elComp) elComp.innerText = completedPO;

        const notifBadge = document.getElementById('notifPaymentBadge');
        if(notifBadge) {
            notifBadge.innerText = pendingPaymentCount;
            if(pendingPaymentCount === 0) notifBadge.style.display = 'none';
            else notifBadge.style.display = 'flex';
        }
    }

    let poChartInstance = null;
    function renderChart(dataArray) {
        const ctx = document.getElementById('poChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const dateCounts = {};
        dataArray.forEach(row => {
            const dateStr = row['Timestamp'];
            if (!dateStr) return;
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj)) return;
            const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            dateCounts[formattedDate] = (dateCounts[formattedDate] || 0) + 1;
        });

        const labels = Object.keys(dateCounts);
        const data = Object.values(dateCounts);

        if (poChartInstance) poChartInstance.destroy();

        poChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah Pesanan (PO)',
                    data: data,
                    backgroundColor: '#4361ee',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    function renderPaymentSection(paymentArray, poArray) {
        const emptyState = document.getElementById('paymentEmptyState');
        const tableContainer = document.getElementById('paymentTableContainer');
        const tbody = document.getElementById('paymentsTableBody');

        if (!tbody) return;

        if (!paymentArray || paymentArray.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (tableContainer) tableContainer.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';

        tbody.innerHTML = '';

        paymentArray.forEach(row => {
            let dateStr = row['Timestamp'] || '-';
            if (dateStr !== '-') {
                const d = new Date(dateStr);
                if (!isNaN(d)) {
                    dateStr = d.toLocaleDateString('id-ID', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                }
            }

            const nominal = parseInt(row['Jumlah Bayar'] || 0);
            const statusVerifikasi = (row['Status Verifikasi'] || '').toLowerCase();
            const orderId = row['ID Order'] || '-';

            // Image URL logic
            let imgUrl = row['Bukti Transfer'] || '';
            let thumbnailHtml = '-';
            if (imgUrl.includes('http')) {
                let displayUrl = imgUrl;
                if (imgUrl.includes('uc?export=view&id=')) {
                    displayUrl = imgUrl.replace('uc?export=view&id=', 'thumbnail?id=') + '&sz=w150';
                }
                thumbnailHtml = `<img src="${displayUrl}" alt="Bukti" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid #ddd;" onclick="window.showReceiptPreview('${imgUrl}')">`;
            }

            // Status Badge
            let statusBadge = '';
            if (statusVerifikasi === 'menunggu verifikasi') {
                statusBadge = `<span class="status-badge badge-warning">Menunggu Verifikasi</span>`;
            } else if (statusVerifikasi === 'selesai' || statusVerifikasi === 'valid' || statusVerifikasi === 'disetujui') {
                statusBadge = `<span class="status-badge badge-success">Valid / Selesai</span>`;
            } else {
                statusBadge = `<span class="status-badge badge-danger">Tidak Valid / Ditolak</span>`;
            }

            // Action Buttons
            let actionHtml = '-';
            if (statusVerifikasi === 'menunggu verifikasi') {
                actionHtml = `
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="btn-action btn-acc" onclick="window.verifyPaymentRow('${orderId}', 'Selesai')" title="Verifikasi Valid"><i class="fa-solid fa-check"></i></button>
                        <button class="btn-action btn-rej" onclick="window.verifyPaymentRow('${orderId}', 'Ditolak')" title="Bukti Tidak Valid"><i class="fa-solid fa-xmark"></i></button>
                        <button class="btn-action btn-rej" onclick="window.deletePayment('${orderId}')" title="Hapus Data Pembayaran" style="background: #6b7280;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
            } else if (statusVerifikasi === 'tidak valid' || statusVerifikasi === 'ditolak') {
                const alasanText = row['Alasan Ditolak'] || '-';
                actionHtml = `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-action btn-acc" onclick="window.verifyPaymentRow('${orderId}', 'Selesai')" title="Verifikasi Valid"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-action btn-rej" onclick="window.deletePayment('${orderId}')" title="Hapus Data Pembayaran" style="background: #6b7280;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <small class="text-danger" style="font-weight: 500; font-size: 0.8rem; text-align: center; max-width: 150px; line-height: 1.2;">Alasan: ${alasanText}</small>
                    </div>
                `;
            } else {
                // Status selesai / valid — hanya tampilkan tombol hapus
                actionHtml = `
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="btn-action btn-rej" onclick="window.deletePayment('${orderId}')" title="Hapus Data Pembayaran" style="background: #6b7280;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${orderId}</strong></td>
                <td><small>${dateStr}</small></td>
                <td>${row['Nama Lengkap'] || '-'}</td>
                <td><strong>Rp ${nominal.toLocaleString('id-ID')}</strong></td>
                <td style="text-align: center;">${thumbnailHtml}</td>
                <td>${statusBadge}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.showReceiptPreview = function(url) {
        const modal = document.getElementById('receiptModal');
        const img = document.getElementById('receiptModalImg');
        if (modal && img) {
            img.src = url;
            modal.classList.add('show');
        }
    };

    window.verifyPaymentRow = function(orderId, newStatus) {
        if (newStatus === 'Selesai') {
            showConfirm(`Apakah Anda yakin ingin menyetujui bukti pembayaran untuk pesanan ${orderId}? Status pesanan akan berlanjut ke proses produksi.`, () => {
                window.submitVerifyPaymentDirect(orderId, 'Selesai');
            });
        } else if (newStatus === 'Ditolak') {
            window.openVerifyPaymentModal(orderId);
        }
    };

    window.openVerifyPaymentModal = function(orderId) {
        window.adminVerifyingPayOrderId = orderId;
        const modal = document.getElementById('verifyPaymentModal');
        const subtitle = document.getElementById('payModalSubtitle');
        const formTolak = document.getElementById('payModalFormTolak');
        
        if (subtitle) subtitle.innerText = `Order ID: ${orderId}`;
        if (formTolak) formTolak.style.display = 'block';
        
        const inputAlasan = document.getElementById('payModalAlasanInput');
        if (inputAlasan) inputAlasan.value = '';

        if (modal) modal.classList.add('show');
    };

    window.closeVerifyPaymentModal = function() {
        const modal = document.getElementById('verifyPaymentModal');
        if (modal) modal.classList.remove('show');
    };

    window.submitVerifyPaymentDirect = function(orderId, status, alasanTolak) {
        showToast('Sedang memproses verifikasi...', 'info');
        
        const payload = new URLSearchParams();
        payload.append('action', 'verify_payment');
        payload.append('id_order', orderId);
        payload.append('status_pembayaran', status);
        if (alasanTolak) {
            payload.append('alasan_tolak', alasanTolak);
        }

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload,
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if (data.result === 'success') {
                showToast(`Status pembayaran ${orderId} berhasil diperbarui!`, 'success');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal memverifikasi: ' + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Terjadi kesalahan jaringan.');
        });
    };

    window.submitVerifyPayment = function(status) {
        if (!window.adminVerifyingPayOrderId) return;
        
        let alasan = '';
        if (status === 'Ditolak') {
            alasan = document.getElementById('payModalAlasanInput').value;
            if (!alasan) {
                alert('Silakan masukkan alasan penolakan bukti pembayaran.');
                return;
            }
        }

        const btn = document.getElementById('btnSubmitPayTolak');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        btn.disabled = true;

        const payload = new URLSearchParams();
        payload.append('action', 'verify_payment');
        payload.append('id_order', window.adminVerifyingPayOrderId);
        payload.append('status_pembayaran', status);
        payload.append('alasan_tolak', alasan);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload,
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            btn.innerHTML = origText;
            btn.disabled = false;
            if (data.result === 'success') {
                showToast(`Pembayaran ${window.adminVerifyingPayOrderId} berhasil ditolak!`, 'success');
                closeVerifyPaymentModal();
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal memproses penolakan: ' + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            btn.innerHTML = origText;
            btn.disabled = false;
            alert('Terjadi kesalahan jaringan.');
        });
    };
    window.fetchAllData();

    // 5. Product Form Submit
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btnSubmit = productForm.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const fileInput = document.getElementById('prodGambarFile');
            const file = fileInput.files[0];
            
            const videoInput = document.getElementById('prodVideoFile');
            const videoFile = videoInput.files[0];
            
            const prodId = document.getElementById('prodId').value;
            const isEdit = prodId !== "";
            
            if (!file && !isEdit) {
                alert('Pilih gambar terlebih dahulu untuk produk baru!');
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
                return;
            }

            const prodData = new URLSearchParams();
            prodData.append('action', isEdit ? 'edit_product' : 'add_product');
            if (isEdit) prodData.append('id_produk', prodId);
            
            prodData.append('kategori', document.getElementById('prodKategori').value);
            prodData.append('nama_produk', document.getElementById('prodNama').value);
            prodData.append('harga_asli', document.getElementById('prodHarga').value);
            prodData.append('badge', document.getElementById('prodBadge').value);
            prodData.append('ukuran', document.getElementById('prodUkuran').value);

            const readFileAsBase64 = (f) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(f);
                });
            };

            const processUploadsAndSend = async () => {
                try {
                    if (file) {
                        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload Gambar...';
                        const imgBase64 = await readFileAsBase64(file);
                        prodData.append('image_base64', imgBase64);
                        prodData.append('image_name', file.name);
                        prodData.append('image_mimetype', file.type);
                    }
                    
                    if (videoFile) {
                        if (videoFile.size > 15 * 1024 * 1024) {
                            alert('Ukuran video terlalu besar! Maksimal 15MB.');
                            btnSubmit.innerHTML = originalText;
                            btnSubmit.disabled = false;
                            return;
                        }
                        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload Video...';
                        const videoBase64 = await readFileAsBase64(videoFile);
                        prodData.append('video_base64', videoBase64);
                        prodData.append('video_name', videoFile.name);
                        prodData.append('video_mimetype', videoFile.type);
                    }
                    
                    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Produk...';
                    
                    fetch(CONFIG.GAS_URL, {
                        method: 'POST',
                        body: prodData,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        redirect: 'follow'
                    })
                    .then(res => res.json())
                    .then(data => {
                        if(data.result === 'success') {
                            alert(isEdit ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!');
                            closeProductModal();
                            window.fetchAllData(true, data);
                            productForm.reset();
                            document.getElementById('prodId').value = "";
                        } else {
                            alert('Gagal: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        alert('Terjadi kesalahan saat menyimpan produk.');
                    })
                    .finally(() => {
                        btnSubmit.innerHTML = originalText;
                        btnSubmit.disabled = false;
                    });
                    
                } catch (err) {
                    console.error(err);
                    alert('Terjadi kesalahan saat memproses file upload.');
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.disabled = false;
                }
            };
            
            processUploadsAndSend();
        });
    }

    // 6. Event Form Submit
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSubmit = eventForm.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const eventData = new URLSearchParams();
            eventData.append('action', 'update_event');
            eventData.append('nama_event', document.getElementById('eventNama').value);
            eventData.append('status_event', document.getElementById('eventStatus').value);
            eventData.append('diskon_event', document.getElementById('eventDiskon').value);
            eventData.append('batas_waktu', document.getElementById('eventBatasWaktu').value);

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: eventData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if(data.result === 'success') {
                    alert('Pengaturan event berhasil disimpan!');
                    window.fetchAllData(true, data);
                } else {
                    alert('Gagal: ' + data.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            });
        });
    }

    // 7. Klien Form Submit
    const klienForm = document.getElementById('klienForm');
    if (klienForm) {
        klienForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputKlien = document.getElementById('klienNama');
            if(!inputKlien.value) return;

            const btnSubmit = document.getElementById('btnTambahKlien');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
            btnSubmit.disabled = true;

            const fileInput = document.getElementById('klienGambar');
            let file = null;
            if (fileInput && fileInput.files.length > 0) {
                file = fileInput.files[0];
            }

            const payload = new URLSearchParams();
            payload.append('action', 'add_klien');
            payload.append('nama_instansi', inputKlien.value);

            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const base64Data = evt.target.result.split(',')[1];
                    payload.append('image_base64', base64Data);
                    payload.append('image_name', file.name);
                    payload.append('image_mimetype', file.type);
                    sendKlienRequest(payload, btnSubmit, originalText, inputKlien, fileInput);
                };
                reader.readAsDataURL(file);
            } else {
                sendKlienRequest(payload, btnSubmit, originalText, inputKlien, fileInput);
            }
        });
    }

    function sendKlienRequest(payload, btnSubmit, originalText, inputKlien, fileInput) {
        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                inputKlien.value = '';
                if(fileInput) fileInput.value = '';
                window.fetchAllData(true, data);
                showToast('Instansi berhasil ditambahkan!', 'success');
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        })
        .finally(() => {
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        });
    }

    // 8. Tampilan Form Submit
    const tampilanForm = document.getElementById('tampilanForm');
    if (tampilanForm) {
        tampilanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('heroGambar');
            if(!fileInput || fileInput.files.length === 0) {
                showToast('Silakan pilih gambar terlebih dahulu', 'error');
                return;
            }

            const btnSubmit = document.getElementById('btnUploadHero');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';
            btnSubmit.disabled = true;

            const file = fileInput.files[0];
            const payload = new URLSearchParams();
            payload.append('action', 'update_hero');

            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Data = evt.target.result.split(',')[1];
                payload.append('image_base64', base64Data);
                payload.append('image_name', 'hero_' + Date.now() + '_' + file.name);
                payload.append('image_mimetype', file.type);

                fetch(CONFIG.GAS_URL, {
                    method: 'POST',
                    body: payload,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    redirect: 'follow'
                })
                .then(res => res.json())
                .then(data => {
                    if(data.result === 'success') {
                        fileInput.value = '';
                        window.fetchAllData(true, data);
                        showToast('Hero Background berhasil diubah!', 'success');
                    } else {
                        alert('Gagal: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert('Terjadi kesalahan jaringan.');
                })
                .finally(() => {
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.disabled = false;
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // 8b. Logo Form Submit
    const logoForm = document.getElementById('logoForm');
    if (logoForm) {
        logoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('logoGambar');
            if(!fileInput || fileInput.files.length === 0) {
                showToast('Silakan pilih gambar logo terlebih dahulu', 'error');
                return;
            }

            const btnSubmit = document.getElementById('btnUploadLogo');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';
            btnSubmit.disabled = true;

            const file = fileInput.files[0];
            const payload = new URLSearchParams();
            payload.append('action', 'update_logo');

            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Data = evt.target.result.split(',')[1];
                payload.append('image_base64', base64Data);
                payload.append('image_name', 'logo_' + Date.now() + '_' + file.name);
                payload.append('image_mimetype', file.type);

                fetch(CONFIG.GAS_URL, {
                    method: 'POST',
                    body: payload,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    redirect: 'follow'
                })
                .then(res => res.json())
                .then(data => {
                    if(data.result === 'success') {
                        fileInput.value = '';
                        window.fetchAllData(true, data);
                        showToast('Logo Brand berhasil diperbarui!', 'success');
                    } else {
                        alert('Gagal: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert('Terjadi kesalahan jaringan.');
                })
                .finally(() => {
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.disabled = false;
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // 9. Tampilan Teks Form Submit
    const tampilanTeksForm = document.getElementById('tampilanTeksForm');
    if (tampilanTeksForm) {
        tampilanTeksForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btnSimpanTeksTampilan');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const teksData = {
                'Hero Title': document.getElementById('teksHeroTitle').value,
                'Hero Subtitle': document.getElementById('teksHeroSubtitle').value,
                'Footer Brand': document.getElementById('teksFooterBrand').value,
                'Footer Description': document.getElementById('teksFooterDesc').value,
                'Footer WhatsApp': document.getElementById('teksFooterWA').value,
                'Footer WhatsApp Link': document.getElementById('teksFooterWALink').value,
                'Footer Instagram': document.getElementById('teksFooterIG').value,
                'Footer Instagram Link': document.getElementById('teksFooterIGLink').value,
                'Footer Email': document.getElementById('teksFooterEmail').value,
                'Footer Email Link': document.getElementById('teksFooterEmailLink').value,
                'Footer Copyright': document.getElementById('teksFooterCopy').value
            };

            const payload = new URLSearchParams();
            payload.append('action', 'update_tampilan_teks');
            payload.append('teks_data', JSON.stringify(teksData));

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if(data.result === 'success') {
                    showToast('Pengaturan teks berhasil disimpan!', 'success');
                    window.fetchAllData(true, data);
                } else {
                    alert('Gagal: ' + data.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            });
        });
    }

    // 10. Klien Edit Form Submit
    const klienEditForm = document.getElementById('klienEditForm');
    if (klienEditForm) {
        klienEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btnSubmitEditKlien');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const oldNama = document.getElementById('editKlienOldNama').value;
            const newNama = document.getElementById('editKlienNama').value;
            const fileInput = document.getElementById('editKlienGambar');
            const hapusGambar = document.getElementById('editKlienHapusGambar').checked;
            
            let file = null;
            if (fileInput && fileInput.files.length > 0) {
                file = fileInput.files[0];
            }

            const payload = new URLSearchParams();
            payload.append('action', 'update_klien');
            payload.append('old_nama_instansi', oldNama);
            payload.append('nama_instansi', newNama);

            if (hapusGambar) {
                payload.append('image_base64', 'delete_image');
                sendKlienEditRequest(payload, btnSubmit, originalText, fileInput);
            } else if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const base64Data = evt.target.result.split(',')[1];
                    payload.append('image_base64', base64Data);
                    payload.append('image_name', file.name);
                    payload.append('image_mimetype', file.type);
                    sendKlienEditRequest(payload, btnSubmit, originalText, fileInput);
                };
                reader.readAsDataURL(file);
            } else {
                sendKlienEditRequest(payload, btnSubmit, originalText, fileInput);
            }
        });
    }

    function sendKlienEditRequest(payload, btnSubmit, originalText, fileInput) {
        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                if(fileInput) fileInput.value = '';
                document.getElementById('editKlienHapusGambar').checked = false;
                window.closeKlienModal();
                window.fetchAllData(true, data);
                showToast('Instansi berhasil diperbarui!', 'success');
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        })
        .finally(() => {
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        });
    }

    // 11. Ongkir Form Submit
    const ongkirForm = document.getElementById('ongkirForm');
    if (ongkirForm) {
        ongkirForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btnSimpanOngkir');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const ongkirData = {
                'Ongkir Status': document.getElementById('ongkirStatus').value,
                'Ongkir Judul': document.getElementById('ongkirJudul').value,
                'Ongkir Biaya': document.getElementById('ongkirBiaya').value,
                'Ongkir Keterangan': document.getElementById('ongkirKeterangan').value
            };

            const payload = new URLSearchParams();
            payload.append('action', 'update_pengaturan');
            payload.append('pengaturan_data', JSON.stringify(ongkirData));

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    showToast('Pengaturan ongkir berhasil disimpan!', 'success');
                    updateOngkirPreview();
                    window.fetchAllData(true, data);
                } else {
                    alert('Gagal: ' + data.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            });
        });
    }

    // 12. Bank Form Submit
    const bankForm = document.getElementById('bankForm');
    if (bankForm) {
        bankForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btnSimpanBank');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const bankData = {
                'Bank Nama': document.getElementById('bankNama').value,
                'Bank Pemilik': document.getElementById('bankPemilik').value,
                'Bank Nomor': document.getElementById('bankNomor').value
            };

            const payload = new URLSearchParams();
            payload.append('action', 'update_pengaturan');
            payload.append('pengaturan_data', JSON.stringify(bankData));

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    showToast('Informasi rekening bank berhasil disimpan!', 'success');
                    updateBankPreview();
                    window.fetchAllData(true, data);
                } else {
                    alert('Gagal: ' + data.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            });
        });
    }

    // 13. WA Form Submit
    const waForm = document.getElementById('waForm');
    if (waForm) {
        waForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputWA = document.getElementById('waAdminNomor');
            let waVal = inputWA.value.trim().replace(/[^0-9]/g, '');
            
            if (!waVal) {
                alert('Nomor WhatsApp tidak boleh kosong!');
                return;
            }

            const btnSubmit = document.getElementById('btnSimpanWA');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            btnSubmit.disabled = true;

            const waData = {
                'Whatsapp Admin': waVal
            };

            const payload = new URLSearchParams();
            payload.append('action', 'update_pengaturan');
            payload.append('pengaturan_data', JSON.stringify(waData));

            fetch(CONFIG.GAS_URL, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                redirect: 'follow'
            })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    showToast('Nomor WhatsApp Admin berhasil disimpan!', 'success');
                    window.fetchAllData(true, data);
                } else {
                    alert('Gagal: ' + data.message);
                }
            })
            .catch(error => {
                console.error(error);
                alert('Terjadi kesalahan jaringan.');
            })
            .finally(() => {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            });
        });
    }

    // Live preview update saat field bank berubah
    ['bankNama', 'bankPemilik', 'bankNomor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateBankPreview);
        if (el) el.addEventListener('change', updateBankPreview);
    });
    ['ongkirStatus', 'ongkirJudul', 'ongkirBiaya'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateOngkirPreview);
        if (el) el.addEventListener('change', updateOngkirPreview);
    });

});

// 4. Modal Verifikasi Logic (Global functions)

window.updateModalTotalAkhir = function() {
    const nominalInput = document.getElementById('modalNominalInput');
    const diskonInput = document.getElementById('modalDiskonInput');
    const ongkirInput = document.getElementById('modalOngkirInput');
    const totalLabel = document.getElementById('modalTotalAkhirLabel');
    
    if (!nominalInput || !diskonInput || !totalLabel) return;
    
    const nominal = parseFloat(nominalInput.value) || 0;
    const diskon = parseFloat(diskonInput.value) || 0;
    const ongkir = parseFloat(ongkirInput ? ongkirInput.value : 0) || 0;
    const total = Math.max(0, Math.round(nominal * (1 - diskon / 100)) + ongkir);
    
    totalLabel.innerText = 'Rp ' + total.toLocaleString('id-ID');
};

window.openVerifyModal = function(action, orderId) {
    window.adminVerifyingOrderId = orderId;
    const modal = document.getElementById('verifyModal');
    const title = document.getElementById('modalTitle');
    const subtitle = document.getElementById('modalSubtitle');
    const formTolak = document.getElementById('modalFormTolak');
    const formSetuju = document.getElementById('modalFormSetuju');

    subtitle.innerText = `Order ID: ${orderId}`;

    if (formTolak) formTolak.style.display = 'none';
    if (formSetuju) formSetuju.style.display = 'none';
    
    const alasanInput = document.getElementById('modalAlasanInput');
    if (alasanInput) alasanInput.value = '';
    
    const dateInput = document.getElementById('modalTanggalBatasInput');
    if (dateInput) dateInput.value = '';

    if (action === 'tolak') {
        title.innerText = 'Verifikasi: Tolak Pesanan';
        title.style.color = 'var(--danger)';
        if (formTolak) formTolak.style.display = 'block';
    } else if (action === 'setuju') {
        title.innerText = 'Verifikasi: Setujui Pesanan';
        title.style.color = 'var(--success)';
        if (formSetuju) formSetuju.style.display = 'block';
        
        const todayStr = new Date().toISOString().split('T')[0];
        const poRow = (window.globalPOData || []).find(row => row['ID Order'] === orderId);
        let poDate = new Date();
        if (poRow && poRow['Timestamp']) {
            const parsedDate = new Date(poRow['Timestamp']);
            if (!isNaN(parsedDate.getTime())) {
                poDate = parsedDate;
            }
        }
        
        const tomorrow = new Date(poDate.getTime());
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (dateInput) {
            dateInput.min = todayStr;
            dateInput.value = tomorrowStr;
        }

        // Prefill nominal based on PO row data
        let defaultNominal = 250000;
        if (poRow) {
            const rawHarga = poRow['Harga Total'];
            const cleanedHarga = String(rawHarga || '').replace(/[^0-9]/g, '');
            if (cleanedHarga) {
                defaultNominal = parseInt(cleanedHarga);
            } else {
                const prodName = poRow['Produk'] || '';
                const matchedProd = (window.globalProductsData || []).find(p => p['Nama Produk'] === prodName);
                if (matchedProd && matchedProd['Harga Asli']) {
                    const cleanedHargaProd = String(matchedProd['Harga Asli']).replace(/[^0-9]/g, '');
                    if (cleanedHargaProd) defaultNominal = parseInt(cleanedHargaProd);
                } else if (prodName.toLowerCase().includes('pdl')) {
                    defaultNominal = 350000;
                }
            }
        }

        let defaultOngkir = 0;
        if (window.globalPengaturanData) {
            const statusOngkir = window.globalPengaturanData['Ongkir Status'] || 'Nonaktif';
            if (statusOngkir === 'Aktif') {
                defaultOngkir = parseFloat(window.globalPengaturanData['Ongkir Biaya']) || 0;
            }
        }

        const nominalInput = document.getElementById('modalNominalInput');
        const diskonInput = document.getElementById('modalDiskonInput');
        const ongkirInput = document.getElementById('modalOngkirInput');
        if (nominalInput) nominalInput.value = defaultNominal;
        if (diskonInput) diskonInput.value = 0;
        if (ongkirInput) ongkirInput.value = defaultOngkir;
        
        window.updateModalTotalAkhir();
    }

    modal.classList.add('show');
};

window.closeVerifyModal = function() {
    const modal = document.getElementById('verifyModal');
    if (modal) modal.classList.remove('show');
};

window.submitVerifyPO = function(status) {
    if (!window.adminVerifyingOrderId) return;
    
    const payload = new URLSearchParams();
    payload.append('action', 'verify_po');
    payload.append('id_order', window.adminVerifyingOrderId);
    payload.append('status_po', status);
    
    let btn;
    if (status === 'Ditolak') {
        const alasan = document.getElementById('modalAlasanInput').value;
        if (!alasan) {
            alert('Silakan masukkan alasan penolakan.');
            return;
        }
        payload.append('alasan_tolak', alasan);
        btn = document.getElementById('btnSubmitTolak');
    } else if (status === 'Disetujui') {
        const batas = document.getElementById('modalTanggalBatasInput').value;
        if (!batas) {
            alert('Silakan tentukan tanggal maksimal pembayaran.');
            return;
        }
        
        const nominalInput = document.getElementById('modalNominalInput');
        const diskonInput = document.getElementById('modalDiskonInput');
        const ongkirInput = document.getElementById('modalOngkirInput');
        const nominal = parseFloat(nominalInput ? nominalInput.value : 0) || 0;
        const diskon = parseFloat(diskonInput ? diskonInput.value : 0) || 0;
        const ongkir = parseFloat(ongkirInput ? ongkirInput.value : 0) || 0;
        
        if (nominal <= 0) {
            alert('Silakan masukkan harga nominal yang valid.');
            return;
        }
        
        const finalTotal = Math.max(0, Math.round(nominal * (1 - diskon / 100)) + ongkir);
        
        payload.append('batas_pembayaran', batas);
        payload.append('harga_total', finalTotal);
        payload.append('diskon', diskon);
        payload.append('ongkir', ongkir);
        btn = document.getElementById('btnSubmitSetuju');
    }

    if (!btn) return;
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload,
        redirect: 'follow'
    })
    .then(res => res.json())
    .then(data => {
        btn.innerHTML = origText;
        btn.disabled = false;
        if (data.result === 'success') {
            showToast(`Pesanan ${window.adminVerifyingOrderId} berhasil diperbarui!`, 'success');
            closeVerifyModal();
            if (window.fetchAllData) window.fetchAllData(true, data);
        } else {
            alert('Gagal memproses verifikasi: ' + data.message);
        }
    })
    .catch(err => {
        console.error(err);
        btn.innerHTML = origText;
        btn.disabled = false;
        alert('Terjadi kesalahan jaringan.');
    });
};

// 5. Modal Produk Logic (Global functions)
window.openProductModal = function() {
    const frm = document.getElementById('productForm');
    if (frm) frm.reset();
    const elId = document.getElementById('prodId');
    if (elId) elId.value = "";
    
    const imgPreview = document.getElementById('prodGambarPreview');
    if (imgPreview) {
        imgPreview.src = "";
        imgPreview.style.display = "none";
    }

    const videoPreviewText = document.getElementById('prodVideoPreviewText');
    const videoPreviewLink = document.getElementById('prodVideoPreviewLink');
    if (videoPreviewText && videoPreviewLink) {
        videoPreviewText.textContent = "Tidak ada video";
        videoPreviewLink.href = "#";
        videoPreviewLink.style.display = "none";
    }

    const elTitle = document.getElementById('productModalTitle');
    if (elTitle) elTitle.innerText = "Tambah Produk Baru";
    const mod = document.getElementById('productModal');
    if (mod) mod.classList.add('show');
};

window.closeProductModal = function() {
    const mod = document.getElementById('productModal');
    if (mod) mod.classList.remove('show');
};

window.deleteProduct = function(productId) {
    showConfirm('Apakah Anda yakin ingin menghapus produk ini?', () => {
        showToast('Sedang menghapus produk...', 'info');
        const prodData = new URLSearchParams();
        prodData.append('action', 'delete_product');
        prodData.append('id_produk', productId);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: prodData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                alert('Produk berhasil dihapus!');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        });
    });
};

window.renderProductsTable = function(produkArray) {
    const tbody = document.getElementById('productsTableBody');
    if(!tbody) return;
    tbody.innerHTML = ''; 

    if(produkArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Belum ada data produk.</td></tr>`;
        return;
    }

    for (let i = produkArray.length - 1; i >= 0; i--) {
        const row = produkArray[i];
        
        let imageUrl = row['URL Gambar'] || 'https://via.placeholder.com/50';
        if (typeof imageUrl === 'string' && imageUrl.includes('drive.google.com/uc?')) {
            const match = imageUrl.match(/id=([^&]+)/);
            if (match && match[1]) {
                imageUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w100`;
            }
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${imageUrl}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #ddd;" alt="Produk"></td>
            <td><span class="status-badge bg-primary">${row['Kategori'] || '-'}</span></td>
            <td><strong>${row['Nama Produk'] || '-'}</strong></td>
            <td>${row['Harga Asli'] || '-'}</td>
            <td><span style="font-size:0.9rem; color:#555; font-weight:500;">${row['Ukuran'] || '-'}</span></td>
            <td>${row['Badge'] ? '<span class="status-badge" style="background:#4361ee; color:white;">' + row['Badge'] + '</span>' : '-'}</td>
            <td class="text-center">
                <div style="display:flex; gap:8px; justify-content:center;">
                    <button class="btn-action btn-acc" title="Edit" onclick="editProduct('${row['ID Produk']}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action btn-rej" title="Hapus" onclick="deleteProduct('${row['ID Produk']}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
};

window.editProduct = function(productId) {
    const products = window.globalProductsData || [];
    const product = products.find(p => p['ID Produk'] === productId);
    
    if (!product) {
        alert("Data produk tidak ditemukan!");
        return;
    }

    const frm = document.getElementById('productForm');
    if (frm) frm.reset();
    document.getElementById('prodId').value = product['ID Produk'];
    document.getElementById('prodKategori').value = product['Kategori'] || '';
    document.getElementById('prodNama').value = product['Nama Produk'] || '';
    document.getElementById('prodHarga').value = product['Harga Asli'] || '';
    document.getElementById('prodBadge').value = product['Badge'] || '';
    document.getElementById('prodUkuran').value = product['Ukuran'] || '';
    
    const imgPreview = document.getElementById('prodGambarPreview');
    if (imgPreview) {
        let imageUrl = product['URL Gambar'] || '';
        if (typeof imageUrl === 'string' && imageUrl.includes('drive.google.com/uc?')) {
            const match = imageUrl.match(/id=([^&]+)/);
            if (match && match[1]) {
                imageUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w100`;
            }
        }
        if (imageUrl) {
            imgPreview.src = imageUrl;
            imgPreview.style.display = "block";
        } else {
            imgPreview.src = "";
            imgPreview.style.display = "none";
        }
    }

    const videoPreviewText = document.getElementById('prodVideoPreviewText');
    const videoPreviewLink = document.getElementById('prodVideoPreviewLink');
    if (videoPreviewText && videoPreviewLink) {
        const videoUrl = product['URL Video'] || '';
        if (videoUrl) {
            videoPreviewText.textContent = "Ada video terupload";
            videoPreviewLink.href = videoUrl;
            videoPreviewLink.style.display = "inline-block";
            videoPreviewLink.onclick = null;
        } else {
            videoPreviewText.textContent = "Tidak ada video";
            videoPreviewLink.href = "#";
            videoPreviewLink.style.display = "none";
            videoPreviewLink.onclick = null;
        }
    }

    document.getElementById('productModalTitle').innerText = "Edit Produk";
    document.getElementById('productModal').classList.add('show');
};

// 6. Akun User Logic
window.viewUser = function(email) {
    const users = window.globalUsersData || [];
    const user = users.find(u => u['Email'] === email);
    if (!user) return;

    let dateStr = user['Timestamp'] || '-';
    if(dateStr !== '-') {
        const d = new Date(dateStr);
        if(!isNaN(d)) {
            dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }

    const body = document.getElementById('userModalBody');
    if (body) {
        body.innerHTML = `
            <div class="summary-row"><span>Nama Lengkap</span><strong>${user['Nama Lengkap'] || '-'}</strong></div>
            <div class="summary-row"><span>Email</span><strong>${user['Email'] || '-'}</strong></div>
            <div class="summary-row"><span>Nomor WhatsApp</span><strong>${user['Nomor WhatsApp'] || '-'}</strong></div>
            <div class="summary-row"><span>Password</span><strong>${user['Password'] || '***'}</strong></div>
            <div class="summary-row"><span>Terdaftar Pada</span><strong>${dateStr}</strong></div>
        `;
    }
    const mod = document.getElementById('userModal');
    if (mod) mod.classList.add('show');
};

window.closeUserModal = function() {
    const mod = document.getElementById('userModal');
    if (mod) mod.classList.remove('show');
};

window.editKlien = function(namaInstansi) {
    const mod = document.getElementById('klienModal');
    if (mod) {
        document.getElementById('editKlienOldNama').value = namaInstansi;
        document.getElementById('editKlienNama').value = namaInstansi;
        document.getElementById('editKlienGambar').value = '';
        document.getElementById('editKlienHapusGambar').checked = false;
        mod.classList.add('show');
    }
};

window.closeKlienModal = function() {
    const mod = document.getElementById('klienModal');
    if (mod) mod.classList.remove('show');
};

window.hapusKlien = function(nama) {
    showConfirm(`Apakah Anda yakin ingin menghapus instansi "${nama}"?`, () => {
        showToast('Sedang menghapus...', 'info');
        const payload = new URLSearchParams();
        payload.append('action', 'delete_klien');
        payload.append('nama_instansi', nama);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                showToast('Instansi berhasil dihapus!', 'success');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        });
    });
};

window.deleteUser = function(email) {
    showConfirm(`Apakah Anda yakin ingin menghapus akun dengan email ${email}?\n\nSemua data Pre-Order dan riwayat Pembayaran milik akun ini juga akan otomatis terhapus secara permanen.`, () => {
        showToast('Menghapus akun dan seluruh data terkait...', 'info');
        const payload = new URLSearchParams();
        payload.append('action', 'delete_user');
        payload.append('email', email);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                alert('Akun berhasil dihapus!');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal menghapus akun: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        });
    });
};

window.deletePayment = function(idOrder) {
    showConfirm(`Apakah Anda yakin ingin menghapus data pembayaran untuk pesanan ${idOrder}? Tindakan ini tidak bisa dibatalkan.`, () => {
        showToast('Sedang menghapus data pembayaran...', 'info');
        const payload = new URLSearchParams();
        payload.append('action', 'delete_payment');
        payload.append('id_order', idOrder);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if (data.result === 'success') {
                showToast('Data pembayaran berhasil dihapus!', 'success');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal menghapus: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        });
    });
};

window.deletePO = function(idOrder) {
    showConfirm(`Apakah Anda yakin ingin menghapus pesanan ${idOrder} secara permanen?`, () => {
        showToast('Sedang menghapus pesanan...', 'info');
        const payload = new URLSearchParams();
        payload.append('action', 'delete_po');
        payload.append('id_order', idOrder);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                alert('Pesanan berhasil dihapus!');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal menghapus pesanan: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        });
    });
};

window.deleteAllPO = function() {
    showConfirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data Pre-Order? Tindakan ini tidak bisa dibatalkan!', () => {
        const mod = document.getElementById('passwordModal');
        const input = document.getElementById('adminPasswordInput');
        if (mod && input) {
            input.value = '';
            mod.classList.add('show');
            input.focus();
        }
    });
};

window.closePasswordModal = function() {
    const mod = document.getElementById('passwordModal');
    if (mod) mod.classList.remove('show');
};

window.submitDeleteAllPO = function() {
    const input = document.getElementById('adminPasswordInput');
    if (!input || !input.value) {
        showToast('Password tidak boleh kosong!', 'error');
        return;
    }

    const btn = document.getElementById('btnSubmitPassword');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    const payload = new URLSearchParams();
    payload.append('action', 'delete_all_po');
    payload.append('admin_password', input.value);

    fetch(CONFIG.GAS_URL, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        redirect: 'follow'
    })
    .then(res => res.json())
    .then(data => {
        if (data.result === 'success') {
            showToast('Semua data PO berhasil dihapus!', 'success');
            closePasswordModal();
            if (window.fetchAllData) window.fetchAllData(true, data);
        } else {
            showToast(data.message || 'Gagal menghapus data', 'error');
        }
    })
    .catch(error => {
        console.error(error);
        showToast('Terjadi kesalahan jaringan.', 'error');
    })
    .finally(() => {
        btn.innerHTML = origText;
        btn.disabled = false;
    });
};

// ==========================================
// Pengaturan Ongkir & Bank - Global Functions
// ==========================================

window.updateBankPreview = function() {
    const nama = document.getElementById('bankNama');
    const nomor = document.getElementById('bankNomor');
    const pemilik = document.getElementById('bankPemilik');

    const previewNama = document.getElementById('previewBankNama');
    const previewNomor = document.getElementById('previewBankNomor');
    const previewPemilik = document.getElementById('previewBankPemilik');

    if (previewNama && nama) previewNama.textContent = nama.value || 'BCA';
    if (previewNomor && nomor) previewNomor.textContent = nomor.value || '-';
    if (previewPemilik && pemilik) previewPemilik.textContent = pemilik.value || '-';
};

window.updateOngkirPreview = function() {
    const status = document.getElementById('ongkirStatus');
    const judul = document.getElementById('ongkirJudul');
    const biaya = document.getElementById('ongkirBiaya');

    const previewLabel = document.getElementById('previewOngkirLabel');
    const previewBiaya = document.getElementById('previewOngkirBiaya');

    if (!previewLabel || !previewBiaya) return;

    const isAktif = status && status.value === 'Aktif';
    const judulVal = judul && judul.value ? judul.value : 'Ongkos Kirim';
    const biayaVal = biaya && biaya.value ? parseInt(biaya.value) : 0;

    previewLabel.textContent = judulVal;
    if (!isAktif) {
        previewBiaya.textContent = 'Gratis Ongkir';
        previewBiaya.style.color = '#51cf66';
    } else {
        previewBiaya.textContent = biayaVal > 0 ? 'Rp ' + biayaVal.toLocaleString('id-ID') : 'Rp 0';
        previewBiaya.style.color = '#ffa94d';
    }
};

window.loadPengaturanData = function(pengaturanData) {
    if (!pengaturanData) return;

    const setFieldValue = (id, key) => {
        const el = document.getElementById(id);
        if (el && pengaturanData[key] !== undefined && pengaturanData[key] !== '') {
            el.value = pengaturanData[key];
        }
    };

    setFieldValue('bankNama', 'Bank Nama');
    setFieldValue('bankPemilik', 'Bank Pemilik');
    setFieldValue('bankNomor', 'Bank Nomor');
    setFieldValue('ongkirStatus', 'Ongkir Status');
    setFieldValue('ongkirJudul', 'Ongkir Judul');
    setFieldValue('ongkirBiaya', 'Ongkir Biaya');
    setFieldValue('ongkirKeterangan', 'Ongkir Keterangan');
    setFieldValue('waAdminNomor', 'Whatsapp Admin');

    window.updateBankPreview();
    window.updateOngkirPreview();
};

window.hapusTestimoni = function(timestamp, nama, ulasan) {
    showConfirm(`Apakah Anda yakin ingin menghapus testimoni dari "${nama}"?`, () => {
        showToast('Sedang menghapus testimoni...', 'info');
        const payload = new URLSearchParams();
        payload.append('action', 'delete_testimoni');
        payload.append('timestamp', timestamp);
        payload.append('nama_lengkap', nama);
        payload.append('ulasan', ulasan);

        fetch(CONFIG.GAS_URL, {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            redirect: 'follow'
        })
        .then(res => res.json())
        .then(data => {
            if(data.result === 'success') {
                showToast('Testimoni berhasil dihapus!', 'success');
                if (window.fetchAllData) window.fetchAllData(true, data);
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .catch(error => {
            console.error(error);
            alert('Terjadi kesalahan jaringan.');
        });
    });
};

