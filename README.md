# Smart Axiata Wifi Top-Up & Shop Operations Dashboard

A highly interactive, modern web dashboard for submitting and managing customer wifi top-ups and contract renewals. It features real-time synchronization with a Google Sheet database, auto-calculated expiry dates, overdue day tracking, custom renewal actions, and proactive expiry alert warnings.

---

## 🚀 Key Features

- **Left Sidebar Navigation (Color `#1B8C3F`)**: Fully styled sidebar with quick action shortcuts and a quick-find search bar.
- **Contract Sign Up Form**:
  - Auto-calculates **Expiry Date** in real-time as `Sign Up Date + Period`.
  - Auto-calculates **Overdue Days** if the contract is expired.
  - Dropdown selectors for Source (`Shop`, `Sale`, `Dealer`), Tariff/Service Plan (`Smart@Home Light`, `Smart@Home 5G`), and Status (`Active`, `Suspend`, `Terminated`).
- **Interactive Top Up & Customer Report**:
  - Displays detailed customer information including amount, PIC, contact info, and status.
  - Features **Icon-Only Action Buttons** for:
    - ✏️ **Edit**: Pre-fills the Sign Up form with customer details for quick modification.
    - 🔄 **Renewal**: Custom action that pre-fills the sign-up form with a **1-month contract renewal** starting on their previous expiry date.
    - 🗑️ **Delete**: Safely removes the subscription record.
- **Smart Expiry Alert Badges & Banner**:
  - Highlights customer contracts that are expiring within **5 days** (or already expired) with clear color-coded indicators.
  - Displays a persistent, dynamic warning banner listing all customers requiring contact for renewal.
- **Embedded Visual Analytics**: Features real-time responsive charts for *Active Contracts by Source* and *Tariff/Service Plan Distribution*.
- **Google Sheets Real-Time Sync**:
  - Built-in configuration tab for Sheet ID and Apps Script Deployment URL.
  - Fully persists configurations and data to `localStorage`, enabling seamless **offline / local fallback** mode if no cloud backend is configured.

---

## 📊 Database Integration (Google Sheets)

**Spreadsheet ID**: `1zhRKPlJN60YgwqVvkzCrIGPBHW36U5t5B_dDgx6JCcI`

### Columns Structure:
The Google Spreadsheet will automatically be initialized with the following headers upon first sync:
1. `ID`
2. `Customer Name`
3. `Top Up Number`
4. `Contact`
5. `Source`
6. `PIC`
7. `Tariff / Service`
8. `Amount`
9. `Sign Up Date`
10. `Period`
11. `Expiry Date`
12. `Status`
13. `Overdue Days`

---

## 🛠️ Google Apps Script Deployment Guide

To sync the dashboard with your Google Sheet, follow these simple steps to deploy the backend script:

1. Open your Google Sheet in a web browser.
2. Go to the menu: **Extensions** > **Apps Script**.
3. Clear any existing code in the editor and paste the code from `gas-backend.js` (or copy it directly from the **Setting** tab on the web dashboard).
4. Click the **Save** (disk) icon.
5. Click **Deploy** > **New deployment** (top-right corner).
6. Configure the deployment:
   - **Select type**: Click the gear icon and select **Web app**.
   - **Description**: `SS-Ops Backend API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
7. Click **Deploy**.
8. Grant necessary permissions (Google will ask you to authorize access to your Spreadsheet).
9. Copy the **Web App URL** provided at the end of the deployment (ends with `/exec`).
10. Open the web dashboard, navigate to the **Setting** tab, paste the URL in the *Google Apps Script Web App Deployment URL* field, and click **Save Settings & Sync**!

---

## 📂 Repository Structure

- `index.html`: Main single-page application dashboard (HTML, CSS, JS with Chart.js).
- `gas-backend.js`: Google Apps Script source code for easy reference and deployment.
- `README.md`: This setup documentation.
