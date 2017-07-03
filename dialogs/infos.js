const builder = require('botbuilder');

// =========================================================
// Root 'Infos' dialog
// =========================================================

const whichInfo = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Quelle information souhaites-tu obtenir précisément ?', 'Feuilles de paie|Documents RH|Contacts utiles', { maxRetries: 0 });
};

const redirectToInfoSelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Feuilles de paie':
          if (process.env.NODE_ENV == 'production') {
            session.endDialog('Je suis en train de construire cette partie, reviens plus tard ! :)');
          } else {
            session.replaceDialog('/select_pay_sheets');
          }
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
