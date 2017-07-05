const moment = require('moment-timezone');
const _ = require('lodash');

const employee = require('../../models/Ogust/employees');
const services = require('../../models/Ogust/services');

const { getTeamBySector } = require('../team');
const checkOgustToken = require('../checkOgustToken').checkToken;
const format = require('./format');

const fillAndSortArrByStartDate = async (getServiceResult) => {
  const sortedServicesByDate = _.values(getServiceResult);
  await sortedServicesByDate.sort((service1, service2) => (
    service1.start_date - service2.start_date));
  return sortedServicesByDate;
};

// =========================================================
// Own planning + another auxiliary planning
// =========================================================

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
    const servicesToDisplay = await format.getServicesToDisplay(session, sortedServicesByDate);
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

// =========================================================
// Community auxiliary planning
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

exports.getCommunityPlanningByChosenDay = async (session, results) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const dayChosen = session.dialogData.days[results.response.entity].dayOgustFormat;
    const workingHoursRaw = await getCommunityWorkingHoursByDay(session, dayChosen);
    if (Object.keys(workingHoursRaw).length === 0) {
      return session.endDialog('Aucune intervention de prévue ce jour-là ! :)');
    }
    const workingHoursToDisplay = await format.formatCommunityWorkingHours(workingHoursRaw);
    session.send(`📅 Voici les créneaux horaires sur lesquels tes collègues travaillent le ${results.response.entity}  \n${workingHoursToDisplay}`);
    return session.endDialog();
  } catch (err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning  de la communauté :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

/*
** offset no param or 0 = get current period, assuming current = 0
** offset -X = all days from -X period before current one, assuming current = 0
** offset  X = get all days from +X week after current one, assuming current = 0
** type = 'weeks', 'months' or 'days'
*/
exports.getPeriodByOffset = (offset = 0, type = 'weeks') => {
  const currentDate = moment().tz('Europe/Paris');
  let periodStart = {};
  if (type == 'weeks') {
    periodStart = currentDate.clone().startOf('isoWeek');
  } else {
    periodStart = currentDate.clone().startOf(type);
  }
  if (offset) {
    if (offset < 0) {
      periodStart.subtract(Math.abs(offset), type);
    }
    if (offset > 0) {
      periodStart.add(Math.abs(offset), type);
    }
  }
  if (!type || type == 'days') {
    return format.formatDays(periodStart);
  } else if (type == 'weeks') {
    return format.formatDays(periodStart);
  }
  return format.formatMonths(periodStart);
};
