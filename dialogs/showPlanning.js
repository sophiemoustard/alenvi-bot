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
    checkOgustToken(session, function(err, isGood) {
      if (err) {
        session.endDialog("Mince, je n'ai pas réussi à récupérer ton autorisation pour obtenir ces informations :/ Si le problème persiste, essaye de contacter un administrateur !");
      } else {
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
    });
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

/*
** var days = getDaysByWeekOffset(-X); : -X = get all days from -X week before current one, assuming current = 0
** var days = getDaysByWeekOffset([0]); : no param or 0, get current week, assuming current = 0
** var days = getDaysByWeekOffset(X); : X = get all days from +X week after current one, assuming current = 0
*/
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
  }
  var days = {};
  // add a 'Précédent' result to the object so it appears in first
  days["Précédent"] = {};
  // We push all days from a week, to then display it with the good format
  for (var i = 0; i <= 6; i++) {
    // user format
    var dayUserFormat = moment(weekStart).add(i, 'days');
    days[dayUserFormat.format("DD/MM")] = {};
    // ogust format
    days[dayUserFormat.format("DD/MM")].dayOgustFormat = dayUserFormat.format("YYYYMMDD");
  }
  // add a 'Suivant' result to the object so it appears in last
  days["Suivant"] = {};
  return days;
}

// services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, 249180689, dayChosen, { "nbPerPage": 20, "pageNum": 1 })
//         .then(toto)
//         .catch(function(err){
//           console.log(err)
//         })
//
// function toto(getServices){
//   if (getServices.body.array_service.result.length == 0) {
//     return session.endDialog("Aucune intervention de prévue ce jour-là ! :)");
//   } else {
//     const sortedServicesByDate = await fillAndSortArrByStartDate(getServices.body.array_service.result);
//     var servicesToAdd = [];
//     for (var i = 0; i < sortedServicesByDate.length; i++) {
//       console.log("Coucou ? i = " + i);
//       const getCustomer = await customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, sortedServicesByDate[i].id_customer, { "nbPerPage": 20, "pageNum": 1 });
//       console.log("MERDE");
//       var startDate = moment(sortedServicesByDate[i].start_date, "YYYYMMDDHHmm").format("HH:mm");
//       var endDate = moment(sortedServicesByDate[i].end_date, "YYYYMMDDHHmm").format("HH:mm");
//       var firstName = getCustomer.body.customer.first_name ? getCustomer.body.customer.first_name + " " : "";
//       servicesToAdd.push(getCustomer.body.customer.title + ". " + firstName + getCustomer.body.customer.last_name + ": " + startDate + "-" + endDate);
//       var servicesToDisplay = servicesToAdd.join('  \n');
//     }
//     session.send("Interventions le " + results.response.entity + ":  \n" + servicesToDisplay);
//     return session.endDialog();
//   }
// }

async function getPlanningByChosenDay(session, results) {
  session.sendTyping();
  var dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
  // Get services by employee id and the day the user chose
  const getServices = await services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, 249180689, dayChosen, { "nbPerPage": 20, "pageNum": 1 });
  if (getServices.body.array_service.result.length == 0) {
    return session.endDialog("Aucune intervention de prévue ce jour-là ! :)");
  } else {
    const sortedServicesByDate = await fillAndSortArrByStartDate(getServices.body.array_service.result);
    var servicesToAdd = [];
    for (var i = 0; i < sortedServicesByDate.length; i++) {
      console.log("Coucou ? i = " + i);
      const getCustomer = await customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, sortedServicesByDate[i].id_customer, { "nbPerPage": 20, "pageNum": 1 });
      console.log("MERDE");
      var startDate = moment(sortedServicesByDate[i].start_date, "YYYYMMDDHHmm").format("HH:mm");
      var endDate = moment(sortedServicesByDate[i].end_date, "YYYYMMDDHHmm").format("HH:mm");
      var firstName = getCustomer.body.customer.first_name ? getCustomer.body.customer.first_name + " " : "";
      servicesToAdd.push(getCustomer.body.customer.title + ". " + firstName + getCustomer.body.customer.last_name + ": " + startDate + "-" + endDate);
      var servicesToDisplay = servicesToAdd.join('  \n');
    }
    session.send("Interventions le " + results.response.entity + ":  \n" + servicesToDisplay);
    return session.endDialog();
  }
}

  // services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, 249180689, dayChosen, { "nbPerPage": 20, "pageNum": 1 }, function(err, getServices) {
  //   if (err) {
  //     return session.endDialog("Zut, je n'ai pas réussi à récupérer ton planning :/ Si le problème persiste, essaye de contacter un administrateur !");
  //   } else {
  //     if (getServices.array_service.result.length == 0) {
  //       return session.endDialog("Aucune intervention de prévue ce jour-là ! :)");
  //     }
  //     else {
  //       var servicesToAdd = [];
        // var counter2 = sortedServicesByDate.length;
        // _.forEach(sortedServicesByDate, function(serviceData) {
        //   customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, serviceData.id_customer, { "nbPerPage": 20, "pageNum": 1 }, function(err, getCustomer) {
        //     if (err) {
        //       return session.endDialog("Oups, je n'ai pas réussi à récupérer les personnes concernées par tes interventions :/ Si le problème persiste, essaye de contacter un administrateur !");
        //     }
        //     console.log("IS SORTED ?");
        //     console.log(serviceData);
        //     --counter2;
        //     console.log("Coucou ?");
        //     var startDate = moment(serviceData.start_date, "YYYYMMDDHHmm").format("HH:mm");
        //     var endDate = moment(serviceData.end_date, "YYYYMMDDHHmm").format("HH:mm");
        //     var firstName = getCustomer.customer.first_name ? getCustomer.customer.first_name + " " : "";
        //     servicesToAdd.push(getCustomer.customer.title + ". " + firstName + getCustomer.customer.last_name + ": " + startDate + "-" + endDate);
        //     console.log(counter2);
        //     if (counter2 === 0) {
        //       console.log("Coucou 3?");
        //       var servicesToDisplay = servicesToAdd.join('  \n');
        //       session.send("Interventions le " + moment(serviceData.start_date, "YYYYMMDDHHmm").format("DD/MM/YYYY") + ":  \n" + servicesToDisplay);
        //       // session.send(servicesToDisplay);
        //       return session.endDialog();
        //     }
        //   });
        // })

        // for (k in getServices.array_service.result) {
        // sortedServicesByDate.push(getServices.array_service.result[k]);
        // }

        // Object.keys(getServices.array_service.result).forEach(function(key) {
        // })
  //     }
  //   }
  // })
// }

const fillAndSortArrByStartDate = async (getServiceResult) => {
  var sortedServicesByDate = [];
  for (k in getServiceResult) {
    sortedServicesByDate.push(getServiceResult[k]);
  }
  console.log("UNSORTED = ");
  console.log(sortedServicesByDate);
  await sortedServicesByDate.sort(function(service1, service2) {
    return (service1.start_date - service2.start_date);
  })
  return sortedServicesByDate;
}
