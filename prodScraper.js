/*jshint esversion: 6*/

//problem:
//  1. Get information from each product page and determine whether they have the following: 'size guide', 'reserve in store', 'reviews'.
//  2. write this information into a database or a table? sheet?

//solution: Use Node.js to build a scraper and scrape the site(s)
//require http module
const wtfnode = require('wtfnode');
wtfnode.init();
wtfnode.dump();
const request = require('request');
const cheerio = require('cheerio');
const reqPro = require('request-promise');
let options = {
  method: 'GET'
};
const http = require('http');

// [A]  Connect to website URL (http://www.gap.com/)
let url = 'http://www.gap.com/';
let divURLArr = [];
let catUrlArr = [];
let catJson;
let subCatArr = [];
let prodJson;
let prodArr = [];

const productScraper = {
  init: () => {
    productScraper.reqHP();
  },
  checkArrayDupe : (theArray) => {
    if((new Set(theArray)).size !== theArray.length) {
      console.info('duplicates');
    } else {
      console.info('no duplicates');
    }
  },
  removeDupes : (theDupeArray) => {
    theDupeArray = theDupeArray.filter( function( item, index, inputArray ) {
           return inputArray.indexOf(item) == index;
    });
  },
  reqHP: () => {
    request(url, (error, response, html) => {
        // First we'll check to make sure no errors occurred when making the request
        if(!error){
            // Use Cheerio library to get jQuery functionality
            productScraper.populateDivArr(html);
        } else {
          console.error('something went wrong with getting the HP');
        }
    });
  },

  populateDivArr : (html) => {
    const $ = cheerio.load(html);

    //get division hrefs
    let divisionElem = $('.topNavItem a');
    //loop through catJson to get actual hrefs
    for(let i = 0; i < divisionElem.length; i++) {
      let divHrefStr = divisionElem[i].attribs.href.split('&mlink')[0];
      //weed out the hrefs with NO CIDs
      if(divHrefStr.indexOf('cid=') > -1) {
        let theDivURL = divHrefStr;
        divURLArr.push(theDivURL);
      }
    }
    console.info(divURLArr);
    productScraper.checkArrayDupe(divURLArr);
    productScraper.loopDivArr();
  },

  loopDivArr : () => {
    //loop through div urls to create paths for category scrape
    for(let j = 0; j < divURLArr.length; j++) {
      let theDivURL = `http://www.gap.com${divURLArr[j]}`;
      // console.info(divURLArr.length);
      if(divURLArr[j].indexOf('1086624') > -1 || divURLArr[j].indexOf('6413') > -1 || divURLArr[j].indexOf('6487') > -1) {
        console.log(`don't run reqDivPage, since there is no left nav`);
      } else {
        productScraper.reqDivPage(theDivURL);
      }
    }
  },

  //go to division page (http://www.gap.com/divURLArr)
  reqDivPage : (theDivURL) => { //version 1
    request(theDivURL, (error, response, html) => {
      console.info(theDivURL);
      if(!error) {
        // console.log(html);
        productScraper.populateCatArr(html);
      } else {
        console.error('something went wrong with getting division page request...');
      }
    });
  },

  populateCatArr : (html) => {
    const $ = cheerio.load(html);

    //go through left nav under categories only to get href
    let catText = $('h2.sidebar-navigation--header span:contains("categories")').parent('h2');
    let catElemLinks = catText.nextUntil('h2','div');
    // console.log(catElemLinks);
    let catATags = catElemLinks.find('a');
    // console.log(catATags);
    //loop through category a tags to get category urls and push to an array
    for(let k = 0; k < catATags.length; k++) {
      catUrlArr.push(catATags[k].attribs.href.split('cid=')[1]);
    }
    console.log(catUrlArr);
    productScraper.checkArrayDupe(catUrlArr);
    console.log(catUrlArr.length);
    // productScraper.loopCatArray();
    productScraper.buildSubCatArray(catUrlArr);
  },

  //get category array synchronously
  buildSubCatArray : (catUrlArr) => {
    let i = 0;
    const loopIt = (catUrlArr) => {
      if(i < catUrlArr.length) {
        let theCatApi = `http://www.gap.com/resources/productSearch/v1/search?cid=${catUrlArr[i]}`;
        options = {
          uri: theCatApi
        };
        reqPro(options)
          .then((response) => {
            // console.log(response);
            catJson = JSON.parse(response);
            let subCatId = catJson.productCategoryFacetedSearch.productCategory.childCategories;
            if(typeof subCatId != 'undefined' && subCatId.prop && subCatId.prop.constructor !== Array) {
              subCatArr.push(catJson.productCategoryFacetedSearch.productCategory.childCategories.businessCatalogItemId);
            } else if(typeof subCatId != 'undefined') {
              console.info(`this is an array with length: ${subCatId.length}`);
              for(let p = 0; p < subCatId.length; p++) {
                subCatArr.push(catJson.productCategoryFacetedSearch.productCategory.childCategories[p].businessCatalogItemId);
              }
            }

            productScraper.checkArrayDupe(subCatArr);
            subCatArr = subCatArr.filter( function( item, index, inputArray ) {
              return inputArray.indexOf(item) == index;
            });
            console.info(`subcat array: ${subCatArr}`);
            productScraper.checkArrayDupe(subCatArr);
            console.info(subCatArr.length);
            console.info('loop it done');
            productScraper.buildPidArray(subCatArr);
          })
          .catch((err) => {
            console.log('something went wrong with category api request-promise');
          });
        ++i;
        loopIt(catUrlArr);
      }
    };
    loopIt(catUrlArr);
  },

  buildPidArray : (subCatArr) => {
    let i = 0;
    const loopIt = (subCatArr) => {
      if(i < subCatArr.length) {
        let theCatApi = `http://www.gap.com/resources/productSearch/v1/search?cid=${subCatArr[i]}`;
        options = {
          uri: theCatApi
        };
        reqPro(options)
          .then((response) => {
            // console.log(response);
            prodJson = JSON.parse(response);
            // console.log(prodJson);
            // productScraper.getPid(prodJson);
            let subCatId = prodJson.productCategoryFacetedSearch.productCategory.childProducts;
            if(typeof subCatId != 'undefined' && subCatId.prop && subCatId.prop.constructor !== Array) {
              prodArr.push(prodJson.productCategoryFacetedSearch.productCategory.childProducts.businessCatalogItemId);
            } else if(typeof subCatId != 'undefined') {
              console.info(`this is an array with length: ${subCatId.length}`);
              for(let p = 0; p < subCatId.length; p++) {
                prodArr.push(prodJson.productCategoryFacetedSearch.productCategory.childProducts[p].businessCatalogItemId);
              }
            }
            productScraper.checkArrayDupe(prodArr);
            prodArr = prodArr.filter( function( item, index, inputArray ) {
                   return inputArray.indexOf(item) == index;
            });
            console.info(`PID array: ${prodArr}`);
            productScraper.checkArrayDupe(prodArr);
            console.info(`PID length = ${prodArr.length}`);
          })
          .catch((err) => {
            console.log('something went wrong with subcat request-promise');
          });
        ++i;
        loopIt(subCatArr);
      } else {
        // process.exit();
      }
    };
    loopIt(subCatArr);
  },

};

productScraper.init();

//  [B] Scrape page to see if it has the following information:
        // 1. 'size guide'  jQuery('.size-guide’).length == 0;
        // 2. 'reserve in store'  jQuery('.reserve-in-store_a').length == 0;
        // 3. 'product reviews'  jQuery('.bv-content-title').length == 0;

//  [C] Save this information to a database or a readable/printable sheet, showing PID and boolean of content
