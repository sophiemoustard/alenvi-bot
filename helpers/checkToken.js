const moment = require('moment');
const has = require('lodash/has');

const { refreshToken } = require('../api/users');

exports.checkToken = async (session) => {
  try {
    if (has(session.userData, 'auth') && has(session.userData, 'refreshToken')) {
      if (moment(session.userData.auth.exp).isAfter()) {
        const tokenRaw = await refreshToken({ refreshToken: session.userData.refreshToken });
        session.userData.auth.token = tokenRaw.data.data.token;
      }
    } else {
      session.replaceDialog('/logout_webapp');
    }
  } catch (err) {
    console.error(err.response.data);
    session.endDialog("Oups ! Il y a eu une erreur au moment de rafraichir tes informations personnelles :/ Si ce problème persiste, n'hésite pas à contacter l'équipe technique !");
  }
};
