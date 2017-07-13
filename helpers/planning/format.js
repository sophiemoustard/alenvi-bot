const moment = require('moment-timezone');

moment.locale('fr');

const customers = require('../../models/Ogust/customers');
const employees = require('../../models/Ogust/employees');

// Get all services applied to a specific customer, and format it to display then
exports.formatServicesPerPeriod = async (session, sortedServicesByDate) => {
  const servicesToDisplay = [];
  let personRaw = {};
  let firstName = '';
  let lastName = '';
  let day = '';
  for (let i = 0; i < sortedServicesByDate.length; i++) {
    // For each date, get the customer title, firstname and lastname
    if (session.dialogData.personType == 'Customer') {
      personRaw = await employees.getEmployeeById(
        session.userData.ogust.tokenConfig.token,
        sortedServicesByDate[i].id_employee,
        { nbPerPage: 1, pageNum: 1 });
      firstName = personRaw.body.employee.first_name ? `${personRaw.body.employee.first_name} ` : '';
      lastName = `${personRaw.body.employee.last_name.substring(0, 1)}. `;
    } else {
      personRaw = await customers.getCustomerByCustomerId(
        session.userData.ogust.tokenConfig.token,
        sortedServicesByDate[i].id_customer,
        { nbPerPage: 1, pageNum: 1 });
      firstName = personRaw.body.customer.first_name ? `${personRaw.body.customer.first_name.substring(0, 1)}. ` : '';
      lastName = personRaw.body.customer.last_name;
    }
    // Then push all the interventions well displayed (without carriage return yet)
    if (session.dialogData.periodChosen.name == 'PerWeek' || session.dialogData.periodChosen.name == 'PerMonth') {
      if (i > 0 && (moment.tz(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('DD/MM') != moment.tz(sortedServicesByDate[i - 1].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('DD/MM'))) {
        day = `${moment.tz(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('DD/MM')}:  \n`;
      } else if (i == 0) {
        day = `${moment.tz(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('DD/MM')}:  \n`;
      } else {
        day = '';
      }
    }
    const startHour = moment.tz(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const endHour = moment.tz(sortedServicesByDate[i].end_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    servicesToDisplay.push(`${day}${firstName}${lastName}: ${startHour} - ${endHour}  `); // ${personRaw.body.customer.title}.
  }
  // Return all services to display the carriage return
  return servicesToDisplay.join('  \n');
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
    // personsToDisplay.Autre = {};
    // personsToDisplay.Autre.customer_id = 0;
  }
  return personsToDisplay;
};

// =========================================================
// Community planning
// =========================================================

exports.formatCommunityWorkingHours = async (workingHours) => {
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

exports.formatPeriodPrompt = (periodStart, periodChosen) => {
  const period = {};
  // Add a 'Précédent' result to the object so it appears in first
  period.Précédent = {};
  // Add all days from a week, to then display it with the good format
  // Prompt understandable object
  if (periodChosen.name == 'PerDay') {
    for (let i = 0; i <= 6; i++) {
      const dayFormat = moment(periodStart).add(i, 'days');
      period[dayFormat.format('DD/MM')] = {};
      period[dayFormat.format('DD/MM')].dayOgustStartFormat = dayFormat.format('YYYYMMDD');
      period[dayFormat.format('DD/MM')].dayOgustEndFormat = dayFormat.endOf('day').format('YYYYMMDD');
    }
  } else if (periodChosen.name == 'PerWeek') {
    for (let i = 0; i <= 6; i++) {
      // Add user format to prompt
      const weekFormat = moment(periodStart).add(i, 'weeks');
      period[`Semaine du ${weekFormat.format('DD/MM')}`] = {};
      // Add ogust format
      period[`Semaine du ${weekFormat.format('DD/MM')}`].dayOgustStartFormat = weekFormat.format('YYYYMMDD');
      period[`Semaine du ${weekFormat.format('DD/MM')}`].dayOgustEndFormat = weekFormat.endOf('week').format('YYYYMMDD');
    }
  } else {
    for (let i = 0; i <= 6; i++) {
      // Add user format to prompt
      const monthFormat = moment(periodStart).add(i, 'months');
      period[monthFormat.format('MMM YYYY')] = {};
      // Add ogust format
      period[monthFormat.format('MMM YYYY')].dayOgustStartFormat = monthFormat.format('YYYYMMDD');
      period[monthFormat.format('MMM YYYY')].dayOgustEndFormat = monthFormat.endOf('month').format('YYYYMMDD');
    }
  }
  // add a 'Suivant' result to the object so it appears in last
  period.Suivant = {};
  return period;
};
