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
exports.getCustomerByCustomerId = (token, id, pageOption) => {
  var options = {
    url: Ogust.API_LINK + "getCustomer",
    json: true,
    body: {
      'token': token,
      'nbperpage': pageOption.nbPerPage,
      "pagenum": pageOption.pageNum,
      'id_customer': id
    },
    resolveWithFullResponse: true,
    time: true
  }
  return rp.post(options);

  // .then(function(parsedBody) {
  //   // console.log("--------------");
  //   // console.log("GET CUSTOMER BY CUSTOMER ID:");
  //   // console.log(parsedBody.body);
  //   console.log("Duration: " + parsedBody.timings.end);
  //   next(null, parsedBody.body);
  // }).catch(function(err) {
  //   console.error(err);
  //   next(err, null);
  // })
}
