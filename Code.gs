/**
 * Cash Registration Portal
 * Main Entry Point and Routing
 */

function doGet(e) {
  var page = e.parameter.page || 'login';
  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle('Cash Registration Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Global Constants
 */
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * Helper to get a sheet by name
 */
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

/**
 * Helper to get data as array of objects
 */
function getSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });
}
