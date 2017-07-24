const builder = require('botbuilder');

// =========================================================
// Root 'Infos' dialog
// =========================================================

const whichInfo = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Quelle information souhaites-tu obtenir précisément ?', 'Feuilles de paie|Administratif|Contacts utiles|Actualités Alenvi', { maxRetries: 0 });
};

const redirectToInfoSelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Feuilles de paie':
          session.replaceDialog('/select_pay_sheets');
          break;
        case 'Administratif':
          session.replaceDialog('/hr_docs');
          break;
        case 'Contacts utiles':
          session.replaceDialog('/usefull_contacts');
          break;
        case 'Actualités Alenvi':
          session.replaceDialog('/show_news_alenvi');
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
