"use strict";

const path = require('path');
const rp = require('request-promise');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const builder = require('botbuilder');
const botauth = require("botauth");

const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;

const config = require('./config');
// const ogust = require('./ogust.js');

const PORT = process.env.PORT || '3978';

const restify = require('restify');
const app = restify.createServer();
app.use(restify.bodyParser());
app.use(restify.queryParser());

//=========================================================
// Bot Setup
//=========================================================

// Create chat bot
var connector = new builder.ChatConnector({
    appId: config.MICROSOFT_APP_ID,
    appPassword: config.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);

bot.set('persistConversationData', true);

bot.set('localizerSettings', {
  botLocalePath : path.join(__dirname, "./helpers/locale"),
  defaultLocale: "fr_FR"
})

const logUserConversation = (event) => {
    console.log('message: ' + event.text + ', user: ' + event.address.user.name);
};

// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});

app.post('/api/messages', connector.listen());

// const facebookConfig = {
//   clientID: process.env.FACEBOOK_APP_ID || '***REMOVED***',
//   clientSecret: process.env.FACEBOOK_APP_SECRET || '***REMOVED***',
//   callbackURL: 'http://localhost:3000/api/users/authenticate/facebook/callback',
//   session: false,
//   profileFields: ['id', 'emails', 'name', 'photos']
// }

var ba = new botauth.BotAuthenticator(app, bot, {
  baseUrl: config.WEBSITE_HOSTNAME, secret: config.***REMOVED***
}).provider("facebook", (options) => {
  return new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || config.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET || config.FACEBOOK_APP_SECRET,
    callbackURL: options.callbackURL,
    profileFields: ['id', 'emails', 'name', 'photos']
  }, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    console.log(profile);
    return done(null, profile);
  });
});

app.get("/", (req, res) => {
  res.send("facebook");
});

// First time connection
bot.on('conversationUpdate', function (message) {
  if (message.membersAdded) {
    message.membersAdded.forEach(function (identity) {
      if (identity.id === message.address.bot.id) {
        bot.beginDialog(message.address, '/hello_first');
      }
    });
  }
});

//=========================================================
// Root Dialog
//=========================================================

bot.dialog('/', new builder.IntentDialog()
    // .matches(/^connexion/i, "/connection")
    .matches(/^d[ée]connexion/i, "/logout_facebook")
    .matches(/coucou|bonjour|bonsoir|hello|hi|hey|salut/i, "/hello")
    // .matches(/Consulter planning/i, "/show_planning")
    // .matches(/^log in|login/i, "/login")
    .onDefault(
      (session, args, next) => {
        // Facebook account_linking
        // if already linked
        // console.log("SESSION USERDATA = ");
        // console.log(session.userData);
        if (session.message.sourceEvent.account_linking) {
          console.log('TOKEN =');
          var token = session.message.sourceEvent.account_linking.authorization_code;
          console.log(token);
          var authorizationStatus = session.message.sourceEvent.account_linking.status;
          if (authorizationStatus === 'linked') {
            // Persist username under the userData
            jwt.verify(token, process.env.TOKEN_SECRET || config.TOKEN_SECRET, function(err, decoded) {
              if (err) {
                console.error("ERROR VERIFY TOKEN");
                console.error(err);
                if (err.name === "JsonWebTokenError") {
                  session.endDialog("Il y a eu un problème avec ta demande :/");
                }
                if (err.name === "TokenExpiredError") {
                  session.endDialog("Ta demande a expiré !");
                }
              } else {
                console.log("DECODED !");
                console.log(decoded);
                session.userData.alenvi = decoded;

                session.send('Compte Facebook lié à Alenvi, merci ' + session.userData.alenvi.firstname + ' :)');
                session.beginDialog('/hello');
              }
            });
          } else if (authorizationStatus === 'unlinked') {
            // Remove username from the userData
            delete session.userData.alenvi;
            session.endDialog('Compte Facebook bien délié ! Reviens-vite :)');
          } else {
            session.endDialog('Il y a eu un problème au moment de délier ton compte Facebook ! :/');
          }
        }
        else {
          // if (session.userData.alenvi) {
          //   console.log("WENT IN /HELLO");
          //   session.beginDialog('/hello');
          //   // endDialog('You are known as ' + session.userData.alenvi.firstname + ' - type "unlink account" to try out unlinking');
          // }
          // else {
            session.beginDialog("/not_understand");
          // }
        }
      }
    )
);

bot.dialog("/not_understand", require("./dialogs/notUnderstand"));

bot.dialog("/login_facebook", require("./dialogs/facebookLoginLogout").login);
bot.dialog("/logout_facebook", require("./dialogs/facebookLoginLogout").logout);

bot.dialog("/hello_first", require("./dialogs/hello").hello_first);
bot.dialog("/hello", require("./dialogs/hello").hello);

bot.dialog("/select_planning", require("./dialogs/showPlanning").select);
bot.dialog("/show_my_planning", require("./dialogs/showPlanning").showMine);

//=========================================================
// Tests
//=========================================================

// bot.dialog("/connection", [].concat(
//   ba.authenticate("facebook"),
//   (session, results) => {
//     console.log("/CONNECTION");
//     //get the facebook profile
//     session.sendTyping();
//     var user = ba.profile(session, "facebook");
//     console.log('FACEBOOK USER:')
//     console.log(user);
//     if (user) {
//       if (user.id) {
//         session.userData.facebook = user;
//         var payload = {};
//         if (user.emails) {
//           payload = {
//             'email': user.emails[0].value,
//             'id': user.id
//           }
//         }
//         else
//           payload = {
//             'id': user.id
//           }
//         var newPayload = _.pickBy(payload);
//         rp.post({
//           url: "http://localhost:3000/api/users/botauth/facebook",
//           json: true,
//           body: newPayload,
//           resolveWithFullResponse: true,
//           time: true
//         }).then(function(parsedBody) {
//           console.log(parsedBody.body);
//           console.log("Duration: " + parsedBody.timings.end);
//           session.userData.alenvi = parsedBody.body.data;
//           session.send("Merci " + session.userData.alenvi.user.firstname + ", tu es maintenant bien lié à Alenvi grâce à Facebook ! :)");
//           session.beginDialog('/hello');
//         }).catch(function(err) {
//           console.error(err);
//           if (err.statusCode == 404)
//             session.endDialog("Je n'arrive pas à te trouver chez Alenvi :( Essaie de contacter un(e) coach, il / elle devrait pouvoir résoudre ce problème !");
//         })
//       }
//     }
//   }
// ))

// bot.dialog("/disconnection", [
//   (session, args, next) => {
//     console.log("/LOGOUT");
//     session.sendTyping();
//     builder.Prompts.confirm(session, "Es-tu sûr de vouloir te déconnecter ?");
//   }, (session, args) => {
//     session.sendTyping();
//     if(args.response) {
//       ba.logout(session, "facebook");
//       session.endDialog("Tu es bien déconnecté. J'espère te revoir bientôt !");
//       // session.beginDialog('/hello_first');
//     } else {
//       session.endDialog("Tu es toujours connecté :)");
//     }
//   }
// ])

// rp.post({
//   uri: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
//   form: {
//     grant_type: "client_credentials",
//     client_id: "***REMOVED***",
//     client_secret: "***REMOVED***",
//     scope: "https://graph.microsoft.com/.default"
//   },
//   json: true,
//   // resolveWithFullResponse: true,
//   // time: true
// }).then(function (parsedBody) {
//   console.log(parsedBody);
//   // console.log("Duration: " + parsedBody.timings.end);
// }).catch(function (err) {
//   console.error(err);
// })


// Setup Server
app.listen(PORT, function() {
  console.log('%s listening to port %s, server url: %s', app.name, PORT, app.url);
})
