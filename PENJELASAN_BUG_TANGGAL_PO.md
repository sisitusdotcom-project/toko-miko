# Penjelasan Bug "Target Selesai" Bernilai "-" & Cara Mengatasinya

Dokumen ini menjelaskan secara rinci mengapa kolom **Target Selesai** (Tanggal PO) sempat menampilkan tanda hubung (`-`) pada panel user dan manajemen PO admin, serta langkah-langkah lengkap untuk memastikan perbaikan terpasang secara sempurna.

---

## 📋 Ringkasan Penyebab Utama

Masalah ini terjadi karena adanya **ketidaksesuaian (mismatch) struktur kolom database Google Sheets** Anda dengan cara aplikasi membaca data. Berikut adalah visualisasi baris header (Baris 1) di sheet `Data_PO` milik Anda:

| Kolom 1 | Kolom 2 | ... | Kolom 10 | Kolom 11 | Kolom 12 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Timestamp | ID Order | ... | Batas Pembayaran | *(Kosong)* | Tanggal PO |

### Mengapa ini memicu bug?
1. **Penyimpanan Data**: Saat pengguna melakukan checkout pesanan baru, aplikasi mengirimkan tanggal target selesai ke **Kolom 11**.
2. **Pembacaan Data (`doGet`)**: Karena Kolom 11 di baris header tidak memiliki nama (kosong), Google Apps Script memetakan datanya sebagai objek dengan nama properti kosong `""`. Sedangkan kolom ke-12 yang bernilai kosong dipetakan sebagai `'Tanggal PO'`.
3. **Hasil di Panel**: Kode lama di panel user dan admin mencari properti bernama `'Tanggal PO'`. Karena properti `'Tanggal PO'` membaca Kolom 12 yang kosong, maka hasilnya selalu tampil sebagai `-`.

---

## 🔍 Kemungkinan Penyebab Lain (Kenapa Masih Tampil "-" Setelah Perbaikan)

Jika Anda sudah memperbarui file kode tetapi masih melihat tanda `-`, berikut adalah beberapa faktor penyebab eksternal yang sering terjadi:

### 1. Cache Browser yang Sangat Kuat (Paling Sering Terjadi)
Karena Anda membuka berkas HTML secara langsung dari folder komputer menggunakan protokol file (`file:///home/mikubuntu/...`), browser Google Chrome atau Firefox cenderung menyimpan cache file JavaScript (`js/dashboard.js` dan `js/admin.js`) secara agresif. Kode perbaikan yang baru Anda simpan belum tentu langsung dijalankan oleh browser.

### 2. Cache Data Lokal (`localStorage`)
Aplikasi kita menggunakan optimasi kecepatan dengan cara menyimpan data sementara di dalam browser (`localStorage`) dengan kunci bernama `userCachedData`. Jika pembaruan data real-time tertunda atau gagal karena koneksi, browser akan terus merender data lama dari cache lokal ini.

### 3. Belum Melakukan Deploy Ulang Google Apps Script (GAS) secara Benar
Jika file `gas.js` diperbarui tetapi proses deploy di Google Apps Script tidak dilakukan sebagai **Versi Baru (New Version)**, maka URL web app Anda akan terus menjalankan kode versi lama.

---

## 🛠️ Langkah-Langkah Perbaikan Lengkap & Pasti Berhasil

Ikuti 3 langkah berikut untuk memastikan semuanya berjalan dengan normal:

### Langkah 1: Bersihkan Kolom Google Sheets Secara Manual (Opsional & Paling Aman)
Untuk merapikan sheet Anda agar tidak bergeser lagi di kemudian hari:
1. Buka Google Spreadsheet tempat database Anda terpusat.
2. Pilih sheet **Data_PO**.
3. Periksa baris paling atas (Baris Header). Jika Anda melihat kolom **Tanggal PO** berada di kolom ke-12 (misalnya kolom L), silakan pindahkan teks tulisan **Tanggal PO** tersebut ke kolom ke-11 (kolom K) agar baris header dan datanya sejajar.
4. Hapus kolom ke-12 jika sudah kosong agar rapi.

### Langkah 2: Lakukan Deploy Ulang Google Apps Script
1. Buka editor Google Apps Script Anda.
2. Pastikan kode di dalam script editor telah disamakan dengan isi berkas terbaru dari `gas.js`.
3. Klik tombol **Deploy** di bagian kanan atas -> pilih **Manage Deployments**.
4. Klik ikon pensil (Edit) di samping deployment aktif Anda.
5. Pada bagian **Version**, pilih **New Version** (Versi Baru). *Langkah ini wajib dilakukan agar Google memperbarui sistem.*
6. Klik tombol **Deploy** di kanan bawah.

### Langkah 3: Lakukan "Hard Reload" di Browser Anda (Wajib)
Untuk membuang file JavaScript lama yang disimpan di cache browser Anda:
* **Google Chrome / Firefox (Linux/Windows)**: Tekan tombol `Ctrl + F5` atau `Ctrl + Shift + R` secara bersamaan saat Anda berada di halaman User Dashboard atau Admin Panel.
* **Safari / macOS**: Tekan `Cmd + Option + E` kemudian `Cmd + R`.

Dengan melakukan **Hard Reload**, browser dipaksa untuk membaca ulang kode JavaScript terbaru dari komputer Anda yang sudah dilengkapi dengan fitur pendeteksi cerdas (fallback).
