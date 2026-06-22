/**
 * Revenue Dashboard Logic
 */

function getRevenueSummary() {
  var txns = getSheetData('TRANSACTIONS');
  var today = new Date().setHours(0,0,0,0);
  var thisMonth = new Date().getMonth();
  var thisYear = new Date().getFullYear();
  
  var summary = {
    totalRevenueToday: 0,
    totalRevenueMonth: 0,
    totalTaxCollected: 0,
    totalTransactions: txns.length,
    activeBusinesses: getSheetData('BUSINESSES').filter(b => b.Status === 'ACTIVE').length
  };
  
  txns.forEach(t => {
    var tDate = new Date(t.DateTime);
    if (tDate.setHours(0,0,0,0) === today) {
      summary.totalRevenueToday += t.Total;
    }
    if (tDate.getMonth() === thisMonth && tDate.getFullYear() === thisYear) {
      summary.totalRevenueMonth += t.Total;
    }
    summary.totalTaxCollected += t.Tax;
  });
  
  return summary;
}

function getRevenueTrends() {
  var txns = getSheetData('TRANSACTIONS');
  // Logic to group by date/month for charts
  var daily = {};
  txns.forEach(t => {
    var dateStr = Utilities.formatDate(new Date(t.DateTime), "GMT", "yyyy-MM-dd");
    daily[dateStr] = (daily[dateStr] || 0) + t.Total;
  });
  
  return {
    daily: Object.keys(daily).map(k => [k, daily[k]])
  };
}
