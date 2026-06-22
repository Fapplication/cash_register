# Cash Registration Portal - System Design Document

## 1. Introduction

This document outlines the design and architecture for a Cash Registration Portal, a web application leveraging Google Sheets as a backend database and Google Apps Script for server-side logic. The portal aims to provide a robust system for businesses to register items, record cash sales, generate receipts, and manage reports, with distinct functionalities for various user roles.

## 2. System Overview

The Cash Registration Portal will serve three primary user types: Business Users (Business Owners and Cashiers), Revenue Office Users, and Administrators. Each user type will have specific functionalities and access levels, ensuring data integrity and operational efficiency.

## 3. User Roles and Functionalities

The system defines the following roles with their respective capabilities:

| Role | Capabilities | Restrictions |
| :--- | :--- | :--- |
| **ADMIN** | Manage businesses, manage users, manage permissions, system configuration. | None. |
| **BUSINESS_OWNER** | View own business transactions, manage items (add, edit, deactivate), view sales history, generate reports (daily, monthly, tax). | Cannot view other businesses' data. |
| **CASHIER** | Create transactions, print receipts. | Cannot edit completed sales, cannot delete sales. |
| **REVENUE_OFFICER** | View all transactions from all businesses, view revenue summaries, download reports, monitor tax collections. | Cannot edit transactions, cannot delete transactions, cannot add businesses. |

## 4. Database Schema (Google Sheets)

The system uses a single Google Spreadsheet with the following sheets (tables):

### 4.1 USERS
| Column | Description |
| :--- | :--- |
| UserID | Unique identifier for the user. |
| FullName | Full name of the user. |
| Username | Login username. |
| Password | Login password. |
| Role | User role (ADMIN, BUSINESS_OWNER, CASHIER, REVENUE_OFFICER). |
| BusinessID | Associated business ID (if applicable). |
| Status | Account status (ACTIVE, INACTIVE). |

### 4.2 BUSINESSES
| Column | Description |
| :--- | :--- |
| BusinessID | Unique identifier for the business. |
| BusinessName | Name of the business. |
| TIN | Tax Identification Number. |
| LicenseNo | Business license number. |
| Address | Physical address. |
| Phone | Contact phone number. |
| Email | Contact email address. |
| Status | Business status (ACTIVE, INACTIVE). |

### 4.3 ITEMS
| Column | Description |
| :--- | :--- |
| ItemID | Unique identifier for the item. |
| BusinessID | Associated business ID. |
| ItemCode | SKU or item code. |
| ItemName | Name of the item. |
| UnitPrice | Price per unit. |
| TaxRate | Applicable tax rate. |
| Status | Item status (ACTIVE, INACTIVE). |

### 4.4 TRANSACTIONS
| Column | Description |
| :--- | :--- |
| TransactionID | Unique identifier for the transaction. |
| ReceiptNo | Generated receipt number. |
| BusinessID | Associated business ID. |
| CashierID | ID of the cashier who processed the sale. |
| DateTime | Timestamp of the transaction. |
| Subtotal | Total amount before tax. |
| Tax | Total tax amount. |
| Total | Grand total amount. |

### 4.5 TRANSACTION_ITEMS
| Column | Description |
| :--- | :--- |
| TransactionID | Associated transaction ID. |
| ItemID | Associated item ID. |
| ItemName | Name of the item at the time of sale. |
| Qty | Quantity sold. |
| Price | Unit price at the time of sale. |
| Amount | Total amount for this item (Qty * Price). |

### 4.6 AUDIT_LOGS
| Column | Description |
| :--- | :--- |
| LogID | Unique identifier for the log entry. |
| UserID | ID of the user who performed the action. |
| Action | Type of action performed. |
| Description | Details of the action. |
| DateTime | Timestamp of the action. |

## 5. Application Architecture

The application is built using the Google Apps Script Web App framework.

### 5.1 Backend (Google Apps Script - `.gs` files)
- **Code.gs**: Main entry point, handles routing (`doGet`) and HTML template inclusion.
- **Auth.gs**: Handles user authentication and session management logic.
- **Business.gs**: Manages business profiles and data retrieval.
- **Item.gs**: Handles CRUD operations for business items.
- **Transaction.gs**: Processes sales, generates receipt numbers, and saves transaction data.
- **Revenue.gs**: Calculates revenue summaries and trends for the Revenue Office dashboard.
- **Reports.gs**: Generates data for daily and monthly reports.
- **Receipt.gs**: Retrieves data for generating PDF receipts.

### 5.2 Frontend (HTML/CSS/JS - `.html` files)
- **index.html**: The main wrapper and layout container.
- **style.html**: Contains custom CSS styles.
- **login_content.html / auth_js.html**: Login interface and logic.
- **business_dashboard_content.html / business_js.html**: Interface for Business Owners.
- **cash_register_content.html / transaction_js.html**: Point of Sale interface for Cashiers.
- **revenue_dashboard_content.html / revenue_js.html**: Dashboard for Revenue Officers.
- **admin_dashboard_content.html**: Dashboard for System Administrators.

## 6. Security Model

- **Authentication**: Users must log in with valid credentials.
- **Authorization**: Access to specific modules and data is strictly controlled based on the user's assigned role.
- **Data Isolation**: Business Owners and Cashiers can only access data related to their specific `BusinessID`.
- **Immutability**: Completed transactions cannot be edited or deleted by Cashiers or Revenue Officers.

## 7. Reporting and Export

The system supports generating reports for daily and monthly revenue, including tax collected. These reports can be viewed on the dashboards and are designed to be exportable to PDF or Excel formats (implementation details depend on specific library usage within the Apps Script environment).
