/**
 * Authentication Logic
 */

function login(username, password) {
  var users = getSheetData('USERS');
  var user = users.find(u => u.Username === username && u.Password === password && u.Status === 'ACTIVE');
  
  if (user) {
    // In a real app, we'd use sessions. In GAS web apps, we often pass user info back to client.
    return {
      success: true,
      user: {
        userId: user.UserID,
        fullName: user.FullName,
        role: user.Role,
        businessId: user.BusinessID
      }
    };
  }
  return { success: false, message: 'Invalid credentials or inactive account' };
}

function getUserProfile(userId) {
  var users = getSheetData('USERS');
  return users.find(u => u.UserID === userId);
}
