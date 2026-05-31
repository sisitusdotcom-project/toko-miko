# System Log Perubahan

Log ini mencatat seluruh perubahan, perbaikan bug, dan penguatan keamanan pada sistem portal Pre-Order Baju Dinas.

## [2026-05-25] Perbaikan Keamanan Route Guard dan Penyelarasan Schema Data PO

### 1. Penguatan Keamanan Akses Profil (Profile Page Protection)
- **File Dimodifikasi**: `js/guard.js`
- **Deskripsi**: Sebelum perubahan ini, halaman `profile.html` tidak dilindungi oleh route guard sehingga pengguna yang belum login (unauthenticated) dapat membukanya secara langsung. Route guard telah diperbarui untuk menyertakan `profile.html` dalam daftar halaman terproteksi. Jika pengguna tidak memiliki role sesi yang valid, sistem akan langsung mengalihkan (redirect) mereka ke `login.html`.
- **Dampak**: Mencegah akses data ilegal bagi pengguna yang belum terautentikasi.

### 2. Penyelarasan Schema Header Data_PO
- **File Dimodifikasi**: `gas.js`
- **Deskripsi**: Pada fungsi penanganan pre-order baru (`doPost` handler), inisialisasi sheet `Data_PO` (jika sheet belum ada) hanya membuat 9 kolom header. Namun, penulisan baris data PO baru menambahkan 11 elemen data (termasuk "Batas Pembayaran" dan "Tanggal PO"). Header inisialisasi diubah menjadi 11 kolom untuk menyelaraskan dengan struktur baris data PO yang ditulis serta fungsi `setup()` awal database.
- **Dampak**: Mencegah misalignment kolom spreadsheet saat sheet dibuat secara dinamis dari request order pertama kali.

## [2026-05-26] Pembaruan Tampilan Status Pending & Penambahan Pengisian Nominal/Diskon PO Admin

### 1. Perubahan Tampilan Pre-Order Pending (User Dashboard)
- **File Dimodifikasi**: `js/dashboard.js`
- **Deskripsi**: Mengubah penulisan status pre-order yang bernilai `"Pending"` menjadi `"Menunggu Verifikasi dari Admin"` pada tampilan kartu riwayat PO dan tampilan detail invoice. Selain itu, menyembunyikan nilai total biaya pada riwayat PO dan invoice dengan menampilkan `"-"` selama pesanan masih dalam status `"Pending"`.
- **Dampak**: Memperjelas status pesanan bagi pengguna dan menghindari kebingungan mengenai total biaya sebelum diverifikasi oleh Admin.

### 2. Form Nominal dan Diskon saat Persetujuan PO (Admin Panel)
- **File Dimodifikasi**: `admin.html`, `js/admin.js`
- **Deskripsi**: Menambahkan input form `"Harga Satuan / Nominal Awal"` dan `"Diskon (%)"` di dalam modal persetujuan pesanan (`verifyModal`). Input nominal ini secara otomatis diisi (pre-filled) berdasarkan harga produk di katalog atau fallback default. Total akhir dihitung secara real-time (`Nominal * (1 - Diskon/100)`) dan dikirimkan sebagai parameter `harga_total` ke backend Google Apps Script saat tombol "Setujui Pesanan" ditekan.
- **Dampak**: Memudahkan admin menentukan harga jahit/pre-order yang disesuaikan serta diskon khusus sebelum pesanan disetujui.

### 3. Pembaruan Status Text, Tombol Hubungi Admin & Pencegahan Klik Kartu Pending (User Dashboard)
- **File Dimodifikasi**: `css/dashboard.css`, `js/dashboard.js`
- **Deskripsi**: 
  - Mengubah teks status `"Menunggu Verifikasi dari Admin"` menjadi `"Menunggu Verifikasi Pesanan"` (untuk pesanan Pending).
  - Mengubah teks status `"Menunggu Verifikasi"` (untuk pembayaran terkirim) menjadi `"Menunggu Verifikasi Pembayaran"`.
  - Mengubah teks tombol submit invoice saat pembayaran terkirim dari `"Menunggu Verifikasi Admin"` menjadi `"Menunggu Verifikasi Pembayaran"`.
  - Menambahkan tombol WhatsApp `"Hubungi Admin (Verifikasi Cepat)"` pada footer kartu pesanan dengan status Pending.
  - Mematikan perilaku klik dan hover pointer pada kartu riwayat pesanan dengan status Pending dengan menghapus class `.clickable-card` dan merestrukturisasi aturan CSS terkait di `dashboard.css`.
- **Dampak**: Memberikan pembedaan status verifikasi pesanan & pembayaran yang lebih jelas, mempermudah pengguna menghubungi admin untuk verifikasi awal, dan mencegah pembukaan form invoice/pembayaran sebelum pesanan diverifikasi.

### 4. Pembaruan Status Text & Aksi Berbeda Per Status Pesanan (Admin Panel)
- **File Dimodifikasi**: `admin.html`, `js/admin.js`
- **Deskripsi**:
  - Mengubah penulisan status `"Pending"` menjadi `"Menunggu Konfirmasi Pesanan"` pada tabel manajemen PO.
  - Mengubah penulisan status `"Menunggu Verifikasi"` menjadi `"Menunggu Konfirmasi Pembayaran"` pada tabel manajemen PO.
  - Mengintegrasikan pengecekan status pembayaran secara dinamis sehingga status PO di tabel admin berubah secara real-time berdasarkan upload bukti pembayaran.
  - Membedakan aksi (tombol tindakan) yang dapat dilakukan oleh Admin berdasarkan status pesanan:
    - **Menunggu Konfirmasi Pesanan**: Tombol Setujui Pesanan (Checkmark), Tolak Pesanan (Xmark), dan Hapus (Trash).
    - **Menunggu Konfirmasi Pembayaran**: Tombol Lihat Bukti Transfer (Image), Setujui Pembayaran (Checkmark), dan Tolak Pembayaran (Xmark).
    - **Status Lainnya (Disetujui/Selesai/Ditolak/Dibatalkan)**: Hanya tombol Hapus (Trash).
  - Memperbarui filter dropdown status pada halaman manajemen PO agar menyertakan semua pilihan status yang valid.
- **Dampak**: Meningkatkan efisiensi kerja admin dengan menghadirkan tindakan yang kontekstual dan relevan untuk setiap tahapan siklus pre-order.

### 5. Isolasi Keranjang Belanja per Akun & Pembatasan Tanggal Pre-Order (User Panel)
- **File Dimodifikasi**: `js/dashboard.js`
- **Deskripsi**:
  - Mengubah kunci penyimpanan keranjang belanja di `localStorage` dari yang awalnya bersifat global (`dashboardCart`) menjadi terisolasi per akun pengguna dengan format `dashboardCart_${currentUserEmail}`. Hal ini mencegah barang di keranjang belanja pengguna sebelumnya tampil saat pengguna lain login atau mendaftar di perangkat yang sama.
  - Membatasi input "Tanggal PO (Target Selesai)" (`cartPoDate`) pada keranjang belanja agar hanya bisa memilih hari esok (H+1) dan seterusnya secara real-time dengan mengatur properti `min` saat modal keranjang dibuka.
  - Menambahkan validasi sisi klien saat tombol kirim preorder diklik, memastikan pengguna tidak dapat memasukkan tanggal hari ini atau hari sebelumnya secara manual/bypass.
- **Dampak**: Menjamin kerahasiaan data keranjang belanja antar akun yang berbeda pada satu perangkat, serta mencegah kesalahan input tanggal target pesanan sebelum hari transaksi berjalan.

### 6. Alur Redireksi Email Terdaftar (Registration & Login Page)
- **File Dimodifikasi**: `js/auth.js`
- **Deskripsi**:
  - Mengintegrasikan deteksi kesalahan pendaftaran ketika email sudah terdaftar. Jika pendaftaran gagal karena email sudah digunakan, sistem akan memicu pemberitahuan Toast `"Email sudah terdaftar, silakan login"`.
  - Mengarahkan pengguna secara otomatis ke halaman `login.html` dengan menyematkan query parameter `email` dan `already_registered=true` setelah penundaan 1,5 detik.
  - Pada halaman login, menambahkan script untuk membaca query parameter tersebut, mengisi input email secara otomatis, serta menampilkan notifikasi Toast `"Email sudah terdaftar, silakan login"` kembali agar pengguna paham bahwa mereka cukup memasukkan password untuk melanjutkan.
- **Dampak**: Memudahkan pengguna yang lupa bahwa mereka telah memiliki akun dengan mengarahkan dan mempermudah proses masuk mereka tanpa harus mengisi ulang alamat email.

### 7. Menghilangkan Lingkaran Kuning Notifikasi setelah Dibaca (User Panel)
- **File Dimodifikasi**: `js/dashboard.js`
- **Deskripsi**:
  - Mengimplementasikan penandaan notifikasi sebagai "dibaca" berbasis waktu (timestamp) per akun dengan kunci `lastReadNotificationsTime_${currentUserEmail}` di `localStorage`.
  - Mengubah fungsi `renderNotifications` agar membandingkan waktu masing-masing notifikasi dengan waktu pembacaan terakhir. Notifikasi hanya dianggap belum dibaca (`isUnread: true`) jika waktu terbitnya lebih baru daripada waktu klik terakhir.
  - Memperbarui event listener pada tombol ikon lonceng notifikasi (`#notifWidgetBtn`) sehingga saat ditekan, sistem secara otomatis menyimpan waktu saat itu ke `localStorage`, menyembunyikan lingkaran kuning (`#topbarNotifBadgeCount`), menyembunyikan badge jumlah (`#notifBadgeCount`), dan menghapus kelas `unread` pada baris notifikasi yang sedang aktif secara instan.
- **Dampak**: Memberikan respons antarmuka yang bersih dan interaktif ketika pengguna memeriksa notifikasi, memastikan lingkaran penanda kuning menghilang secara permanen untuk notifikasi yang sudah dilihat.
