const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const getPlanningByChosenDay = require('../helpers/planning').getPlanningByChosenDay;
const getDaysByWeekOffset = require('../helpers/planning').getDaysByWeekOffset;

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
            session.beginDialog("/show_my_planning");
            break;
          case "Un(e) auxilière":
            console.log("Une auxilière");
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
// Show my planning
//=========================================================
exports.showMine = [
  async (session, args) => {
    try {
      await checkOgustToken(session);
      session.sendTyping();
      if (args) {
        if (args.weekSelected || args.weekSelected == 0) {
          var days = getDaysByWeekOffset(args.weekSelected);
          // We have to use session.dialogData to save the week selected in waterfall
          session.dialogData.weekSelected = args.weekSelected;
        }
      }
      else {
        var days = getDaysByWeekOffset();
        session.dialogData.weekSelected = 0;
      }
      session.dialogData.days = days;
      builder.Prompts.choice(session, "Pour quel jour souhaites-tu consulter ton planning ?", days, { maxRetries: 3 });
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
        return session.beginDialog("/show_my_planning", { weekSelected: --session.dialogData.weekSelected });
      }
      else if (results.response.entity == "Suivant") {
        return session.beginDialog("/show_my_planning", { weekSelected: ++session.dialogData.weekSelected });
      }
      else {
        if (session.dialogData.days[results.response.entity]) {
          return getPlanningByChosenDay(session, results);
        }
      }
    }
  }
]
