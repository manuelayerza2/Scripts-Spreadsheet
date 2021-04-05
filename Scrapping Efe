function onOpen() {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [];
  menuItems.push({name: "Actualizar efe", functionName: "ppal"});
  menuItems.push(null); // line separator
  spreadsheet.addMenu('Actualizar', menuItems);
}

function ppal(){
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Resultados");
  var rangeurl = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("categorias").getDataRange();
  var values = rangeurl.getValues();
  var numRows = rangeurl.getNumRows();
  var a=[];
  for (let j = 1; j <= numRows; j++){
    var url = rangeurl.getCell(j, 2).getValue();
    var categoria = rangeurl.getCell(j, 1).getValue();
    a = efe(url,categoria);
    sheet.appendRow(a);
  }
}

function efe(url, categoria) {
  
  var date = Utilities.formatDate(new Date(), "GMT+1", "dd/MM/yyyy")
  var websiteContent = UrlFetchApp.fetch(url);
  var totalExp = /"totalResultCount":([\s\S]*?)",/gi;
  var total = websiteContent.getContentText().match(totalExp);
  var final= total[0].replace(/"totalResultcount": "/gi,"").replace(/",/gi,"");
  var categExp = /<span class="outline">([\s\S]*?)<\/div>/gi;
  var categ = websiteContent.getContentText().match(categExp);
  var a = [];
  var categReal = [];
  a[2]="Total "+final;
  a[1]=categoria;
  a[0]=date;
   for(var i in categ)
    {
      categReal[i]=categ[i].replace(/(^\s+)|(\s+$)/g, "").replace(/<\/?[^>]+>/gi, "").replace(/\s/g, "") ;
      a.push(categReal[i]);
    }
  return a;

}