// =========================================================
// Hello when connected or not
// =========================================================

const builder = require('botbuilder');
// const moment = require('moment');
// const BotMetrics = require('botmetrics');
// const { sendEndorsementToSlack } = require('../helpers/sendEndorsement');
// const { getAlenviUserById } = require('../models/Alenvi/users');
const { checkToken } = require('../helpers/checkOgustToken');
const { checkOptionalDocs } = require('../helpers/checkOptionalDocs');
const reminder = require('../helpers/reminder');

exports.hello_first = [
  (session) => {
    session.sendTyping();
    if ((session.message.sourceEvent.postback && session.message.sourceEvent.postback.referral && session.message.sourceEvent.postback.referral.ref) || (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref)) {
      return session.replaceDialog('/autoLogin_webapp');
    }
    session.send("Hello ! Je m'appelle Pigi, le petit oiseau qui facilite ton quotidien chez Alenvi 😉");
    session.send("Il semblerait que nous ne nous connaissions pas encore ! Peux-tu t'authentifier grâce à tes identifiants, pour que je puisse te reconnaître ?");
    session.replaceDialog('/login_webapp');
  }
];

// const whichCommunity = (session, role, sector) => {
//   if (role === 'admin' || role == 'coach') {
//     BotMetrics.enrichUser(session.message.address.user.id, { gender: role });
//   } else {
//     const corresp = {
//       community: {
//         '1a*': 1,
//         '1b*': 2
//       },
//       translate: {
//         auxiliary: 'auxiliaire'
//       }
//     };
//     BotMetrics.enrichUser(session.message.address.user.id, { gender: `${corresp.translate[role]} ${corresp.community[sector]}` });
//   }
// };

let reminderDocs;
let reminderSet = false;

const rootGreetingMenu = async (session) => {
  session.sendTyping(); // Hello ${session.userData.alenvi.firstname}!
  // whichCommunity(session, session.userData.alenvi.role, session.userData.alenvi.sector);
  // if (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref === 'signup_complete') {
  //   await checkToken(session);
  //   session.send("Merci d'avoir completé ton inscription ! :)");
  // }
  if (session.userData.alenvi.administrative) {
    if (!checkOptionalDocs(session.userData.alenvi.administrative)) {
      if (!reminderSet) {
        console.log('Setting optionalDocs reminder...');
        reminderDocs = await reminder.optionalDocs(session, 'every 1 day at 18:30');
        reminderSet = true;
      }
    }
  }
  if ((session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref === 'optional_docs_complete') || (session.userData.alenvi.administrative && checkOptionalDocs(session.userData.alenvi.administrative))) {
    session.sendTyping();
    await checkToken(session);
    if (reminderSet && reminderDocs) {
      console.log('Clearing optionalDocs reminder...');
      reminderDocs.clear();
    }
    reminderSet = false;
    if (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref === 'optional_docs_complete') {
      session.send("Merci d'avoir completé ton inscription ! :)");
    }
  }
  // if (moment(session.userData.alenvi.createdAt).add('45', 'days').isSame(moment(), 'day') && session.userData.alenvi.administrative && !session.userData.alenvi.administrative.endorsement) {
  //   await sendEndorsementToSlack(session);
  // }
  //  if (session.userData.alenvi.administrative && !session.userData.alenvi.administrative.signup.complete) {
  //    await checkToken(session);
  //    showEndSignupCard(session);
  //  }
  if (session.userData.firstConnection) {
    console.log('test');
    const url = `${process.env.WEBSITE_HOSTNAME}/bot/auxiliaries/${session.userData.alenvi._id}?&access_token=${session.userData.alenvi.token}`;
    const myCards = [];
    const cards = myCards.push(
      new builder.HeroCard(session)
        .title('Mes informations personnelles')
        .buttons([
          builder.CardAction.openUrl(session, url, 'Mettre à jour')
        ])
    );
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.send('Pour finaliser ton inscription chez Alenvi, merci de bien vouloir mettre à jour tes informations personnelles en cliquant ci-dessous. Et n’hésites pas à revenir me parler ensuite! ^_^ ');
    session.endDialog(message);
  } else {
    builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Répertoire|Infos|Administratif|Formation|URGENCE', { maxRetries: 0 });
  }
  // if (session.userData.alenvi.role == 'admin' || session.userData.alenvi.role == 'coach') {
  //   builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Répertoire|Infos|Formation|URGENCE|Accueil aux.', { maxRetries: 0 });
  // } else {
  //   builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Répertoire|Infos|Formation|URGENCE', { maxRetries: 0 });
  // }
};

const redirectMenuResult = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Consulter planning':
          session.replaceDialog('/select_show_planning');
          break;
        case 'Modifier planning':
          session.replaceDialog('/select_modify_planning');
          break;
        case 'Bénéficiaires':
          session.replaceDialog('/which_customers');
          break;
        case 'Répertoire':
          session.replaceDialog('/select_directory');
          break;
        case 'Infos':
          session.replaceDialog('/select_infos');
          break;
        case 'Administratif':
          session.replaceDialog('/administrative');
          break;
        case 'Formation':
          session.replaceDialog('/training_choice');
          break;
        case 'URGENCE':
          session.replaceDialog('/show_emergency');
          break;
        case 'Accueil aux.':
          session.replaceDialog('/ask_phone_nbr');
          break;
      }
    }
    // session.endDialog();
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.hello = [rootGreetingMenu, redirectMenuResult];
