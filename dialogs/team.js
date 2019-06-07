const { checkToken } = require('../helpers/checkToken');
const { createUrlCards, displayCards } = require('../helpers/cards');

const displayTeam = async (session) => {
  await checkToken(session);
  const data = [{ title: 'Répertoire', path: 'auxiliaries/team' }];
  const cards = createUrlCards(session, data);
  displayCards(session, cards);
};

exports.displayTeam = [displayTeam];
