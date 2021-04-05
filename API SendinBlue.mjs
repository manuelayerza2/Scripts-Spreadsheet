function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    {name: 'Actualizar resultados', functionName: 'sendingblue'}
  ];
  spreadsheet.addMenu('Actualizar', menuItems);
}

function sendingblue(){
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers2 = {
    "accept": "application/json",
    "api-key": "XXXX",
    "api-key": "XXXX",

   
    
   
    "Content-Type": "application/json"};
    
  var options2 = {
    "method" : "get",
    "headers": headers2,
    "muteHttpExceptions" : true
  }; 
  var name=[];
  var subject=[];
  var tag=[];
  var fechaEnvio=[];
  var abtest=[];
  var receptores=[];
  var sent = [];
  var delivered = [];
  var clickers = [];
  var uniqueClicks = [];
  var softBounces = [];
  var hardBounces = [];
  var uniqueViews = [];
  var unsubscriptions = [];
  var viewed = [];
  var complaints = [];
  var result2 = UrlFetchApp.fetch('https://api.sendinblue.com/v3/emailCampaigns?limit=500&offset=0', options2).getContentText();
  var parseo = JSON.parse(result2);
   for (i in parseo.campaigns){
     name[i] = parseo.campaigns[i].name;
     subject[i] = parseo.campaigns[i].subject;
     tag[i] = parseo.campaigns[i].tag;
     fechaEnvio[i] = parseo.campaigns[i].sentDate;
     abtest[i] = parseo.campaigns[i].abTesting;
     receptores[i] = parseo.campaigns[i].recipients.lists[0];
     sent[i] = parseo.campaigns[i].statistics.globalStats.sent;
     delivered[i] = parseo.campaigns[i].statistics.globalStats.delivered;
     clickers[i] = parseo.campaigns[i].statistics.globalStats.clickers;
     uniqueClicks[i] = parseo.campaigns[i].statistics.globalStats.uniqueClicks;
     softBounces[i] = parseo.campaigns[i].statistics.globalStats.softBounces;
     hardBounces[i] = parseo.campaigns[i].statistics.globalStats.hardBounces;
     uniqueViews[i] = parseo.campaigns[i].statistics.globalStats.uniqueViews;
     unsubscriptions[i] = parseo.campaigns[i].statistics.globalStats.unsubscriptions;
     viewed[i] = parseo.campaigns[i].statistics.globalStats.viewed;
     complaints[i] = parseo.campaigns[i].statistics.globalStats.complaints;

   }
  var x = [name, subject, tag, fechaEnvio, abtest, receptores,sent,delivered,clickers,uniqueClicks, softBounces, hardBounces, uniqueViews, unsubscriptions, viewed,complaints];
  var y = transposeArray(x);
  sheet.getRange(2, 1, y.length, y[0].length).setValues(y);
}

function transposeArray(array){
  var result = [];
  for (var col = 0; col < array[0].length; col++) { // Loop over array cols
    result[col] = [];
    for (var row = 0; row < array.length; row++) { // Loop over array rows
      result[col][row] = array[row][col]; // Rotate
    }
  }
  return result;
}