const moment = require('moment');

const employee = require('../Ogust/employees');
const services = require('../Ogust/services');
const customers = require('../Ogust/customers');
const team = require('../Ogust/team');

exports.getPlanningByChosenDay = async (session, results) => {
  try {
    session.sendTyping();
    var dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
    // Get services by employee id and the day the user chose from prompt
    // employee_id = 249180689 for testing (Aurélie)
    // or session.userData.alenvi.employee_id in prod
    if (session.dialogData.isCommunity) {
      var getServices = await services.getAllServicesInDate(session.userData.ogust.tokenConfig.token, session.dialogData.myCoworkerChosen ? session.dialogData.myCoworkerChosen.employee_id : session.userData.alenvi.employee_id, dayChosen, { "nbPerPage": 20, "pageNum": 1 });
    } else {
      var getServices = await services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, session.dialogData.myCoworkerChosen ? session.dialogData.myCoworkerChosen.employee_id : session.userData.alenvi.employee_id, dayChosen, { "nbPerPage": 20, "pageNum": 1 });
    }
    if (getServices.body.status == "KO") {
      throw new Error("Error while getting services: " + getServices.body.message);
    }
    if (Object.keys(getServices.body.array_service.result).length == 0) {
      return session.endDialog("Aucune intervention de prévue ce jour-là ! :)");
    } else {
      let sortedServicesByDate = await fillAndSortArrByStartDate(getServices.body.array_service.result);
      let servicesToDisplay = await getServicesToDisplay(session, sortedServicesByDate);
      session.send("Interventions le " + results.response.entity + ":  \n" + servicesToDisplay);
      return session.endDialog();
    }
  } catch(err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
}

// exports.getCommunityPlanningByChosenDay = async (session, results) => {
//   try {
//     session.sendTyping();
//     var dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
//     var communityServicesByDay = await services.getAllServicesByCommunityAndDate(session.userData.ogust.tokenConfig.token, { "nbPerPage": 20, "pageNum": 1 })
//   }
// }

// Get all services applied to a specific customer, and format it to display then
const getServicesToDisplay = async (session, sortedServicesByDate) => {
  var servicesToDisplay = [];
  for (var i = 0; i < sortedServicesByDate.length; i++) {
    // For each date, get the customer title, firstname and lastname
    var getCustomer = await customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, sortedServicesByDate[i].id_customer, { "nbPerPage": 20, "pageNum": 1 });
    if (getCustomer.body.status == "KO") {
      throw new Error("Error while getting customers: " + getCustomer.body.message);
    }
    // Then push all the interventions well displayed (without carriage return yet)
    var startDate = moment(sortedServicesByDate[i].start_date, "YYYYMMDDHHmm").format("HH:mm");
    var endDate = moment(sortedServicesByDate[i].end_date, "YYYYMMDDHHmm").format("HH:mm");
    var firstName = getCustomer.body.customer.first_name ? getCustomer.body.customer.first_name + " " : "";
    servicesToDisplay.push(getCustomer.body.customer.title + ". " + firstName + getCustomer.body.customer.last_name + ": " + startDate + "-" + endDate);
  }
  // Return all services to display the carriage return
  return servicesToDisplay.join('  \n');
}

const fillAndSortArrByStartDate = async (getServiceResult) => {
  var sortedServicesByDate = [];
  for (k in getServiceResult) {
    sortedServicesByDate.push(getServiceResult[k]);
  }
  await sortedServicesByDate.sort(function(service1, service2) {
    return (service1.start_date - service2.start_date);
  })
  return sortedServicesByDate;
}

/*
** var days = getDaysByWeekOffset(-X); : -X = get all days from -X week before current one, assuming current = 0
** var days = getDaysByWeekOffset([0]); : no param or 0, get current week, assuming current = 0
** var days = getDaysByWeekOffset(X); : X = get all days from +X week after current one, assuming current = 0
*/
// Get days be week offset, used in generic show_planning
exports.getDaysByWeekOffset = (offset) => {
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
  // Add a 'Précédent' result to the object so it appears in first
  days["Précédent"] = {};
  // Add all days from a week, to then display it with the good format
  // Prompt understandable object
  for (var i = 0; i <= 6; i++) {
    // Add user format to prompt
    var dayUserFormat = moment(weekStart).add(i, 'days');
    days[dayUserFormat.format("DD/MM")] = {};
    // Add ogust format
    days[dayUserFormat.format("DD/MM")].dayOgustFormat = dayUserFormat.format("YYYYMMDD");
  }
  // add a 'Suivant' result to the object so it appears in last
  days["Suivant"] = {};
  return days;
}

exports.getTeamToDisplayBySector = async (session) => {
  const getTeam = await team.getTeamByEmployeeBySector(session.userData.ogust.tokenConfig.token, session.userData.alenvi.sector, { "nbPerPage": 20, "pageNum": 1 });
  if (getTeam.body.status == "KO") {
    throw new Error("Error while getting team by employee sector: " + getTeam.body.message);
  }
  var getTeamResult = getTeam.body.array_employee.result;
  console.log(getTeamResult);
  if (Object.keys(getTeamResult).length == 0) {
    return session.endDialog("Il semble que tu sois le pillier de ta communauté ! :)");
  } else {
    // Prompt understandable object
    var teamToDisplay = {};
    for (k in getTeamResult) {
      if (getTeamResult[k].id_employee != session.userData.alenvi.employee_id) {
        teamToDisplay[getTeamResult[k].first_name + " " + getTeamResult[k].last_name] = {};
        teamToDisplay[getTeamResult[k].first_name + " " + getTeamResult[k].last_name].employee_id = getTeamResult[k].id_employee;
      }
    }
    console.log("TEAM TO DISPLAY =");
    console.log(teamToDisplay);
    return teamToDisplay;
  }
}
