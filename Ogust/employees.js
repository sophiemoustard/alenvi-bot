"use strict";

const Ogust = require("../config").Ogust;
const rp = require('request-promise');

/********** EMPLOYEES **********/

/*
** Get all employees
** PARAMS:
** - token: token after login
** Method: POST
*/
exports.getEmployees = function(token, pageOption, next) {
  var payload = {
    'token': token,
    'nbperpage': pageOption.nbPerPage,
    "pagenum": pageOption.pageNum,
    'status': 'A'
  }
  rp.post({
    url: Ogust.API_LINK + "searchEmployee",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET EMPLOYEES:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}

/*
** Get an employee by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** Method: POST
*/
exports.getEmployeeByEmployeeId = (token, id, pageOption) => {
  var options = {
    url: Ogust.API_LINK + "getEmployee",
    json: true,
    body: {
      'token': token,
      'nbperpage': pageOption.nbPerPage,
      "pagenum": pageOption.pageNum,
      'id_employee': id,
      'status': 'A'
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(options);
  // .then(function(parsedBody) {
  //   console.log("--------------");
  //   console.log("GET EMPLOYEE BY EMPLOYEE ID:");
  //   console.log(parsedBody.body);
  //   console.log("Duration: " + parsedBody.timings.end);
  //   next(null, parsedBody.body);
  // }).catch(function(err) {
  //   console.error(err);
  //   next(err, null);
  // })
}

/*
** Get employees by sector
** PARAMS:
** - token: token after login
** - sector: employee sector
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getEmployeesBySector = (token, sector, pageOption) => {
  var options = {
    url: Ogust.API_LINK + "searchEmployee",
    json: true,
    body: {
      "token": token,
      "nbperpage": pageOption.nbPerPage,
      "pagenum": pageOption.pageNum,
      "sector": sector, // "1b*" for testing purpose, sector in prod
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
