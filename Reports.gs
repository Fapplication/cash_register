/**
 * Reports Generation
 */

function getDailyRevenueReport(date) {
  var txns = getSheetData('TRANSACTIONS');
  var targetDate = new Date(date).setHours(0,0,0,0);
  
  return txns.filter(t => new Date(t.DateTime).setHours(0,0,0,0) === targetDate);
}

function getMonthlyRevenueReport(month, year) {
  var txns = getSheetData('TRANSACTIONS');
  return txns.filter(t => {
    var d = new Date(t.DateTime);
    return d.getMonth() === parseInt(month) && d.getFullYear() === parseInt(year);
  });
}
