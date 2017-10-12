/*jshint esversion: 6*/


const request = require('request');
const cheerio = require('cheerio');
const reqPro = require('request-promise');

let options = {
  method: 'GET',
};
//the function
let divURLArr = [];
const productScraper = {

  scrapeGap : () => {
    options = {
      uri: 'http://www.gap.com',
    };
    reqPro(options)
      .then((response) => {
        // console.log(response);
        productScraper.populateDivArr(response);
      })
      .catch((err) => {
        console.error('we have a problem');
      });

  },

  populateDivArr : (html) => {
    const $ = cheerio.load(html);
    //get division hrefs
    let divisionElem = $('.topNavItem a');
    for(let i = 0; i < divisionElem.length; i++) {
      let divHrefStr = divisionElem[i].attribs.href.split('&mlink')[0];
      //weed out the hrefs with NO CIDs
      if(divHrefStr.indexOf('cid=') > -1) {
        let theDivURL = divHrefStr;
        divURLArr.push(theDivURL);
      }
    }
    console.info(divURLArr);
  },

}; //end productScraper

productScraper.scrapeGap();
