const builder = require('botbuilder');
const jwt = require('jsonwebtoken');
const { getAlenviUserById } = require('../models/Alenvi/users');

exports.autoLogin = async (session) => {
  let token = '';
  if (session.message.sourceEvent.postback && session.message.sourceEvent.postback.referral && session.message.sourceEvent.postback.referral.ref)  {
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
        console.log('DECODED !');
        console.log(decoded);
        const userId = decoded._id;
        const userDataAlenviRaw = await getAlenviUserById(userId);
        const userDataAlenvi = userDataAlenviRaw.body.data.user;
        session.userData.alenvi = userDataAlenvi;
        session.userData.alenvi.token = userDataAlenvi.alenviToken;
        session.send(`Bienvenue, ${session.userData.alenvi.firstname}! Merci de t'être connecté(e) ! :)`);
        session.replaceDialog('/hello');
      } catch (e) {
        console.error(e);
        return session.endDialog('Il y a eu un problème avec ta demande :/');
      }
    }
  });
};

exports.login = async (session) => {
  const uri = `${process.env.WEBSITE_HOSTNAME}/bot/authenticate`;

  const message = new builder.Message(session).sourceEvent({
    facebook: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          image_aspect_ratio: 'square',
          elements: [{
            title: 'Authentification avec identifiants Alenvi',
            image_url: 'https://res.cloudinary.com/alenvi/image/upload/v1499948101/images/bot/Pigi.png',
            buttons: [{
              type: 'web_url',
              url: uri,
              title: 'Se connecter'
            }],
          }]
        }
      }
    }
  });
  session.endDialog(message);
};
