const builder = require('botbuilder');
const token = require('../Ogust/token');
const employee = require('../Ogust/employees');
const services = require('../Ogust/services');

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
    token.getToken(function(err, getToken) {
      // session.userData.alenvi.employee_id
      services.getServicesByEmployeeId(getToken.token, 249180689, { "slotToSub": 2, "slotToAdd": 2, "intervalType": "week" }, { "nbPerPage": 20, "pageNum": 1 }, function(err, getServices) {
      })
    });
        // session.userData.ogust = getEmployee;
    session.endDialog("Merci !");
  }
]
