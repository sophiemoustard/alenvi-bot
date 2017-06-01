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
exports.getTeamByEmployeeBySector = (token, sector, pageOption) => {
  var options = {
    url: Ogust.API_LINK + "searchEmployee",
    json: true,
    body: {
      "token": token,
      "nbperpage": pageOption.nbPerPage,
      "pagenum": pageOption.pageNum,
      "sector": sector, // "1b*" for testing purpose
      "status": 'A', // = "Actif"
      "nature": 'S' // = "Salarié"
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(options);
  // .then(function(parsedBody) {
  //   console.log("--------------");
  //   console.log("GET TEAM BY EMPLOYEE SECTOR:");
  //   console.log(parsedBody.body);
  //   console.log("Duration: " + parsedBody.timings.end);
  //   next(null, parsedBody.body);
  // }).catch(function(err) {
  //   console.error(err);
  //   next(err, null);
  // })
}
