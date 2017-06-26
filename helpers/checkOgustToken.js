const moment = require('moment-timezone');
const token = require('../Ogust/token');
const {checkUserData} = require('./checkUserData');

const addTokenToSession = async (session) => {
  console.log('Get a new token...');
  const getToken = await token.getToken();
  if (getToken.body.status === 'KO') {
    throw new Error(`Error while getting token: ${getToken.body.message}`);
  }
  const currentDate = moment().tz('Europe/Paris');
  session.userData.ogust.tokenConfig.token = getToken.body.token;
  // Add an expiration time of 9 minuts (Ogust token validity = 10 min)
  session.userData.ogust.tokenConfig.expireDate = currentDate.add(9, 'm');
};

exports.checkToken = async (session) => {
  try {
    session.userData.ogust = session.userData.ogust || {};
    session.userData.ogust.tokenConfig = session.userData.ogust.tokenConfig || {};
    session.userData.ogust.tokenConfig.token = session.userData.ogust.tokenConfig.token || '';
    session.userData.ogust.tokenConfig.expireDate = session.userData.ogust.tokenConfig.expireDate || '';
    if (session.userData.ogust.tokenConfig.token === '') {
      await addTokenToSession(session);
      await checkUserData(session);
    }
    if (session.userData.ogust.tokenConfig.expireDate !== '') {
      const currentDate = moment().tz('Europe/Paris');
      if (moment(currentDate).isAfter(session.userData.ogust.tokenConfig.expireDate)) {
        await addTokenToSession(session);
        await checkUserData(session);
      } else {
        return true;
      }
    }
  } catch (err) {
    console.error(err);
    return session.endDialogs(`Oups ! Il y a eu une erreur au moment de rafraichir tes informations personnelles :/ Si ce problème persiste, n'hésite pas à contacter l'équipe technique !`);
  }
};
