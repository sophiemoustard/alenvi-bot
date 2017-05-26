const builder = require('botbuilder');
const token = require('../Ogust/login');

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
            console.log("LE MIENS !")
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
  (session, args) => {
    console.log(token());
    session.endDialog("Merci !");
  }
]
