/**
 * ═══════════════════════════════════════════════════════════════
 * BeritaKu — Google Apps Script Backend
 * ═══════════════════════════════════════════════════════════════
 *
 * CARA SETUP:
 * 1. Buka Google Sheets baru → beri nama "BeritaKu Database"
 * 2. Klik menu Extensions → Apps Script
 * 3. Hapus semua kode lama, paste kode ini seluruhnya
 * 4. Klik Save (Ctrl+S)
 * 5. Klik Deploy → New Deployment
 *    ▸ Type        : Web App
 *    ▸ Execute as  : Me
 *    ▸ Who can access: Anyone
 * 6. Klik Deploy → salin URL-nya
 * 7. Paste URL itu ke CFG.API di index.html
 *
 * STRUKTUR SHEET (dibuat otomatis):
 * ┌─ users    ─ id | username | password | nama | role | createdAt
 * ├─ news     ─ id | judul | penulis | penulisId | kategori | tanggal | gambar | deskripsi | timestamp
 * └─ comments ─ id | newsId | nama | komentar | timestamp
 * ═══════════════════════════════════════════════════════════════
 */

// ── Sheet names ──
const SH_USERS    = 'users';
const SH_NEWS     = 'news';
const SH_COMMENTS = 'comments';

// ── Column headers (order matters — matches row positions) ──
const HDR_USERS    = ['id','username','password','nama','role','createdAt'];
const HDR_NEWS     = ['id','judul','penulis','penulisId','kategori','tanggal','gambar','deskripsi','timestamp'];
const HDR_COMMENTS = ['id','newsId','nama','komentar','timestamp'];

// ═══════════════════════════════════════════════════════════════
// ENTRY POINTS
// ═══════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    switch (action) {
      case 'login':         result = handleLogin(body);         break;
      case 'getNews':       result = handleGetNews();            break;
      case 'addNews':       result = handleAddNews(body);        break;
      case 'editNews':      result = handleEditNews(body);       break;
      case 'deleteNews':    result = handleDeleteNews(body);     break;
      case 'getComments':   result = handleGetComments(body);    break;
      case 'addComment':    result = handleAddComment(body);     break;
      default:              result = { ok: false, error: 'Unknown action: ' + action };
    }

    return respond(result);
  } catch (err) {
    return respond({ ok: false, error: err.toString() });
  }
}

function doGet(e) {
  // First-time setup — call this URL in browser to initialise sheets
  setupAllSheets();
  return respond({ ok: true, message: 'BeritaKu API is running ✅ Sheets initialised.' });
}

// ── Helper: send JSON response with CORS ──
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════
// SHEET HELPERS
// ═══════════════════════════════════════════════════════════════

function getOrCreateSheet(name, headers) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setBackground('#c0392b').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupAllSheets() {
  getOrCreateSheet(SH_USERS,    HDR_USERS);
  getOrCreateSheet(SH_NEWS,     HDR_NEWS);
  getOrCreateSheet(SH_COMMENTS, HDR_COMMENTS);
}

// Convert sheet rows → array of objects
function rowsToObjects(sheet, headers) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (row[i] !== undefined && row[i] !== null) ? String(row[i]) : ''; });
    return obj;
  });
}

// Find 1-indexed row number by first-column id
function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function generateId(prefix) {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 5);
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

function handleLogin({ username, password }) {
  if (!username || !password)
    return { ok: false, error: 'Username dan password diperlukan.' };

  const sheet = getOrCreateSheet(SH_USERS, HDR_USERS);
  const users = rowsToObjects(sheet, HDR_USERS);
  const user  = users.find(u =>
    u.username.toLowerCase() === String(username).toLowerCase() &&
    u.password === String(password)
  );

  if (!user) return { ok: false, error: 'Username atau password salah.' };

  // Never send password back to client
  const { password: _pw, ...safeUser } = user;
  return { ok: true, user: safeUser };
}

// ═══════════════════════════════════════════════════════════════
// NEWS  — CRUD
// ═══════════════════════════════════════════════════════════════

function handleGetNews() {
  const sheet = getOrCreateSheet(SH_NEWS, HDR_NEWS);
  const news  = rowsToObjects(sheet, HDR_NEWS);
  news.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  return { ok: true, news };
}

function handleAddNews({ news }) {
  if (!news || !news.judul)
    return { ok: false, error: 'Data berita tidak lengkap.' };

  const sheet = getOrCreateSheet(SH_NEWS, HDR_NEWS);
  const id    = generateId('n');
  const ts    = Date.now();

  const row = HDR_NEWS.map(h => {
    if (h === 'id')        return id;
    if (h === 'timestamp') return ts;
    return news[h] || '';
  });

  sheet.appendRow(row);
  try { sheet.autoResizeColumns(1, HDR_NEWS.length); } catch (_) {}
  return { ok: true, id };
}

function handleEditNews({ id, news }) {
  if (!id || !news) return { ok: false, error: 'ID dan data berita diperlukan.' };

  const sheet  = getOrCreateSheet(SH_NEWS, HDR_NEWS);
  const rowNum = findRowById(sheet, id);
  if (rowNum === -1) return { ok: false, error: 'Berita tidak ditemukan.' };

  // Read existing row, update only editable fields
  const existingVals = sheet.getRange(rowNum, 1, 1, HDR_NEWS.length).getValues()[0];
  const obj = {};
  HDR_NEWS.forEach((h, i) => { obj[h] = existingVals[i]; });

  const editable = ['judul','penulis','kategori','tanggal','gambar','deskripsi'];
  editable.forEach(f => { if (news[f] !== undefined) obj[f] = news[f]; });

  sheet.getRange(rowNum, 1, 1, HDR_NEWS.length).setValues([HDR_NEWS.map(h => obj[h] || '')]);
  return { ok: true };
}

function handleDeleteNews({ id }) {
  if (!id) return { ok: false, error: 'ID berita diperlukan.' };

  const sheet  = getOrCreateSheet(SH_NEWS, HDR_NEWS);
  const rowNum = findRowById(sheet, id);
  if (rowNum === -1) return { ok: false, error: 'Berita tidak ditemukan.' };

  sheet.deleteRow(rowNum);
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════════

function handleGetComments({ newsId }) {
  if (!newsId) return { ok: false, error: 'newsId diperlukan.' };

  const sheet    = getOrCreateSheet(SH_COMMENTS, HDR_COMMENTS);
  const all      = rowsToObjects(sheet, HDR_COMMENTS);
  const comments = all
    .filter(c => c.newsId === String(newsId))
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  return { ok: true, comments };
}

function handleAddComment({ comment }) {
  if (!comment || !comment.nama || !comment.komentar || !comment.newsId)
    return { ok: false, error: 'Data komentar tidak lengkap.' };

  // Basic spam guard: trim & length check
  const nama     = String(comment.nama).trim().slice(0, 100);
  const komentar = String(comment.komentar).trim().slice(0, 2000);
  if (!nama || !komentar)
    return { ok: false, error: 'Nama dan komentar tidak boleh kosong.' };

  const sheet = getOrCreateSheet(SH_COMMENTS, HDR_COMMENTS);
  const id    = generateId('c');
  const ts    = Date.now();

  const row = HDR_COMMENTS.map(h => {
    if (h === 'id')        return id;
    if (h === 'timestamp') return ts;
    if (h === 'nama')      return nama;
    if (h === 'komentar')  return komentar;
    if (h === 'newsId')    return String(comment.newsId);
    return '';
  });

  sheet.appendRow(row);
  return { ok: true, id };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY — Tambah User Baru (jalankan manual dari editor)
// ═══════════════════════════════════════════════════════════════

/**
 * Cara pakai:
 * 1. Edit variabel newUser di bawah
 * 2. Pilih fungsi "addUserManually" di dropdown atas
 * 3. Klik ▶ Run
 * 4. User langsung masuk ke sheet "users"
 */
function addUserManually() {
  const newUser = {
    username: 'editor1',      // ← ganti
    password: 'password123',  // ← ganti
    nama:     'Editor Satu',  // ← ganti
    role:     'editor',       // 'admin' atau 'editor'
  };

  const sheet = getOrCreateSheet(SH_USERS, HDR_USERS);
  const id    = generateId('u');
  const row   = HDR_USERS.map(h => {
    if (h === 'id')        return id;
    if (h === 'createdAt') return new Date().toISOString();
    return newUser[h] || '';
  });

  sheet.appendRow(row);
  Logger.log('✅ User ditambahkan: ' + JSON.stringify({ ...newUser, password: '***' }));
}
