// =========================================================
// Hello when connected or not
// =========================================================

const builder = require('botbuilder');
// const moment = require('moment');
// const BotMetrics = require('botmetrics');
// const { sendEndorsementToSlack } = require('../helpers/sendEndorsement');
// const { getAlenviUserById } = require('../models/Alenvi/users');
const { checkToken } = require('../helpers/checkOgustToken');
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
    if ((session.userData.alenvi.administrative.navigoInvoice && session.userData.alenvi.administrative.navigoInvoice.has && !session.userData.alenvi.administrative.navigoInvoice.link)
      || (session.userData.alenvi.administrative.mutualFund && session.userData.alenvi.administrative.mutualFund.has && !session.userData.alenvi.administrative.mutualFund.link)
      || (session.userData.alenvi.administrative.phoneInvoice && session.userData.alenvi.administrative.phoneInvoice.has && !session.userData.alenvi.administrative.phoneInvoice.link)
      || (session.userData.alenvi.administrative.certificates && session.userData.alenvi.administrative.certificates.has && session.userData.alenvi.administrative.certificates.docs.length === 0)) {
      if (!reminderSet) {
        console.log('Setting optionalDocs reminder...');
        reminderDocs = await reminder.optionalDocs(session, 'at 18:30 on Monday');
        reminderSet = true;
      }
    }
  }
  if (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref === 'optional_docs_complete') {
    session.sendTyping();
    await checkToken(session);
    if (reminderSet && reminderDocs) {
      console.log('Clearing optionalDocs reminder...');
      reminderDocs.clear();
    }
    reminderSet = false;
    session.send("Merci d'avoir completé ton inscription ! :)");
  }
  // if (moment(session.userData.alenvi.createdAt).add('45', 'days').isSame(moment(), 'day') && session.userData.alenvi.administrative && !session.userData.alenvi.administrative.endorsement) {
  //   await sendEndorsementToSlack(session);
  // }
  //  if (session.userData.alenvi.administrative && !session.userData.alenvi.administrative.signup.complete) {
  //    await checkToken(session);
  //    showEndSignupCard(session);
  //  }
  builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Répertoire|Infos|Formation|URGENCE', { maxRetries: 0 });
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
          session.replaceDialog('/show_my_customers');
          break;
        case 'Répertoire':
          session.replaceDialog('/select_directory');
          break;
        case 'Infos':
          session.replaceDialog('/select_infos');
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
