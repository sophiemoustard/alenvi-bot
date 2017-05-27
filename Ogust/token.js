"use strict";

const Ogust = require("../config").Ogust;
const rp = require('request-promise');
const crypto = require('crypto');
const moment = require('moment');

/********** AUTHENTIFICATION **********/

/*
** Login and get token
** Method: POST
*/
exports.getToken = function(next) {
  var dateTime = new moment();
  var payload = {
    'key': Ogust.PUBLIC_KEY,
    'request': 'GET_TOKEN',
    'time': moment().utc(dateTime).format("YYYYMMDDHHmmss") + '.' + (Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000)
  }
  var joinPayload = payload.key + '+' + payload.request + '+' + payload.time;
  var hash = crypto.createHmac('sha1', Ogust.PRIVATE_KEY).update(joinPayload).digest('hex');
  payload['api_signature'] = hash.toUpperCase();
  rp.post({
    uri: Ogust.API_LINK + "getToken",
    body: payload,
    json: true,
    resolveWithFullResponse: true,
    time: true
  }).then(function (parsedBody) {
    console.log("--------------");
    console.log("LOGIN AND GET TOKEN:");
    console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    // getEmployees(parsedBody.body.token, { "nbPerPage": 20, "pageNum": 1 });
    // getEmployeeByEmployeeId(parsedBody.body.token, 266254102, { "nbPerPage": 1, "pageNum": 1 });
    // getAllServices(parsedBody.body.token, { "slotToSub": 2, "slotToAdd": 2, "intervalType": "month" }, { "nbPerPage": 20, "pageNum": 1 });
    // getServicesByEmployeeId(parsedBody.body.token, 266254102, { "slotToSub": 2, "slotToAdd": 2, "intervalType": "month" }, { "nbPerPage": 20, "pageNum": 1 });
    // getServicesByCustomerId(parsedBody.body.token, 259863037, { "slotToSub": 2, "slotToAdd": 2, "intervalType": "month" }, { "nbPerPage": 20, "pageNum": 1 });
    // getSalariesByEmployeeId(parsedBody.body.token, 266254102, { "nbPerPage": 20, "pageNum": 1 });
    // getAllSalaries(parsedBody.body.token, { "nbPerPage": 20, "pageNum": 1});
    // getTeamByEmployeeSector(parsedBody.body.token, '1b*', { "nbPerPage": 20, "pageNum": 1 });
    next(null, parsedBody.body);
  }).catch(function (err) {
    console.error(err);
    next(err, null);
  })
  // return result;
}

// login();
