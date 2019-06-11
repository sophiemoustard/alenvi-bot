const { checkToken } = require('../helpers/checkToken');
const { createUrlCards, displayCards } = require('../helpers/cards');

const displayAdministrative = async (session) => {
  await checkToken(session);
  const data = [
    { title: 'Infos personnelles', path: `auxiliaries/${session.userData._id}` },
    { title: 'Paye', path: 'auxiliaries/paye' },
    { title: 'Documents', path: 'auxiliaries/docs' },
    { title: 'Contrats', path: 'auxiliaries/contracts' },
  ];
  const cards = createUrlCards(session, data);
  displayCards(session, cards);
};

exports.displayAdministrative = [displayAdministrative];
