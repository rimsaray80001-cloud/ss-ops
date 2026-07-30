/**
 * Google Apps Script for SS-OPS Customer Top-Up Dashboard
 * Deployed as a Web App:
 * - Execute as: Me (your email)
 * - Who has access: Anyone
 */

const DEFAULT_SPREADSHEET_ID = "1zhRKPlJN60YgwqVvkzCrIGPBHW36U5t5B_dDgx6JCcI";

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
    let sheet = ss.getSheets()[0];
    if (!sheet) {
      sheet = ss.insertSheet();
    }
    
    // Ensure sheet headers exist
    ensureHeaders(sheet);
    
    if (action === 'get') {
      const data = getData(sheet);
      return jsonResponse(data);
    }
    
    let payload = null;
    let id = e.parameter.id;
    let index = e.parameter.index;
    
    if (e.parameter.data) {
      payload = JSON.parse(e.parameter.data);
    } else if (e.postData) {
      const postBody = JSON.parse(e.postData.contents);
      payload = postBody.data;
      id = id || postBody.id;
      index = index || postBody.index;
    }
    
    if (action === 'save') {
      if (!payload) {
        return jsonResponse({ error: "Missing payload data for save" });
      }
      saveData(sheet, payload, id, index);
      return jsonResponse(getData(sheet));
    }
    
    if (action === 'delete') {
      deleteData(sheet, id, index);
      return jsonResponse(getData(sheet));
    }
    
    return jsonResponse({ error: "Invalid action. Supported: get, save, delete" });
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "ID", "Customer Name", "Top Up Number", "Contact", 
      "Source", "PIC", "Tariff / Service", "Amount", 
      "Sign Up Date", "Period", "Expiry Date", "Status", "Overdue Days"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1B8C3F")
      .setFontColor("white");
  }
}

function getData(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  const data = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item = {};
    headers.forEach((header, colIdx) => {
      const key = getPropertyKey(header);
      let val = row[colIdx];
      if (val instanceof Date) {
        // Convert dates to standard YYYY-MM-DD format
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      item[key] = val;
    });
    // Add spreadsheet row index (1-based, real sheet row index)
    item.sheetRowIndex = i + 1;
    data.push(item);
  }
  return data;
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
    "Period": "period",
    "Expiry Date": "expire_date",
    "Status": "status",
    "Overdue Days": "overdue_days"
  };
  return map[header] || header.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function saveData(sheet, payload, id, index) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const dataRows = sheet.getDataRange().getValues();
  
  let targetRowIndex = -1;
  const searchId = id || payload.id;
  
  if (searchId) {
    for (let i = 1; i < dataRows.length; i++) {
      if (dataRows[i][0].toString() === searchId.toString()) {
        targetRowIndex = i + 1;
        break;
      }
    }
  } else if (index !== undefined && index !== null && index !== "" && index !== -1) {
    targetRowIndex = parseInt(index);
  }
  
  // Build standard row values matching headers
  const rowValues = headers.map(header => {
    const key = getPropertyKey(header);
    if (key === "id" && !payload.id) {
      return searchId || "CUST_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
    }
    return payload[key] !== undefined ? payload[key] : "";
  });
  
  if (targetRowIndex > 1 && targetRowIndex <= sheet.getLastRow()) {
    // Update existing row
    sheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Append new row
    sheet.appendRow(rowValues);
  }
}

function deleteData(sheet, id, index) {
  const dataRows = sheet.getDataRange().getValues();
  let targetRowIndex = -1;
  const searchId = id;
  
  if (searchId) {
    for (let i = 1; i < dataRows.length; i++) {
      if (dataRows[i][0].toString() === searchId.toString()) {
        targetRowIndex = i + 1;
        break;
      }
    }
  } else if (index !== undefined && index !== null && index !== "" && index !== -1) {
    targetRowIndex = parseInt(index);
  }
  
  if (targetRowIndex > 1 && targetRowIndex <= sheet.getLastRow()) {
    sheet.deleteRow(targetRowIndex);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}
