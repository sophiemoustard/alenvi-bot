// =========================================================
// Hello when connected or not
// =========================================================

const builder = require('botbuilder');
// const BotMetrics = require('botmetrics');

exports.hello_first = [
  (session) => {
    console.log(session.message.sourceEvent);
    session.sendTyping();
    if ((session.message.sourceEvent.postback && session.message.sourceEvent.postback.referral && session.message.sourceEvent.postback.referral.ref) || (session.message.sourceEvent.referral && session.message.sourceEvent.referral.ref)) {
      return session.replaceDialog('/autoLogin_webapp');
    }
    session.send("Hello ! Je m'appelle Pigi, le petit oiseau qui facilite ton quotidien chez Alenvi 😉");
    session.send("Il semblerait que nous ne nous connaissions pas encore ! Peux-tu t'authentifier grâce aux identifiants fournis par Alenvi, pour que je puisse te reconnaître ?");
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

const rootGreetingMenu = (session) => {
  session.sendTyping(); // Hello ${session.userData.alenvi.firstname}!
  // whichCommunity(session, session.userData.alenvi.role, session.userData.alenvi.sector);
  if (session.userData.alenvi.role == 'admin' || session.userData.alenvi.role == 'coach') {
    builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Equipe|Infos|Formation|URGENCE|Accueil aux.', { maxRetries: 0 });
  } else {
    builder.Prompts.choice(session, 'Comment puis-je t’aider ? 😉', 'Consulter planning|Modifier planning|Bénéficiaires|Equipe|Infos|Formation|URGENCE', { maxRetries: 0 });
  }
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
        case 'Equipe':
          session.replaceDialog('/show_team');
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
