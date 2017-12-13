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
        session.send(`Avant ton arrivée chez Alenvi, j’aimerais partager avec toi :
        -  Notre charte d’envie
        -  Et une vidéo qui résume notre vision du métier de l’auxiliaire d’envie
        C’est super si tu peux prendre le temps de lire ce texte et visionner cette vidéo avant ton arrivée :)`);
        setTimeout(() => {
          session.send('La vidéo: https://www.facebook.com/alenviservices/videos/2117859944894421');
          session.endDialog('La charte d’envie: http://blog.alenvi.io/charte-envie');
        }, 15000);
        // session.replaceDialog('/hello');
      } catch (e) {
        console.error(e);
        return session.endDialog('Il y a eu un problème avec ta demande :/');
      }
    }
  });
};

const getCardAttachment = (session) => {
  const uri = `${process.env.WEBSITE_HOSTNAME}/bot/authenticate`;
  return new builder.HeroCard(session)
    .title('Connexion Alenvi')
    .images([
      builder.CardImage.create(session, 'https://res.cloudinary.com/alenvi/image/upload/v1499948101/images/bot/Pigi.png')
    ])
    .buttons([
      builder.CardAction.openUrl(session, uri, 'Se connecter')
    ]);
};

const showConnectionCard = (session) => {
  session.sendTyping();
  const card = getCardAttachment(session);
  const message = new builder.Message(session).addAttachment(card);
  session.endDialog(message);
};

exports.login = async (session) => {
  const uri = `${process.env.WEBSITE_HOSTNAME}/bot/authenticate`;
  if (session.message.address.channelId == 'facebook') {
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
  } else {
    showConnectionCard(session);
  }
};
