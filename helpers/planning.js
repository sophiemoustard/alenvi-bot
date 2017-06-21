const moment = require('moment');
const _ = require('lodash');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const employee = require('../Ogust/employees');
const services = require('../Ogust/services');
const customers = require('../Ogust/customers');

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
    if (getCustomer.body.status === 'KO') {
      throw new Error(`Error while getting customers: ${getCustomer.body.message}`);
    }
    // Then push all the interventions well displayed (without carriage return yet)
    const startDate = moment(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm').format('HH:mm');
    const endDate = moment(sortedServicesByDate[i].end_date, 'YYYYMMDDHHmm').format('HH:mm');
    const firstName = getCustomer.body.customer.first_name ? `${getCustomer.body.customer.first_name.substring(0, 1)} ` : '';
    servicesToDisplay.push(`${getCustomer.body.customer.title}. ${firstName}${getCustomer.body.customer.last_name}: ${startDate} - ${endDate}`);
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
    if (getServices.body.status === 'KO') {
      throw new Error(`Error while getting services: ${getServices.body.message}`);
    }
    if (Object.keys(getServicesResult).length === 0) {
      return session.endDialog('Aucune intervention ce jour-là ! :)');
    }
    const sortedServicesByDate = await fillAndSortArrByStartDate(getServicesResult);
    const servicesToDisplay = await getServicesToDisplay(session, sortedServicesByDate);
    session.send(`Interventions le ${results.response.entity}:  \n${servicesToDisplay}`);
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

const getTeamBySector = exports.getTeamBySector = async (session) => {
  const getTeam = await employee.getEmployeesBySector(
    session.userData.ogust.tokenConfig.token,
    session.userData.alenvi.sector, { nbPerPage: 20, pageNum: 1 });
  if (getTeam.body.status === 'KO') {
    throw new Error(`Error while getting employees by sector: ${getTeam.body.message}`);
  }
  const getTeamResult = getTeam.body.array_employee.result;
  if (Object.keys(getTeamResult).length === 0) {
    return session.endDialog('Il semble que tu sois le pillier de ta communauté ! :)');
  }
  return getTeamResult;
};

const getWorkHoursByDay = async (session, dayChosen) => {
  const myTeam = await getTeamBySector(session);
  const lengthTeam = Object.keys(myTeam).length;
  const workingHours = {};
  // For all people in my team, get their planning, then return it as an object well formated
  for (const i in myTeam) {
    if (myTeam[i].id_employee == session.userData.alenvi.employee_id && lengthTeam === 1) {
      return session.endDialog('Il semble que tu sois le premier membre de ta communauté ! :)');
    }
    if (myTeam[i].id_employee != session.userData.alenvi.employee_id) {
      const employeeId = myTeam[i].id_employee;
      const getEmployeePlanningByDay = await services.getServicesByEmployeeIdAndDate(
        session.userData.ogust.tokenConfig.token,
        employeeId, dayChosen, { nbPerPage: 20, pageNum: 1 });
      if (getEmployeePlanningByDay.body.status === 'KO') {
        throw new Error(`Error while getting employee planning by day: ${getEmployeePlanningByDay.body.message}`);
      }
      const employeePlanningResult = getEmployeePlanningByDay.body.array_service.result;
      if (employeePlanningResult) {
        for (const j in employeePlanningResult) {
          if (!workingHours[employeeId]) {
            workingHours[employeeId] = {};
          }
          workingHours[employeeId][j] = {};
          workingHours[employeeId][j].start_date = moment(employeePlanningResult[j].start_date, 'YYYYMMDDHHmm').format('HH:mm');
          workingHours[employeeId][j].end_date = moment(employeePlanningResult[j].end_date, 'YYYYMMDDHHmm').format('HH:mm');
          workingHours[employeeId].title = myTeam[i].title;
          workingHours[employeeId].first_name = myTeam[i].first_name;
          workingHours[employeeId].last_name = myTeam[i].last_name;
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
    for (const indexService in obj) {
      if (obj[indexService].start_date && obj[indexService].end_date) {
        planningToAdd += `${obj[indexService].start_date} - ${obj[indexService].end_date}  \n`;
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
    const workingHoursRaw = await getWorkHoursByDay(session, dayChosen);
    if (Object.keys(workingHoursRaw).length === 0) {
      return session.endDialog('Aucune intervention de prévue ce jour-là ! :)');
    }
    const workingHoursToDisplay = await formatCommunityWorkingHours(workingHoursRaw);
    session.send(`Voici les créneaux horaires sur lesques tes collègues travaillent le ${results.response.entity}:  \n${workingHoursToDisplay}`);
    return session.endDialog();
  } catch (err) {
    console.error(err);
    return session.endDialog("Zut, je n'ai pas réussi à récupérer le planning  de la communauté :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

// =========================================================
// Generic helper for planning
// =========================================================

exports.getCustomers = async (session) => {
  // First we get services from Ogust by employee Id in a specific range
  // 249180689 || session.userData.alenvi.employee_id
  const servicesInFourWeeks = await services.getServicesByEmployeeIdInRange(
    session.userData.ogust.tokenConfig.token,
    session.userData.alenvi.employee_id,
    { slotToSub: 2, slotToAdd: 2, intervalType: 'week' },
    { nbPerPage: 500, pageNum: 1 }
  );
  if (servicesInFourWeeks.body.status === 'KO') {
    throw new Error(`Error while getting services in four weeks: ${servicesInFourWeeks.body.message}`);
  }
  // Put it in a variable so it's more readable
  const servicesRawObj = servicesInFourWeeks.body.array_service.result;
  if (Object.keys(servicesRawObj).length === 0) {
    return session.endDialog("Il semble que tu n'aies aucune intervention de prévue d'ici 2 semaines !");
  }
  // Transform this services object into an array, then pop all duplicates by id_customer
  const servicesUniqCustomers = _.uniqBy(_.values(servicesRawObj), 'id_customer');
  // Get only id_customer properties (without '0' id_customer)
  const uniqCustomers = servicesUniqCustomers.filter(
    (service) => {
      if (service.id_customer != 0 && service.id_customer != '271395715' && service.id_customer != '244566438' && service.id_customer != '286871430') {
        // Not Reunion Alenvi please
        return service;
      }
    }
  ).map(service => service.id_customer); // Put it in array of id_customer
  const myRawCustomers = [];
  for (let i = 0; i < uniqCustomers.length; i++) {
    const getCustomer = await customers.getCustomerByCustomerId(
      session.userData.ogust.tokenConfig.token,
      uniqCustomers[i],
      { nbPerPage: 20, pageNum: 1 });
    if (getCustomer.body.status === 'KO') {
      throw new Error(`Error while getting customers: ${getCustomer.body.message}`);
    }
    myRawCustomers.push(getCustomer.body.customer);
  }
  return myRawCustomers;
};

/*
** getDaysByWeekOffset(-X); : -X = all days from -X week before current one, assuming current = 0
** getDaysByWeekOffset([0]); : no param or 0, get current week, assuming current = 0
** getDaysByWeekOffset(X); : X = get all days from +X week after current one, assuming current = 0
*/
exports.getDaysByWeekOffset = (offset = 0) => {
  const days = {};
  const currentDate = moment();
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
