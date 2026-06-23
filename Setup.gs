// ============================================================
//  CASH REGISTRATION PORTAL — Setup.gs
//  Run setupPortal() ONCE from the Apps Script editor to
//  create all required sheets, headers, and a default admin.
// ============================================================

function setupPortal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schema = {
    Businesses: [
      'id','name','tin','licenseNo','address','phone','email','status','createdAt'
    ],
    Users: [
      'id','businessId','name','username','passwordHash','role','phone','status','createdAt'
    ],
    Items: [
      'id','businessId','code','name','category','price','taxRate','status'
    ],
    Transactions: [
      'id','receiptNo','businessId','cashierId','date','paymentType',
      'subtotal','tax','total','status'
    ],
    TransactionItems: [
      'id','transactionId','itemId','qty','unitPrice','lineVat','lineTotal'
    ],
    AuditLogs: [
      'id','userId','username','action','timestamp','ipAddress'
    ],
    Sessions: [
      'token','userId','role','username','createdAt','expiresAt'
    ],
    Settings: [
      'key','value'
    ],
  };

  // Create sheets
  Object.entries(schema).forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      Logger.log('Created sheet: ' + name);
    }
    // Write headers if row 1 is empty
    if (sh.getRange(1, 1).getValue() === '') {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1E3A5F')
        .setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
      Logger.log('Headers written for: ' + name);
    }
  });

  // Default settings
  const settingsSh = ss.getSheetByName('Settings');
  const existingSettings = settingsSh.getDataRange().getValues();
  if (existingSettings.length <= 1) {
    const defaults = [
      ['defaultTaxRate', '15'],
      ['currency', 'ETB'],
      ['portalName', 'Cash Registration Portal'],
      ['vatLabel', 'VAT'],
      ['fiscalYear', new Date().getFullYear().toString()],
    ];
    defaults.forEach(row => settingsSh.appendRow(row));
    Logger.log('Default settings written.');
  }

  // Seed sample business
  const bizSh = ss.getSheetByName('Businesses');
  if (bizSh.getLastRow() <= 1) {
    bizSh.appendRow([
      'BIZ-SEED-001',
      'Sunrise General Trade',
      'TIN-2021-001',
      'LIC-2021-001',
      'Main Street, Addis Ababa',
      '0911-001-001',
      'sunrise@trade.et',
      'Active',
      new Date().toISOString(),
    ]);
    Logger.log('Seed business added.');
  }

  // Seed sample items
  const itemSh = ss.getSheetByName('Items');
  if (itemSh.getLastRow() <= 1) {
    const sampleItems = [
      ['ITM-SEED-001','BIZ-SEED-001','ITM-001','Laptop 15"','Electronics',45000,15,'Active'],
      ['ITM-SEED-002','BIZ-SEED-001','ITM-002','Office Chair','Furniture',8500,15,'Active'],
      ['ITM-SEED-003','BIZ-SEED-001','ITM-003','Rice (25kg)','Groceries',1200,0,'Active'],
      ['ITM-SEED-004','BIZ-SEED-001','ITM-004','Printer Paper A4','Stationery',350,15,'Active'],
      ['ITM-SEED-005','BIZ-SEED-001','ITM-005','Cooking Oil 5L','Groceries',680,0,'Active'],
    ];
    sampleItems.forEach(row => itemSh.appendRow(row));
    Logger.log('Seed items added.');
  }

  // Create default admin user (password: Admin@1234)
  const usersSh = ss.getSheetByName('Users');
  if (usersSh.getLastRow() <= 1) {
    const adminHash = hashPassword('Admin@1234');
    usersSh.appendRow([
      'USR-ADMIN-001', '', 'System Administrator', 'admin',
      adminHash, 'admin', '0911-000-000', 'Active', new Date().toISOString()
    ]);

    // Seed one of each role for testing
    const roles = [
      ['USR-OWNER-001','BIZ-SEED-001','Business Owner','owner','owner','0911-000-001'],
      ['USR-CASHIER-001','BIZ-SEED-001','Head Cashier','cashier','cashier','0911-000-002'],
      ['USR-OFFICER-001','','Revenue Officer','officer','officer','0911-000-003'],
    ];
    roles.forEach(([id, biz, name, uname, role, phone]) => {
      usersSh.appendRow([
        id, biz, name, uname, hashPassword(uname + '@1234'),
        role, phone, 'Active', new Date().toISOString()
      ]);
    });
    Logger.log('Default users created.');
    Logger.log('Admin login — username: admin | password: Admin@1234');
    Logger.log('Owner login — username: owner | password: owner@1234');
    Logger.log('Cashier login — username: cashier | password: cashier@1234');
    Logger.log('Officer login — username: officer | password: officer@1234');
  }

  SpreadsheetApp.getUi().alert(
    '✅ Setup complete!\n\n' +
    'Default credentials:\n' +
    '  Admin    →  admin / Admin@1234\n' +
    '  Owner    →  owner / owner@1234\n' +
    '  Cashier  →  cashier / cashier@1234\n' +
    '  Officer  →  officer / officer@1234\n\n' +
    'Deploy this script as a Web App to launch the portal.'
  );
}

// Utility needed by Setup (duplicate-safe — same logic as Code.gs)
function hashPassword(password) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return raw.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}
