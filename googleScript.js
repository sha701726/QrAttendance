function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.trim() !== "")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Extract and clean input data
    const fullName = toTitleCase(data.fullName || '');
    const mobile = data.mobile || '';
    const employeeId = data.employeeId || '';
    const department = toTitleCase(data.department || '');
    const timestamp = new Date();
    const today = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "dd-MM-yyyy");
    const currentTime = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "HH:mm:ss");

    // Get header rows
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];       // Date (merged) headers
    const subHeaders = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];    // Check-in / Check-out labels

    // Find today's check-in and check-out column indexes
    let checkInCol = -1;
    let checkOutCol = -1;
    for (let i = 0; i < headers.length - 1; i++) {
      if (headers[i] === today && subHeaders[i] === "Check-in" && subHeaders[i + 1] === "Check-out") {
        checkInCol = i + 1;
        checkOutCol = i + 2;
        break;
      }
    }

    if (checkInCol === -1 || checkOutCol === -1) {
      return ContentService.createTextOutput("Error: Today's columns not found.")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Search for existing employee by ID
    const empIds = sheet.getRange(3, 4, sheet.getLastRow() - 2).getValues(); // Column 4 = Employee ID
    let rowIndex = empIds.findIndex(row => String(row[0]).trim() === employeeId.trim()) + 3; // +3 due to header rows

    // Add new user if not found
    if (rowIndex === 2) {
      rowIndex = sheet.getLastRow() + 1;
      const serial = rowIndex - 2;
      sheet.getRange(rowIndex, 1, 1, 5).setValues([[serial, fullName, mobile, employeeId, department]]);
    }

    // Get today's cells for the user
    const checkInCell = sheet.getRange(rowIndex, checkInCol);
    const checkOutCell = sheet.getRange(rowIndex, checkOutCol);

    // Prevent multiple entries
    if (!checkInCell.getValue()) {
      checkInCell.setValue(currentTime);
      return ContentService.createTextOutput("Checked in at " + currentTime)
        .setMimeType(ContentService.MimeType.TEXT);
    } else if (!checkOutCell.getValue()) {
      checkOutCell.setValue(currentTime);
      return ContentService.createTextOutput("Checked out at " + currentTime)
        .setMimeType(ContentService.MimeType.TEXT);
    } else {
      return ContentService.createTextOutput("Already marked for today.")
        .setMimeType(ContentService.MimeType.TEXT);
    }

  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
