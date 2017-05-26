//=========================================================
// Login / Logout
//=========================================================

const builder = require('botbuilder');
const request = require('request');
const config = require('../config');

exports.login = (session) => {
  var message = new builder.Message(session).sourceEvent({
    facebook: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'Bienvenue sur la liaison de compte',
            // image_url: "http://localhost:3000/images/Pigi.png",
            buttons: [{
              type: 'account_link',
              url: "http://localhost:3000/api/users/bot/facebook/account_linking"
            }]
          }]
        }
      }
    }
  });
  session.endDialog(message);
};

exports.logout = (session) => {
  request({
    url: 'https://graph.facebook.com/v2.6/me/unlink_accounts',
    method: 'POST',
    qs: {
      access_token: process.env.FACEBOOK_PAGE_TOKEN || config.FACEBOOK_PAGE_TOKEN
    },
    body: {
      psid: session.message.address.user.id
    },
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      session.endDialog();
    } else {
      session.endDialog('Il y a eu un problème au moment de te déconnecter :(');
    }
  });
};
