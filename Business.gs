/**
 * Business Management
 */

function getBusinessInfo(businessId) {
  var businesses = getSheetData('BUSINESSES');
  return businesses.find(b => b.BusinessID === businessId);
}

function updateBusinessContact(businessId, address, phone, email) {
  var sheet = getSheet('BUSINESSES');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === businessId) {
      sheet.getRange(i + 1, 5).setValue(address);
      sheet.getRange(i + 1, 6).setValue(phone);
      sheet.getRange(i + 1, 7).setValue(email);
      return { success: true };
    }
  }
  return { success: false, message: 'Business not found' };
}

function getAllBusinesses() {
  return getSheetData('BUSINESSES');
}
