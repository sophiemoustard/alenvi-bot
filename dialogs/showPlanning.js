const builder = require('botbuilder');

// =========================================================
// Root 'Select show planning' dialog
// =========================================================

const whichPlanning = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Quel planning souhaites-tu consulter en particulier ?', 'Le mien|Un(e) auxiliaire|Un(e) bénéficiaire|Ma communauté', { listStyle: builder.ListStyle.button, maxRetries: 0 });
};

const redirectToDaySelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Le mien':
          // session.replaceDialog('/which_person', { personType: 'Self' });
          session.replaceDialog('/display_calendar');
          break;
        case 'Un(e) auxiliaire':
          session.replaceDialog('/which_person', { personType: 'Auxiliary' });
          break;
        case 'Un(e) bénéficiaire':
          session.replaceDialog('/which_person', { personType: 'Customer' });
          break;
        case 'Ma communauté':
          session.replaceDialog('/which_person', { personType: 'Community' });
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

exports.select = [whichPlanning, redirectToDaySelected];
