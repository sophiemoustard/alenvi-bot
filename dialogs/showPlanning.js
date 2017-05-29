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
    console.log("ARGS =");
    console.log(args);
    checkOgustToken(session, function(err, isGood) {
      if (err) {
        session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaye de contacter un administrateur !");
      } else {
        session.sendTyping();
        if (args) {
          if (args.weekSelected || args.weekSelected == 0) {
            var days = getDaysByWeekOffset(args.weekSelected);
            session.dialogData.weekSelected = args.weekSelected;
          }
        }
        else {
          var days = getDaysByWeekOffset();
          session.dialogData.weekSelected = 0;
        }
        // var days = getDaysByWeekOffset(null, 1);
        builder.Prompts.choice(session, "Pour quel jour souhaites-tu consulter ton planning ?", days, { maxRetries: 3 });
      }
    });
  },
  (session, results) => {
    if (results.response) {
      console.log(results.response);
      switch (results.response.entity) {
        case "Précédent":
          console.log("PREVIOUS WEEK!")
          return session.beginDialog("/show_my_planning", { weekSelected: --session.dialogData.weekSelected });
          break;
        case "Suivant":
          console.log("NEXT WEEK!")
          return session.beginDialog("/show_my_planning", { weekSelected: ++session.dialogData.weekSelected });
          break;
        case "tchouy":
          console.log("La communauté");
          break;
      }
    }
    services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, 249180689, "20170602", { "nbPerPage": 20, "pageNum": 1 }, function(err, getServices) {
      if (err) {
        session.endDialog("Zut, je n'ai pas réussi à récupérer ton planning :/ Si le problème persiste, essaye de contacter un administrateur !");
      } else {
        console.log("Service data");
        _.forEach(getServices.array_service.result, function(serviceData) {
          console.log(serviceData);
          customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, serviceData.id_customer, { "nbPerPage": 20, "pageNum": 1 }, function(err, getCustomer) {
            if (err)
            session.endDialog("Oups, je n'ai pas réussi à récupérer les personnes concernées par tes interventions :/ Si le problème persiste, essaye de contacter un administrateur !");
            // console.log(getCustomer);
            console.log(getCustomer.customer.title + ". " + getCustomer.customer.first_name + " " + getCustomer.customer.last_name);
          });
        })
      }
    })
    session.endDialog("Merci !");
  }
]

// var days = getDaysByWeekOffset(-X); : -X = get all days from -X week before current one
// var days = getDaysByWeekOffset(); : no param, get current week
// var days = getDaysByWeekOffset(X); : X = get all days from +X week after current one
var getDaysByWeekOffset = function(offset) {
  var currentDate = moment();
  var weekStart = currentDate.clone().startOf('week');
  if (offset) {
    if (offset < 0) {
      weekStart.subtract(Math.abs(offset), 'week');
    }
    if (offset > 0) {
      weekStart.add(Math.abs(offset), 'week');
    }
    if (offset == 0) {
      weekStart = currentDate.clone().startOf('week');
    }
  }
  // var weekEnd = currentDate.clone().endOf('week');
  // var days = [];
  var days = {};
  days["Précédent"] = {};
  for (var i = 0; i <= 6; i++) {
    // days.push(moment(weekStart).add(i, 'days').format("DD/MM"));
    var dayUserFormat = moment(weekStart).add(i, 'days');
    days[dayUserFormat.format("DD/MM")] = {};
    days[dayUserFormat.format("DD/MM")].dayOgustFormat = dayUserFormat.format("YYYYMMDD");
  }
  days["Suivant"] = {};
  console.log("DAYS =");
  console.log(days);
  return days;
}
