// =========================================================
// Login / Logout
// ========================================================

const builder = require('botbuilder');
const request = require('request');
const config = require('../config');

exports.login = (session) => {
  console.log('WENT IN LOGIN');
  const uri = `${process.env.WEBSITE_HOSTNAME}/api/bot/facebook/account_linking`;
  const message = new builder.Message(session).sourceEvent({
    facebook: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          image_aspect_ratio: 'square',
          elements: [{
            title: 'Authentification avec identifiants Alenvi',
            image_url: 'http://www.welcometothejungle.co/uploads/company/logo/alenvi.png',
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

exports.logout = (session) => {
  console.log('WENT IN LOGOUT');
  request({
    url: 'https://graph.facebook.com/v2.6/me/unlink_accounts',
    method: 'POST',
    qs: {
      access_token: process.env.FACEBOOK_PAGE_TOKEN || config.FACEBOOK_PAGE_TOKEN,
    },
    body: {
      psid: session.message.address.user.id,
    },
    json: true
  }, (error, response) => {
    if (!error && response.statusCode === 200) {
      return session.endDialog();
    }
    return session.endDialog('Il y a eu un problème au moment de te déconnecter :(');
  });
};
