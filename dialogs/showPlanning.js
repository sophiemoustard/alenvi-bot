const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning');

// =========================================================
// Root 'Select show planning' dialog
// =========================================================

const whichPlanning = (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'Quel planning souhaites-tu consulter en particulier ?', 'Le mien|Un(e) auxiliaire|Ma communauté', { maxRetries: 0 });
};

const redirectToDaySelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Le mien':
          session.replaceDialog('/show_planning', { weekSelected: 0, myCoworkerChosen: '', isCommunity: false });
          break;
        case 'Un(e) auxiliaire':
          session.replaceDialog('/show_another_auxiliary_planning');
          break;
        case 'Ma communauté':
          session.replaceDialog('/show_planning', { weekSelected: 0, myCoworkerChosen: '', isCommunity: true });
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

const whichDay = async (session, args) => {
  let days = {};
  try {
    await checkOgustToken(session);
    session.sendTyping();
    // Because we can recall this dialog with different weeks select, we need to check it
    session.dialogData.myCoworkerChosen = args.myCoworkerChosen;
    session.dialogData.isCommunity = args.isCommunity;
    if (args.weekSelected != 0) {
      days = planning.getPeriodByOffset(args.weekSelected, 'weeks');
      // We have to use session.dialogData to save the week selected in waterfall
      session.dialogData.weekSelected = args.weekSelected;
    } else { // If user didn't click on 'Précédent' or 'Suivant', just get current week's days
      days = planning.getPeriodByOffset(0, 'weeks');
      session.dialogData.weekSelected = 0;
    }
    session.dialogData.days = days;
    let targetPlanning = '';
    if (args.myCoworkerChosen) {
      targetPlanning = 'son planning';
    } else if (args.isCommunity) {
      targetPlanning = 'le planning de ta communauté';
    } else {
      targetPlanning = 'ton planning';
    }
    builder.Prompts.choice(session, `Pour quel jour souhaites-tu consulter ${targetPlanning} ?`, days, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const handleWeeksOrGetPlanningSelected = (session, results) => {
  let params = {};
  if (results.response) {
    // Use args to save week's offset in the new dialog => dialogData is unset in each new one
    if (results.response.entity === 'Précédent') {
      params = {
        weekSelected: --session.dialogData.weekSelected,
        myCoworkerChosen: session.dialogData.myCoworkerChosen,
        isCommunity: session.dialogData.isCommunity,
      };
      return session.replaceDialog('/show_planning', params);
    } else if (results.response.entity === 'Suivant') {
      params = {
        weekSelected: ++session.dialogData.weekSelected,
        myCoworkerChosen: session.dialogData.myCoworkerChosen,
        isCommunity: session.dialogData.isCommunity,
      };
      return session.replaceDialog('/show_planning', params);
    }

    if (session.dialogData.days[results.response.entity]) {
      // My community planning
      if (session.dialogData.isCommunity) {
        return planning.getCommunityPlanningByChosenDay(session, results);
      }
      // My planning or another auxiliary planning
      return planning.getPlanningByChosenDay(session, results);
    }
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.showPlanning = [whichDay, handleWeeksOrGetPlanningSelected];

// =========================================================
// Show another auxiliary planning
// =========================================================

const whichAuxiliary = async (session) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    // Get list of coworkers
    const myRawCoworkers = await planning.getTeamBySector(session);
    const myCoworkers = await planning.formatPromptListPersons(session, myRawCoworkers, 'id_employee');
    // Put the list in dialogData so we can compare it in next function
    session.dialogData.myCoworkers = myCoworkers;
    builder.Prompts.choice(session, 'Quel(le) auxiliaire précisément ?', myCoworkers, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer tes collègues :/ Si le problème persiste, essaye de contacter l'équipe technique !");
  }
};

const whichPerson = async (session, args) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    session.dialogData.isBeneficiary = args.isBeneficiary;
    if (session.dialogData.isBeneficiary) {
      // blablablabal
    }
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer les personnes correspondantes :/ Si le problème persiste, essaye de contacter l'équipe technique !");
  }
};

const redirectToShowPlanning = (session, results) => {
  if (results.response) {
    if (session.dialogData.myCoworkers[results.response.entity]) {
      const params = {
        weekSelected: 0,
        myCoworkerChosen: session.dialogData.myCoworkers[results.response.entity],
        isCommunity: false,
      };
      return session.replaceDialog('/show_planning', params);
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.showAnotherAuxiliaryPlanning = [whichAuxiliary, redirectToShowPlanning];
