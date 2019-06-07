const builder = require('botbuilder');


exports.createUrlCards = (session, data) => {
  const baseUrl = `${process.env.WEBSITE_HOSTNAME}`;
  const myCards = [];
  for (const card of data) {
    myCards.push(
      new builder.HeroCard(session)
        .title(card.title)
        .buttons([builder.CardAction.openUrl(session, `${baseUrl}/${card.path}`, 'Consulter')])
    );
  }
  return myCards;
};

exports.displayCards = (session, cards) => {
  const message = new builder.Message(session)
    .attachmentLayout(builder.AttachmentLayout.carousel)
    .attachments(cards);
  session.endDialog(message);
};
