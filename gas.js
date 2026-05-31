// ==========================================
// Google Apps Script (GAS) untuk Backend Web PO Baju Dinas
// ==========================================

const SHEET_USERS = "Data_Users"; // Sheet untuk data registrasi
const SHEET_PO = "Data_PO";       // Sheet untuk data pre-order
const SHEET_PEMBAYARAN = "Data_Pembayaran"; // Sheet untuk verifikasi pembayaran
const SHEET_PRODUK = "Data_Produk"; // Sheet untuk katalog produk
const SHEET_EVENT = "Data_Event"; // Sheet untuk diskon global
const SHEET_KLIEN = "Data_Klien"; // Sheet untuk daftar klien / instansi
const SHEET_TAMPILAN = "Data_Tampilan"; // Sheet untuk pengaturan tampilan web
const SHEET_PENGATURAN = "Data_Pengaturan"; // Sheet untuk pengaturan ongkir & bank
const SHEET_TESTIMONI = "Data_Testimoni"; // Sheet untuk ulasan pelanggan

// Fungsi untuk upload gambar ke Google Drive
function saveImageToDrive(base64Data, filename, mimeType) {
  try {
    const folderName = "PO_Baju_Images";
    let folders = DriveApp.getFoldersByName(folderName);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    // Hapus prefix data:image/...;base64, jika ada
    let cleanBase64 = base64Data;
    if (base64Data.indexOf(",") > -1) {
      cleanBase64 = base64Data.split(",")[1];
    }
    
    const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType || "image/png", filename || ("img_" + new Date().getTime() + ".png"));
    const file = folder.createFile(blob);
    // Pastikan file bisa diakses publik
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return thumbnail link yang bisa di-embed di img src tanpa masalah CORS/CORP
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  } catch(e) {
    throw new Error("Gagal upload gambar ke Drive: " + e.toString());
  }
}

// Fungsi untuk upload video ke Google Drive
function saveVideoToDrive(base64Data, filename, mimeType) {
  try {
    const folderName = "PO_Baju_Videos";
    let folders = DriveApp.getFoldersByName(folderName);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    let cleanBase64 = base64Data;
    if (base64Data.indexOf(",") > -1) {
      cleanBase64 = base64Data.split(",")[1];
    }
    
    const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType || "video/mp4", filename || ("video_" + new Date().getTime() + ".mp4"));
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return "https://drive.google.com/uc?export=view&id=" + file.getId();
  } catch(e) {
    throw new Error("Gagal upload video ke Drive: " + e.toString());
  }
}

// Fungsi khusus untuk dipicu (Run) pertama kali agar Google meminta Izin Akses
function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Sheet Registrasi
  let sheetUsers = doc.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = doc.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(["Timestamp", "Nama Lengkap", "Nomor WhatsApp", "Email", "Password"]);
    sheetUsers.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Setup Sheet PO
  let sheetPO = doc.getSheetByName(SHEET_PO);
  if (!sheetPO) {
    sheetPO = doc.insertSheet(SHEET_PO);
    sheetPO.appendRow(["Timestamp", "ID Order", "Nama Lengkap", "Kategori", "Produk", "Ukuran", "Status", "Harga Total", "Alasan Ditolak", "Batas Pembayaran", "Tanggal PO"]);
    sheetPO.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#f3f3f3");
  } else {
    if (sheetPO.getLastColumn() < 11 || sheetPO.getRange(1, 11).getValue() !== "Tanggal PO") {
      sheetPO.getRange(1, 11).setValue("Tanggal PO");
      sheetPO.getRange(1, 11).setFontWeight("bold").setBackground("#f3f3f3");
    }
  }

  // Setup Sheet Pembayaran
  let sheetPembayaran = doc.getSheetByName(SHEET_PEMBAYARAN);
  if (!sheetPembayaran) {
    sheetPembayaran = doc.insertSheet(SHEET_PEMBAYARAN);
    sheetPembayaran.appendRow(["Timestamp", "ID Order", "Nama Lengkap", "Nama Produk", "Jumlah Bayar", "Bukti Transfer", "Status Verifikasi", "Tanggal Verifikasi"]);
    sheetPembayaran.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Setup Sheet Produk
  let sheetProduk = doc.getSheetByName(SHEET_PRODUK);
  if (!sheetProduk) {
    sheetProduk = doc.insertSheet(SHEET_PRODUK);
    sheetProduk.appendRow(["ID Produk", "Kategori", "Nama Produk", "Harga Asli", "Harga Diskon", "Badge", "URL Gambar", "Ukuran"]);
    sheetProduk.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Setup Sheet Event
  let sheetEvent = doc.getSheetByName(SHEET_EVENT);
  if (!sheetEvent) {
    sheetEvent = doc.insertSheet(SHEET_EVENT);
    sheetEvent.appendRow(["Nama Event", "Status", "Diskon (%)", "Batas Waktu"]);
    sheetEvent.appendRow(["Promo Spesial", "Nonaktif", "10", ""]); // Default row
    sheetEvent.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Setup Sheet Klien
  let sheetKlien = doc.getSheetByName(SHEET_KLIEN);
  if (!sheetKlien) {
    sheetKlien = doc.insertSheet(SHEET_KLIEN);
    sheetKlien.appendRow(["Timestamp", "Nama Instansi", "URL Gambar"]);
    sheetKlien.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Setup Sheet Tampilan
  let sheetTampilan = doc.getSheetByName(SHEET_TAMPILAN);
  if (!sheetTampilan) {
    sheetTampilan = doc.insertSheet(SHEET_TAMPILAN);
    sheetTampilan.appendRow(["Bagian", "Nilai", "Update Terakhir"]);
    sheetTampilan.appendRow(["Hero Background", "", new Date()]);
    sheetTampilan.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Setup Sheet Pengaturan (Ongkir & Bank)
  let sheetPengaturan = doc.getSheetByName(SHEET_PENGATURAN);
  if (!sheetPengaturan) {
    sheetPengaturan = doc.insertSheet(SHEET_PENGATURAN);
    sheetPengaturan.appendRow(["Kunci", "Nilai", "Update Terakhir"]);
    sheetPengaturan.appendRow(["Bank Nama", "BCA", new Date()]);
    sheetPengaturan.appendRow(["Bank Pemilik", "", new Date()]);
    sheetPengaturan.appendRow(["Bank Nomor", "", new Date()]);
    sheetPengaturan.appendRow(["Ongkir Status", "Nonaktif", new Date()]);
    sheetPengaturan.appendRow(["Ongkir Judul", "Ongkos Kirim", new Date()]);
    sheetPengaturan.appendRow(["Ongkir Biaya", "0", new Date()]);
    sheetPengaturan.appendRow(["Ongkir Keterangan", "", new Date()]);
    sheetPengaturan.appendRow(["Whatsapp Admin", "628123456789", new Date()]);
    sheetPengaturan.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Setup Sheet Testimoni
  let sheetTestimoni = doc.getSheetByName(SHEET_TESTIMONI);
  if (!sheetTestimoni) {
    sheetTestimoni = doc.insertSheet(SHEET_TESTIMONI);
    sheetTestimoni.appendRow(["Timestamp", "Nama Lengkap", "Bintang", "Ulasan"]);
    sheetTestimoni.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
    // Default row
    sheetTestimoni.appendRow([new Date(), "Bpk. Ahmad", 5, "Jahitannya sangat rapi, bahannya adem dan ukurannya pas banget di badan. Proses PO juga transparan."]);
    sheetTestimoni.appendRow([new Date(), "Ibu Siti", 5, "Sangat puas dengan PDL yang dipesan. Kuat untuk dipakai di lapangan dan desainnya terlihat gagah."]);
  }
  
  Logger.log("Setup berhasil. Sheet dan Header sudah dibuat.");
}

function doPost(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const data = e.parameter;
    const action = data.action; // Parameter pembeda (register, po, upload_payment, dll)

    if (action === "register") {
      // 1. Menangani Pendaftaran (Register)
      let sheet = doc.getSheetByName(SHEET_USERS);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_USERS);
        sheet.appendRow(["Timestamp", "Nama Lengkap", "Nomor WhatsApp", "Email", "Password"]);
        sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      // Hindari duplikasi email
      const dataRange = sheet.getDataRange().getValues();
      for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][3] === data.email) {
          return ContentService.createTextOutput(JSON.stringify({ 
            "result": "error", 
            "message": "Email sudah terdaftar!" 
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      sheet.appendRow([
        new Date(),
        data.nama || "-",
        data.whatsapp || "-",
        data.email || "-",
        data.password || "-"
      ]);

    } else if (action === "login") {
      let sheet = doc.getSheetByName(SHEET_USERS);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ 
          "result": "error", 
          "message": "Database pengguna belum ada!" 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const dataRange = sheet.getDataRange().getValues();
      let foundUser = null;
      let inputEmail = data.email ? data.email.toString().trim().toLowerCase() : "";
      let inputPassword = data.password ? data.password.toString() : "";

      for (let i = 1; i < dataRange.length; i++) {
        let sheetEmail = dataRange[i][3] ? dataRange[i][3].toString().trim().toLowerCase() : "";
        let sheetPassword = dataRange[i][4] ? dataRange[i][4].toString() : "";

        if (sheetEmail === inputEmail) {
          if (sheetPassword === inputPassword) {
            foundUser = {
              nama: dataRange[i][1],
              whatsapp: dataRange[i][2],
              email: dataRange[i][3]
            };
            break;
          } else {
            return ContentService.createTextOutput(JSON.stringify({ 
              "result": "error", 
              "message": "Password salah!" 
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      if (foundUser) {
        return ContentService.createTextOutput(JSON.stringify({ 
          "result": "success", 
          "user": foundUser
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 
          "result": "error", 
          "message": "Email tidak terdaftar!" 
        })).setMimeType(ContentService.MimeType.JSON);
      }

    } else if (action === "add_product") {
      let sheet = doc.getSheetByName(SHEET_PRODUK);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_PRODUK);
        sheet.appendRow(["ID Produk", "Kategori", "Nama Produk", "Harga Asli", "Harga Diskon", "Badge", "URL Gambar", "Ukuran", "URL Video"]);
        sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const productId = "PROD-" + new Date().getTime();
      let imageUrl = data.url_gambar || "";
      if (data.image_base64) {
        imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
      }
      let videoUrl = "";
      if (data.video_base64) {
        videoUrl = saveVideoToDrive(data.video_base64, data.video_name, data.video_mimetype);
      }

      const headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
      let ukuranCol = headerRow.indexOf("Ukuran") + 1;
      if (ukuranCol === 0) {
        sheet.getRange(1, headerRow.length + 1).setValue("Ukuran");
        sheet.getRange(1, headerRow.length + 1).setFontWeight("bold").setBackground("#f3f3f3");
        ukuranCol = headerRow.length + 1;
      }

      const headerRowUpdated = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
      let videoCol = headerRowUpdated.indexOf("URL Video") + 1;
      if (videoCol === 0) {
        sheet.getRange(1, headerRowUpdated.length + 1).setValue("URL Video");
        sheet.getRange(1, headerRowUpdated.length + 1).setFontWeight("bold").setBackground("#f3f3f3");
        videoCol = headerRowUpdated.length + 1;
      }

      const newRowIdx = sheet.getLastRow() + 1;
      sheet.getRange(newRowIdx, 1).setValue(productId);
      sheet.getRange(newRowIdx, 2).setValue(data.kategori || "-");
      sheet.getRange(newRowIdx, 3).setValue(data.nama_produk || "-");
      sheet.getRange(newRowIdx, 4).setValue(data.harga_asli || "0");
      sheet.getRange(newRowIdx, 5).setValue("");
      sheet.getRange(newRowIdx, 6).setValue(data.badge || "");
      sheet.getRange(newRowIdx, 7).setValue(imageUrl);
      sheet.getRange(newRowIdx, ukuranCol).setValue(data.ukuran || "-");
      sheet.getRange(newRowIdx, videoCol).setValue(videoUrl);

    } else if (action === "edit_product") {
      let sheet = doc.getSheetByName(SHEET_PRODUK);
      if (sheet) {
        const values = sheet.getDataRange().getValues();
        let targetRow = -1;
        for (let i = 1; i < values.length; i++) {
          if (values[i][0] === data.id_produk) {
            targetRow = i + 1;
            break;
          }
        }

        if (targetRow > -1) {
          sheet.getRange(targetRow, 2).setValue(data.kategori || "-");
          sheet.getRange(targetRow, 3).setValue(data.nama_produk || "-");
          sheet.getRange(targetRow, 4).setValue(data.harga_asli || "0");
          sheet.getRange(targetRow, 6).setValue(data.badge || "");
          
          const headerRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
          let ukuranCol = headerRow.indexOf("Ukuran") + 1;
          if (ukuranCol === 0) {
            sheet.getRange(1, headerRow.length + 1).setValue("Ukuran");
            sheet.getRange(1, headerRow.length + 1).setFontWeight("bold").setBackground("#f3f3f3");
            ukuranCol = headerRow.length + 1;
          }
          sheet.getRange(targetRow, ukuranCol).setValue(data.ukuran || "-");
          
          const headerRowUpdated = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
          let videoCol = headerRowUpdated.indexOf("URL Video") + 1;
          if (videoCol === 0) {
            sheet.getRange(1, headerRowUpdated.length + 1).setValue("URL Video");
            sheet.getRange(1, headerRowUpdated.length + 1).setFontWeight("bold").setBackground("#f3f3f3");
            videoCol = headerRowUpdated.length + 1;
          }
          
          if (data.image_base64) {
            const imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
            sheet.getRange(targetRow, 7).setValue(imageUrl);
          }
          if (data.video_base64) {
            const videoUrl = saveVideoToDrive(data.video_base64, data.video_name, data.video_mimetype);
            sheet.getRange(targetRow, videoCol).setValue(videoUrl);
          }
        }
      }

    } else if (action === "update_event") {
      let sheet = doc.getSheetByName(SHEET_EVENT);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_EVENT);
        sheet.appendRow(["Nama Event", "Status", "Diskon (%)", "Batas Waktu"]);
        sheet.appendRow(["Promo Spesial", "Nonaktif", "10", ""]);
        sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
      }
      sheet.getRange(2, 1).setValue(data.nama_event || "Promo");
      sheet.getRange(2, 2).setValue(data.status_event || "Nonaktif");
      sheet.getRange(2, 3).setValue(data.diskon_event || "0");
      sheet.getRange(2, 4).setValue(data.batas_waktu || "");

    } else if (action === "add_klien") {
      let sheet = doc.getSheetByName(SHEET_KLIEN);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_KLIEN);
        sheet.appendRow(["Timestamp", "Nama Instansi", "URL Gambar"]);
        sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
      }
      let imageUrl = "";
      if (data.image_base64) {
        imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
      }
      sheet.appendRow([new Date(), data.nama_instansi, imageUrl]);

    } else if (action === "update_hero") {
      let sheet = doc.getSheetByName(SHEET_TAMPILAN);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_TAMPILAN);
        sheet.appendRow(["Bagian", "Nilai", "Update Terakhir"]);
        sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
      }
      let imageUrl = "";
      if (data.image_base64) {
        imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
      }
      
      const values = sheet.getDataRange().getValues();
      let rowUpdated = false;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === "Hero Background") {
           sheet.getRange(i + 1, 2).setValue(imageUrl);
           sheet.getRange(i + 1, 3).setValue(new Date());
           rowUpdated = true;
           break;
        }
      }
      if(!rowUpdated) {
         sheet.appendRow(["Hero Background", imageUrl, new Date()]);
      }

    } else if (action === "update_logo") {
      let sheet = doc.getSheetByName(SHEET_TAMPILAN);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_TAMPILAN);
        sheet.appendRow(["Bagian", "Nilai", "Update Terakhir"]);
        sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
      }
      let imageUrl = "";
      if (data.image_base64) {
        imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
      }
      
      const values = sheet.getDataRange().getValues();
      let rowUpdated = false;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === "Logo Brand") {
           sheet.getRange(i + 1, 2).setValue(imageUrl);
           sheet.getRange(i + 1, 3).setValue(new Date());
           rowUpdated = true;
           break;
        }
      }
      if(!rowUpdated) {
         sheet.appendRow(["Logo Brand", imageUrl, new Date()]);
      }

    } else if (action === "update_klien") {
      let sheet = doc.getSheetByName(SHEET_KLIEN);
      if (sheet) {
        const values = sheet.getDataRange().getValues();
        let found = false;
        for (let i = 1; i < values.length; i++) {
          if (values[i][1] === data.old_nama_instansi) {
            sheet.getRange(i + 1, 2).setValue(data.nama_instansi);
            if (data.image_base64) {
               if (data.image_base64 === "delete_image") {
                  sheet.getRange(i + 1, 3).setValue("");
               } else {
                  let imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
                  sheet.getRange(i + 1, 3).setValue(imageUrl);
               }
            }
            found = true;
            break;
          }
        }
        if (!found) {
           throw new Error("Instansi tidak ditemukan.");
        }
      }

    } else if (action === "update_tampilan_teks") {
      let sheet = doc.getSheetByName(SHEET_TAMPILAN);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_TAMPILAN);
        sheet.appendRow(["Bagian", "Nilai", "Update Terakhir"]);
        sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      let teksDataStr = data.teks_data;
      if (teksDataStr) {
         let teksObj = JSON.parse(teksDataStr);
         const values = sheet.getDataRange().getValues();
         
         for (let key in teksObj) {
            let rowUpdated = false;
            for (let i = 1; i < values.length; i++) {
              if (values[i][0] === key) {
                 sheet.getRange(i + 1, 2).setValue(teksObj[key]);
                 sheet.getRange(i + 1, 3).setValue(new Date());
                 rowUpdated = true;
                 break;
              }
            }
            if (!rowUpdated) {
               sheet.appendRow([key, teksObj[key], new Date()]);
            }
         }
      }

    } else if (action === "update_pengaturan") {
      // Menyimpan pengaturan ongkir / bank ke Sheet Data_Pengaturan
      let sheet = doc.getSheetByName(SHEET_PENGATURAN);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_PENGATURAN);
        sheet.appendRow(["Kunci", "Nilai", "Update Terakhir"]);
        sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
      }

      let dataStr = data.pengaturan_data;
      if (dataStr) {
        let dataObj = JSON.parse(dataStr);
        const values = sheet.getDataRange().getValues();

        for (let key in dataObj) {
          let rowUpdated = false;
          for (let i = 1; i < values.length; i++) {
            if (values[i][0] === key) {
              sheet.getRange(i + 1, 2).setValue(dataObj[key]);
              sheet.getRange(i + 1, 3).setValue(new Date());
              rowUpdated = true;
              break;
            }
          }
          if (!rowUpdated) {
            sheet.appendRow([key, dataObj[key], new Date()]);
          }
        }
      }

    } else if (action === "delete_klien") {
      let sheet = doc.getSheetByName(SHEET_KLIEN);
      if (sheet) {
        const values = sheet.getDataRange().getValues();
        for (let i = 1; i < values.length; i++) {
          if (values[i][1] === data.nama_instansi) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }

    } else if (action === "verify_po") {
      // Verifikasi PO (Disetujui/Ditolak dari tabel PO)
      let sheetPO = doc.getSheetByName(SHEET_PO);
      if (sheetPO) {
        const valuesPO = sheetPO.getDataRange().getValues();
        const headerRow = valuesPO[0];
        let alasanCol = headerRow.indexOf("Alasan Ditolak") + 1;
        if (alasanCol === 0) {
          sheetPO.getRange(1, sheetPO.getLastColumn() + 1).setValue("Alasan Ditolak");
          alasanCol = sheetPO.getLastColumn();
        }
        let batasCol = headerRow.indexOf("Batas Pembayaran") + 1;
        if (batasCol === 0) {
          sheetPO.getRange(1, sheetPO.getLastColumn() + 1).setValue("Batas Pembayaran");
          batasCol = sheetPO.getLastColumn();
        }
        let diskonCol = headerRow.indexOf("Diskon") + 1;
        if (diskonCol === 0) {
          sheetPO.getRange(1, sheetPO.getLastColumn() + 1).setValue("Diskon");
          diskonCol = sheetPO.getLastColumn();
        }
        let ongkirCol = headerRow.indexOf("Ongkir") + 1;
        if (ongkirCol === 0) {
          sheetPO.getRange(1, sheetPO.getLastColumn() + 1).setValue("Ongkir");
          ongkirCol = sheetPO.getLastColumn();
        }

        for (let i = 1; i < valuesPO.length; i++) {
          if (valuesPO[i][1] === data.id_order) {
            sheetPO.getRange(i + 1, 7).setValue(data.status_po || "Disetujui");
            if (data.harga_total) {
              sheetPO.getRange(i + 1, 8).setValue(data.harga_total);
            }
            if (data.status_po === "Ditolak") {
              sheetPO.getRange(i + 1, alasanCol).setValue(data.alasan_tolak || "-");
              sheetPO.getRange(i + 1, batasCol).setValue("");
            } else {
              sheetPO.getRange(i + 1, alasanCol).setValue(""); // Clear reason if approved
              sheetPO.getRange(i + 1, batasCol).setValue(data.batas_pembayaran || "");
              sheetPO.getRange(i + 1, diskonCol).setValue(data.diskon || "0");
              sheetPO.getRange(i + 1, ongkirCol).setValue(data.ongkir || "0");
            }
            break;
          }
        }
      }

    } else if (action === "upload_payment") {
      // Upload Bukti Pembayaran ke Sheet Khusus Data_Pembayaran
      let sheetPembayaran = doc.getSheetByName(SHEET_PEMBAYARAN);
      if (!sheetPembayaran) {
        sheetPembayaran = doc.insertSheet(SHEET_PEMBAYARAN);
        sheetPembayaran.appendRow(["Timestamp", "ID Order", "Nama Lengkap", "Nama Produk", "Jumlah Bayar", "Bukti Transfer", "Status Verifikasi", "Tanggal Verifikasi"]);
        sheetPembayaran.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f3f3");
      }

      if (data.image_base64 && data.id_order) {
        const imageUrl = saveImageToDrive(data.image_base64, data.image_name, data.image_mimetype);
        
        // Cari apakah id_order sudah ada di Data_Pembayaran
        const valuesPem = sheetPembayaran.getDataRange().getValues();
        let targetRowPem = -1;
        for (let i = 1; i < valuesPem.length; i++) {
          if (valuesPem[i][1] === data.id_order) {
            targetRowPem = i + 1;
            break;
          }
        }

        if (targetRowPem > -1) {
          // Update baris yang sudah ada
          sheetPembayaran.getRange(targetRowPem, 1).setValue(new Date());
          sheetPembayaran.getRange(targetRowPem, 5).setValue(data.jumlah_bayar || "0");
          sheetPembayaran.getRange(targetRowPem, 6).setValue(imageUrl);
          sheetPembayaran.getRange(targetRowPem, 7).setValue("Menunggu Verifikasi");
          sheetPembayaran.getRange(targetRowPem, 8).setValue("-");
        } else {
          // Tambah baris baru
          sheetPembayaran.appendRow([
            new Date(),
            data.id_order,
            data.nama_lengkap || "-",
            data.nama_produk || "-",
            data.jumlah_bayar || "0",
            imageUrl,
            "Menunggu Verifikasi",
            "-"
          ]);
        }

        // Sinkronisasi status di Data_PO
        let sheetPO = doc.getSheetByName(SHEET_PO);
        if (sheetPO) {
          const valuesPO = sheetPO.getDataRange().getValues();
          for (let i = 1; i < valuesPO.length; i++) {
            if (valuesPO[i][1] === data.id_order) {
              sheetPO.getRange(i + 1, 7).setValue("Menunggu Verifikasi");
              break;
            }
          }
        }
      }

    } else if (action === "verify_payment") {
      // Admin memverifikasi pembayaran dari sheet Data_Pembayaran
      const newStatus = data.status_pembayaran || "Selesai"; // "Selesai" atau "Ditolak"
      const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Update Data_Pembayaran
      let sheetPembayaran = doc.getSheetByName(SHEET_PEMBAYARAN);
      if (sheetPembayaran) {
        const valuesPem = sheetPembayaran.getDataRange().getValues();
        const headersPem = valuesPem[0];
        
        let alasanIdx = headersPem.indexOf("Alasan Ditolak");
        if (alasanIdx === -1) {
          sheetPembayaran.getRange(1, headersPem.length + 1).setValue("Alasan Ditolak");
          sheetPembayaran.getRange(1, headersPem.length + 1).setFontWeight("bold").setBackground("#f3f3f3");
          alasanIdx = headersPem.length;
        }

        for (let i = 1; i < valuesPem.length; i++) {
          if (valuesPem[i][1] === data.id_order) {
            sheetPembayaran.getRange(i + 1, 7).setValue(newStatus);
            sheetPembayaran.getRange(i + 1, 8).setValue(nowStr);
            sheetPembayaran.getRange(i + 1, alasanIdx + 1).setValue(newStatus === "Ditolak" ? (data.alasan_tolak || "") : "");
            break;
          }
        }
      }

      // Update Data_PO
      let sheetPO = doc.getSheetByName(SHEET_PO);
      if (sheetPO) {
        const valuesPO = sheetPO.getDataRange().getValues();
        for (let i = 1; i < valuesPO.length; i++) {
          if (valuesPO[i][1] === data.id_order) {
            // Jika pembayaran ditolak, status PO dikembalikan ke "Disetujui" agar user bisa re-upload
            const nextPOStatus = (newStatus === "Ditolak") ? "Disetujui" : "Selesai";
            sheetPO.getRange(i + 1, 7).setValue(nextPOStatus);
            break;
          }
        }
      }

    } else if (action === "delete_product") {
      let sheet = doc.getSheetByName(SHEET_PRODUK);
      if (sheet) {
        const values = sheet.getDataRange().getValues();
        for (let i = 1; i < values.length; i++) {
          if (values[i][0] === data.id_produk) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }

    } else if (action === "delete_user") {
      let sheetUsers = doc.getSheetByName(SHEET_USERS);
      let userNameToDelete = null;

      if (sheetUsers) {
        const valuesUsers = sheetUsers.getDataRange().getValues();
        // values[i][3] corresponds to the Email column
        for (let i = 1; i < valuesUsers.length; i++) {
          if (valuesUsers[i][3] === data.email) {
            userNameToDelete = valuesUsers[i][1]; // Ambil Nama Lengkap
            sheetUsers.deleteRow(i + 1);
            break;
          }
        }
      }

      if (userNameToDelete) {
        // Langkah 1: Kumpulkan semua ID Order milik user dari Data_PO
        let userOrderIds = [];
        let sheetPO = doc.getSheetByName(SHEET_PO);
        if (sheetPO) {
          const valuesPO = sheetPO.getDataRange().getValues();
          for (let i = 1; i < valuesPO.length; i++) {
            if (valuesPO[i][2] === userNameToDelete) { // Kolom Nama Lengkap (index 2)
              userOrderIds.push(valuesPO[i][1]); // Kolom ID Order (index 1)
            }
          }
        }

        // Langkah 2: Hapus semua data Pembayaran yang ID Order-nya milik user ini
        if (userOrderIds.length > 0) {
          let sheetPembayaran = doc.getSheetByName(SHEET_PEMBAYARAN);
          if (sheetPembayaran) {
            const valuesPem = sheetPembayaran.getDataRange().getValues();
            // Loop dari belakang agar index tidak bergeser
            for (let i = valuesPem.length - 1; i >= 1; i--) {
              if (userOrderIds.indexOf(valuesPem[i][1]) !== -1) { // Kolom ID Order di Pembayaran (index 1)
                sheetPembayaran.deleteRow(i + 1);
              }
            }
          }
        }

        // Langkah 3: Hapus semua data Pre-Order milik user
        if (sheetPO) {
          // Reload nilai karena mungkin ada perubahan dari Langkah 1
          const valuesPOFresh = sheetPO.getDataRange().getValues();
          for (let i = valuesPOFresh.length - 1; i >= 1; i--) {
            if (valuesPOFresh[i][2] === userNameToDelete) {
              sheetPO.deleteRow(i + 1);
            }
          }
        }
      }

    } else if (action === "update_profile") {
      let sheetUsers = doc.getSheetByName(SHEET_USERS);
      if (sheetUsers) {
        const valuesUsers = sheetUsers.getDataRange().getValues();
        let foundIndex = -1;
        for (let i = 1; i < valuesUsers.length; i++) {
          if (valuesUsers[i][3] === data.old_email) { // Email di kolom ke-4 (index 3)
            foundIndex = i;
            break;
          }
        }
        if (foundIndex !== -1) {
          // Update Nama Lengkap (kolom 2 / index 1), Email (kolom 4 / index 3), Nomor WhatsApp (kolom 3 / index 2)
          if (data.nama) sheetUsers.getRange(foundIndex + 1, 2).setValue(data.nama);
          if (data.email) sheetUsers.getRange(foundIndex + 1, 4).setValue(data.email);
          if (data.whatsapp) sheetUsers.getRange(foundIndex + 1, 3).setValue(data.whatsapp);
          
          // Update Nama Lengkap di SHEET_PO juga agar history tetap sinkron
          if (data.nama && valuesUsers[foundIndex][1] !== data.nama) {
            let sheetPO = doc.getSheetByName(SHEET_PO);
            if (sheetPO) {
              const valuesPO = sheetPO.getDataRange().getValues();
              for (let i = 1; i < valuesPO.length; i++) {
                if (valuesPO[i][2] === valuesUsers[foundIndex][1]) { // Nama Lengkap di kolom ke-3 (index 2)
                  sheetPO.getRange(i + 1, 3).setValue(data.nama);
                }
              }
            }
          }
          
          return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Profil berhasil diperbarui!" })).setMimeType(ContentService.MimeType.JSON);
        } else {
          return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "User tidak ditemukan!" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

    } else if (action === "update_password") {
      let sheetUsers = doc.getSheetByName(SHEET_USERS);
      if (sheetUsers) {
        const valuesUsers = sheetUsers.getDataRange().getValues();
        let foundIndex = -1;
        for (let i = 1; i < valuesUsers.length; i++) {
          if (valuesUsers[i][3] === data.email) { // Email di kolom ke-4 (index 3)
            foundIndex = i;
            break;
          }
        }
        if (foundIndex !== -1) {
          const currentPwInSheet = valuesUsers[foundIndex][4]; // Password di kolom ke-5 (index 4)
          if (currentPwInSheet !== data.current_password) {
            return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Password saat ini salah!" })).setMimeType(ContentService.MimeType.JSON);
          }
          sheetUsers.getRange(foundIndex + 1, 5).setValue(data.new_password);
          return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Password berhasil diperbarui!" })).setMimeType(ContentService.MimeType.JSON);
        } else {
          return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "User tidak ditemukan!" })).setMimeType(ContentService.MimeType.JSON);
        }
      }

    } else if (action === "delete_payment") {
      // Hapus satu record pembayaran dari Data_Pembayaran berdasarkan ID Order
      let sheetPembayaran = doc.getSheetByName(SHEET_PEMBAYARAN);
      if (sheetPembayaran) {
        const valuesPem = sheetPembayaran.getDataRange().getValues();
        for (let i = 1; i < valuesPem.length; i++) {
          if (valuesPem[i][1] === data.id_order) { // ID Order di kolom ke-2 (index 1)
            sheetPembayaran.deleteRow(i + 1);
            break;
          }
        }
      }

      // Kembalikan status PO ke "Disetujui" agar user bisa upload ulang bukti transfer
      let sheetPO = doc.getSheetByName(SHEET_PO);
      if (sheetPO) {
        const valuesPO = sheetPO.getDataRange().getValues();
        const headersPO = valuesPO[0];
        const statusIdx = headersPO.indexOf("Status") + 1;
        for (let i = 1; i < valuesPO.length; i++) {
          if (valuesPO[i][1] === data.id_order) {
            const currentStatus = String(valuesPO[i][statusIdx - 1] || '').toLowerCase();
            // Hanya reset ke Disetujui jika status bukan Ditolak atau Selesai
            if (currentStatus !== 'ditolak' && currentStatus !== 'selesai' && currentStatus !== 'dibatalkan') {
              sheetPO.getRange(i + 1, statusIdx).setValue("Disetujui");
            }
            break;
          }
        }
      }

    } else if (action === "delete_po") {
      let sheetPO = doc.getSheetByName(SHEET_PO);
      if (sheetPO) {
        const valuesPO = sheetPO.getDataRange().getValues();
        for (let i = 1; i < valuesPO.length; i++) {
          if (valuesPO[i][1] === data.id_order) { // ID Order di kolom ke-2 (index 1)
            sheetPO.deleteRow(i + 1);
            break;
          }
        }
      }

    } else if (action === "delete_all_po") {
      if (data.admin_password !== "admin123") {
        return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Password admin salah!" })).setMimeType(ContentService.MimeType.JSON);
      }
      
      let sheetPO = doc.getSheetByName(SHEET_PO);
      if (sheetPO) {
        const lastRow = sheetPO.getLastRow();
        if (lastRow > 1) {
          // Menghapus mulai dari baris ke-2 hingga ke bawah, menyisakan header
          sheetPO.deleteRows(2, lastRow - 1);
        }
      }

    } else if (action === "delete_testimoni") {
      let sheet = doc.getSheetByName(SHEET_TESTIMONI);
      if (sheet) {
        const values = sheet.getDataRange().getValues();
        const targetTimestamp = data.timestamp;
        const targetNama = data.nama_lengkap;
        const targetUlasan = data.ulasan;
        
        for (let i = 1; i < values.length; i++) {
          const rowTimestampVal = values[i][0];
          const rowTimestampMs = rowTimestampVal instanceof Date ? rowTimestampVal.getTime().toString() : new Date(rowTimestampVal).getTime().toString();
          
          const matchTimestamp = !targetTimestamp || rowTimestampMs === String(targetTimestamp) || String(rowTimestampVal) === String(targetTimestamp);
          const matchNama = !targetNama || String(values[i][1]).trim().toLowerCase() === String(targetNama).trim().toLowerCase();
          const matchUlasan = !targetUlasan || String(values[i][3]).trim().toLowerCase() === String(targetUlasan).trim().toLowerCase();
          
          if (matchTimestamp && matchNama && matchUlasan) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }

    } else if (action === "add_testimoni") {
      let sheet = doc.getSheetByName(SHEET_TESTIMONI);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_TESTIMONI);
        sheet.appendRow(["Timestamp", "Nama Lengkap", "Bintang", "Ulasan"]);
        sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const timestamp = new Date();
      const namaLengkap = data.nama_lengkap || "User";
      const bintang = parseInt(data.bintang) || 5;
      const ulasan = data.ulasan || "";
      
      sheet.appendRow([timestamp, namaLengkap, bintang, ulasan]);
      
      return ContentService.createTextOutput(JSON.stringify({
        "result": "success",
        "message": "Testimoni berhasil disimpan!"
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      // 2. Menangani Input Pre-Order (PO) Baru
      let sheet = doc.getSheetByName(SHEET_PO);
      if (!sheet) {
        sheet = doc.insertSheet(SHEET_PO);
        sheet.appendRow(["Timestamp", "ID Order", "Nama Lengkap", "Kategori", "Produk", "Ukuran", "Status", "Harga Total", "Alasan Ditolak", "Batas Pembayaran", "Tanggal PO", "Diskon", "Ongkir"]);
        sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const timestamp = new Date();
      const idOrder = "#PO-" + timestamp.getTime().toString().slice(-5);
      const namaLengkap = data.nama_lengkap || "User";
      const kategori = data.kategori || "-";
      const produk = data.produk || "-";
      const ukuran = data.ukuran || "-";
      const tanggalPo = data.tanggal_po || "-";
      
      sheet.appendRow([timestamp, idOrder, namaLengkap, kategori, produk, ukuran, "Pending", data.harga_total || "0", "", "", tanggalPo, "0", "0"]);
      
      return ContentService.createTextOutput(JSON.stringify({
        "result": "success",
        "message": "Pre-Order berhasil disimpan",
        "id_order": idOrder
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      "result": "success", 
      "action": action,
      "message": "Data berhasil disimpan!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "result": "error", 
      "message": error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const resultObj = getAllDataObj(doc);
    resultObj["result"] = "success";

    if (e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + "(" + JSON.stringify(resultObj) + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(JSON.stringify(resultObj))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const errObj = { "result": "error", "message": error.message };
    if (e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + "(" + JSON.stringify(errObj) + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(errObj))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllDataObj(doc) {
  // 1. Ambil Data PO
  let sheetPO = doc.getSheetByName(SHEET_PO);
  let poData = [];
  if (sheetPO) {
    if (sheetPO.getLastColumn() < 11 || sheetPO.getRange(1, 11).getValue() !== "Tanggal PO") {
      sheetPO.getRange(1, 11).setValue("Tanggal PO");
      sheetPO.getRange(1, 11).setFontWeight("bold").setBackground("#f3f3f3");
    }
    const valuesPO = sheetPO.getDataRange().getValues();
    if (valuesPO.length > 1) {
      const headersPO = valuesPO[0];
      if (headersPO.length > 7 && (!headersPO[7] || String(headersPO[7]).trim() === "")) {
        headersPO[7] = "Harga Total";
        sheetPO.getRange(1, 8).setValue("Harga Total");
      }
      const statusIdx = headersPO.indexOf("Status");
      const batasIdx = headersPO.indexOf("Batas Pembayaran");
      const now = new Date();

      for (let i = 1; i < valuesPO.length; i++) {
        let rowObj = {};
        for (let j = 0; j < headersPO.length; j++) {
          rowObj[headersPO[j]] = valuesPO[i][j];
        }

        if (statusIdx !== -1 && batasIdx !== -1) {
          const statusVal = String(valuesPO[i][statusIdx]).trim();
          const batasVal = String(valuesPO[i][batasIdx]).trim();
          if (statusVal.toLowerCase() === "disetujui" && batasVal && batasVal !== "" && batasVal !== "-") {
            const batasDate = new Date(batasVal);
            if (!isNaN(batasDate.getTime())) {
              batasDate.setHours(23, 59, 59, 999);
              if (now > batasDate) {
                sheetPO.getRange(i + 1, statusIdx + 1).setValue("Dibatalkan");
                rowObj["Status"] = "Dibatalkan";
                valuesPO[i][statusIdx] = "Dibatalkan";
              }
            }
          }
        }
        poData.push(rowObj);
      }
    }
  }

  // 2. Ambil Data Pembayaran
  let sheetPembayaran = doc.getSheetByName(SHEET_PEMBAYARAN);
  let pembayaranData = [];
  if (sheetPembayaran) {
    const valuesPem = sheetPembayaran.getDataRange().getValues();
    if (valuesPem.length > 1) {
      const headersPem = valuesPem[0];
      for (let i = 1; i < valuesPem.length; i++) {
        let rowObj = {};
        for (let j = 0; j < headersPem.length; j++) {
          rowObj[headersPem[j]] = valuesPem[i][j];
        }
        pembayaranData.push(rowObj);
      }
    }
  }

  // 3. Ambil Data Users
  let sheetUsers = doc.getSheetByName(SHEET_USERS);
  let usersData = [];
  if (sheetUsers) {
    const valuesUsers = sheetUsers.getDataRange().getValues();
    if (valuesUsers.length > 1) {
      const headersUsers = valuesUsers[0];
      for (let i = 1; i < valuesUsers.length; i++) {
        let rowObj = {};
        for (let j = 0; j < headersUsers.length; j++) {
          rowObj[headersUsers[j]] = valuesUsers[i][j];
        }
        usersData.push(rowObj);
      }
    }
  }

  // 4. Ambil Data Produk
  let sheetProduk = doc.getSheetByName(SHEET_PRODUK);
  let produkData = [];
  if (sheetProduk) {
    const headerRow = sheetProduk.getRange(1, 1, 1, Math.max(sheetProduk.getLastColumn(), 1)).getValues()[0];
    if (headerRow.indexOf("Ukuran") === -1) {
      sheetProduk.getRange(1, headerRow.length + 1).setValue("Ukuran");
      sheetProduk.getRange(1, headerRow.length + 1).setFontWeight("bold").setBackground("#f3f3f3");
    }
    const valuesProduk = sheetProduk.getDataRange().getValues();
    if (valuesProduk.length > 1) {
      const headersProduk = valuesProduk[0];
      for (let i = 1; i < valuesProduk.length; i++) {
        let rowObj = {};
        for (let j = 0; j < headersProduk.length; j++) {
          rowObj[headersProduk[j]] = valuesProduk[i][j];
        }
        produkData.push(rowObj);
      }
    }
  }

  // 5. Ambil Data Event
  let sheetEvent = doc.getSheetByName(SHEET_EVENT);
  let eventData = { "Nama Event": "", "Status": "Nonaktif", "Diskon (%)": "0", "Batas Waktu": "" };
  if (sheetEvent) {
    const valuesEvent = sheetEvent.getDataRange().getValues();
    if (valuesEvent.length > 1) {
      eventData = {
        "Nama Event": valuesEvent[1][0],
        "Status": valuesEvent[1][1],
        "Diskon (%)": valuesEvent[1][2],
        "Batas Waktu": valuesEvent[1][3] || ""
      };
    }
  }

  // 6. Ambil Data Klien
  let sheetKlien = doc.getSheetByName(SHEET_KLIEN);
  let klienData = [];
  if (sheetKlien) {
    const valuesKlien = sheetKlien.getDataRange().getValues();
    if (valuesKlien.length > 1) {
      let headersKlien = valuesKlien[0];
      if (headersKlien.length >= 3 && headersKlien[2] === "") {
         headersKlien[2] = "URL Gambar";
         sheetKlien.getRange(1, 3).setValue("URL Gambar").setFontWeight("bold").setBackground("#f3f3f3");
      } else if (headersKlien.length < 3) {
         headersKlien.push("URL Gambar");
         sheetKlien.getRange(1, 3).setValue("URL Gambar").setFontWeight("bold").setBackground("#f3f3f3");
      }
      for (let i = 1; i < valuesKlien.length; i++) {
        let rowObj = {};
        for (let j = 0; j < headersKlien.length; j++) {
          rowObj[headersKlien[j]] = valuesKlien[i][j] || "";
        }
        klienData.push(rowObj);
      }
    }
  }

  // 7. Ambil Data Tampilan
  let sheetTampilan = doc.getSheetByName(SHEET_TAMPILAN);
  let tampilanData = {};
  if (sheetTampilan) {
    const valuesTampilan = sheetTampilan.getDataRange().getValues();
    for (let i = 1; i < valuesTampilan.length; i++) {
      tampilanData[valuesTampilan[i][0]] = valuesTampilan[i][1];
    }
  }

  // 8. Ambil Data Pengaturan
  let sheetPengaturan = doc.getSheetByName(SHEET_PENGATURAN);
  let pengaturanData = {};
  if (sheetPengaturan) {
    const valuesPengaturan = sheetPengaturan.getDataRange().getValues();
    for (let i = 1; i < valuesPengaturan.length; i++) {
      if (valuesPengaturan[i][0]) {
        pengaturanData[valuesPengaturan[i][0]] = valuesPengaturan[i][1] !== undefined ? String(valuesPengaturan[i][1]) : '';
      }
    }
  }

  // 9. Ambil Data Testimoni
  let sheetTestimoni = doc.getSheetByName(SHEET_TESTIMONI);
  let testimoniData = [];
  if (sheetTestimoni) {
    const valuesTestimoni = sheetTestimoni.getDataRange().getValues();
    if (valuesTestimoni.length > 1) {
      const headersTestimoni = valuesTestimoni[0];
      for (let i = 1; i < valuesTestimoni.length; i++) {
        let rowObj = {};
        for (let j = 0; j < headersTestimoni.length; j++) {
          rowObj[headersTestimoni[j]] = valuesTestimoni[i][j];
        }
        testimoniData.push(rowObj);
      }
    }
  }

  return {
    "data_po": poData,
    "data_pembayaran": pembayaranData,
    "data_users": usersData,
    "data_produk": produkData,
    "data_event": eventData,
    "data_klien": klienData,
    "data_tampilan": tampilanData,
    "data_pengaturan": pengaturanData,
    "data_testimoni": testimoniData
  };
}
