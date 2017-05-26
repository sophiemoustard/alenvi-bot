"use strict";

const Ogust = require("../config").Ogust;
const rp = require('request-promise');

/********** SALARIES **********/

/*
** Get salaries by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getSalariesByEmployeeId = function(token, id, pageOption) {
  var payload = {
    "token": token,
    "id_employee": id,
    "nbperpage": pageOption.nbPerPage,
    "pagenum": pageOption.pageNum
  }
  rp.post({
    url: Ogust.API_LINK + "searchSalary",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET SALARIES BY EMPLOYEE ID:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
  }).catch(function(err) {
    console.error(err);
  })
}

/*
** Get all salaries
** PARAMS:
** - token: token after login
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getAllSalaries = function(token, pageOption) {
  var payload = {
    "token": token,
    "nbperpage": pageOption.nbPerPage,
    "pagenum": pageOption.pageNum
  }
  rp.post({
    url: Ogust.API_LINK + "searchSalary",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET ALL SALARIES:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
  }).catch(function(err) {
    console.error(err);
  })
}
