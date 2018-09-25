const builder = require('botbuilder');

// =========================================================
// Root 'Infos' dialog
// =========================================================

const whichInfo = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Choisis ta rubrique :) ', 'Feuilles de paie|Infos perso|Documents', { maxRetries: 0 });
};

const redirectToInfoSelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Feuilles de paie':
          session.replaceDialog('/select_pay_sheets');
          break;
        case 'Infos perso':
          session.replaceDialog('/show_personnal_info');
          break;
        case 'Documents':
          session.replaceDialog('/hr_docs');
          break;
        default:
          break;
      }
    } else {
      session.endDialog('Vous devez vous connecter pour accéder à cette fonctionnalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.select = [whichInfo, redirectToInfoSelected];
