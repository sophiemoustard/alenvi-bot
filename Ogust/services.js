"use strict";

const Ogust = require("../config").Ogust;
const rp = require('request-promise');
const moment = require('moment');

/********** SERVICES **********/

/*
** Get all services
** PARAMS:
** - token: token after login
** - timeOption:
** --- slotToSub (time in number to subtract),
** --- slotToAdd (time in number to add)
** --- intervalType: "day", "week", "year", "hour"...
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)

** METHOD: POST
*/
exports.getAllServices = function(token, timeOption, pageOption, next) {
  var interval = getInterval(timeOption);
  var payload = {
    "token": token,
    "status": "@!=|" + 'N',
    "start_date": "@between" + '|' + interval.intervalBwd + '|' + interval.intervalFwd,
    "nbperpage": pageOption.nbPerPage,
    "pagenum": pageOption.pageNum
  }
  rp.post({
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET ALL SERVICES:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}

/*
** Get services by employee id
** PARAMS:
** - token: token after login
** - id: employee id
** - timeOption:
** --- slotToSub (time in number to subtract),
** --- slotToAdd (time in number to add)
** --- intervalType: "day", "week", "year", "hour"...
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getServicesByEmployeeId = function(token, id, timeOption, pageOption, next) {
  var interval = getInterval(timeOption);
  var payload = {
    "token": token,
    "id_employee": id,
    "status": "@!=|" + 'N',
    "start_date": "@between" + '|' + interval.intervalBwd + '|' + interval.intervalFwd,
    "nbperpage": pageOption.nbPerPage,
    "pagenum": pageOption.pageNum
  }
  rp.post({
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET SERVICES BY EMPLOYEE ID:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}

/*
** Get services by customer id
** PARAMS:
** - token: token after login
** - id: customer id
** - timeOption:
** --- slotToSub (time in number to subtract),
** --- slotToAdd (time in number to add)
** --- intervalType: "day", "week", "year", "hour"...
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getServicesByCustomerId = function(token, id, timeOption, pageOption, next) {
  var interval = getInterval(timeOption);
  var payload = {
    "token": token,
    "id_customer": id,
    "status": "@!=|" + 'N',
    "start_date": "@between" + '|' + interval.intervalBwd + '|' + interval.intervalFwd,
    "nbperpage": pageOption.nbPerPage,
    "pagenum": pageOption.pageNum
  }
  rp.post({
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    console.log("--------------");
    console.log("GET SERVICES BY CUSTOMER ID:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}

/*
** Get a date interval using range array and interval type
** PARAMS:
** - timeOption:
** --- slotToSub (time in number to subtract),
** --- slotToAdd (time in number to add)
** --- intervalType: "day", "week", "year", "hour"...
*/
var getInterval = function(timeOption) {
  timeOption.slotToSub = Math.abs(timeOption.slotToSub);
  timeOption.slotToAdd = Math.abs(timeOption.slotToAdd);
  var dateNow = moment();
  var finalInterval = {
      intervalBwd: dateNow.subtract(timeOption.slotToSub, timeOption.intervalType).format("YYYYMMDDHHmm"),
      intervalFwd: dateNow.add(timeOption.slotToAdd + timeOption.slotToSub, timeOption.intervalType).format("YYYYMMDDHHmm") // We have to (re)add slotToSub, because subtract() reallocates dateNow
  }
  return finalInterval;
}
