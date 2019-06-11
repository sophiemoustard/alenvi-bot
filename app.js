require('dotenv').config();
const path = require('path');

const builder = require('botbuilder');
const botbuilderMongo = require('botbuilder-mongodb');

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
const dashbot = require('dashbot')(dashbotApiMap).microsoftDeprecated;

dashbot.setFacebookToken(process.env.FACEBOOK_PAGE_TOKEN);

bot.use(dashbot);

// Middleware for logging
bot.use({
  receive(event, next) {
    logUserConversation(event);
    next();
  },
  send(event, next) {
    logUserConversation(event);
    next();
  }
});

app.post('/api/messages', connector.listen());
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

// Root dialog
bot.dialog('/', new builder.IntentDialog()
  .onDefault((session) => {
    session.sendTyping();
    if (Object.keys(session.userData).length === 0) {
      session.replaceDialog('/hello_first');
    } else {
      session.replaceDialog('/hello');
    }
  })
);

// =========================================================
// Dialogs routing
// =========================================================

bot.dialog('/not_understand', require('./dialogs/notUnderstand'));

bot.dialog('/autoLogin_webapp', require('./dialogs/webappAuth').autoLogin);
bot.dialog('/logout_webapp', require('./dialogs/webappAuth').logout)
  .triggerAction({
    matches: /^d[ée]connexion$/i
  });

bot.dialog('/hello_first', require('./dialogs/hello').hello_first);
bot.dialog('/hello', require('./dialogs/hello').hello);

bot.dialog('/planning', require('./dialogs/planning').displayPlanning);
bot.dialog('/customers', require('./dialogs/customers').displayCustomers);
bot.dialog('/administrative', require('./dialogs/administrative').displayAdministrative);
bot.dialog('/team', require('./dialogs/team').displayTeam);

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });

// Setup Server
app.listen(PORT, () => {
  console.log('%s listening to port %s, server url: %s', app.name, PORT, app.url);
});
