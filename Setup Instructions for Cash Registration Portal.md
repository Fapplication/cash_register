# Setup Instructions for Cash Registration Portal

Follow these steps to deploy the Cash Registration Portal using Google Sheets and Google Apps Script.

## 1. Prepare the Google Spreadsheet

1. Create a new Google Spreadsheet.
2. Create the following sheets (tabs) with the exact headers in the first row:

### USERS
`UserID`, `FullName`, `Username`, `Password`, `Role`, `BusinessID`, `Status`

### BUSINESSES
`BusinessID`, `BusinessName`, `TIN`, `LicenseNo`, `Address`, `Phone`, `Email`, `Status`

### ITEMS
`ItemID`, `BusinessID`, `ItemCode`, `ItemName`, `UnitPrice`, `TaxRate`, `Status`

### TRANSACTIONS
`TransactionID`, `ReceiptNo`, `BusinessID`, `CashierID`, `DateTime`, `Subtotal`, `Tax`, `Total`

### TRANSACTION_ITEMS
`TransactionID`, `ItemID`, `ItemName`, `Qty`, `Price`, `Amount`

### AUDIT_LOGS
`LogID`, `UserID`, `Action`, `Description`, `DateTime`

## 2. Add Initial Data (Sample)

Add at least one admin user to the **USERS** sheet to get started:
- `UserID`: U-001
- `FullName`: System Admin
- `Username`: admin
- `Password`: admin123
- `Role`: ADMIN
- `BusinessID`: (leave blank)
- `Status`: ACTIVE

## 3. Set Up Google Apps Script

1. In your Spreadsheet, go to **Extensions** > **Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Create the following files in the Apps Script editor and paste the corresponding code provided:
   - `Code.gs`
   - `Auth.gs`
   - `Business.gs`
   - `Item.gs`
   - `Transaction.gs`
   - `Revenue.gs`
   - `Reports.gs`
   - `Receipt.gs`
   - `index.html`
   - `style.html`
   - `login_content.html`
   - `auth_js.html`
   - `business_dashboard_content.html`
   - `business_js.html`
   - `cash_register_content.html`
   - `transaction_js.html`
   - `revenue_dashboard_content.html`
   - `revenue_js.html`
   - `admin_dashboard_content.html`

## 4. Deploy the Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**.
2. Select **Web app** as the type.
3. Set **Execute as** to "Me".
4. Set **Who has access** to "Anyone" (or your preferred setting).
5. Click **Deploy** and authorize the script.
6. Copy the **Web App URL** – this is your portal link!
