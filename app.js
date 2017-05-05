const request = require('request');
const rp = require('request-promise');
const express = require('express');
const app = express();

const PORT = "3978";

var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
app.listen(PORT, function() {
  console.log('%s listening to port %s', app.name, PORT);
})

// Create chat bot
var connector = new builder.ChatConnector({
    appId: "845d6eba-e003-4f10-82c5-1d6fe9d712e6",
    appPassword: "RCJP0v0q7yexo1tqc5Beuid"
});
var bot = new builder.UniversalBot(connector);
app.post('/api/messages', connector.listen());

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

var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);
