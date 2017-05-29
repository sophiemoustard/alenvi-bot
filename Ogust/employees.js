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
exports.getEmployeeByEmployeeId = function(token, id, pageOption, next) {
  var payload = {
    'token': token,
    'nbperpage': pageOption.nbPerPage,
    "pagenum": pageOption.pageNum,
    'id_employee': id,
    'status': 'A'
  }
  rp.post({
    url: Ogust.API_LINK + "getEmployee",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET EMPLOYEE BY EMPLOYEE ID:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}
