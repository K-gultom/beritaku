# 📰 BeritaKu — Portal Berita

Aplikasi berita ringan berbasis HTML/JS murni dengan Google Sheets sebagai database.
Cocok di-deploy ke **GitHub Pages** dan diakses via ponsel.

---

## 🗂️ Struktur File

```
news-app/
├── index.html        ← Frontend (upload ke GitHub Pages)
├── apps-script.js    ← Backend (paste ke Google Apps Script)
└── README.md
```

---

## ⚙️ Cara Setup (Langkah demi Langkah)

### LANGKAH 1 — Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com) → Buat spreadsheet baru
2. Beri nama: **BeritaKu Database**
3. Buka menu **Extensions → Apps Script**

### LANGKAH 2 — Setup Apps Script

1. Di editor Apps Script, **hapus semua kode** yang ada
2. **Copy & paste** seluruh isi file `apps-script.js`
3. Klik **Save** (Ctrl+S)
4. Klik **Run** → pilih fungsi `doGet` → izinkan permission
5. Klik **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy** → **Copy** URL yang muncul

### LANGKAH 3 — Hubungkan ke Frontend

1. Buka file `index.html`
2. Cari baris:
   ```javascript
   API_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
   ```
3. Ganti dengan URL yang kamu copy tadi:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/XXXX.../exec',
   ```

### LANGKAH 4 — Deploy ke GitHub Pages

1. Buat repository baru di GitHub (contoh: `beritaku`)
2. Upload file `index.html` ke repository
3. Buka **Settings → Pages**
4. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`
5. Klik **Save**
6. Website kamu akan aktif di: `https://username.github.io/beritaku`

---

## 👤 Cara Tambah Pengguna

Karena signup dibatasi, tambah user lewat Apps Script:

1. Buka Apps Script editor
2. Edit fungsi `addUserManually()`:
   ```javascript
   const newUser = {
     username: 'namauserbaru',
     password: 'password123',
     nama: 'Nama Lengkap',
     role: 'editor',  // atau 'admin'
   };
   ```
3. Pilih fungsi `addUserManually` di dropdown
4. Klik **Run**

User otomatis masuk ke sheet `users` di Spreadsheet.

---

## 🗄️ Struktur Spreadsheet (Otomatis Dibuat)

### Sheet: `users`
| id | username | password | nama | role | createdAt |
|----|----------|----------|------|------|-----------|
| u1 | admin | admin123 | Administrator | admin | 2025-... |

### Sheet: `news`
| id | judul | penulis | penulisId | kategori | tanggal | gambar | deskripsi | timestamp |
|----|-------|---------|-----------|----------|---------|--------|-----------|-----------|

---

## 🖼️ Cara Sisipkan Gambar

Tidak menyimpan gambar langsung (terlalu besar). Gunakan URL:

1. **Google Drive**: Upload gambar → Klik kanan → "Get link" → Ubah ke format:
   `https://drive.google.com/uc?id=FILE_ID`
2. **Imgur**: Upload di imgur.com → Copy link gambar langsung
3. **URL gambar apapun** yang bisa diakses publik

---

## 🔗 Format Link di Deskripsi

Untuk menyisipkan link di teks deskripsi:
```
Baca selengkapnya di [sini](https://contoh.com).
Data lengkap ada di [website resmi](https://pemerintah.go.id).
```

---

## ✨ Fitur

- ✅ Halaman berita dengan hero card & card list
- ✅ Filter per kategori
- ✅ Pencarian berita real-time
- ✅ Login/Logout (user dikelola via Spreadsheet)
- ✅ Tambah, Edit, Hapus berita
- ✅ Kalender untuk tanggal terbit
- ✅ Support link di deskripsi `[teks](url)`
- ✅ Support URL gambar
- ✅ Mobile-first UI
- ✅ Loading skeleton
- ✅ Mode demo (tanpa konfigurasi API)

---

## 🔐 Keamanan

> Password disimpan sebagai plain text di Google Sheets.
> Untuk keamanan lebih, pertimbangkan hashing password di Apps Script.
> Akses admin ke Spreadsheet dibatasi oleh permission Google Account Anda.

---

## 🧪 Mode Demo

Jika `API_URL` belum diisi, aplikasi otomatis masuk **mode demo** dengan:
- 5 berita contoh
- Login: `admin` / `admin123` atau `editor` / `editor123`

Cocok untuk testing tampilan sebelum menghubungkan ke Spreadsheet.
