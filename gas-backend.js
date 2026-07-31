/**
 * Google Apps Script for SS-OPS Customer Top-Up Dashboard
 * Deployed as a Web App:
 * - Execute as: Me (your email)
 * - Who has access: Anyone
 */

const DEFAULT_SPREADSHEET_ID = "1zhRKPlJN60YgwqVvkzCrIGPBHW36U5t5B_dDgx6JCcI";

const SHEET_NAMES = [
  "Sign Up",
  "Smart@Home",
  "Fiber+",
  "SME service",
  "Pre-paid service",
  "Terminated"
];

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
    const customSheetId = e.parameter.sheetId || (e.postData && JSON.parse(e.postData.contents).sheetId);
    const spreadsheetId = customSheetId || DEFAULT_SPREADSHEET_ID;
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    ensureAllSheets(ss);
    
    if (action === 'get') {
      const data = getDataAll(ss);
      return jsonResponse(data);
    }
    
    let payload = null;
    let id = e.parameter.id;
    let index = e.parameter.index;
    let monthSheetName = e.parameter.monthSheetName;
    
    if (e.parameter.data) {
      payload = JSON.parse(e.parameter.data);
    } else if (e.postData) {
      const postBody = JSON.parse(e.postData.contents);
      payload = postBody.data;
      id = id || postBody.id;
      index = index || postBody.index;
      monthSheetName = monthSheetName || postBody.monthSheetName;
    }
    
    if (action === 'save') {
      if (!payload) {
        return jsonResponse({ error: "Missing payload data for save" });
      }
      saveData(ss, payload, id);
      return jsonResponse(getDataAll(ss));
    }
    
    if (action === 'save_renewal') {
      if (!payload) {
        return jsonResponse({ error: "Missing payload data for renewal save" });
      }
      if (!monthSheetName) {
        return jsonResponse({ error: "Missing monthSheetName for renewal save" });
      }
      saveRenewalData(ss, monthSheetName, payload);
      return jsonResponse({ success: true, data: getDataAll(ss) });
    }
    
    if (action === 'delete') {
      deleteData(ss, id);
      return jsonResponse(getDataAll(ss));
    }
    
    return jsonResponse({ error: "Invalid action. Supported: get, save, delete" });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function ensureAllSheets(ss) {
  SHEET_NAMES.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    ensureHeaders(sheet);
  });
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "ID", "Customer Name", "Top Up Number", "Contact", 
      "Source", "PIC", "Tariff / Service", "Amount", 
      "Sign Up Date", "Period", "Expiry Date", "Status", "Overdue Days",
      "Service Type", "Free Service", "Invoice Number", "Outstanding Amount"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1B8C3F")
      .setFontColor("white");
  }
}

function findCustomerById(ss, id) {
  if (!id) return null;
  for (let i = 0; i < SHEET_NAMES.length; i++) {
    const sheetName = SHEET_NAMES[i];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    const rows = sheet.getDataRange().getValues();
    for (let r = 1; r < rows.length; r++) {
      if (rows[r][0] && rows[r][0].toString() === id.toString()) {
        return {
          sheet: sheet,
          sheetName: sheetName,
          rowIndex: r + 1,
          rowData: rows[r]
        };
      }
    }
  }
  return null;
}

function getDataAll(ss) {
  const allData = [];
  SHEET_NAMES.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return;
    
    const headers = rows[0];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const item = {};
      headers.forEach((header, colIdx) => {
        const key = getPropertyKey(header);
        let val = row[colIdx];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        item[key] = val;
      });
      item.sheetRowIndex = i + 1;
      item.sheetName = sheetName;
      if (sheetName !== "Sign Up" && sheetName !== "Terminated") {
        item.is_renewed = true;
      }
      allData.push(item);
    }
  });
  return allData;
}

function getPropertyKey(header) {
  const map = {
    "ID": "id",
    "Customer Name": "customer",
    "Top Up Number": "number",
    "Contact": "contact",
    "Source": "source",
    "PIC": "pic",
    "Tariff / Service": "tariff",
    "Amount": "amount",
    "Sign Up Date": "signup_date",
    "New Start Date": "new_start_date",
    "Period": "period",
    "Expiry Date": "expire_date",
    "New Expiry Date": "new_expire_date",
    "Status": "status",
    "Renewal Status": "renewal_status",
    "Overdue Days": "overdue_days",
    "Renewal ID": "renewal_id",
    "Logged At": "logged_at",
    "Service Type": "service_type",
    "Free Service": "free_service",
    "Invoice Number": "invoice_number",
    "Outstanding Amount": "outstanding_amount",
    "Renewed By": "renewed_by"
  };
  return map[header] || header.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function getTargetSheetName(payload) {
  if (payload.status === "Terminated") {
    return "Terminated";
  }
  
  if (payload.is_renewed) {
    const serviceType = payload.service_type || "Smart@Home";
    if (serviceType === "Smart@Home") return "Smart@Home";
    if (serviceType === "Fiber+") return "Fiber+";
    if (serviceType === "SME Service") return "SME service";
    if (serviceType === "Prepaid Service") return "Pre-paid service";
  }
  
  return "Sign Up";
}

function saveData(ss, payload, id) {
  const searchId = id || payload.id;
  const existing = findCustomerById(ss, searchId);
  
  // If editing an existing customer who is already in a renewed sheet, keep the renewed flag
  if (existing && ["Smart@Home", "Fiber+", "SME service", "Pre-paid service"].indexOf(existing.sheetName) !== -1) {
    payload.is_renewed = true;
  }
  
  const targetSheetName = getTargetSheetName(payload);
  const targetSheet = ss.getSheetByName(targetSheetName);
  
  ensureHeaders(targetSheet);
  const headers = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn()).getValues()[0];
  
  const rowValues = headers.map(header => {
    const key = getPropertyKey(header);
    if (key === "id" && !payload.id) {
      return searchId || "CUST_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
    }
    return payload[key] !== undefined ? payload[key] : "";
  });
  
  if (existing) {
    if (existing.sheetName === targetSheetName) {
      // Update existing row
      targetSheet.getRange(existing.rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Delete from old sheet
      existing.sheet.deleteRow(existing.rowIndex);
      // Append to new sheet
      targetSheet.appendRow(rowValues);
    }
  } else {
    // Append to target sheet
    targetSheet.appendRow(rowValues);
  }
}

function deleteData(ss, id) {
  const existing = findCustomerById(ss, id);
  if (existing) {
    existing.sheet.deleteRow(existing.rowIndex);
  }
}

function saveRenewalData(ss, monthSheetName, payload) {
  let renewalSheet = ss.getSheetByName(monthSheetName);
  if (!renewalSheet) {
    renewalSheet = ss.insertSheet(monthSheetName);
  }
  
  // Ensure headers for the renewal sheet
  if (renewalSheet.getLastRow() === 0) {
    const headers = [
      "Renewal ID", "Customer Name", "Top Up Number", "Contact", 
      "Source", "PIC", "Tariff / Service", "Amount", 
      "New Start Date", "Period", "New Expiry Date", "Renewal Status", 
      "Renewed By", "Invoice Number", "Outstanding Amount", "Logged At"
    ];
    renewalSheet.appendRow(headers);
    renewalSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1B8C3F")
      .setFontColor("white");
  }
  
  const headers = renewalSheet.getRange(1, 1, 1, renewalSheet.getLastColumn()).getValues()[0];
  
  const searchId = payload.renewal_id || ("REN_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000));
  payload.renewal_id = searchId;
  payload.logged_at = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  const dataRows = renewalSheet.getDataRange().getValues();
  let targetRowIndex = -1;
  for (let i = 1; i < dataRows.length; i++) {
    if (dataRows[i][0].toString() === searchId.toString()) {
      targetRowIndex = i + 1;
      break;
    }
  }
  
  const rowValues = headers.map(header => {
    const key = getPropertyKey(header);
    return payload[key] !== undefined ? payload[key] : "";
  });
  
  if (targetRowIndex > 1 && targetRowIndex <= renewalSheet.getLastRow()) {
    renewalSheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    renewalSheet.appendRow(rowValues);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
