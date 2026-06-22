/**
 * Receipt Logic
 */

function getReceiptData(transactionId) {
  var txns = getSheetData('TRANSACTIONS');
  var txnItems = getSheetData('TRANSACTION_ITEMS');
  var businesses = getSheetData('BUSINESSES');
  
  var txn = txns.find(t => t.TransactionID === transactionId);
  if (!txn) return null;
  
  var items = txnItems.filter(ti => ti.TransactionID === transactionId);
  var business = businesses.find(b => b.BusinessID === txn.BusinessID);
  
  return {
    business: business,
    transaction: txn,
    items: items
  };
}
