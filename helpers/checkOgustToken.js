"use strict";

const moment = require('moment');
const token = require('../Ogust/token');

exports.checkToken = async (session) => {
  if (!session.userData.ogust) {
    session.userData.ogust = {};
  }
  if (!session.userData.ogust.tokenConfig) {
    session.userData.ogust.tokenConfig = {};
    session.userData.ogust.tokenConfig.token = "";
    session.userData.ogust.tokenConfig.expireDate = "";
  }
  if (session.userData.ogust.tokenConfig.token == "") {
    await addTokenToSession(session);
  }
  if (session.userData.ogust.tokenConfig.expireDate != "") {
    var currentDate = moment();
    if (moment(currentDate).isAfter(session.userData.ogust.tokenConfig.expireDate)) {
      await addTokenToSession(session);
    }
    else {
      return true;
    }
  }
}

var addTokenToSession = async function(session) {
  const getToken = await token.getToken();
  if (getToken.body.status == "KO") {
    throw new Error("Error while getting token: " + getToken.body.message);
  }
  var currentDate = moment();
  console.log(getToken.statusCode);
  session.userData.ogust.tokenConfig.token = getToken.body.token;
  session.userData.ogust.tokenConfig.expireDate = currentDate.add(9, 'm');
}
