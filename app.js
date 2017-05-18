"use strict";

const path = require('path');
const rp = require('request-promise');

const builder = require('botbuilder');
const botauth = require("botauth");

const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;

const WEBSITE_HOSTNAME = "https://8fd4418d.ngrok.io";
const MICROSOFT_APP_ID = "845d6eba-e003-4f10-82c5-1d6fe9d712e6";
const MICROSOFT_APP_PASSWORD = "RCJP0v0q7yexo1tqc5Beuid";
const FACEBOOK_APP_ID = "977382919031323";
const FACEBOOK_APP_SECRET = "8214581d3dcd75f4caecb06058de585d";
const BOTAUTH_SECRET = "BOTAUTH_SECRET";

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
    appId: MICROSOFT_APP_ID,
    appPassword: MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector, {
  localizerSettings: {
    botLocalePath : path.join(__dirname, "./helpers/locale"),
    defaultLocale: "fr_fr"
  }
});

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
//   clientID: process.env.FACEBOOK_APP_ID || '977382919031323',
//   clientSecret: process.env.FACEBOOK_APP_SECRET || '8214581d3dcd75f4caecb06058de585d',
//   callbackURL: 'http://localhost:3000/api/users/authenticate/facebook/callback',
//   session: false,
//   profileFields: ['id', 'emails', 'name', 'photos']
// }

var ba = new botauth.BotAuthenticator(app, bot, {
  baseUrl: WEBSITE_HOSTNAME, secret: BOTAUTH_SECRET
}).provider("facebook", (options) => {
  return new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET || FACEBOOK_APP_SECRET,
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

bot.dialog('/', new builder.IntentDialog()
    .matches(/^bonjour/i, "/hello")
    .matches(/^connexion/i, "/connection")
    .matches(/^d[ée]connexion/i, "/logout")
    // .matches(/^signin/i, "/signin")
    .onDefault((session, args) => {
      console.log(session.message.address.user);
      session.endDialog("Je n'ai pas compris. Essaie de le dire autrement !");
    })
);

bot.dialog("/hello", (session, args) => {
  console.log(session);
    session.endDialog("Bonjour ! Je peux t'aider à obtenir des informations de Facebook. Essaye d'écrire 'Connexion'.");
    console.log(session);
});

bot.dialog("/connection", [].concat(
  ba.authenticate("facebook"),
  function(session, results) {
    //get the facebook profile
    var user = ba.profile(session, "facebook");
    //var user = results.response;
    console.log(user);

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
      session.endDialog("Bonjour " + user.name.givenName + " :) Merci d'utiliser Pigi ! Que puis-je pour toi ?");
    }).catch(function(err) {
      console.error(err);
    })

    // call facebook and get something using user.accessToken
    var client = restify.createJsonClient({
      url: 'https://graph.facebook.com',
      accept : 'application/json',
      headers : {
        "Authorization" : `OAuth ${ user.accessToken }`
      }
    });

    client.get(`/v2.9/me/picture?redirect=0`, (err, req, res, obj) => {
      if(!err) {
        console.log(obj);
        var msg = new builder.Message()
        .attachments([
          new builder.HeroCard(session)
          .text(user.displayName)
          .images([
            new builder.CardImage(session).url(obj.data.url)
          ])
        ]);
        session.endDialog(msg);
      } else {
        console.log(err);
        session.endDialog("error getting profile");
      }
    });
  }
));

bot.dialog("/logout", [
    (session, args, next) => {
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
//     client_id: "845d6eba-e003-4f10-82c5-1d6fe9d712e6",
//     client_secret: "RCJP0v0q7yexo1tqc5Beuid",
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
