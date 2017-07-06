const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning/treatment.js');
const { getTeamBySector } = require('../helpers/team');
const { formatPromptListPersons } = require('../helpers/planning/format');
const { getCustomers } = require('./../helpers/customers');

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

// const checkPerson = async (session, args) => {
//   let targetPlanning = '';
//   await checkOgustToken(session);
//   session.sendTyping();
//   // Because we can recall this dialog with different weeks select, we need to check it
//   session.dialogData.personChosen = args.personChosen;
//   session.dialogData.personType = args.personType;
//
//   switch (session.dialogData.personChosen) {
//     case 'Self':
//       session.replaceDialog();
//       break;
//     case 'Auxiliary':
//     case 'Customer':
//       targetPlanning = 'son planning';
//       break;
//     case 'Community':
//       targetPlanning = 'le planning de ta communauté';
//       break;
//   }
// }

const whichDay = async (session) => {
  let days = {};
  try {
    await checkOgustToken(session);
    session.sendTyping();
    // Because we can recall this dialog with different weeks select, we need to check it
    if (session.dialogData.weekSelected != 0) {
      days = planning.getPeriodByOffset(session.dialogData.offset, 'weeks');
    } else { // If user didn't click on 'Précédent' or 'Suivant', just get current week's days
      days = planning.getPeriodByOffset(0, 'weeks');
      session.dialogData.offset = 0;
    }
    session.dialogData.days = days;
    let targetPlanning = '';
    switch (session.dialogData.personChosen) {
      case 'Self':
        targetPlanning = 'ton planning';
        break;
      case 'Auxiliary':
      case 'Customer':
        targetPlanning = 'son planning';
        break;
      case 'Community':
        targetPlanning = 'le planning de ta communauté';
        break;
    }
    builder.Prompts.choice(session, `Pour quel jour souhaites-tu consulter ${targetPlanning} ?`, days, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const handleWeeksOrGetPlanningSelected = (session, results) => {
  const params = {};
  if (results.response) {
    // Use args to save week's offset in the new dialog => dialogData is unset in each new one
    params.personChosen = session.dialogData.personChosen;
    params.personType = session.dialogData.personType;
    if (results.response.entity === 'Précédent') {
      params.offset = --session.dialogData.offset;
      return session.replaceDialog('/show_planning', params);
    } else if (results.response.entity === 'Suivant') {
      params.offset = ++session.dialogData.offset;
      return session.replaceDialog('/show_planning', params);
    }
    if (session.dialogData.days[results.response.entity]) {
      switch (session.dialogData.personType) {
        case 'Self':
        case 'Auxiliary':
        case 'Customer':
          return planning.getPlanningByChosenDay(session, results);
        case 'Community':
          return planning.getCommunityPlanningByChosenDay(session, results);
      }
    }
  } else {
    return session.cancelDialog(0, '/not_understand');
  }
};

exports.showPlanning = [whichPerson, whichDay, handleWeeksOrGetPlanningSelected];

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

const whichPerson = async (session, args) => {
  try {
    let myRawPersons;
    let personType;
    let personPromptMsg;
    session.dialogData.personType = args.personType || '';
    await checkOgustToken(session);
    session.sendTyping();
    switch (args.personType) {
      case 'Customer':
        myRawPersons = await getCustomers(session, session.userData.alenvi.employee_id);
        personType = 'id_customer';
        personPromptMsg = 'Quel(le) bénéficiaire précisément ?';
        break;
      case 'Auxiliary':
        myRawPersons = await getTeamBySector(session);
        personType = 'id_employee';
        personPromptMsg = 'Quel(le) auxiliaire précisément ?';
        break;
      case 'Self':
      case 'Community':
        return session.replaceDialog('/which_day', { offset: '0', personChosen: '', personType: session.dialogData.personType });
      case '':
        throw new Error('personType is empty');
      default:
        break;
    }
    session.dialogData.myPersons = await formatPromptListPersons(session, myRawPersons, personType);
    builder.Prompts.choice(session, personPromptMsg, session.dialogData.myPersons, { maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer les personnes correspondantes :/ Si le problème persiste, essaye de contacter l'équipe technique !");
  }
};

const redirectToWhichDay = (session, results) => {
  if (results.response) {
    if (session.dialogData.myPersons[results.response.entity]) {
      const params = {
        offset: 0,
        personChosen: session.dialogData.myPersons[results.response.entity],
        personType: session.dialogData.personType
      };
      return session.replaceDialog('/which_day', params);
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.showPersonPlanning = [whichPerson, redirectToWhichDay];
