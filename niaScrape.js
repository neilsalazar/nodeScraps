/*jshint esversion: 6*/
// 'use strict'
var express = require('express');
var app = express(),
    http = require('http').createServer(app),
    hostname = '127.0.0.1';

app.set('trust proxy', 1);
app.set('port', (process.env.PORT || 5000));

var request = require('request');
const reqPro = require('request-promise');
let options = {
  method: 'GET'
};

var url = require('url'),
    events = require('events'),
    eventEmitter = new events.EventEmitter(),
    cheerio = require('cheerio'),
    fs = require('fs');

var requestNew = require('sync-request');
var json2csv = require('json2csv');

/* working variables */
var domain = 'http://www.gap.com';
var HPNavNameLinks = [];
var MasterBreadCrumbList = [];

var wrkRawJSONArr = {
  pid     : "",
  dpName  : "",
  dpCid   : "",
  catName : "",
  catCid  : "",
};
var newFileWrkObj = {
  pid     : "",
  breadCrumb  : ""
};

let pidArray = [];

//Writing in the file
var createCSVNew = function(newFileWrkObj){
  pidArray.push(wrkRawJSONArr.pid);
  console.info(`this is the PID array: ${pidArray}`);
  var newLine= "\r\n";
  /*var fields = ["pid", "dpName", "dpCid", "catName", "catCid"];
  var appendThis = [
    {
        'pid': wrkRawJSONArr.pid,
        'dpName': wrkRawJSONArr.dpName,
        'dpCid': wrkRawJSONArr.dpCid,
        'catName': wrkRawJSONArr.catName,
        'catCid': wrkRawJSONArr.catCid,
    }
  ];*/

  var fields = ["pid", "breadCrumb"];
  var appendThis = [
    {
        'pid': newFileWrkObj.pid,
        'breadCrumb': newFileWrkObj.breadCrumb
    }
  ];
  var toCsv = {
      data: appendThis,
      fields: fields,
      hasCSVColumnTitle: false
  };

  fs.stat('file1.csv', function (err, stat) {
    if (err === null) {
      var csv = json2csv(toCsv) + newLine;
      fs.appendFileSync('file1.csv', csv);
      console.log('record is appended! ');
    }
    else {
      fields= (fields + newLine);
      fs.writeFile('file1.csv', fields, function (err, stat) {
          if (err) throw err;
      });
    }
  });
};

//Function to check if element is json array
function isJsonArray(element) {
  return Object.prototype.toString.call(element).trim() == '[object Array]';
}

//Function to convert json object to json array if it's otherwise it will just return it.
function jsonObjectToArray(element){
  var jsonArray = [];
  if(!isJsonArray(element)){
    jsonArray.push(element);
  }else {
    jsonArray = element;
  }
  return jsonArray;
}

//go through Prod page and get info
var prodPageValues = function(pdPid) {
  console.info(`http://www.gap.com/browse/product.do?pid=${pdPid}`);
  let prodPageReq = request('http://www.gap.com/browse/product.do?pid=${pdPid}');
  const $ = cheerio.load(prodPageReq);
  console.info($('.size-guide').length);
  // => {
  //     // First we'll check to make sure no errors occurred when making the request
  //     if(!error){
  //         // Use Cheerio library to get jQuery functionality
  //         const $ = che;erio.load(html);
  //         console.info($('.size-guide').length);
  //     } else {
  //       console.error('something went wrong with getting the HP');
  //     }
  // });
  // let prodPage = requestNew('GET',`http://www.gap.com/browse/product.do?pid=${pdPid}`);
  // let $ = cheerio.load(prodPage);
};

//parsing child product of sub categories
var catChildCategoriesParse = function(jsonObj,wrkMast){
  var catChildGrid = [],childInnerGrid = [], wrk15 = [];
  var MasterBreadCrumbList2 = [];
  var mySet = new Set();
  catChildGrid = jsonObjectToArray(jsonObj);
  for(var z=0; z<catChildGrid.length; z ++){

    if(catChildGrid[z].childProducts != null && catChildGrid[z].childProducts != 'undefined'){
      childInnerGrid = jsonObjectToArray(catChildGrid[z].childProducts);
      for(var y=0; y<childInnerGrid.length; y++){
        var pdName = childInnerGrid[y].name;
        var pdPid = childInnerGrid[y].businessCatalogItemId;

        wrkRawJSONArr.pid = pdPid;

        //wrkRawJSONArr.pdName = pdName;
        if(mySet.has(pdPid)){
          console.log('duplicate');
        }else{
          mySet.add(pdPid);
          newFileWrkObj.pid = pdPid;
          newFileWrkObj.breadCrumb = wrkRawJSONArr.dpName +':'+ wrkRawJSONArr.dpCid +':'+ wrkRawJSONArr.catName +':'+ wrkRawJSONArr.catCid;
         // createCSVNew(wrkRawJSONArr);
          // createCSVNew(newFileWrkObj);
          prodPageValues(pdPid);
        }
      }
    }
  }
};

// parsing categories
var catepgProductLinks = function(arrList,dpName,dpCid){
  var urls = [], catResultArr = [], catName = '', catCid = '', wrk1 = '',wrk2 = '',wrklk ='';
  for(var x=0; x<arrList.length; x++){
      wrklk = arrList[x].split(':')[1];
      wrk1 = url.parse(wrklk, true);
      wrk2 = domain + '/resources/webHierarchy/v1/' + wrk1.query.cid + '?isProductRequest=true';
      urls.push(wrk2);
  }
  console.log(`div name: ${dpName}, div Cid: ${dpCid}`);
  console.log('urls:'+urls.length);
  for(var i in urls){
    //pulling for jeans
    //var catresp =  requestNew('GET', 'http://www.gap.com/resources/webHierarchy/v1/5664?isProductRequest=true');
    var catresp =  requestNew('GET',urls[i]);
    var wrkMast = [];
    let jsonObj = JSON.parse(catresp.getBody());
    if(jsonObj.webHierarchyResultV1 != null){
      catName = jsonObj.webHierarchyResultV1.requestedProductCategory.name;
      catCid = jsonObj.webHierarchyResultV1.requestedProductCategory.businessCatalogItemId;
      if(jsonObj.webHierarchyResultV1.requestedProductCategory.childCategories != null && jsonObj.webHierarchyResultV1.requestedProductCategory.childCategories != 'undefined'){
        var childCategoriesjsonObj = [];
        childCategoriesjsonObj = jsonObj.webHierarchyResultV1.requestedProductCategory.childCategories;

        wrkRawJSONArr.dpName = dpName;
        wrkRawJSONArr.dpCid = dpCid;
        wrkRawJSONArr.catName = catName;
        wrkRawJSONArr.catCid = catCid;

        catChildCategoriesParse(childCategoriesjsonObj,wrkMast);
      }
    }
  }
};

//Crawling each category page
var dpwomenLinks = function(resp,dpName,dpCid){
  var $ = resp;
  let mastWomNameLks = [];
  $('.sidebar-navigation').find('h2').each(function(ind){
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('categories') > -1 ){
      $(this).addClass('tempC');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('accessories') > -1 ){
      $(this).addClass('tempA');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('gapsale') > -1 ){
      $(this).addClass('tempS');
    }
  });

  $('.sidebar-navigation .tempC').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() +':'+ $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });
  $('.sidebar-navigation .tempA').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });
  if($('.sidebar-navigation .tempS').length > 0){
    var x = $('.sidebar-navigation .tempS').next().find('span').html() + ':' + $('.sidebar-navigation .tempS').next().find('a').attr('href');
    mastWomNameLks.push(x);
  }

  catepgProductLinks(mastWomNameLks,dpName,dpCid);
};
var dpgapBodyLinks = function(resp,dpName,dpCid){
  var $ = resp;
  let mastWomNameLks = [];
  $('.sidebar-navigation').find('h2').each(function(ind){
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('categories') > -1 ){
      $(this).addClass('tempC');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('intimate collections') > -1 ){
      $(this).addClass('tempA');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('sleep & lounge collections') > -1 ){
      $(this).addClass('tempB');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('gapsale') > -1 ){
      $(this).addClass('tempS');
    }
  });

  $('.sidebar-navigation .tempC').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() +':'+ $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });
  $('.sidebar-navigation .tempA').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });
  $('.sidebar-navigation .tempB').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });

  if($('.sidebar-navigation .tempS').length > 0){
    var x = $('.sidebar-navigation .tempS').next().find('span').html() + ':' + $('.sidebar-navigation .tempS').next().find('a').attr('href');
    mastWomNameLks.push(x);
  }

  catepgProductLinks(mastWomNameLks,dpName,dpCid);
};
var dpMatLinks = function(resp,dpName,dpCid){
  var $ = resp;
  let mastWomNameLks = [];
  $('.sidebar-navigation').find('h2').each(function(ind){
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('categories') > -1 ){
      $(this).addClass('tempC');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('gapbody') > -1 ){
      $(this).addClass('tempA');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('accessories') > -1 ){
      $(this).addClass('tempB');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('gapsale') > -1 ){
      $(this).addClass('tempS');
    }
  });

  $('.sidebar-navigation .tempC').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() +':'+ $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });
  $('.sidebar-navigation .tempA').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });
  $('.sidebar-navigation .tempB').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    mastWomNameLks.push(x);
  });

  if($('.sidebar-navigation .tempS').length > 0){
    var x = $('.sidebar-navigation .tempS').next().find('span').html() + ':' + $('.sidebar-navigation .tempS').next().find('a').attr('href');
    mastWomNameLks.push(x);
  }

  catepgProductLinks(mastWomNameLks,dpName,dpCid);
};
var dpgirlsLinks = function(resp,dpName,dpCid){
  var $ = resp;
  let mastGrlNameLks = [];
  $('.sidebar-navigation').find('h2').each(function(ind){
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('categories') > -1 ){
      $(this).addClass('tempC');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('gapsale') > -1 ){
      $(this).addClass('tempS');
    }
  });

  $('.sidebar-navigation .tempC').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() +':'+ $(this).find('a').attr('href');
    mastGrlNameLks.push(x);
  });

  if($('.sidebar-navigation .tempS').length > 0){
    var x = $('.sidebar-navigation .tempS').next().find('span').html() + ':' + $('.sidebar-navigation .tempS').next().find('a').attr('href');
    mastGrlNameLks.push(x);
  }
  catepgProductLinks(mastGrlNameLks,dpName,dpCid);
};

var dptoddlerLinks = function(resp,dpName,dpCid){
  var $ = resp;
  let masttodNameLks = [];
  $('.sidebar-navigation').find('h2').each(function(ind){
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('toddler girl') > -1 ){
      $(this).addClass('tempC');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('toddler boy') > -1 ){
      $(this).addClass('tempA');
    }
  });

  $('.sidebar-navigation .tempC').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() +':'+ $(this).find('a').attr('href');
    masttodNameLks.push(x);
  });
  $('.sidebar-navigation .tempA').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    masttodNameLks.push(x);
  });
  catepgProductLinks(masttodNameLks,dpName,dpCid);
};

var dpbabyLinks = function(resp,dpName,dpCid){
  var $ = resp;
  let mastbabyNameLks = [];
  $('.sidebar-navigation').find('h2').each(function(ind){
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('baby girl') > -1 ){
      $(this).addClass('tempC');
    }
    if(($(this).find('.sidebar-navigation--header--text').html()).indexOf('baby boy') > -1 ){
      $(this).addClass('tempA');
    }
  });

  $('.sidebar-navigation .tempC').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() +':'+ $(this).find('a').attr('href');
    mastbabyNameLks.push(x);
  });
  $('.sidebar-navigation .tempA').nextUntil('h2').each(function(){
    var x ='',y='';
    x = $(this).find('.sidebar-navigation--category--text').html() + ':' + $(this).find('a').attr('href');
    mastbabyNameLks.push(x);
  });
  catepgProductLinks(mastbabyNameLks,dpName,dpCid);
};

// crawling division pages
var fetchDPLinks = function(){
  let urls = [];
  for(var x=0; x<HPNavNameLinks.length; x++){
      urls.push(domain + HPNavNameLinks[x].split(':')[1]);
  }
  console.log('fetch links');
  console.log(urls.length);
  for(var i in urls){
    var dpresp =  requestNew('GET', urls[i]);
    let $ = cheerio.load(dpresp.getBody());
    let wrk1 = url.parse(urls[0],true);
    let divCid = wrk1.query.cid;
    console.log('HHHHHHH  ' + $('head').find('title').text());
    var divName = $('head').find('title').text();
    divName = divName.split(' ')[0];
    divName = divName.split("'")[0];
    switch (divName){
      case 'Women':
        var divNameN = divName + "'s";
        console.log('inside women->calling for category cid');
        dpwomenLinks($,divNameN,divCid);
        break;
      case 'GapBody':
        dpgapBodyLinks($,divName,divCid);
        break;
      case 'GapFit':
        dpgirlsLinks($,divName,divCid);
        break;
      case 'Maternity':
        dpMatLinks($,divName,divCid);
        break;
      case 'Men':
        var divNameN = divName + "'s";
        dpwomenLinks($,divNameN,divCid);
        break;
      case 'Girls':
        dpgirlsLinks($,divName,divCid);
        break;
      case 'Boys':
        dpgirlsLinks($,divName,divCid);
        break;
      case 'Toddler':
        dptoddlerLinks($,divName,divCid);
        break;
      case 'Baby':
        dpbabyLinks($,divName,divCid);
        break;
      default:
        break;
    } // end of switch
  }//for end
};

// starting point request gap hp
var response = requestNew('GET', 'http://www.gap.com');
var $ = cheerio.load(response.getBody());

$('#mainNavGOL .topNavItem').each(function(){
  if($(this).find('a').length > 0 && $(this).find('a').html() != 'gap factory' && $(this).find('span').html() != '#gaplove'){
    var hpNavTemp1 = $(this).find('a').html();
    var hpNavTemp2 = $(this).find('a').attr('href');
    var urlLink = url.parse(hpNavTemp2, true);
    var temp = hpNavTemp1 +':'+ urlLink.pathname + '?cid='+ urlLink.query.cid;
    HPNavNameLinks.push(temp);
  }
});

if(HPNavNameLinks.length > 0){
  fetchDPLinks();
}
