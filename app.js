"use strict";

const path = require('path');
const rp = require('request-promise');

const builder = require('botbuilder');
const botauth = require("botauth");

const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;

const config = require('./config');

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
// , function(session) {
//
// }
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

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, '/hello_first');
            }
        });
    }
});

// [
//     function (session, args, next) {
//         if (!session.userData.name) {
//             session.beginDialog('/profile');
//         } else {
//             next();
//         }
//     },
//     function (session, results) {
//         session.send('Hello %s!', session.userData.name);
//     }
// ]

bot.dialog('/', new builder.IntentDialog()
    .matches(/^bonjour/i, "/hello")
    .matches(/^connexion/i, "/connection")
    .matches(/^d[ée]connexion/i, "/logout")
    // .matches(/^signin/i, "/signin")
    .onDefault(
      (session, args, next) => {
        session.beginDialog("/not_understand");
      }
    )
);

bot.dialog("/not_understand", (session, args) => {
  session.sendTyping();
  session.endDialog("Pardonne-moi, je n'ai pas compris. Peux-tu répéter autrement ?");
})

bot.dialog("/hello_first", (session, args) => {
  session.sendTyping();
  session.send("Hello ! Je m'appelle Pigi, le petit oiseau qui facilite ton quotidien chez Alenvi 😉");
  session.sendTyping();
  session.send("Il semblerait que nous ne nous connaissions pas encore ! Veux-tu bien t'authentifier grâce à Facebook, afin que je puisse te reconnaître ?");
  session.beginDialog("/connection");
});

bot.dialog("/hello", [
  (session, args) => {
    console.log(session.message);
    session.sendTyping();
    builder.Prompts.choice(session, "Hello " + session.userData.alenvi.user.firstname + "! 😉 Comment puis-je t’aider ?", "Modifier planning|Consulter planning|Bénéficiaires|Equipe|Infos");
  },
  (session, results) => {
    if (results.response) {
      // session.endDialog("Hello " + session.userData.alenvi.user.firstname + "! 😉 Comment puis-je t’aider ?");
      console.log(results.response);
      session.endDialog("Tu as choisi " + results.response.entity);
    }
    else
      session.beginDialog("/not_understand");
  }
]);

bot.dialog("/connection", [].concat(
  ba.authenticate("facebook"),
  (session, results) => {
    //get the facebook profile
    session.sendTyping();
    var user = ba.profile(session, "facebook");
    console.log('FACEBOOK USER:')
    console.log(user);
    if (user) {
      if (user.id) {
        session.userData.facebook = user;
        var payload = {
          'email': user.emails[0].value,
          'id': user.id
        }
        rp.post({
          url: "http://localhost:3000/api/users/botauth/facebook",
          json: true,
          body: payload,
          resolveWithFullResponse: true,
          time: true
        }).then(function(parsedBody) {
          console.log(parsedBody.body);
          console.log("Duration: " + parsedBody.timings.end);
          session.userData.alenvi = parsedBody.body.data;
          session.send("Merci " + session.userData.alenvi.user.firstname + ", tu es maintenant bien lié à Alenvi grâce à Facebook ! :)");
          session.beginDialog('/hello');
        }).catch(function(err) {
          console.error(err);
        })

        // call facebook and get something using user.accessToken
        // var client = restify.createJsonClient({
        //   url: 'https://graph.facebook.com',
        //   accept : 'application/json',
        //   headers : {
        //     "Authorization" : `OAuth ${ user.accessToken }`
        //   }
        // });
        //
        // client.get(`/v2.9/me/picture?redirect=0`, (err, req, res, obj) => {
        //   if(!err) {
        //     console.log(obj);
        //     var msg = new builder.Message()
        //     .attachments([
        //       new builder.HeroCard(session)
        //       .text(user.displayName)
        //       .images([
        //         new builder.CardImage(session).url(obj.data.url)
        //       ])
        //     ]);
        //     session.endDialog(msg);
        //   } else {
        //     console.log(err);
        //     session.endDialog("Il y a eu un problème au moment de récupérer ton profil.");
        //   }
        // });
      }
    }
  }
));

bot.dialog("/logout", [
  (session, args, next) => {
    session.sendTyping();
    builder.Prompts.confirm(session, "Es-tu sûr de vouloir te déconnecter ?");
  }, (session, args) => {
    if(args.response) {
      ba.logout(session, "facebook");
      session.endDialog("Tu es bien déconnecté.");
    } else {
      session.endDialog("Tu es toujours connecté.");
    }
  }
]);

// bot.dialog('/signin', [
//   function (session) {
//     // Send a signin
//     var msg = new builder.Message(session)
//     .attachments([
//       new builder.SigninCard(session)
//       // .title("You must first signin to your account.")
//       .button("signin", "http://localhost:3000/login.html")
//     ]);
//     session.endDialog(msg);
//   }
// ]);

/*
** TESTS
*/
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

//=========================================================
// Bots Dialogs
//=========================================================

// var intents = new builder.IntentDialog();
// bot.dialog('/', intents);
//
// intents.matches(/^change name/i, [
//     function (session) {
//         session.beginDialog('/profile');
//     },
//     function (session, results) {
//         session.send('Ok... Changed your name to %s', session.userData.name);
//     }
// ]);
//
// intents.onDefault([
//     function (session, args, next) {
//         if (!session.userData.name) {
//             session.beginDialog('/profile');
//         } else {
//             next();
//         }
//     },
//     function (session, results) {
//         session.send('Hello %s!', session.userData.name);
//     }
// ]);
//
// bot.dialog('/profile', [
//     function (session) {
//         builder.Prompts.text(session, 'Hi! What is your name?');
//     },
//     function (session, results) {
//         session.userData.name = results.response;
//         session.endDialog();
//     }
// ]);

// Setup Server
app.listen(PORT, function() {
  console.log('%s listening to port %s, server url: %s', app.name, PORT, app.url);
})
