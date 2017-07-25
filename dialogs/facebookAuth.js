// =========================================================
// Login / Logout
// ========================================================

const builder = require('botbuilder');
const rp = require('request-promise');
const config = require('../config');

exports.login = (session) => {
  console.log('WENT IN LOGIN');
  const uri = `${process.env.WEBSITE_HOSTNAME}/api/bot/facebook/account_linking`;// 'https://f388f055.ngrok.io/api/bot/facebook/account_linking';
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
              type: 'account_link',
              url: uri
            }],
          }]
        }
      }
    }
  });
  session.endDialog(message);
};

exports.logout = async (session) => {
  console.log('WENT IN LOGOUT');
  try {
    const options = {
      url: 'https://graph.facebook.com/v2.6/me/unlink_accounts',
      method: 'POST',
      qs: {
        access_token: process.env.FACEBOOK_PAGE_TOKEN || config.FACEBOOK_PAGE_TOKEN,
      },
      body: {
        psid: session.message.address.user.id,
      },
      json: true
    };
    const res = await rp(options);
    if (res.result === 'unlink account success') {
      return session.endDialog();
    }
  } catch (err) {
    console.log(err);
    return session.endDialog('Il y a eu un problème au moment de te déconnecter');
  }
};
