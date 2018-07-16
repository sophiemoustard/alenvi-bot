require('dotenv').config();
const path = require('path');
const jwt = require('jsonwebtoken');
// const _ = require('lodash');

const builder = require('botbuilder');
const botbuilderMongo = require('botbuilder-mongodb');

// const BotmetricsMiddleware = require('botmetrics-botframework-middleware').BotmetricsMiddleware({
//   botId: process.env.BOTMETRICS_BOT_ID,
//   apiKey: process.env.BOTMETRICS_API_KEY
// });

const { sendMessageToUser } = require('./helpers/sendMessageToUser');

const PORT = process.env.PORT || '3978';

const restify = require('restify');

const app = restify.createServer();
app.use(restify.bodyParser());
app.use(restify.queryParser());

const mongoOptions = {
  ip: process.env.MONGO_HOST,
  port: process.env.MONGO_PORT,
  database: process.env.MONGO_DB,
  collection: 'BotStateStorage',
  username: process.env.MONGO_USERNAME || '',
  password: process.env.MONGO_PWD || '',
  queryString: process.env.MONGO_QUERY || ''
};

const mongoStorage = botbuilderMongo.GetMongoDBLayer(mongoOptions);

// =========================================================
// Bot Setup
// =========================================================

// Create chat bot
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// const inMemoryStorage = new builder.MemoryBotStorage();

const bot = new builder.UniversalBot(connector).set('storage', mongoStorage);

bot.set('persistConversationData', true);

bot.set('localizerSettings', {
  botLocalePath: path.join(__dirname, './locale'),
  defaultLocale: 'fr_FR',
});

const logUserConversation = (event) => {
  if (event.text) {
    console.log(`message: ${event.text}, user: ${event.address.user.name}`);
  }
};

const dashbotApiMap = { facebook: process.env.DASHBOT_API_KEY_FB };
const dashbot = require('dashbot')(dashbotApiMap).microsoft;

dashbot.setFacebookToken(process.env.FACEBOOK_PAGE_TOKEN);

bot.use(dashbot);

// Middleware for logging
bot.use({
  receive(event, next) {
    logUserConversation(event);
    // BotmetricsMiddleware.receive();
    next();
  },
  // botbuilder: (session, next) => {
  //   console.log(session.message.text);
  // },
  send(event, next) {
    logUserConversation(event);
    // BotmetricsMiddleware.send();
    next();
  }
});

// const resume = (encodedAddress) => {
//   const stringAddress = decodeURIComponent(encodedAddress);
//   const address = JSON.parse(stringAddress);
//   console.log(address);
//   const msg = new builder.Message().address(address).text('Modification effectuée ! ;)');
//   bot.send(msg.toMessage());
// };

app.post('/api/messages', connector.listen());
app.post('sendMessageToUser', sendMessageToUser(bot));
app.get('/', (req, res) => {
  res.send('Alenvi bot :)');
});

// First time connection
bot.on('conversationUpdate', (message) => {
  if (message.membersAdded) {
    message.membersAdded.forEach((identity) => {
      if (identity.id === message.address.bot.id) {
        bot.beginDialog(message.address, '/hello_first');
      }
    });
  }
});

// bot.on('error', (e) => {
//   console.error(e);
//   throw new Error(`Error in the bot: ${e}`);
// })

// =========================================================
// Root Dialog
// =========================================================

bot.dialog('/', new builder.IntentDialog()
  // .matches(/^cc|coucou|bonjour|bonsoir|hello|hi|hey|salut/i, '/hello')

  // .matches(/^connexion/i, "/connection")
  // .matches(/Consulter planning/i, "/show_planning")
  // .matches(/^log in|login/i, "/login")
  .onDefault((session) => {
    if (session.message.sourceEvent.account_linking) {
      const token = session.message.sourceEvent.account_linking.authorization_code;
      const authorizationStatus = session.message.sourceEvent.account_linking.status;
      if (authorizationStatus === 'linked') {
        jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
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
            console.log('DECODED !');
            console.log(decoded);
            session.userData.alenvi = decoded;
            session.userData.alenvi.token = token;
            session.send(`Je t'ai bien reconnu ${session.userData.alenvi.firstname}, merci de t'être connecté(e) ! :)`);
            session.replaceDialog('/hello');
          }
        });
      } else if (authorizationStatus === 'unlinked') {
        delete session.userData.alenvi;
        delete session.userData.ogust;
        session.endDialog('Compte bien déconnecté ! Reviens-vite :)');
      } else {
        session.endDialog('Il y a eu un problème au moment de déconnecter ton compte Alenvi ! :/');
      }
    } else {
      session.replaceDialog('/not_understand');
    }
  })
);

// =========================================================
// Dialogs routing
// =========================================================

bot.dialog('/not_understand', require('./dialogs/notUnderstand'));

// bot.dialog('/login_facebook', require('./dialogs/facebookAuth').login);
// bot.dialog('/logout_facebook', require('./dialogs/facebookAuth').logout)
//   .triggerAction({
//     matches: /^d[ée]connexion$/i
//   });
bot.dialog('/autoLogin_webapp', require('./dialogs/webappAuth').autoLogin);
bot.dialog('/login_webapp', require('./dialogs/webappAuth').login);
bot.dialog('/logout_webapp', require('./dialogs/webappAuth').logout)
  .triggerAction({
    matches: /^d[ée]connexion$/i
  });

bot.dialog('/hello_first', require('./dialogs/hello').hello_first);
bot.dialog('/hello', require('./dialogs/hello').hello);

bot.dialog('/select_show_planning', require('./dialogs/showPlanning').select);
bot.dialog('/which_person', require('./dialogs/whichPerson').whichPerson);
bot.dialog('/which_period', require('./dialogs/whichPeriod').whichPeriod);
bot.dialog('/which_period_unit', require('./dialogs/whichPeriodUnit').whichPeriodUnit);
bot.dialog('/display_calendar', require('./dialogs/displayCalendar').displayCalendar);

bot.dialog('/select_modify_planning', require('./dialogs/modifyPlanning').select);
bot.dialog('/select_intervention', require('./dialogs/modifyPlanning').selectIntervention);
bot.dialog('/set_intervention', require('./dialogs/modifyPlanning').setIntervention)
  .cancelAction('cancelSetIntervention', 'Tu as bien annulé ta demande !', { matches: /^annuler|anuler$/i });
bot.dialog('/ask_for_request', require('./dialogs/modifyPlanning').askForRequest);

bot.dialog('/which_customers', require('./dialogs/customers').whichCustomers);
bot.dialog('/show_customers', require('./dialogs/customers').showCustomers);
bot.dialog('/my_customers_more_details', require('./dialogs/customers').moreDetails);

bot.dialog('/select_directory', require('./dialogs/team').selectDirectory);
bot.dialog('/show_sector_team', require('./dialogs/team').showSectorTeam);
bot.dialog('/show_team', require('./dialogs/team').showTeam);

// bot.beginDialogAction('deconnexion', '/logout_facebook', { matches: /^d[ée]connexion$/i });
bot.beginDialogAction('myCustomersMoreDetails', '/my_customers_more_details');
bot.beginDialogAction('setIntervention', '/set_intervention');
bot.beginDialogAction('askForRequest', '/ask_for_request');

bot.dialog('/select_infos', require('./dialogs/infos').select);
bot.dialog('/hr_docs', require('./dialogs/HRDocs').showHRDocs);
bot.dialog('/usefull_contacts', require('./dialogs/usefull_contacts').showContacts);
bot.dialog('/select_pay_sheets', require('./dialogs/pay_sheets').select);
bot.dialog('/show_news_alenvi', require('./dialogs/showNewsAlenvi').showNewsAlenvi);

bot.dialog('/training_choice', require('./dialogs/trainingChoice').trainingChoice);
bot.dialog('/show_training', require('./dialogs/showTraining').showTraining);

bot.dialog('/show_emergency', require('./dialogs/showEmergency').showEmergency);

bot.dialog('/ask_phone_nbr', require('./dialogs/askPhoneNbr').askPhoneNbr);

bot.dialog('/le_jeu_du_plus_ou_moins', require('./dialogs/gaming').intro)
  .triggerAction({
    matches: /^jeu$/i
  });
bot.dialog('le_jeu_comme_je_veux', require('./dialogs/gaming').gameplay);

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });

// Setup Server
app.listen(PORT, () => {
  console.log('%s listening to port %s, server url: %s', app.name, PORT, app.url);
});
