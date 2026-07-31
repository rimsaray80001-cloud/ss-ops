---
name: SS-Ops AI Coding Agent
description: Specialized agent for developing, maintaining, and reviewing the Smart Axiata Wifi Top-Up & Shop Operations Dashboard.
tools: [codebase, view, edit, create, grep, glob, bash]
target: github-copilot
user-invocable: true
---

# SS-Ops Codebase & Agent Guidelines

Welcome, Agent! This repository contains **Smart Axiata Wifi Top-Up & Shop Operations Dashboard**, a lightweight, highly interactive web application designed to manage customer top-ups, contract sign-ups, and renewals.

This file outlines the codebase conventions, technical stack, database structure, and key logic you must adhere to when making any contributions or edits.

---

## 🛠️ Repository & Tech Stack Overview

- **Single Page Application (SPA)**: The entire user interface, styles, and client-side logic are contained within a single file: `/home/runner/work/ss-ops/ss-ops/index.html`.
- **Frontend Stack**:
  - HTML5 & CSS3: Hand-written, using modern CSS variables defined under `:root`. Primary branding color is Smart Green (`#1B8C3F`).
  - Google Fonts: `Plus Jakarta Sans` and `Kantumruy Pro` for high-quality multilingual typography.
  - Chart.js: Used via CDN for rendering analytics and performance statistics.
  - Vanilla ES6+ JavaScript: No frameworks (such as React, Vue, or Angular) are used. Maintain clean, pure JavaScript.
- **Backend Stack**:
  - Google Apps Script: Deployed as a Web App to communicate with Google Sheets. Code lives in `/home/runner/work/ss-ops/ss-ops/gas-backend.js`.
- **Local Fallback**:
  - Synchronizes with `localStorage` (via keys like `ss_ops_customers`, `ss_ops_renewals`, `ss_ops_sheet_id`, `ss_ops_script_url`) to ensure complete offline/local functional fallback if a Google Sheets deployment URL is not configured.

---

## 📊 Database Schema & Sheet Partitioning

### 1. The Six Partitioned Sheets
The Google Sheets backend partitions customer data across **six sheets** based on service type, status, and whether a customer has been renewed:
1. **`Sign Up`**: Default sheet for initial customer signups.
2. **`Renew Smart@Home`**: Renewed customers with a "Smart@Home" service type.
3. **`Fiber+`**: Renewed customers with a "Fiber+" service type.
4. **`SME Service`**: Renewed customers with an "SME Service" service type.
5. **`Pre-paid`**: Renewed customers with a "Pre-paid" service type.
6. **`Terminate`**: Customers whose status is set to "Terminate" or "Terminated".

### 2. Auto-Filled Plan Rates (PLAN_AMOUNTS)
Plan rates are predefined. Do not hardcode these values across multiple places; use the `PLAN_AMOUNTS` mapping:
* **`4G`**: 15.00
* **`5G`**: 29.00
* **`Fiber+`**: 20.00
* **`Post paid`**: 35.00
* **`Hybrid+`**: 45.00
* **`ICT service`**: 60.00
* **`Smart Laor'`**: 5.00
* **`Smart Data 5G`**: 10.00

### 3. Header Configuration
When initializing sheets, the following headers are configured:
- **Standard Sheet Headers**: `ID`, `Customer Name`, `Top Up Number`, `Contact`, `Source`, `PIC`, `Tariff / Service`, `Amount`, `Sign Up Date`, `Period`, `Expiry Date`, `Status`, `Overdue Days`, `Service Type`, `Free Service`, `Invoice Number`, `Outstanding Amount`.
- **Renewal Sheet Headers**: `Renewal ID`, `Customer Name`, `Top Up Number`, `Contact`, `Source`, `PIC`, `Tariff / Service`, `Amount`, `New Start Date`, `Period`, `New Expiry Date`, `Renewal Status`, `Renewed By`, `Invoice Number`, `Outstanding Amount`, `Logged At`.

---

## 🔄 Core Workflows & Business Logic

### 1. Form Auto-Calculations
* **Expiry Date**: Automatically calculated in real-time as `Sign Up Date + Period` (months).
* **Overdue Days**: If the current date exceeds the Expiry Date, calculate the difference in days. If the status is not expired or is active/not yet past the expiry date, overdue days should show `0` or appropriate non-overdue values.
* **Expiry Alert Badges**: Visually highlight contracts expiring within **5 days** (or already expired) with clear color-coded badges and display them in the alert warnings banner.

### 2. Form & Action Actions
* **Edit Action**: Pre-fills the Sign Up form with selected customer details.
* **Renewal Action**: Custom action that pre-fills the sign-up form with a **1-month contract renewal** starting exactly on the previous expiry date.
* **Delete Action**: Safely deletes the customer row across any of the partitioned sheets based on ID.

---

## 🚫 Agent Boundaries & Best Practices

1. **Keep HTML Unified**:
   - Unless explicitly instructed otherwise, do not modularize or extract sections of `index.html` into multiple files. Keep everything in one cohesive, single-page application.
2. **Style Consistency**:
   - Use the CSS variables defined in `:root`. Keep all styling aligned with Smart Axiata's branding colors (primary Green: `#1B8C3F`).
3. **Synchronization & Offline Support**:
   - Always ensure changes to data sync with *both* local storage and the Google Apps Script Web App (if configured).
4. **Google Apps Script Code Delivery**:
   - The settings tab displays the backend Apps Script code dynamically. If you change `/home/runner/work/ss-ops/ss-ops/gas-backend.js`, make sure to update any string templates or inline functions in `index.html` that export/display this code.
5. **No Extra Dependencies**:
   - No build systems, transpilers, or CSS preprocessors are used. Do not introduce packages or configuration files like `package.json`, `webpack`, `vite`, or Tailwind CLI unless specifically requested by the user. Keep dependencies CDNs-only.
