const { checkToken } = require('../helpers/checkToken');
const { createUrlCards, displayCards } = require('../helpers/cards');

const displayCustomers = async (session) => {
  await checkToken(session);
  const data = [{ title: 'Fiches', path: 'auxiliaries/customers' }];
  const cards = createUrlCards(session, data);
  displayCards(session, cards);
};

exports.displayCustomers = [displayCustomers];
