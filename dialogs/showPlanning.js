const builder = require('botbuilder');
const _ = require('lodash');
const moment = require('moment');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const employee = require('../Ogust/employees');
const services = require('../Ogust/services');
const customers = require('../Ogust/customers');

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
    checkOgustToken(session);
    session.sendTyping();
    // var days = getDaysByWeekOffset(1, null);
    var days = getDaysByWeekOffset();
    // var days = getDaysByWeekOffset(null, 1);
    builder.Prompts.choice(session, "Pour quel jour souhaites-tu consulter ton planning ?", "Précédent|" + days[0] + "|" + days[1] + "|" + days[2] + "|" + days[3] + "|" + days[4] + "|" + days[5] + "|" + days[6] + "|Suivant");
  },
  (session, results) => {
    services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, 249180689, "20170602", { "nbPerPage": 20, "pageNum": 1 }, function(err, getServices) {
      if (err)
        session.endDialog("Zut, je n'ai pas réussi à récupérer ton planning :/ Si le problème persiste, essaye de contacter un administrateur !");
      console.log("Service data");
      _.forEach(getServices.array_service.result, function(serviceData) {
        // var payload = {
        //   'firstname': employeeData.first_name,
        //   'lastname': employeeData.last_name,
        //   'local.email': employeeData.email,
        //   'employee_id': employeeData.employee_id,
        //   'sector': employeeData.sector,
        //   'facebook.facebookId': employeeData.skype_id
        // }
        console.log(serviceData);

        customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, serviceData.id_customer, { "nbPerPage": 20, "pageNum": 1 }, function(err, getCustomer) {
          if (err)
          session.endDialog("Oups, je n'ai pas réussi à récupérer les personnes concernées par tes interventions :/ Si le problème persiste, essaye de contacter un administrateur !");
          // console.log(getCustomer);
          console.log(getCustomer.customer.title + ". " + getCustomer.customer.first_name + " " + getCustomer.customer.last_name);
        });
      })
      session.endDialog("Merci !");
    })
  }
]

var getDaysByWeekOffset = function(numberOfWeekToSub, numberOfWeekToAdd) {
  var currentDate = moment();
  var weekStart = currentDate.clone().startOf('week');
  if (numberOfWeekToSub) {
    weekStart.subtract(numberOfWeekToSub, 'week');
  }
  if (numberOfWeekToAdd) {
    weekStart.add(numberOfWeekToAdd, 'week');
  }
  // var weekEnd = currentDate.clone().endOf('week');
  var days = [];
  for (var i = 0; i <= 6; i++) {
    days.push(moment(weekStart).add(i, 'days').format("DD/MM"));
  }
  console.log("DAYS =");
  console.log(days);
  return days;
}
