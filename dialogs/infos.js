const builder = require('botbuilder');

// =========================================================
// Root 'Infos' dialog
// =========================================================

const whichInfo = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Quelle information souhaites-tu obtenir précisément ?', 'Feuilles de paie|Documents RH|Contacts Utiles', { maxRetries: 0 });
};

const redirectToInfoSelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Feuilles de paie':
          session.replaceDialog('/pay_sheets');
          break;
        case 'Documents RH':
          session.replaceDialog('/hr_docs');
          break;
        case 'Contacts utiles':
          session.replaceDialog('/usefull_contacts');
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
