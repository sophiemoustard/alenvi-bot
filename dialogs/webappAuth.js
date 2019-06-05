// const builder = require('botbuilder');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const pick = require('lodash/pick');

const { getUserById } = require('../api/users');

exports.autoLogin = async (session) => {
  let token = '';
  if (session.message.sourceEvent.postback && session.message.sourceEvent.postback.referral && session.message.sourceEvent.postback.referral.ref) {
    token = session.message.sourceEvent.postback.referral.ref;
  } else if (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref) {
    token = session.message.sourceEvent.referral.ref;
  }
  jwt.verify(token, process.env.TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      console.error('ERROR VERIFY TOKEN');
      console.error(err);
      if (err.name === 'JsonWebTokenError') {
        session.endDialog('Il y a eu un problème avec ta demande :/');
      }
      if (err.name === 'TokenExpiredError') {
        session.endDialog('Ta demande a expiré !');
      }
    } else {
      try {
        const userId = decoded._id;
        const expDate = moment.unix(decoded.exp).toDate();
        const userDataRaw = await getUserById(userId, token);
        session.userData = pick(userDataRaw.data.data.user, ['_id', 'identity']);
        session.userData.auth = {
          token,
          exp: expDate,
        };
        session.send(`Bienvenue, ${session.userData.identity.firstname}! Merci de t'être connecté(e) ! :)`);
        session.replaceDialog('/hello');
      } catch (e) {
        console.error(e.response.data);
        return session.endDialog('Il y a eu un problème avec ta demande :/');
      }
    }
  });
};

exports.logout = (session) => {
  delete session.userData;
  return session.endDialog('Compte bien déconnecté ! Reviens-vite :)');
};
