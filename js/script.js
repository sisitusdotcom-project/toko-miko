document.addEventListener('DOMContentLoaded', () => {

    // 0. Auto-update tombol "Masuk" jika sudah login
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('logout_sync')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserEmail');
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserWhatsapp');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const userRole = localStorage.getItem('userRole');
    if (userRole) {
        const authBtn = document.querySelector('a[href="login.html"]');
        if (authBtn) {
            authBtn.innerHTML = '<i class="fa-solid fa-house-user"></i> Dashboard';
            authBtn.href = userRole === 'admin' ? 'admin.html' : 'dashboard.html';
        }
    } else {
        // Cek jika sedang tidak login, pastikan link login/register membawa logout_sync untuk membersihkan isolasi storage
        if (window.location.protocol === 'file:') {
            document.querySelectorAll('a[href^="login.html"], a[href^="register.html"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    let href = link.getAttribute('href');
                    href += (href.includes('?') ? '&' : '?') + 'logout_sync=true';
                    window.location.href = href;
                });
            });
        }
    }
    
    /* 
     ========================================
     1. Countdown Timer Logic
     ========================================
    */
    let timerInterval;

    window.startCountdown = function(targetDateStr) {
        if (timerInterval) clearInterval(timerInterval);
        
        if (!targetDateStr) {
            document.getElementById("countdown").innerHTML = "<div class='time-box' style='padding: 10px 20px;'><span>PROMO</span><small>BERLANGSUNG</small></div>";
            return;
        }

        const targetTime = new Date(targetDateStr).getTime();

        // Cek jika tanggal tidak valid
        if (isNaN(targetTime)) {
            document.getElementById("countdown").innerHTML = "<div class='time-box' style='padding: 10px 20px;'><span>PROMO</span><small>BERLANGSUNG</small></div>";
            return;
        }

        timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance < 0) {
                clearInterval(timerInterval);
                document.getElementById("countdown").innerHTML = "<div class='time-box' style='padding: 10px 20px; min-width: auto; width: 100%;'><span style='font-size: 1.1rem; font-weight: 700; letter-spacing: 0.5px;'>PROMO SUDAH BERAKHIR</span></div>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const dEl = document.getElementById("days");
            const hEl = document.getElementById("hours");
            const mEl = document.getElementById("minutes");
            const sEl = document.getElementById("seconds");

            if(dEl) dEl.innerText = days.toString().padStart(2, '0');
            if(hEl) hEl.innerText = hours.toString().padStart(2, '0');
            if(mEl) mEl.innerText = minutes.toString().padStart(2, '0');
            if(sEl) sEl.innerText = seconds.toString().padStart(2, '0');
        }, 1000);
    };

    /* 
     ========================================
     2. Gallery Filter Logic
     ========================================
    */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                if (filterValue === 'all') {
                    card.classList.remove('hide');
                } else {
                    if (card.getAttribute('data-category') === filterValue) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                }
            });
        });
    });

    /* 
     ========================================
     3. Navbar Scroll Effect
     ========================================
    */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* 
     ========================================
     4. Mobile Menu Toggle
     ========================================
    */
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon between bars and times
            const icon = hamburger.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        const navItems = navLinks.querySelectorAll('a');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }



    /* 
     ========================================
     6. Dynamic Product Loading (GAS)
     ========================================
    */
    function loadProducts() {
        if (typeof CONFIG === 'undefined' || !CONFIG.GAS_URL) {
            console.error('GAS URL tidak ditemukan. Pastikan js/config.js dimuat.');
            return;
        }

        const grid = document.getElementById('productGrid');
        if (!grid) return;

        // Coba memuat dari cache (localStorage) agar tidak ada delay visual
        const cached = localStorage.getItem('landingPageCache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                handleCatalogData(parsed, true);
            } catch(e) {}
        }

        const url = `${CONFIG.GAS_URL}?t=${new Date().getTime()}`;

        fetch(url, { redirect: 'follow' })
            .then(res => res.json())
            .then(data => {
                if (data.result === 'success') {
                    localStorage.setItem('landingPageCache', JSON.stringify(data));
                }
                handleCatalogData(data, false);
            })
            .catch(err => {
                console.warn('Fetch catalog standar diblokir peramban. Beralih ke fallback JSONP...');
                fetchCatalogJSONP();
            });
    }

    function handleCatalogData(data, isSilent = false) {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        if (data.result === 'success') {
            const products = data.data_produk || [];
            if (products.length === 0) {
                grid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1 / -1;">Katalog produk masih kosong.</p>';
                return;
            }

            // 1. Cek Event Aktif
            let eventActive = false;
            let eventDiskon = 0;
            const eventData = data.data_event;
            const banner = document.querySelector('.discount-banner');
            
            if (eventData && eventData['Status'] === 'Aktif') {
                eventActive = true;
                eventDiskon = parseInt(eventData['Diskon (%)'], 10) || 0;
                const bannerText = document.getElementById('eventBannerText');
                if (bannerText) bannerText.innerText = eventData['Nama Event'] || 'Promo Spesial';
                if (banner) banner.style.display = 'inline-flex';
                window.startCountdown(eventData['Batas Waktu']);
            } else {
                if (banner) banner.style.display = 'none';
            }

            // 2. Render Produk
            grid.innerHTML = ''; 
            const categories = new Set();
            
            products.forEach(p => {
                const catRaw = p['Kategori'] || 'Lainnya';
                if (catRaw) categories.add(catRaw);
                
                const cat = catRaw.toLowerCase();
                
                let rawHarga = p['Harga Asli'];
                let hargaAsliStr = "Rp 0";
                let hargaInt = 0;
                
                if (typeof rawHarga === 'number') {
                    hargaInt = rawHarga;
                    hargaAsliStr = "Rp " + hargaInt.toLocaleString('id-ID');
                } else if (typeof rawHarga === 'string') {
                    hargaAsliStr = rawHarga;
                    hargaInt = parseInt(hargaAsliStr.replace(/[^0-9]/g, ''), 10) || 0;
                }
                
                let priceHtml = `<p class="price">${hargaAsliStr}</p>`;
                let badgeHtml = '';
                let finalHargaInt = hargaInt;
                
                if (p['Badge']) {
                    const badgeText = p['Badge'].toLowerCase();
                    const badgeClass = badgeText.includes('diskon') ? 'badge-discount' : 'badge-po';
                    badgeHtml = `<span class="badge ${badgeClass}">${p['Badge']}</span>`;
                }
                
                if (eventActive && eventDiskon > 0) {
                    finalHargaInt = hargaInt - (hargaInt * eventDiskon / 100);
                    const hargaDiskonStr = "Rp " + finalHargaInt.toLocaleString('id-ID');
                    priceHtml = `<p class="price"><del>${hargaAsliStr}</del> <span class="text-danger-color font-weight-bold">${hargaDiskonStr}</span></p>`;
                    
                    if (!badgeHtml) {
                        badgeHtml = `<span class="badge badge-discount">Event Diskon ${eventDiskon}%</span>`;
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
                    <div class="product-card" data-category="${cat}">
                        <div class="product-img-wrap">
                            ${badgeHtml}
                            <img src="${imageUrl}" alt="${p['Nama Produk']}" class="product-img">
                        </div>
                        <div class="product-info">
                            <h3>${p['Nama Produk'] || 'Produk'}</h3>
                            ${priceHtml}
                            ${p['URL Video'] ? `
                            <button class="btn btn-outline-primary btn-sm btn-video-preview" onclick="playProductVideo('${p['URL Video']}')" style="margin-top: 10px; width: 100%; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; font-size: 0.85rem; padding: 6px 12px; cursor: pointer; border: 1px solid var(--primary-color); background: transparent; color: var(--primary-color); transition: var(--transition);">
                                <i class="fa-solid fa-circle-play"></i> Lihat Video
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                grid.innerHTML += cardHtml;
            });

            // 3. Render Filters Dinamis
            const filterContainer = document.getElementById('filterContainer');
            if (filterContainer) {
                filterContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Semua</button>';
                categories.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    btn.setAttribute('data-filter', cat.toLowerCase());
                    btn.innerText = cat;
                    filterContainer.appendChild(btn);
                });
            }

            initFilters();

            // 4. Render Klien / Instansi (Social Proof)
            const klienContainer = document.getElementById('clientLogosContainer');
            const sectionKlien = document.getElementById('social-proof');
            const dataKlien = data.data_klien || [];

            if (klienContainer) {
                if (dataKlien.length > 0) {
                    if (sectionKlien) sectionKlien.style.display = 'block';
                    klienContainer.innerHTML = '';
                    dataKlien.forEach(k => {
                        const namaInstansi = k['Nama Instansi'];
                        const urlGambar = k['URL Gambar'];
                        if (namaInstansi || urlGambar) {
                            const div = document.createElement('div');
                            div.className = 'logo-box';
                            if (urlGambar) {
                                div.innerHTML = `<img src="${urlGambar}" alt="${namaInstansi}" style="max-height: 50px; max-width: 150px; border-radius: 4px; object-fit: contain;">`;
                                div.style.padding = "5px";
                                div.style.background = "transparent";
                                div.style.border = "none";
                                div.title = namaInstansi;
                            } else {
                                div.innerText = namaInstansi;
                            }
                            klienContainer.appendChild(div);
                        }
                    });
                } else {
                    if (sectionKlien) sectionKlien.style.display = 'none';
                }
            }

            // 5. Update Hero Background & Teks
            const dataTampilan = data.data_tampilan || {};
            if (dataTampilan['Hero Background']) {
                const heroSection = document.getElementById('hero');
                if (heroSection) {
                    heroSection.style.backgroundImage = `url('${dataTampilan['Hero Background']}')`;
                    heroSection.style.backgroundSize = 'cover';
                    heroSection.style.backgroundPosition = 'center';
                }
            }
            
            const setHtmlIfExist = (id, key) => { 
                if (dataTampilan[key]) {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = dataTampilan[key];
                }
            };
            
            setHtmlIfExist('dynHeroTitle', 'Hero Title');
            setHtmlIfExist('dynHeroSubtitle', 'Hero Subtitle');
            setHtmlIfExist('dynFooterBrand', 'Footer Brand');
            
            // Render dynNavbarBrand dengan logo (jika ada)
            const navbarBrand = document.getElementById('dynNavbarBrand');
            if (navbarBrand) {
                const brandText = dataTampilan['Footer Brand'] || 'Dinas<span>Custom.</span>';
                const logoUrl = dataTampilan['Logo Brand'];
                let logoHtml = '';
                if (logoUrl) {
                    logoHtml = `<img id="dynNavbarLogo" src="${logoUrl}" alt="Logo" style="height: 38px; object-fit: contain; margin-right: 8px;">`;
                    
                    // Perbarui favicon global
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                    link.href = logoUrl;
                }
                navbarBrand.innerHTML = `${logoHtml}<span>${brandText}</span>`;
            }
            setHtmlIfExist('dynFooterDesc', 'Footer Description');
            
            if(dataTampilan['Footer WhatsApp']) {
                const el = document.getElementById('dynFooterWA');
                if(el) el.innerHTML = `<i class="fa-brands fa-whatsapp"></i> ${dataTampilan['Footer WhatsApp']}`;
            }
            if(dataTampilan['Footer Instagram']) {
                const el = document.getElementById('dynFooterIG');
                if(el) el.innerHTML = `<i class="fa-brands fa-instagram"></i> ${dataTampilan['Footer Instagram']}`;
            }
            if(dataTampilan['Footer Email']) {
                const el = document.getElementById('dynFooterEmail');
                if(el) el.innerHTML = `<i class="fa-regular fa-envelope"></i> ${dataTampilan['Footer Email']}`;
            }
            
            setHtmlIfExist('dynFooterCopy', 'Footer Copyright');
            
            // 6. Render Testimoni Dinamik
            const testimonialGrid = document.getElementById('testimonialGrid');
            const dataTestimoni = data.data_testimoni || [];
            if (testimonialGrid && dataTestimoni.length > 0) {
                testimonialGrid.innerHTML = '';
                // Urutkan dari yang terbaru ke terlama
                for (let i = dataTestimoni.length - 1; i >= 0; i--) {
                    const row = dataTestimoni[i];
                    const nama = row['Nama Lengkap'] || 'Pelanggan';
                    const ulasan = row['Ulasan'] || '';
                    const bintang = parseInt(row['Bintang']) || 5;

                    let starsHtml = '';
                    for (let s = 0; s < 5; s++) {
                        if (s < bintang) {
                            starsHtml += '<i class="fa-solid fa-star"></i>';
                        } else {
                            starsHtml += '<i class="fa-regular fa-star"></i>';
                        }
                    }

                    const card = document.createElement('div');
                    card.className = 'testi-card';
                    card.innerHTML = `
                        <div style="color: #ffc107; margin-bottom: 8px; font-size: 0.9rem;">${starsHtml}</div>
                        <p class="quote">"${ulasan}"</p>
                        <div class="author">
                            <strong>${nama}</strong>
                        </div>
                    `;
                    testimonialGrid.appendChild(card);
                }
            }

        } else {
            grid.innerHTML = `<p class="text-center text-danger" style="grid-column: 1 / -1;">Gagal memuat produk: ${data.message}</p>`;
        }
    }

    function fetchCatalogJSONP() {
        const grid = document.getElementById('productGrid');
        const callbackName = 'gasCatalogCallback_' + Math.round(1000000 * Math.random());
        window[callbackName] = function(data) {
            delete window[callbackName];
            if (data && data.result === 'success') {
                localStorage.setItem('landingPageCache', JSON.stringify(data));
            }
            handleCatalogData(data, false);
        };

        const script = document.createElement('script');
        script.src = `${CONFIG.GAS_URL}?callback=${callbackName}&t=${Date.now()}`;
        script.onerror = function() {
            delete window[callbackName];
            if (grid) grid.innerHTML = `<p class="text-center text-danger" style="grid-column: 1 / -1;">Terjadi kesalahan jaringan atau CORS. Pastikan skrip backend gas.js terbaru telah di-deploy.</p>`;
        };
        document.body.appendChild(script);
    }



    function initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const productCards = document.querySelectorAll('.product-card');

        filterBtns.forEach(btn => {
            // Re-attach fresh listener
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');

                const filterValue = newBtn.getAttribute('data-filter');

                productCards.forEach(card => {
                    if (filterValue === 'all') {
                        card.classList.remove('hide');
                    } else {
                        if (card.getAttribute('data-category').toLowerCase().includes(filterValue)) {
                            card.classList.remove('hide');
                        } else {
                            card.classList.add('hide');
                        }
                    }
                });
            });
        });
    }

    // Panggil fetch saat load
    loadProducts();

});

window.playProductVideo = function(videoUrl) {
    const modal = document.getElementById('videoPreviewModal');
    const playerContainer = document.getElementById('videoPreviewContainer');
    if (!modal || !playerContainer) return;
    
    let embedUrl = videoUrl;
    if (videoUrl.includes('drive.google.com') && !videoUrl.includes('/preview') && !videoUrl.includes('export=view')) {
        const match = videoUrl.match(/id=([^&]+)/) || videoUrl.match(/\/file\/d\/([^\/]+)/);
        if (match && match[1]) {
            embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    
    if (embedUrl.includes('drive.google.com/file/d/') && embedUrl.includes('/preview')) {
        playerContainer.innerHTML = `<iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="autoplay"></iframe>`;
    } else {
        playerContainer.innerHTML = `<video src="${embedUrl}" controls autoplay style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></video>`;
    }
    
    modal.classList.add('show');
};

window.closeVideoPreviewModal = function() {
    const modal = document.getElementById('videoPreviewModal');
    const playerContainer = document.getElementById('videoPreviewContainer');
    if (playerContainer) playerContainer.innerHTML = '';
    if (modal) modal.classList.remove('show');
};
