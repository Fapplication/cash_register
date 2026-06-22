/**
 * Item Management
 */

function getItemsByBusiness(businessId) {
  var items = getSheetData('ITEMS');
  return items.filter(item => item.BusinessID === businessId && item.Status === 'ACTIVE');
}

function addItem(itemData) {
  var sheet = getSheet('ITEMS');
  var id = 'ITEM-' + new Date().getTime();
  sheet.appendRow([
    id,
    itemData.businessId,
    itemData.itemCode,
    itemData.itemName,
    itemData.unitPrice,
    itemData.taxRate,
    'ACTIVE'
  ]);
  return { success: true, itemId: id };
}

function updateItem(itemId, itemData) {
  var sheet = getSheet('ITEMS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === itemId) {
      sheet.getRange(i + 1, 3).setValue(itemData.itemCode);
      sheet.getRange(i + 1, 4).setValue(itemData.itemName);
      sheet.getRange(i + 1, 5).setValue(itemData.unitPrice);
      sheet.getRange(i + 1, 6).setValue(itemData.taxRate);
      return { success: true };
    }
  }
  return { success: false };
}

function deactivateItem(itemId) {
  var sheet = getSheet('ITEMS');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === itemId) {
      sheet.getRange(i + 1, 7).setValue('INACTIVE');
      return { success: true };
    }
  }
  return { success: false };
}
