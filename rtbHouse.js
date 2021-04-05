function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [];
  menuItems.push(null); // line separator
  menuItems.push({name: "Actualizar Gasto RTB", functionName: "rtbhouse"});
  menuItems.push(null); // line separator
  spreadsheet.addMenu('Update', menuItems);
}

function rtbhouse() {
   var sheet = SpreadsheetApp.getActiveSheet();
   var fecha_fin = sheet.getRange("A2").getDisplayValue();
   var headers = {
    "Accept": "application/json",
    "Cache-Control": "no-cache",
    "Authorization" : "Basic bWFudWVsX2F5ZXJ6YUBtY2tpbnNleS5jb206ZENSZlJxeVNHKjVMcnVO",
    "Connection": "keep-alive",
    "Content-Type": "application/json"};  
   var options = {
    "async": true,
    "crossDomain": true,
    "method" : "GET",
    "headers": headers,
  };
  var rtb = UrlFetchApp.fetch('https://api.panel.rtbhouse.com/v3/advertisers/sPCdwYBFsqixOVH0GDlS/rtb-stats?dayFrom=2020-07-01&dayTo='+fecha_fin+'&groupBy=day&countConvention=ATTRIBUTED', options).getContentText();
  var parseo = JSON.parse(rtb);
  // '+fecha_fin+'
  var resultado = arreglo(parseo);
  sheet.getRange(2, 2, resultado.length, resultado[0].length).setValues(resultado);
  //var cell = sheet.getRange("A2");
  //cell.setValue(token);
}

function arreglo(parseo){
  var ecps = [];
  var conversionsCount = [];
  var roas = [];
  var ecc = [];
  var ctr = [];
  var conversionsValue=[];
  var campaignCost = [];
  var cr = [];
  var clicksCount = [];
  var day = [];
  var cpc = [];
  var impsCount=[];

   for (var i in parseo.data){
     ecps[i]=parseo.data[i].ecps;
     conversionsCount[i]=parseo.data[i].conversionsCount;
     roas[i]=parseo.data[i].roas;
     ecc[i]=parseo.data[i].ecc;
     ctr[i]=parseo.data[i].ctr;
     conversionsValue[i]=parseo.data[i].conversionsValue;
     campaignCost[i]=parseo.data[i].campaignCost;
     cr[i]=parseo.data[i].cr;
     clicksCount[i]=parseo.data[i].clicksCount;
     day[i]=parseo.data[i].day;
     cpc[i]=parseo.data[i].cpc;
     impsCount[i]=parseo.data[i].impsCount;   
   }
  var x=[day,impsCount,ecc,ctr,campaignCost,conversionsCount,conversionsValue,cr,cpc,roas,ecps];
  var y = transposeArray(x);
  return y;
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
