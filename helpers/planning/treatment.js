const moment = require('moment-timezone');
const _ = require('lodash');

const employees = require('../../models/Ogust/employees');
const customers = require('../../models/Ogust/customers');

const { getTeamBySector } = require('../team');
const checkOgustToken = require('../checkOgustToken').checkToken;
const format = require('./format');

const fillAndSortArrByStartDate = async (getServiceResult) => {
  const sortedServicesByDate = _.values(getServiceResult);
  await sortedServicesByDate.sort((service1, service2) => (
    service1.start_date - service2.start_date));
  return sortedServicesByDate;
};

const getCommunityWorkingHoursByDay = async (session, dateOgust) => {
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
      const employeePlanningByDayRaw = await employees.getServices(
        session.userData.ogust.tokenConfig.token,
        employeeId,
        'false', 'true', '', '', '',
        `${dateOgust.periodStart}0000`, `${dateOgust.periodEnd}2359`,
        '', '',
        { nbPerPage: 20, pageNum: 1 }
      );
      const employeePlanningByDay = employeePlanningByDayRaw.body.array_service.result;
      // Create the object to return
      if (employeePlanningByDay) {
        workingHours[employeeId] = {};
        workingHours[employeeId].interventions = [];
        workingHours[employeeId].title = myTeam[i].title;
        workingHours[employeeId].first_name = myTeam[i].first_name;
        workingHours[employeeId].last_name = myTeam[i].last_name;
        for (const j in employeePlanningByDay) {
          const interv = {
            start_date: moment.tz(employeePlanningByDay[j].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm'),
            end_date: moment.tz(employeePlanningByDay[j].end_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm')
          };
          workingHours[employeeId].interventions.push(interv);
          // Use Lodash sortBy() to sort easily
          const sortedWorkingHours = _.sortBy(workingHours[employeeId].interventions, 'start_date');
          workingHours[employeeId].interventions = sortedWorkingHours;
        }
      }
    }
  }
  return workingHours;
};

// =========================================================
// Generic get planning
// =========================================================
exports.getPlanningByPeriodChosen = async (session, results) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    let servicesRaw = {};
    let servicesToDisplay = {};
    let communityWorkingHoursRaw = {};
    const dateOgust = {};
    dateOgust.periodStart = session.dialogData.periodUnit[results.response.entity].dayOgustStartFormat;
    dateOgust.periodEnd = session.dialogData.periodUnit[results.response.entity].dayOgustEndFormat;
    // Get all services of an employee by day the user chose from prompt
    // employee_id = 249180689 for testing (Aurélie) or session.userData.alenvi.employee_id in prod
    if (session.dialogData.personType == 'Customer') {
      servicesRaw = await customers.getServices(
        session.userData.ogust.tokenConfig.token,
        session.dialogData.personChosen.customer_id,
        'false', 'true', '', '', '',
        `${dateOgust.periodStart}0000`, `${dateOgust.periodEnd}2359`,
        '', '',
        { nbPerPage: 100, pageNum: 1 }
      );
    } else if (session.dialogData.personType == 'Self') {
      servicesRaw = await employees.getServices(
        session.userData.ogust.tokenConfig.token,
        session.userData.alenvi.employee_id,
        'false', 'true', '', '', '',
        `${dateOgust.periodStart}0000`, `${dateOgust.periodEnd}2359`,
        '', '',
        { nbPerPage: 100, pageNum: 1 }
      );
    } else if (session.dialogData.personType == 'Auxiliary') {
      servicesRaw = await employees.getServices(
        session.userData.ogust.tokenConfig.token,
        session.dialogData.personChosen.employee_id,
        'false', 'true', '', '', '',
        `${dateOgust.periodStart}0000`, `${dateOgust.periodEnd}2359`,
        '', '',
        { nbPerPage: 100, pageNum: 1 }
      );
    } else if (session.dialogData.personType == 'Community') {
      communityWorkingHoursRaw = await getCommunityWorkingHoursByDay(session, dateOgust);
      if (Object.keys(communityWorkingHoursRaw) === 0) {
        return session.endDialog('Aucune intervention ce jour-là ! :)');
      }
    }
    if (session.dialogData.personType == 'Self' || session.dialogData.personType == 'Auxiliary' || session.dialogData.personType == 'Customer') {
      const servicesUnsorted = servicesRaw.body.data.servicesRaw.array_service.result;
      if (Object.keys(servicesUnsorted).length === 0) {
        return session.endDialog('Aucune intervention ce jour-là ! :)');
      }
      const servicesSorted = await fillAndSortArrByStartDate(servicesUnsorted);
      servicesToDisplay = await format.formatServicesPerPeriod(session, servicesSorted);
    }
    if (session.dialogData.personType == 'Self') {
      session.send(`📅 Interventions le ${results.response.entity}  \n${servicesToDisplay}`);
    } else if (session.dialogData.personType == 'Customer') {
      const person = await customers.getCustomerByCustomerId(session.userData.ogust.tokenConfig.token, session.dialogData.personChosen.customer_id, { nbPerPage: 1, pageNum: 1 });
      session.send(`📅 Interventions chez ${person.body.data.user.customer.title} ${person.body.data.user.customer.last_name} - ${results.response.entity}  \n${servicesToDisplay}`);
    } else if (session.dialogData.personType == 'Auxiliary') {
      const person = await employees.getEmployeeById(session.userData.ogust.tokenConfig.token, session.dialogData.personChosen.employee_id, { nbPerPage: 1, pageNum: 1 });
      session.send(`📅 Interventions de ${person.body.data.user.employee.first_name} - ${results.response.entity}  \n${servicesToDisplay}`);
    } else if (session.dialogData.personType == 'Community') {
      const workingHoursToDisplay = await format.formatCommunityWorkingHours(communityWorkingHoursRaw);
      session.send(`📅 Voici les créneaux horaires sur lesquels tes collègues travaillent le ${results.response.entity}  \n${workingHoursToDisplay}`);
    }
    return session.endDialog();
  } catch (err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

/*
** offset no param or 0 = get current period, assuming current = 0
** offset -X = all days from -X period before current one, assuming current = 0
** offset  X = get all days from +X week after current one, assuming current = 0
** periodChosen.name = 'PerDay', 'PerWeek', 'PerMonth'
** periodChosen.type = 'weeks', 'months' or 'days'
*/
exports.getPeriodByOffset = (offset = 0, periodChosen) => {
  const currentDate = moment().tz('Europe/Paris');
  let periodStart = {};
  if (periodChosen.name == 'PerDay') {
    periodStart = currentDate.clone().startOf('isoWeek');
  } else {
    periodStart = currentDate.clone().startOf(periodChosen.type);
  }
  if (offset) {
    if (offset < 0) {
      periodStart.subtract(Math.abs(offset), periodChosen.type);
    }
    if (offset > 0) {
      periodStart.add(Math.abs(offset), periodChosen.type);
    }
  }
  return format.formatPeriodPrompt(periodStart, periodChosen);
};
