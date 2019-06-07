const { checkToken } = require('../helpers/checkToken');
const { createUrlCards, displayCards } = require('../helpers/cards');

const displayPlanning = async (session) => {
  await checkToken(session);
  const data = [
    { title: 'Le Mien', path: 'auxiliaries/agenda' },
    { title: 'Auxiliaires', path: 'ni/planning/auxiliaries' },
    { title: 'Bénéficiaires', path: 'ni/planning/customers' },
  ];
  const cards = createUrlCards(session, data);
  displayCards(session, cards);
};

exports.displayPlanning = [displayPlanning];
