const moment = require('moment');
const token = require('../Ogust/token');

const addTokenToSession = async (session) => {
  console.log('Get a new token...');
  const getToken = await token.getToken();
  if (getToken.body.status === 'KO') {
    throw new Error(`Error while getting token: ${getToken.body.message}`);
  }
  const currentDate = moment();
  session.userData.ogust.tokenConfig.token = getToken.body.token;
  // Add an expiration time of 9 minuts (Ogust token validity = 10 min)
  session.userData.ogust.tokenConfig.expireDate = currentDate.add(9, 'm');
};

exports.checkToken = async (session) => {
  session.userData.ogust = session.userData.ogust || {};
  session.userData.ogust.tokenConfig = session.userData.ogust.tokenConfig || {};
  session.userData.ogust.tokenConfig.token = session.userData.ogust.tokenConfig.token || '';
  session.userData.ogust.tokenConfig.expireDate = session.userData.ogust.tokenConfig.expireDate || '';
  if (session.userData.ogust.tokenConfig.token === '') {
    await addTokenToSession(session);
  }
  if (session.userData.ogust.tokenConfig.expireDate !== '') {
    const currentDate = moment();
    if (moment(currentDate).isAfter(session.userData.ogust.tokenConfig.expireDate)) {
      await addTokenToSession(session);
    } else {
      return true;
    }
  }
};
