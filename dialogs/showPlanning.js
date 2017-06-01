const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const getPlanningByChosenDay = require('../helpers/planning').getPlanningByChosenDay;
const getDaysByWeekOffset = require('../helpers/planning').getDaysByWeekOffset;
const getTeamToDisplayBySector = require('../helpers/planning').getTeamToDisplayBySector;

//=========================================================
// Select planning
//=========================================================
exports.select = [
  (session, args) => {
    session.sendTyping();
    builder.Prompts.choice(session, "Quel planning souhaites-tu consulter en particulier ?", "Le miens|Un(e) auxilière|La communauté");
  },
  (session, results) => {
    if (results.response) {
      if (session.userData.alenvi) {
        console.log(results.response);
        switch (results.response.entity) {
          case "Le miens":
            session.beginDialog("/show_planning", { isMe: true });
            break;
          case "Un(e) auxilière":
            session.beginDialog("/show_another_auxiliary_planning");
            break;
          case "La communauté":
            console.log("La communauté");
            break;
        }
        // session.endDialog();
      }
      else {
        session.endDialog("Vous devez vous connecter pour accéder à cette fonctionnalité ! :)");
      }
    }
  }
];

//=========================================================
// Show a planning, mine by default
//=========================================================
exports.showPlanning = [
  async (session, args) => {
    try {
      await checkOgustToken(session);
      session.sendTyping();
      // Because we can recall this dialog with different weeks select, we need to check it
      session.dialogData.isMe = args.isMe;
      if (args.weekSelected || args.weekSelected == 0) {
        var days = getDaysByWeekOffset(args.weekSelected);
        // We have to use session.dialogData to save the week selected in waterfall
        session.dialogData.weekSelected = args.weekSelected;
      }
      // If user didn't click on 'Précédent' or 'Suivant', just get current week's days to display
      else {
        var days = getDaysByWeekOffset();
        session.dialogData.weekSelected = 0;
      }
      session.dialogData.days = days;
      if (args.isMe) {
        builder.Prompts.choice(session, "Pour quel jour souhaites-tu consulter ton planning ?", days, { maxRetries: 3 });
      } else {
        builder.Prompts.choice(session, "Pour quel jour souhaites-tu consulter son planning ?", days, { maxRetries: 3 });
      }
    }
    catch(err) {
      console.error(err);
      return session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaye de contacter un administrateur !");
    }
  },
  (session, results) => {
    if (results.response) {
      console.log(results.response);
      // We have to use args to save the offset of the week in the new dialog, because session.dialogData is unset in each new dialog
      if (results.response.entity == "Précédent") {
        return session.beginDialog("/show_planning", { weekSelected: --session.dialogData.weekSelected, isMe: session.dialogData.isMe });
      }
      else if (results.response.entity == "Suivant") {
        return session.beginDialog("/show_planning", { weekSelected: ++session.dialogData.weekSelected, isMe: session.dialogData.isMe });
      }
      else {
        if (session.dialogData.days[results.response.entity]) {
          return getPlanningByChosenDay(session, results);
        }
      }
    }
  }
]

//=========================================================
// Show another auxiliary planning
//=========================================================
exports.showAnotherAuxiliaryPlanning = [
  async (session, args) => {
    try {
      await checkOgustToken(session);
      session.sendTyping();
      // Get list of coworkers
      const myCoworkers = await getTeamToDisplayBySector(session);
      // Put the list in dialogData so we can compare it in next function
      session.dialogData.myCoworkers = myCoworkers;
      builder.Prompts.choice(session, "Quel(le) auxiliaire précisément ?", myCoworkers, { maxRetries: 3 });
    } catch (err) {
      console.error(err);
      return session.endDialog("Mince, je n'ai pas réussi à récupérer tes collègues :/ Si le problème persiste, essaye de contacter un administrateur !");
    }
  },
  (session, results) => {
    if (results.response.entity) {
      // TODO: Work on this bug exactly here
      if (session.dialogData.myCorworkers[results.response.entity]) {
        session.beginDialog("/show_planning", { isMe: false, myCorworkerChosen: session.dialogData.myCorworkers[results.response.entity] });
      }
    }
  }
]
