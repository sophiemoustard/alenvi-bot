const moment = require('moment-timezone');

moment.locale('fr');

const customers = require('../../models/Ogust/customers');

// Get all services applied to a specific customer, and format it to display then
exports.getServicesToDisplay = async (session, sortedServicesByDate) => {
  const servicesToDisplay = [];
  for (let i = 0; i < sortedServicesByDate.length; i++) {
    // For each date, get the customer title, firstname and lastname
    const customerRaw = await customers.getCustomerByCustomerId(
      session.userData.ogust.tokenConfig.token,
      sortedServicesByDate[i].id_customer,
      { nbPerPage: 20, pageNum: 1 });
    // Then push all the interventions well displayed (without carriage return yet)
    const startDate = moment.tz(sortedServicesByDate[i].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const endDate = moment.tz(sortedServicesByDate[i].end_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const firstName = customerRaw.body.customer.first_name ? `${customerRaw.body.customer.first_name.substring(0, 1)}. ` : '';
    servicesToDisplay.push(`${firstName}${customerRaw.body.customer.last_name}: ${startDate} - ${endDate}  `); // ${customerRaw.body.customer.title}.
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

// exports.formatWeeks = (weekStart) => {
//   const weeks = {};
//   // Add a 'Précédent' result to the object so it appears in first
//   weeks['Précédent'] = {};
//   // Add all days from a week, to then display it with the good format
//   // Prompt understandable object
//   for (let i = 0; i <= 6; i++) {
//     // Add user format to prompt
//     const weekUserFormat = moment(weekStart).add(i, 'days');
//     days[dayUserFormat.format('DD/MM')] = {};
//     // Add ogust format
//     days[dayUserFormat.format('DD/MM')].dayOgustFormat = dayUserFormat.format('YYYYMMDD');
//   }
//   // add a 'Suivant' result to the object so it appears in last
//   days.Suivant = {};
//   return days;
// }

// exports.formatMonths = (weekStart) => {
//   const days = {};
//   // Add a 'Précédent' result to the object so it appears in first
//   days['Précédent'] = {};
//   // Add all days from a week, to then display it with the good format
//   // Prompt understandable object
//   for (let i = 0; i <= 6; i++) {
//     // Add user format to prompt
//     const dayUserFormat = moment(weekStart).add(i, 'days');
//     days[dayUserFormat.format('DD/MM')] = {};
//     // Add ogust format
//     days[dayUserFormat.format('DD/MM')].dayOgustFormat = dayUserFormat.format('YYYYMMDD');
//   }
//   // add a 'Suivant' result to the object so it appears in last
//   days.Suivant = {};
//   return days;
// }

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
      period[dayFormat.format('DD/MM')].dayOgustFormat = dayFormat.format('YYYYMMDD');
    }
  } else if (periodChosen.name == 'PerWeek') {
    for (let i = 0; i <= 6; i++) {
      // Add user format to prompt
      const weekFormat = moment(periodStart).add(i, 'weeks');
      period[`Semaine du ${weekFormat.format('DD/MM')}`] = {};
      // Add ogust format
      period[`Semaine du ${weekFormat.format('DD/MM')}`].dayOgustFormat = weekFormat.format('YYYYMMDD');
    }
  } else {
    for (let i = 0; i <= 6; i++) {
      // Add user format to prompt
      const monthFormat = moment(periodStart).add(i, 'months');
      period[monthFormat.format('MMM YYYY')] = {};
      // Add ogust format
      period[monthFormat.format('MMM YYYY')].dayOgustFormat = monthFormat.format('YYYYMMDD');
    }
  }
  // add a 'Suivant' result to the object so it appears in last
  period.Suivant = {};
  return period;
};
