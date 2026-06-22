/**
 * Transaction Management
 */

function processSale(saleData) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var transSheet = ss.getSheetByName('TRANSACTIONS');
  var itemsSheet = ss.getSheetByName('TRANSACTION_ITEMS');
  
  var transactionId = 'TXN-' + new Date().getTime();
  var receiptNo = 'RC-' + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd") + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Save Transaction
  transSheet.appendRow([
    transactionId,
    receiptNo,
    saleData.businessId,
    saleData.cashierId,
    new Date(),
    saleData.subtotal,
    saleData.tax,
    saleData.total
  ]);
  
  // Save Transaction Items
  saleData.items.forEach(item => {
    itemsSheet.appendRow([
      transactionId,
      item.itemId,
      item.itemName,
      item.qty,
      item.price,
      item.amount
    ]);
  });
  
  return { 
    success: true, 
    transactionId: transactionId, 
    receiptNo: receiptNo,
    dateTime: new Date().toISOString()
  };
}

function getTransactionsByBusiness(businessId) {
  var txns = getSheetData('TRANSACTIONS');
  return txns.filter(t => t.BusinessID === businessId);
}

function getAllTransactions() {
  return getSheetData('TRANSACTIONS');
}
