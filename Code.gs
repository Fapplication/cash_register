// ============================================================
//  CASH REGISTRATION PORTAL — Code.gs
//  Google Apps Script backend
//  All sheet names match Setup.gs constants exactly.
// ============================================================

// ── Sheet name constants ─────────────────────────────────────
const SHEETS = {
  BUSINESSES:    'Businesses',
  USERS:         'Users',
  ITEMS:         'Items',
  TRANSACTIONS:  'Transactions',
  TX_ITEMS:      'TransactionItems',
  AUDIT:         'AuditLogs',
  SESSIONS:      'Sessions',
  SETTINGS:      'Settings',
};

// ── Session helpers ──────────────────────────────────────────
function createSession(userId, role, username) {
  const token  = Utilities.getUuid();
  const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 h
  const sh = getSheet(SHEETS.SESSIONS);
  sh.appendRow([token, userId, role, username, new Date().toISOString(), expiry.toISOString()]);
  return token;
}

function getSession(token) {
  if (!token) return null;
  const sh   = getSheet(SHEETS.SESSIONS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const expiry = new Date(data[i][5]);
      if (expiry > new Date()) {
        return { token, userId: data[i][1], role: data[i][2], username: data[i][3] };
      }
    }
  }
  return null;
}

function deleteSession(token) {
  deleteAllRowsByKey(SHEETS.SESSIONS, 0, token);
}

// ── Auth entry point (called from login page) ────────────────
function doLogin(username, password) {
  const hashed = hashPassword(password);
  const users  = getAllRows(SHEETS.USERS);
  const user   = users.find(u => u[3] === username && u[4] === hashed && u[7] === 'Active');
  if (!user) return { ok: false, message: 'Invalid credentials or account inactive.' };

  const token = createSession(user[0], user[5], username);
  writeAudit(user[0], username, 'User login', getClientIp());
  return { ok: true, token, role: user[5], name: user[2], userId: user[0] };
}

function doLogout(token) {
  const sess = getSession(token);
  if (sess) {
    writeAudit(sess.userId, sess.username, 'User logout', getClientIp());
    deleteSession(token);
  }
  return { ok: true };
}

// ── Web app entry point ──────────────────────────────────────
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Cash Registration Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ── Businesses ───────────────────────────────────────────────
function getBusiness(token) {
  authGuard(token, ['admin','officer','owner']);
  return rowsToObjects(SHEETS.BUSINESSES,
    ['id','name','tin','licenseNo','address','phone','email','status','createdAt']);
}

function saveBusiness(token, data) {
  authGuard(token, ['admin']);
  const sess = getSession(token);
  if (data.id) {
    updateRowById(SHEETS.BUSINESSES, data.id, [
      data.id, data.name, data.tin, data.licenseNo,
      data.address, data.phone, data.email, data.status, data.createdAt
    ]);
    writeAudit(sess.userId, sess.username, 'Business updated: ' + data.name, getClientIp());
  } else {
    const id = generateId('BIZ');
    const now = new Date().toISOString();
    getSheet(SHEETS.BUSINESSES).appendRow([
      id, data.name, data.tin, data.licenseNo,
      data.address, data.phone, data.email, 'Active', now
    ]);
    writeAudit(sess.userId, sess.username, 'Business registered: ' + data.name, getClientIp());
  }
  return { ok: true };
}

function toggleBusinessStatus(token, id, status) {
  authGuard(token, ['admin']);
  const rows = getAllRows(SHEETS.BUSINESSES);
  const sh   = getSheet(SHEETS.BUSINESSES);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { sh.getRange(i + 1, 8).setValue(status); break; }
  }
  return { ok: true };
}

// ── Users ────────────────────────────────────────────────────
function getUsers(token) {
  authGuard(token, ['admin']);
  return rowsToObjects(SHEETS.USERS,
    ['id','businessId','name','username','passwordHash','role','phone','status','createdAt'],
    row => { const o = row; delete o.passwordHash; return o; });
}

function saveUser(token, data) {
  authGuard(token, ['admin']);
  const sess = getSession(token);
  if (data.id) {
    const existing = getAllRows(SHEETS.USERS).find(r => r[0] === data.id);
    const ph = data.password ? hashPassword(data.password) : (existing ? existing[4] : '');
    updateRowById(SHEETS.USERS, data.id, [
      data.id, data.businessId, data.name, data.username,
      ph, data.role, data.phone, data.status, existing ? existing[8] : new Date().toISOString()
    ]);
    writeAudit(sess.userId, sess.username, 'User updated: ' + data.username, getClientIp());
  } else {
    const id = generateId('USR');
    const ph = hashPassword(data.password || 'Password@1');
    getSheet(SHEETS.USERS).appendRow([
      id, data.businessId || '', data.name, data.username,
      ph, data.role, data.phone, 'Active', new Date().toISOString()
    ]);
    writeAudit(sess.userId, sess.username, 'User created: ' + data.username, getClientIp());
  }
  return { ok: true };
}

function resetPassword(token, userId, newPassword) {
  authGuard(token, ['admin']);
  const sh   = getSheet(SHEETS.USERS);
  const rows = getAllRows(SHEETS.USERS);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      sh.getRange(i + 1, 5).setValue(hashPassword(newPassword));
      break;
    }
  }
  const sess = getSession(token);
  writeAudit(sess.userId, sess.username, 'Password reset for userId: ' + userId, getClientIp());
  return { ok: true };
}

// ── Items ────────────────────────────────────────────────────
function getItems(token) {
  authGuard(token, ['admin','owner','cashier','officer']);
  return rowsToObjects(SHEETS.ITEMS,
    ['id','businessId','code','name','category','price','taxRate','status']);
}

function saveItem(token, data) {
  authGuard(token, ['admin','owner']);
  const sess = getSession(token);
  if (data.id) {
    updateRowById(SHEETS.ITEMS, data.id, [
      data.id, data.businessId, data.code, data.name,
      data.category, parseFloat(data.price), parseFloat(data.taxRate), data.status || 'Active'
    ]);
    writeAudit(sess.userId, sess.username, 'Item updated: ' + data.name, getClientIp());
  } else {
    const id = generateId('ITM');
    getSheet(SHEETS.ITEMS).appendRow([
      id, data.businessId || '', data.code, data.name,
      data.category, parseFloat(data.price), parseFloat(data.taxRate), 'Active'
    ]);
    writeAudit(sess.userId, sess.username, 'Item added: ' + data.name, getClientIp());
  }
  return { ok: true };
}

// ── Cash Registration ────────────────────────────────────────
function registerSale(token, saleData) {
  authGuard(token, ['admin','cashier','owner']);
  const sess      = getSession(token);
  const txId      = generateId('TXN');
  const receiptNo = generateReceiptNo();
  const now       = new Date().toISOString();

  let subtotal = 0, tax = 0;
  saleData.items.forEach(item => {
    subtotal += item.lineSubtotal;
    tax      += item.lineVat;
  });
  const total = subtotal + tax;

  getSheet(SHEETS.TRANSACTIONS).appendRow([
    txId, receiptNo, saleData.businessId, sess.userId,
    now, saleData.paymentType, subtotal, tax, total, 'Active'
  ]);

  const txSh = getSheet(SHEETS.TX_ITEMS);
  saleData.items.forEach(item => {
    txSh.appendRow([
      generateId('TXI'), txId, item.itemId, item.qty,
      item.unitPrice, item.lineVat, item.lineTotal
    ]);
  });

  writeAudit(sess.userId, sess.username,
    'Transaction registered: ' + receiptNo, getClientIp());

  return { ok: true, txId, receiptNo, total };
}

function getTransactions(token, filters) {
  authGuard(token, ['admin','owner','officer','cashier']);
  const sess = getSession(token);
  let rows = rowsToObjects(SHEETS.TRANSACTIONS,
    ['id','receiptNo','businessId','cashierId','date','paymentType',
     'subtotal','tax','total','status']);

  // Officers see all; cashiers see only own transactions
  if (sess.role === 'cashier') {
    rows = rows.filter(r => r.cashierId === sess.userId);
  }
  if (filters && filters.businessId) {
    rows = rows.filter(r => r.businessId === filters.businessId);
  }
  if (filters && filters.dateFrom) {
    rows = rows.filter(r => r.date >= filters.dateFrom);
  }
  if (filters && filters.dateTo) {
    rows = rows.filter(r => r.date <= filters.dateTo);
  }

  // Enrich with business name and cashier name
  const businesses = getAllRows(SHEETS.BUSINESSES);
  const users      = getAllRows(SHEETS.USERS);
  return rows.map(r => {
    const biz  = businesses.find(b => b[0] === r.businessId);
    const user = users.find(u => u[0] === r.cashierId);
    return {
      ...r,
      businessName: biz  ? biz[1]  : r.businessId,
      cashierName:  user ? user[2] : r.cashierId,
    };
  });
}

function getReceiptDetail(token, receiptNo) {
  authGuard(token, ['admin','owner','officer','cashier']);
  const txRows  = getAllRows(SHEETS.TRANSACTIONS);
  const tx      = txRows.find(r => r[1] === receiptNo);
  if (!tx) return { ok: false, message: 'Receipt not found.' };

  const txiRows = getAllRows(SHEETS.TX_ITEMS).filter(r => r[1] === tx[0]);
  const itemMap = {};
  getAllRows(SHEETS.ITEMS).forEach(r => { itemMap[r[0]] = r; });
  const bizRows = getAllRows(SHEETS.BUSINESSES);
  const biz     = bizRows.find(b => b[0] === tx[2]);
  const userRows = getAllRows(SHEETS.USERS);
  const cashier  = userRows.find(u => u[0] === tx[3]);

  writeAudit(tx[3], cashier ? cashier[3] : '', 'Receipt viewed: ' + receiptNo, getClientIp());

  return {
    ok: true,
    transaction: {
      id: tx[0], receiptNo: tx[1], businessId: tx[2], cashierId: tx[3],
      date: tx[4], paymentType: tx[5], subtotal: tx[6], tax: tx[7], total: tx[8],
      businessName: biz ? biz[1] : tx[2],
      businessTin:  biz ? biz[2] : '',
      businessAddr: biz ? biz[4] : '',
      cashierName:  cashier ? cashier[2] : tx[3],
    },
    items: txiRows.map(r => {
      const item = itemMap[r[2]];
      return {
        txItemId: r[0], txId: r[1], itemId: r[2],
        itemName: item ? item[3] : r[2],
        qty: r[3], unitPrice: r[4], lineVat: r[5], lineTotal: r[6],
      };
    }),
  };
}

// ── Reports ──────────────────────────────────────────────────
function getDailyReport(token, dateStr) {
  authGuard(token, ['admin','officer','owner']);
  const sess   = getSession(token);
  const prefix = dateStr || new Date().toISOString().slice(0, 10);

  let rows = rowsToObjects(SHEETS.TRANSACTIONS,
    ['id','receiptNo','businessId','cashierId','date','paymentType',
     'subtotal','tax','total','status'])
    .filter(r => r.date && r.date.startsWith(prefix));

  if (sess.role === 'owner') {
    // Limit to businesses owned — simplified: filter by userId match in Users sheet
    // Full impl: add ownerUserId column to Businesses sheet
  }

  const businesses = {};
  getAllRows(SHEETS.BUSINESSES).forEach(b => {
    businesses[b[0]] = b[1];
  });

  const grouped = {};
  rows.forEach(r => {
    const bn = businesses[r.businessId] || r.businessId;
    if (!grouped[bn]) grouped[bn] = { name: bn, count: 0, subtotal: 0, tax: 0, total: 0 };
    grouped[bn].count++;
    grouped[bn].subtotal += parseFloat(r.subtotal) || 0;
    grouped[bn].tax      += parseFloat(r.tax)      || 0;
    grouped[bn].total    += parseFloat(r.total)    || 0;
  });

  const totals = rows.reduce((acc, r) => {
    acc.count++;
    acc.subtotal += parseFloat(r.subtotal) || 0;
    acc.tax      += parseFloat(r.tax)      || 0;
    acc.total    += parseFloat(r.total)    || 0;
    return acc;
  }, { count: 0, subtotal: 0, tax: 0, total: 0 });

  writeAudit(sess.userId, sess.username,
    'Report generated: Daily — ' + prefix, getClientIp());

  return { ok: true, date: prefix, businesses: Object.values(grouped), totals };
}

function getMonthlyReport(token, yearMonth) {
  authGuard(token, ['admin','officer','owner']);
  const sess   = getSession(token);
  const prefix = yearMonth || new Date().toISOString().slice(0, 7);

  const rows = rowsToObjects(SHEETS.TRANSACTIONS,
    ['id','receiptNo','businessId','cashierId','date','paymentType',
     'subtotal','tax','total','status'])
    .filter(r => r.date && r.date.startsWith(prefix));

  // Group by day
  const byDay = {};
  rows.forEach(r => {
    const day = r.date.slice(0, 10);
    if (!byDay[day]) byDay[day] = { day, count: 0, subtotal: 0, tax: 0, total: 0 };
    byDay[day].count++;
    byDay[day].subtotal += parseFloat(r.subtotal) || 0;
    byDay[day].tax      += parseFloat(r.tax)      || 0;
    byDay[day].total    += parseFloat(r.total)    || 0;
  });

  const totals = rows.reduce((acc, r) => {
    acc.count++;
    acc.subtotal += parseFloat(r.subtotal) || 0;
    acc.tax      += parseFloat(r.tax)      || 0;
    acc.total    += parseFloat(r.total)    || 0;
    return acc;
  }, { count: 0, subtotal: 0, tax: 0, total: 0 });

  writeAudit(sess.userId, sess.username,
    'Report generated: Monthly — ' + prefix, getClientIp());

  return { ok: true, month: prefix, days: Object.values(byDay).sort((a,b) => a.day.localeCompare(b.day)), totals };
}

// ── Audit ────────────────────────────────────────────────────
function getAuditLogs(token, limit) {
  authGuard(token, ['admin','officer']);
  const rows = getAllRows(SHEETS.AUDIT);
  const logs = [];
  const start = Math.max(1, rows.length - (limit || 200));
  for (let i = rows.length - 1; i >= start && i >= 1; i--) {
    logs.push({
      id: rows[i][0], userId: rows[i][1], username: rows[i][2],
      action: rows[i][3], date: rows[i][4], ip: rows[i][5]
    });
  }
  return logs;
}

// ── Dashboard summary ────────────────────────────────────────
function getDashboardStats(token) {
  authGuard(token, ['admin','officer','owner','cashier']);
  const today = new Date().toISOString().slice(0, 10);
  const txRows = rowsToObjects(SHEETS.TRANSACTIONS,
    ['id','receiptNo','businessId','cashierId','date','paymentType',
     'subtotal','tax','total','status'])
    .filter(r => r.date && r.date.startsWith(today));

  const todayRevenue = txRows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
  const todayTax     = txRows.reduce((s, r) => s + (parseFloat(r.tax)   || 0), 0);
  const txCount      = txRows.length;

  const bizCount = getAllRows(SHEETS.BUSINESSES)
    .slice(1).filter(r => r[7] === 'Active').length;

  // Payment method breakdown
  const pmethods = {};
  txRows.forEach(r => {
    pmethods[r.paymentType] = (pmethods[r.paymentType] || 0) + (parseFloat(r.total) || 0);
  });

  // Last 7 days trend
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const rows2 = rowsToObjects(SHEETS.TRANSACTIONS,
      ['id','receiptNo','businessId','cashierId','date','paymentType',
       'subtotal','tax','total','status'])
      .filter(r => r.date && r.date.startsWith(ds));
    trend.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      total: rows2.reduce((s, r) => s + (parseFloat(r.total) || 0), 0),
      isToday: i === 0,
    });
  }

  return { ok: true, todayRevenue, todayTax, txCount, bizCount, pmethods, trend };
}

// ── Shared utilities ─────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name);
  return sh;
}

function getAllRows(name) {
  const sh = getSheet(name);
  const data = sh.getDataRange().getValues();
  return data; // index 0 = headers
}

function rowsToObjects(sheetName, keys, transform) {
  const rows = getAllRows(sheetName);
  return rows.slice(1).map(r => {
    const obj = {};
    keys.forEach((k, i) => { obj[k] = r[i] !== undefined ? r[i] : ''; });
    return transform ? transform(obj) : obj;
  });
}

function updateRowById(sheetName, id, newValues) {
  const sh   = getSheet(sheetName);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sh.getRange(i + 1, 1, 1, newValues.length).setValues([newValues]);
      return;
    }
  }
}

function deleteAllRowsByKey(sheetName, colIndex, key) {
  const sh   = getSheet(sheetName);
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][colIndex] === key) sh.deleteRow(i + 1);
  }
}

function generateId(prefix) {
  return prefix + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
}

function generateReceiptNo() {
  const sh = getSheet(SHEETS.TRANSACTIONS);
  const count = Math.max(sh.getLastRow(), 1);
  const year  = new Date().getFullYear();
  return 'RCP-' + year + '-' + String(count).padStart(5, '0');
}

function hashPassword(password) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return raw.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function authGuard(token, allowedRoles) {
  const sess = getSession(token);
  if (!sess) throw new Error('Unauthorized: session expired or invalid.');
  if (!allowedRoles.includes(sess.role))
    throw new Error('Forbidden: role ' + sess.role + ' cannot perform this action.');
  return sess;
}

function writeAudit(userId, username, action, ip) {
  getSheet(SHEETS.AUDIT).appendRow([
    generateId('AUD'), userId, username, action,
    new Date().toISOString(), ip || 'unknown'
  ]);
}

function getClientIp() {
  // GAS does not expose client IP directly; placeholder
  return 'server-side';
}

function getSettings() {
  const rows = getAllRows(SHEETS.SETTINGS);
  const obj  = {};
  rows.slice(1).forEach(r => { obj[r[0]] = r[1]; });
  return obj;
}

function saveSetting(token, key, value) {
  authGuard(token, ['admin']);
  const sh   = getSheet(SHEETS.SETTINGS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) { sh.getRange(i + 1, 2).setValue(value); return { ok: true }; }
  }
  sh.appendRow([key, value]);
  return { ok: true };
}
