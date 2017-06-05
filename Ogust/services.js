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
exports.getServicesInRange = function(token, timeOption, pageOption) {
  var interval = getIntervalInRange(timeOption);
  var options = {
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: {
      "token": token,
      "status": "@!=|" + 'N',
      "type": "I",
      "start_date": "@between" + '|' + interval.intervalBwd + '|' + interval.intervalFwd,
      "nbperpage": pageOption.nbPerPage,
      "pagenum": pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(options);
  // .then(function(parsedBody) {
  //   console.log("--------------");
  //   console.log("GET ALL SERVICES:");
  //   console.log(parsedBody.body);
  //   console.log("Duration: " + parsedBody.timings.end);
  //   next(null, parsedBody.body);
  // }).catch(function(err) {
  //   console.error(err);
  //   next(err, null);
  // })
}

exports.getServicesByDate = (token, date, pageOption) => {
  var option = {
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: {
      "token": token,
      "status": "@!=|" + 'N',
      "type": "I",
      "start_date": "@between" + '|' + date + "0000" + '|' + date + "2359",
      "nbperpage": pageOption.nbPerPage,
      "pagenum": pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(option);
}

/*
** Get services by employee id in range
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
exports.getServicesByEmployeeIdInRange = function(token, id, timeOption, pageOption) {
  var interval = getIntervalInRange(timeOption);
  var option = {
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: {
      "token": token,
      "id_employee": id,
      "status": "@!=|" + 'N',
      "type": "I",
      "start_date": "@between" + '|' + interval.intervalBwd + '|' + interval.intervalFwd,
      "nbperpage": pageOption.nbPerPage,
      "pagenum": pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(option);
}

/*
** Get services by employee id and date
** PARAMS:
** - token: token after login
** - id: employee id
** - date: start_date in "YYYYMMDD" format
** - pageOption:
** --- nbPerPage: X (number of results returned per pages)
** --- pageNum: Y (number of pages)
** METHOD: POST
*/
exports.getServicesByEmployeeIdAndDate = (token, id, date, pageOption) => {
  var option = {
    url: Ogust.API_LINK + "searchService",
    json: true,
    body: {
      "token": token,
      "id_employee": id,
      "status": "@!=|" + 'N',
      "type": "I", // Intervention
      "start_date": "@between" + '|' + date + "0000" + '|' + date + "2359",
      "nbperpage": pageOption.nbPerPage,
      "pagenum": pageOption.pageNum
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(option);
  //   .then(function(parsedBody) {
  //   console.log("--------------");
  //   console.log("GET SERVICES BY EMPLOYEE ID:");
  //   console.log(parsedBody.body);
  //   console.log("Duration: " + parsedBody.timings.end);
  //   // next(null, parsedBody.body);
  //   return parsedBody.body;
  // }).catch(function(err) {
  //   console.error(err);
  //   return err;
  // })
}

// .then(function(parsedBody) {
//   console.log("--------------");
//   console.log("GET SERVICES BY EMPLOYEE ID:");
//   console.log(parsedBody.body);
//   console.log("Duration: " + parsedBody.timings.end);
//   next(null, parsedBody.body);
// }).catch(function(err) {
//   console.error(err);
//   next(err, null);
// })

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
  var interval = getIntervalInRange(timeOption);
  var payload = {
    "token": token,
    "id_customer": id,
    "status": "@!=|" + 'N',
    "type": "I", // Intervention
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
var getIntervalInRange = function(timeOption) {
  timeOption.slotToSub = Math.abs(timeOption.slotToSub);
  timeOption.slotToAdd = Math.abs(timeOption.slotToAdd);
  var dateNow = moment();
  var finalInterval = {
      intervalBwd: dateNow.subtract(timeOption.slotToSub, timeOption.intervalType).format("YYYYMMDDHHmm"),
      intervalFwd: dateNow.add(timeOption.slotToAdd + timeOption.slotToSub, timeOption.intervalType).format("YYYYMMDDHHmm") // We have to (re)add slotToSub, because subtract() reallocates dateNow
  }
  return finalInterval;
}

// var getIntervalByDayOffset = function(offset) {
//
// }
