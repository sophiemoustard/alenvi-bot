const builder = require('botbuilder');
const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const getCardsAttachments = async (session, args) => {
  if (!args) {
    throw new Error('No personType and/or personChosen');
  }
  const title = 'Consulter planning';
  let url = '';
  switch (args.personType) {
    case 'Auxiliary':
      url = `${process.env.WEBSITE_HOSTNAME}/auxiliaries/planning?auxiliary=true&self=true`;
      break;
    case 'Customer':
      url = `${process.env.WEBSITE_HOSTNAME}/auxiliaries/planning?customer=true`;
  }
  const myCards = [];
  myCards.push(
    new builder.HeroCard(session)
      .title(title)
      .buttons([
        builder.CardAction.openUrl(session, url, '📅  Consulter')
      ])
  );
  return myCards;
};

const displayCalendar = async (session, args) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const cards = await getCardsAttachments(session, args);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Je n'ai pas réussi à récupérer ton planning :/");
  }
};

exports.displayCalendar = [displayCalendar];
