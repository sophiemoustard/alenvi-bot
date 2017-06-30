const moment = require('moment-timezone');
const _ = require('lodash');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const {getTeamBySector} = require('../helpers/team');

const employee = require('../models/Ogust/employees');
const services = require('../models/Ogust/services');
const customers = require('../models/Ogust/customers');

// =========================================================
// Own planning + another auxiliary planning
// =========================================================

const fillAndSortArrByStartDate = async (getServiceResult) => {
  const sortedServicesByDate = _.values(getServiceResult);
  await sortedServicesByDate.sort((service1, service2) => (
    service1.start_date - service2.start_date));
  return sortedServicesByDate;
};

// Get all services applied to a specific customer, and format it to display then
const getServicesToDisplay = async (session, sortedServicesByDate) => {
  const servicesToDisplay = [];
  for (let i = 0; i < sortedServicesByDate.length; i++) {
    // For each date, get the customer title, firstname and lastname
    const getCustomer = await customers.getCustomerByCustomerId(
      session.userData.ogust.tokenConfig.token,
      sortedServicesByDate[i].id_customer,
      { nbPerPage: 20, pageNum: 1 });
    // Then push all the interventions well displayed (without carriage return yet)
    const startDate = moment.tz(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const endDate = moment.tz(sortedServicesByDate[i].end_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const firstName = getCustomer.body.customer.first_name ? `${getCustomer.body.customer.first_name.substring(0, 1)}. ` : '';
    servicesToDisplay.push(`${firstName}${getCustomer.body.customer.last_name}: ${startDate} - ${endDate}  `); // ${getCustomer.body.customer.title}.
  }
  // Return all services to display the carriage return
  return servicesToDisplay.join('  \n');
};

exports.getPlanningByChosenDay = async (session, results) => {
  try {
    session.sendTyping();
    const dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
    // Get all services of an employee by day the user chose from prompt
    // employee_id = 249180689 for testing (Aurélie) or session.userData.alenvi.employee_id in prod
    const getServices = await services.getServicesByEmployeeIdAndDate(
      session.userData.ogust.tokenConfig.token,
      session.dialogData.myCoworkerChosen ?
        session.dialogData.myCoworkerChosen.employee_id :
        session.userData.alenvi.employee_id,
      dayChosen, { nbPerPage: 20, pageNum: 1 }
    );
    const getServicesResult = getServices.body.array_service.result;
    if (Object.keys(getServicesResult).length === 0) {
      return session.endDialog('Aucune intervention ce jour-là ! :)');
    }
    const sortedServicesByDate = await fillAndSortArrByStartDate(getServicesResult);
    const servicesToDisplay = await getServicesToDisplay(session, sortedServicesByDate);
    if (session.dialogData.myCoworkerChosen) {
      const coWorker = await employee.getEmployeeById(
        session.userData.ogust.tokenConfig.token,
        session.dialogData.myCoworkerChosen.employee_id,
        { nbPerPage: 1, pageNum: 1 }
      );
      session.send(`📅 Interventions de ${coWorker.body.employee.first_name} le ${results.response.entity}  \n${servicesToDisplay}`);
    } else {
    session.send(`📅 Interventions le ${results.response.entity}  \n${servicesToDisplay}`);
    }
    return session.endDialog();
  } catch (err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

exports.formatPromptListPersons = async (session, persons, field) => {
  // Prompt understandable object
  const personsToDisplay = {};
  if (field === 'id_employee') {
    for (const k in persons) {
      if (persons[k].id_employee != session.userData.alenvi.employee_id) {
        personsToDisplay[`${persons[k].first_name} ${persons[k].last_name.substring(0, 1)}.`] = {};
        personsToDisplay[`${persons[k].first_name} ${persons[k].last_name.substring(0, 1)}.`].employee_id = persons[k].id_employee;
      }
    }
  } else if (field === 'id_customer') {
    for (const k in persons) {
      if (persons[k].first_name) {
        personsToDisplay[`${persons[k].first_name.substring(0, 1)}. ${persons[k].last_name}`] = {};
        personsToDisplay[`${persons[k].first_name.substring(0, 1)}. ${persons[k].last_name}`].customer_id = persons[k].id_customer;
      } else {
        personsToDisplay[`${persons[k].last_name}`] = {};
        personsToDisplay[`${persons[k].last_name}`].customer_id = persons[k].id_customer;
      }
    }
    personsToDisplay.Autre = {};
    personsToDisplay.Autre.customer_id = 0;
  }
  return personsToDisplay;
};

// =========================================================
// Community planning
// =========================================================

const getCommunityWorkingHoursByDay = async (session, dayChosen) => {
  const myTeam = await getTeamBySector(session, session.userData.alenvi.sector);
  const lengthTeam = Object.keys(myTeam).length;
  const workingHours = {};
  // For all people in my team, get their planning, then return it as an object well formated
  for (const i in myTeam) {
    // Check errors in bot's session
    if (myTeam[i].id_employee == session.userData.alenvi.employee_id && lengthTeam === 1) {
      return session.endDialog('Il semble que tu sois le premier membre de ta communauté ! :)');
    }
    if (myTeam[i].id_employee != session.userData.alenvi.employee_id) {
      const employeeId = myTeam[i].id_employee;
      // Get all interventions for an employee
      const employeePlanningByDayRaw = await services.getServicesByEmployeeIdAndDate(
        session.userData.ogust.tokenConfig.token,
        employeeId, dayChosen, { nbPerPage: 20, pageNum: 1 });
      const employeePlanningByDay = employeePlanningByDayRaw.body.array_service.result;
      // Create the object to return
      if (employeePlanningByDay) {
        workingHours[employeeId] = {};
        workingHours[employeeId]['interventions'] = [];
        workingHours[employeeId].title = myTeam[i].title;
        workingHours[employeeId].first_name = myTeam[i].first_name;
        workingHours[employeeId].last_name = myTeam[i].last_name;
        for (const j in employeePlanningByDay) {
          const interv = {
            start_date: moment.tz(employeePlanningByDay[j].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm'),
            end_date: moment.tz(employeePlanningByDay[j].end_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm')
          };
          workingHours[employeeId]['interventions'].push(interv);
          // Use Lodash sortBy() to sort easily
          let sortedWorkingHours = _.sortBy(workingHours[employeeId]['interventions'], 'start_date');
          workingHours[employeeId]['interventions'] = sortedWorkingHours;
        }
      }
    }
  }
  return workingHours;
};

const formatCommunityWorkingHours = async (workingHours) => {
  const planningToDisplay = [];
  for (const k in workingHours) {
    const obj = workingHours[k];
    let planningToAdd = `${obj.first_name} ${obj.last_name}:  \n`;
    for (let i = 0; i < obj.interventions.length; i++) {
      console.log(obj.interventions[i]);
      if (obj.interventions[i].start_date && obj.interventions[i].end_date) {
        planningToAdd += `${obj.interventions[i].start_date} - ${obj.interventions[i].end_date}  \n`;
      }
    }
    planningToDisplay.push(planningToAdd);
  }
  return planningToDisplay.join('  \n');
};

exports.getCommunityPlanningByChosenDay = async (session, results) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
    const workingHoursRaw = await getCommunityWorkingHoursByDay(session, dayChosen);
    if (Object.keys(workingHoursRaw).length === 0) {
      return session.endDialog('Aucune intervention de prévue ce jour-là ! :)');
    }
    const workingHoursToDisplay = await formatCommunityWorkingHours(workingHoursRaw);
    session.send(`📅 Voici les créneaux horaires sur lesquels tes collègues travaillent le ${results.response.entity}  \n${workingHoursToDisplay}`);
    return session.endDialog();
  } catch (err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning  de la communauté :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

// =========================================================
// Generic helper for planning
// =========================================================

/*
** offset no param or 0 = get current week, assuming current = 0
** offset -X = all days from -X week before current one, assuming current = 0
** offset  X = get all days from +X week after current one, assuming current = 0
*/
exports.getDaysByWeekOffset = (offset = 0) => {
  const days = {};
  const currentDate = moment().tz('Europe/Paris');
  const weekStart = currentDate.clone().startOf('isoWeek');
  if (offset) {
    if (offset < 0) {
      weekStart.subtract(Math.abs(offset), 'week');
    }
    if (offset > 0) {
      weekStart.add(Math.abs(offset), 'week');
    }
  }
  // Add a 'Précédent' result to the object so it appears in first
  days['Précédent'] = {};
  // Add all days from a week, to then display it with the good format
  // Prompt understandable object
  for (let i = 0; i <= 6; i++) {
    // Add user format to prompt
    const dayUserFormat = moment(weekStart).add(i, 'days');
    days[dayUserFormat.format('DD/MM')] = {};
    // Add ogust format
    days[dayUserFormat.format('DD/MM')].dayOgustFormat = dayUserFormat.format('YYYYMMDD');
  }
  // add a 'Suivant' result to the object so it appears in last
  days.Suivant = {};
  return days;
};
