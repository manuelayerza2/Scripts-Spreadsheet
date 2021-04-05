function pullJSON() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var sheet = ss.getActiveSheet();
  var url="https://api.brandmeister.network/v1.0/repeater/?action=get&q=1148311"; // Paste your JSON URL here
  var response = UrlFetchApp.fetch(url); // get feed
  var dataAll = JSON.parse(response.getContentText());

  // I modified below.
  var rows = [Object.keys(dataAll)]; // Retrieve headers.
  var temp = [];
  for (var i = 0; i < rows[0].length; i++) {
    temp.push(dataAll[rows[0][i]]); // Retrieve values.
  }
  rows.push(temp);
  sheet.getRange(1,1,rows.length,rows[0].length).setValues(rows); // Put values to Spreadsheet.
}