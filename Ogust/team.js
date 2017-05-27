"use strict";

const Ogust = require("../config").Ogust;
const rp = require('request-promise');

/********** TEAM **********/

/*
** Get team by employee sector
** PARAMS:
** - token: token after login
** - sector: employee sector
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getTeamByEmployeeSector = function(token, sector, pageOption, next) {
  var payload = {
    "token": token,
    "nbperpage": pageOption.nbPerPage,
    "pagenum": pageOption.pageNum,
    "sector": sector
  }
  rp.post({
    url: Ogust.API_LINK + "searchEmployee",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET TEAM BY EMPLOYEE SECTOR:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}
