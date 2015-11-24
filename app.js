//node modules
var _ = require('lodash');
var request = require('request'); //async load json
var Promise = require('es6-promise').Promise;
var json2csv = require('json2csv');
var fs = require("fs");  //filestream

var express = require('express');
var app = express();

// respond with "Hello World!" on the homepage
app.get('/', function (req, res) {
  
  
  //res.send('id: ' + req.query.time);
  
  //date range
var min_date = new Date(2008,6,1);
var max_date = new Date(2015,5,30);


//functions
function convertmonthtext(monthtext){
  if(monthtext==="JAN"){return 0;}
  if(monthtext==="FEB"){return 1;}
  if(monthtext==="MAR"){return 2;}
  if(monthtext==="APR"){return 3;}
  if(monthtext==="MAY"){return 4;}
  if(monthtext==="JUN"){return 5;}
  if(monthtext==="JUL"){return 6;}
  if(monthtext==="AUG"){return 7;}
  if(monthtext==="SEP"){return 8;} 
  if(monthtext==="OCT"){return 9;}
  if(monthtext==="NOV"){return 10;}
  if(monthtext==="DEC"){return 11;}  
}

function parseDate(dateofaward){
  
  //if date is undefined in source data, it will fall through to second return
  if(dateofaward){
       var awardday=parseInt(dateofaward.substr(0,2));
       var awardmonth=dateofaward.substr(3,3);
       var awardyear=dateofaward.substr(7,2);
       
       //hopefully my code doesn't last long enough where this will be a problem
       var preyear; //adds correct century digits
       if(parseInt(awardyear)>50){preyear="19";}else{preyear="20";}
       awardyear=preyear+awardyear;
                  
       return  new Date(parseInt(awardyear), convertmonthtext(awardmonth), awardday);
    
  }
  
  return new Date(1950, 0, 1);  //no date passed - flag error later for data validation
}


//--TASK 1-- filter by program and date

//get raw competitve grants =competitve
var promise1 = new Promise(function(resolve, reject) {
  
request({
    url: 'https://dola.colorado.gov/gis-tmp/allcompetitive.json',
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode === 200) {

     var competitivefiltered = _.filter(body, function(chr) {
       
     var date_award = parseDate(chr.DATE_OF_AWARD);
     return  (chr.PROGRAM_TYPE === 'EIAF' && date_award>=min_date && date_award<=max_date);
              
     });
      
        if (competitivefiltered.length>0) {
    resolve(competitivefiltered);
  }
  else {
    resolve("No results - Competitive Awards");
  }
      
    }
});

});


//get raw formulaic grants =formulaic
var promise2 = new Promise(function(resolve, reject) {

request({
    url: 'https://dola.colorado.gov/gis-tmp/allformulaic.json',
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode === 200) {

     var formulaicfiltered = _.filter(body, function(chr) {
       
     var date_award = parseDate(chr.DIST_DATE);
     return ((chr.PROGRAM_TYPE === 'SEV_DIST' || chr.PROGRAM_TYPE === 'FML') && date_award>=min_date && date_award<=max_date);
       
     });
      
        if (formulaicfiltered.length>0) {
    resolve(formulaicfiltered);
  }
  else {
    resolve("No results - Formulaic Awards");
  }

    }
});
  
});


//combine to common schema =grantscombined
//wait for both promises to complete
Promise.all([promise1, promise2]).then(function(values) { 

  var competitive = values[0];
  var formulaic = values[1];

  
  var allgrants=[];
  
  var i;
  for(i=0;i<competitive.length;i=i+1){
    
    
    allgrants.push(
      {
        "LG_ID": competitive[i].LG_ID,
        "COUNTY": competitive[i].COUNTY,
        "PROJECT_NMBR": competitive[i].PROJECT_NMBR,
        "PROGRAM_TYPE": competitive[i].PROGRAM_TYPE,
        "PROJECT_TYPE": competitive[i].PROJECT_TYPE,
        "PROJECT_NAME": competitive[i].PROJECT_NAME,
        "PROJECT_DESCRIPTION": competitive[i].PROJECT_DESCRIPTION,
        "ENTITY_APPLICANT": competitive[i].APPLICANT_TITLE,  
        "DATE_OF_AWARD": competitive[i].DATE_OF_AWARD,
        "FY_AWARD": competitive[i].FY_AWARD,
        "EXECUTION_DATE": competitive[i].EXECUTION_DATE,
        "FY_EXEC": competitive[i].FY_EXEC,
        "AMT_AWARDED": competitive[i].AMT_AWARDED,
        "AMT_SEVERANCE": competitive[i].AMT_SEVERANCE,    
        "AMT_MINERAL": competitive[i].AMT_MINERAL,
        "MATCHING_FUNDS": competitive[i].MATCHING_FUNDS,
        "MEASURABLE": competitive[i].MEASURABLE,
        "REGION_MANAGER": competitive[i].REGION_MANAGER,
        "FS_REGIONS": competitive[i].FS_REGIONS         
      }
    );
  }
  
  for(i=0;i<formulaic.length;i=i+1){
    allgrants.push(
      {
        "LG_ID": formulaic[i].LG_ID,
        "COUNTY": formulaic[i].COUNTY,
        "PROJECT_NMBR": null,
        "PROGRAM_TYPE": formulaic[i].PROGRAM_TYPE,
        "PROJECT_TYPE": null,
        "PROJECT_NAME": null,
        "PROJECT_DESCRIPTION": null,
        "ENTITY_APPLICANT": formulaic[i].ENTITY_NAME,  
        "DATE_OF_AWARD": formulaic[i].DIST_DATE,
        "FY_AWARD": formulaic[i].FISCAL_YEAR,
        "EXECUTION_DATE": formulaic[i].DIST_DATE,
        "FY_EXEC": formulaic[i].FISCAL_YEAR,
        "AMT_AWARDED": formulaic[i].DIST_AMOUNT,
        "AMT_SEVERANCE": null,    
        "AMT_MINERAL": null,
        "MATCHING_FUNDS": null,
        "MEASURABLE": null,
        "REGION_MANAGER": null,
        "FS_REGIONS": null         
      }
    );
  }  
  

  var splitgrants=[];
  
  for(j=0;j<(allgrants.length);j=j+1){
    
    //omg, big problems when null values in object - check that a value is truthy
    if(allgrants[j]["COUNTY"]){
    cvar = (allgrants[j]["COUNTY"]);
    if (cvar.indexOf(',') > -1) { 

      var countylist=cvar.split(", ");


      var county_count = countylist.length;
      for(var k=0; k<county_count; k=k+1){
        splitgrants.push({
        "LG_ID": allgrants[j].LG_ID,
        "COUNTY": countylist[k],
        "PROJECT_NMBR": allgrants[j].PROJECT_NMBR,
        "PROGRAM_TYPE": allgrants[j].PROGRAM_TYPE,
        "PROJECT_TYPE": allgrants[j].PROJECT_TYPE,
        "PROJECT_NAME": allgrants[j].PROJECT_NAME,
        "PROJECT_DESCRIPTION": allgrants[j].PROJECT_DESCRIPTION,
        "ENTITY_APPLICANT": allgrants[j].APPLICANT_TITLE,  
        "DATE_OF_AWARD": allgrants[j].DATE_OF_AWARD,
        "FY_AWARD": allgrants[j].FY_AWARD,
        "EXECUTION_DATE": allgrants[j].EXECUTION_DATE,
        "FY_EXEC": allgrants[j].FY_EXEC,
        "AMT_AWARDED": parseFloat(allgrants[j].AMT_AWARDED)/county_count,
        "AMT_SEVERANCE": parseFloat(allgrants[j].AMT_SEVERANCE)/county_count,    
        "AMT_MINERAL": parseFloat(allgrants[j].AMT_MINERAL)/county_count,
        "MATCHING_FUNDS": parseFloat(allgrants[j].MATCHING_FUNDS)/county_count,
        "MEASURABLE": parseFloat(allgrants[j].MEASURABLE)/county_count,
        "REGION_MANAGER": allgrants[j].REGION_MANAGER,
        "FS_REGIONS": allgrants[j].FS_REGIONS           
        });
      }
      //multi-county - push one record for each county into new array (splitgrants)
      
    }
  }

  }

      
  //now, remove all elements that have commas from the old array
    allgrants = _.filter(allgrants, function(el) {
         comma_check = el.COUNTY;
      if(comma_check){
    if(comma_check.indexOf(',') === -1){ 
      return true; 
    }else{
      return false;
    }
      }
    });

    
    //merge the new array (splitgrants) with the old array (allgrants)
  var countygrants = allgrants.concat(splitgrants);  
  
  
 split_awards(countygrants);  
    
  
});

//--TASK 2-- aggregate awards to county level

function split_awards(allgrants){
  
function sum(numbers) {
    return _.reduce(numbers, function(result, current) {
        return result + parseFloat(current);
    }, 0);
}
var result = _.chain(allgrants)
    .groupBy("COUNTY")
    .map(function(value, key) {
        return {
            COUNTY: key,
            AWARDED: sum(_.pluck(value, "AMT_AWARDED")).toFixed(2)
        }
    })
    .value();

  

json2csv({ data: result }, function(err, csv) {

  if (err) console.log(err);
  fs.writeFile('file.csv', csv, function(err) {
    if (err) throw err;
    
      res.set({
    "Content-Disposition": 'attachment; filename="file.csv"',
    "Content-Type": "text/csv"
});

  res.sendFile('file.csv', {"root": "/home/nitrous/code/public_html/CO_FS_Data_N/"});
    
  });
});
  
  
}


  
});


var server = app.listen(4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});