const moment = require('moment');

const employee = require('../Ogust/employees');
const services = require('../Ogust/services');
const customers = require('../Ogust/customers');

//=========================================================
// Own planning + another auxiliary planning
//=========================================================

exports.getPlanningByChosenDay = async (session, results) => {
  try {
    session.sendTyping();
    var dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
    // Get all services of an employee by day the user chose from prompt
    // employee_id = 249180689 for testing (Aurélie) or session.userData.alenvi.employee_id in prod
    var getServices = await services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, session.dialogData.myCoworkerChosen ? session.dialogData.myCoworkerChosen.employee_id : session.userData.alenvi.employee_id, dayChosen, { "nbPerPage": 20, "pageNum": 1 });
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
    servicesToDisplay.push(getCustomer.body.customer.title + ". " + firstName + getCustomer.body.customer.last_name + ": " + startDate + " - " + endDate);
  }
  // Return all services to display the carriage return
  return servicesToDisplay.join('  \n');
}

exports.formatListOtherAuxiliaries = async (session, myTeam) => {
  // Prompt understandable object
  var teamToDisplay = {};
  for (k in myTeam) {
    if (myTeam[k].id_employee != session.userData.alenvi.employee_id) {
      teamToDisplay[myTeam[k].first_name + " " + myTeam[k].last_name] = {};
      teamToDisplay[myTeam[k].first_name + " " + myTeam[k].last_name].employee_id = myTeam[k].id_employee;
    }
  }
  return teamToDisplay;
}

//=========================================================
// Community planning
//=========================================================

exports.getCommunityPlanningByChosenDay = async (session, results) => {
  try {
    session.sendTyping();
    var dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
    var workingHoursRaw = await getWorkHoursByDay(session, dayChosen);
    var workingHoursToDisplay = formatCommunityWorkingHours(workingHoursRaw);
    session.send("Planning de ta communauté le " + results.response.entity + ":  \n" + workingHoursToDisplay);
    return session.endDialog();
  } catch(err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning  de la communauté :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
}

const getWorkHoursByDay = async (session, dayChosen) => {
  var myTeam = await getTeamBySector(session);
  var workingHours = {};
  // For all people in my team, get their planning, then return it as an object well formated
  for (i in myTeam) {
    if (myTeam[i].id_employee != session.userData.alenvi.employee_id) {
      var employeeId = myTeam[i].id_employee;
      var getEmployeePlanningByDay = await services.getServicesByEmployeeIdAndDate(session.userData.ogust.tokenConfig.token, employeeId, dayChosen, { "nbPerPage": 20, "pageNum": 1 });
      if (getEmployeePlanningByDay.body.status == "KO") {
        throw new Error("Error while getting employee planning by day: " + getEmployeePlanningByDay.body.message);
      }
      var employeePlanningResult = getEmployeePlanningByDay.body.array_service.result;
      if (employeePlanningResult) {
        for (j in employeePlanningResult) {
          if (!workingHours[employeeId]) {
            workingHours[employeeId] = {};
          }
          workingHours[employeeId][j] = {};
          workingHours[employeeId][j].start_date = moment(employeePlanningResult[j].start_date, "YYYYMMDDHHmm").format("HH:mm");
          workingHours[employeeId][j].end_date = moment(employeePlanningResult[j].end_date, "YYYYMMDDHHmm").format("HH:mm");
          workingHours[employeeId].title = myTeam[i].title;
          workingHours[employeeId].first_name = myTeam[i].first_name;
          workingHours[employeeId].last_name = myTeam[i].last_name;
        }
      }
    }
  }
  return workingHours;
}

const formatCommunityWorkingHours = async (workingHours) => {
  var planningToDisplay = [];
  console.log("WORKING HOURS");
  console.log(workingHours);
  for (k in workingHours) {
    var obj = workingHours[k];
    console.log("test 1");
    var planningToAdd = obj.first_name + " " + obj.last_name + "\n";
    for (indexService in obj) {
      console.log("test 2");
      planningToAdd += obj[indexService].start_date + " - " + obj[indexService].end_date + "\n";
    }
    console.log("PLANNING TO ADD =");
    console.log(planningToAdd);
    planningToDisplay.push(planningToAdd);
  }
  console.log("PLANNING TO DISPLAY = ");
  console.log(planningToDisplay);
  return planningToDisplay.join('  \n');
}



//=========================================================
// Generic helper for planning
//=========================================================

const getTeamBySector = exports.getTeamBySector = async (session) => {
  const getTeam = await employee.getEmployeesBySector(session.userData.ogust.tokenConfig.token, session.userData.alenvi.sector, { "nbPerPage": 20, "pageNum": 1 });
  if (getTeam.body.status == "KO") {
    throw new Error("Error while getting employees by sector: " + getTeam.body.message);
  }
  var getTeamResult = getTeam.body.array_employee.result;
  if (Object.keys(getTeamResult).length == 0) {
    return session.endDialog("Il semble que tu sois le pillier de ta communauté ! :)");
  } else {
    return getTeamResult;
  }
}

/*
** var days = getDaysByWeekOffset(-X); : -X = get all days from -X week before current one, assuming current = 0
** var days = getDaysByWeekOffset([0]); : no param or 0, get current week, assuming current = 0
** var days = getDaysByWeekOffset(X); : X = get all days from +X week after current one, assuming current = 0
*/
exports.getDaysByWeekOffset = (offset=0) => {
  var currentDate = moment();
  var weekStart = currentDate.clone().startOf('isoWeek');
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
