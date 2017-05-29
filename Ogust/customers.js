"use strict";

const Ogust = require("../config").Ogust;
const rp = require('request-promise');

/*
** Get a customer by customer id
** PARAMS:
** - token: token after login
** - id: customer id
** Method: POST
*/
exports.getCustomerByCustomerId = function(token, id, pageOption, next) {
  var payload = {
    'token': token,
    'nbperpage': pageOption.nbPerPage,
    "pagenum": pageOption.pageNum,
    'id_customer': id
  }
  rp.post({
    url: Ogust.API_LINK + "getCustomer",
    json: true,
    body: payload,
    resolveWithFullResponse: true,
    time: true
  }).then(function(parsedBody) {
    // console.log("--------------");
    // console.log("GET CUSTOMER BY CUSTOMER ID:");
    // console.log(parsedBody.body);
    console.log("Duration: " + parsedBody.timings.end);
    next(null, parsedBody.body);
  }).catch(function(err) {
    console.error(err);
    next(err, null);
  })
}
