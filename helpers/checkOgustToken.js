"use strict";

const moment = require('moment');
const token = require('../Ogust/token');

exports.checkToken = function(session, next) {
  if (!session.userData.ogust) {
    session.userData.ogust = {};
  }
  if (!session.userData.ogust.tokenConfig) {
    session.userData.ogust.tokenConfig = {};
    session.userData.ogust.tokenConfig.token = "";
    session.userData.ogust.tokenConfig.expireDate = "";
  }
  if (session.userData.ogust.tokenConfig.token == "") {
    addTokenToSession(session, next);
  }
  if (session.userData.ogust.tokenConfig.expireDate != "") {
    var currentDate = moment();
    if (moment(currentDate).isAfter(session.userData.ogust.tokenConfig.expireDate)) {
      addTokenToSession(session, next);
    }
    else {
      next(null, true);
    }
  }
}

var addTokenToSession = function(session, next) {
  token.getToken(function(err, getToken) {
    if (err) {
      next(err, null)
    }
    else {
      var currentDate = moment();
      session.userData.ogust.tokenConfig.token = getToken.token;
      session.userData.ogust.tokenConfig.expireDate = currentDate.add(9, 'm');
      next(null, true)
    }
  })
}
