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
          session.replaceDialog('/which_person', { personType: 'Self' });
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


// =========================================================
// Show a planning, user connected one by default
// Generic function shared by my own planning and another auxiliary planning
// =========================================================

// =========================================================
// Show another auxiliary planning
// =========================================================

// const whichAuxiliary = async (session) => {
//   try {
//     await checkOgustToken(session);
//     session.sendTyping();
//     // Get list of coworkers
//     const myRawCoworkers = await planning.getTeamBySector(session);
//     const myCoworkers = await planning.formatPromptListPersons(session, myRawCoworkers, 'id_employee');
//     // Put the list in dialogData so we can compare it in next function
//     session.dialogData.myCoworkers = myCoworkers;
//     builder.Prompts.choice(session, 'Quel(le) auxiliaire précisément ?', myCoworkers, { maxRetries: 0 });
//   } catch (err) {
//     console.error(err);
//     return session.endDialog("Mince, je n'ai pas réussi à récupérer tes collègues :/ Si le problème persiste, essaye de contacter l'équipe technique !");
//   }
// };
