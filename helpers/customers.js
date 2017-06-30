const _ = require('lodash');

const services = require('../models/Ogust/services');
const customers = require('../models/Ogust/customers');

exports.getCustomers = async (session, id) => {
  // First we get services from Ogust by employee Id in a specific range
  // 249180689 || session.userData.alenvi.employee_id
  const servicesInFourWeeks = await services.getServicesByEmployeeIdInRange(
    session.userData.ogust.tokenConfig.token, id,
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
      if (service.id_customer != 0 && service.id_customer != '271395715'
      && service.id_customer != '244566438' && service.id_customer != '286871430') {
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
