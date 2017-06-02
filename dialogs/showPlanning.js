const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const getPlanningByChosenDay = require('../helpers/planning').getPlanningByChosenDay;
const getDaysByWeekOffset = require('../helpers/planning').getDaysByWeekOffset;
const getTeamToDisplayBySector = require('../helpers/planning').getTeamToDisplayBySector;

//=========================================================
// Root 'Select planning' dialog
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
            session.beginDialog("/show_planning", { weekSelected: 0, myCoworkerChosen: "", isCommunity: false });
            break;
          case "Un(e) auxilière":
            session.beginDialog("/show_another_auxiliary_planning");
            break;
          case "La communauté":
            session.beginDialog("/show_planning", { weekSelected: 0, myCoworkerChosen: "", isCommunity: true });
            break;
        }
      }
      else {
        session.endDialog("Vous devez vous connecter pour accéder à cette fonctionnalité ! :)");
      }
    }
  }
];

//=========================================================
// Show a planning, user connected one by default ; generic function shared by all selected dialog
//=========================================================
exports.showPlanning = [
  async (session, args) => {
    try {
      await checkOgustToken(session);
      session.sendTyping();
      // Because we can recall this dialog with different weeks select, we need to check it
      session.dialogData.myCoworkerChosen = args.myCoworkerChosen;
      session.dialogData.isCommunity = args.isCommunity;
      if (args.weekSelected != 0) {
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
      var targetPlanning = "";
      if (args.myCoworkerChosen) {
        targetPlanning = "son planning";
      } else if (args.isCommunity) {
        targetPlanning = "le planning de ta communauté";
      } else {
        targetPlanning = "ton planning";
      }
      builder.Prompts.choice(session, "Pour quel jour souhaites-tu consulter " + targetPlanning + " ?", days, { maxRetries: 3 });
    } catch(err) {
        console.error(err);
        return session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaye de contacter un administrateur !");
    }
  },
  (session, results) => {
    if (results.response) {
      console.log(results.response);
      // We have to use args to save the offset of the week in the new dialog, because session.dialogData is unset in each new dialog
      if (results.response.entity == "Précédent") {
        var params = {
          weekSelected: --session.dialogData.weekSelected,
          myCoworkerChosen: session.dialogData.myCoworkerChosen,
          isCommunity: session.dialogData.isCommunity
        }
        return session.beginDialog("/show_planning", params);
      }
      else if (results.response.entity == "Suivant") {
        var params = {
          weekSelected: ++session.dialogData.weekSelected,
          myCoworkerChosen: session.dialogData.myCoworkerChosen,
          isCommunity: session.dialogData.isCommunity
        }
        return session.beginDialog("/show_planning", params);
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
      if (session.dialogData.myCoworkers[results.response.entity]) {
        var params = {
          weekSelected: 0,
          myCoworkerChosen: session.dialogData.myCoworkers[results.response.entity],
          isCommunity: false
        }
        return session.beginDialog("/show_planning", params);
      }
    }
  }
]
