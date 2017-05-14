const bodyParser = require('body-parser');
const request = require('request');
const rp = require('request-promise');

const builder = require('botbuilder');
const botauth = require("botauth");

const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;

const WEBSITE_HOSTNAME = "31ef8e7c.ngrok.io/api/users";
const MICROSOFT_APP_ID = "845d6eba-e003-4f10-82c5-1d6fe9d712e6";
const MICROSOFT_APP_PASSWORD = "RCJP0v0q7yexo1tqc5Beuid";
const FACEBOOK_APP_ID = "977382919031323";
const FACEBOOK_APP_SECRET = "8214581d3dcd75f4caecb06058de585d";
const BOTAUTH_SECRET = "BOTAUTH_SECRET";

const express = require('express');
const app = express();
const PORT = process.env.PORT || '3978';
app.set('port', PORT);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//=========================================================
// Bot Setup
//=========================================================

// Create chat bot
var connector = new builder.ChatConnector({
    appId: MICROSOFT_APP_ID,
    appPassword: MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
app.post('/api/messages', connector.listen());

var ba = new botauth.BotAuthenticator(app, bot, {
  baseUrl: "https://" + WEBSITE_HOSTNAME, secret: BOTAUTH_SECRET
}).provider("facebook", (options) => {
  return new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: options.callbackURL
  }, (accessToken, refreshToken, profile, done) => {
    profile = profile || {};
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    return done(null, profile);
  });
});

app.get("/", (req, res) => {
  res.send("facebook");
});

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

bot.dialog('/', new builder.IntentDialog()
    .matches(/^hello/i, "/hello")
    .matches(/^profile/i, "/profile")
    .matches(/^logout/i, "/logout")
    .onDefault((session, args) => {
        session.endDialog("Je n'ai pas compris. Essaye d'écrire 'profile'");
    })
);

bot.dialog("/hello", (session, args) => {
    session.endDialog("Bonjour ! Je peux t'aider à obtenir des informations de Facebook. Essaye d'écrire 'profile'.");
});

bot.dialog("/profile", [].concat(
    ba.authenticate("facebook"),
    function(session, results) {
        //get the facebook profile
        var user = ba.profile(session, "facebook");
        //var user = results.response;
        console.log(results);
        console.log("coucou");

        //call facebook and get something using user.accessToken
        var client = restify.createJsonClient({
            url: 'https://graph.facebook.com',
            accept : 'application/json',
            headers : {
                "Authorization" : `OAuth ${ user.accessToken }`
            }
        });

        client.get(`/v2.8/me/picture?redirect=0`, (err, req, res, obj) => {
            if(!err) {
                console.log(obj);
                var msg = new builder.Message()
                    .attachments([
                        new builder.HeroCard(session)
                            .text(user.displayName)
                            .images([
                                new builder.CardImage(session).url(obj.data.url)
                                ]
                            )
                        ]
                    );
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
            session.endDialog("Tu es bien déconnecter.");
        } else {
            session.endDialog("Tu es toujours connecté.");
        }
    }
]);

// Setup Server
app.listen(PORT, function() {
  console.log('%s listening to port %s', app.name, PORT);
})
