const builder = require('botbuilder');
const later = require('later');
const { checkToken } = require('./checkOgustToken');

const getEndSignupCardAttachment = (session) => {
  const uri = `${process.env.WEBSITE_HOSTNAME}/signup/optionalDocuments`;
  return new builder.HeroCard(session)
    .title('Envoi documents optionels')
    .text('Merci de bien vouloir cliquer sur le lien pour envoyer tes justificatifs (facture téléphone, navigo, attestation sécu,...) :)')
    .images([
      builder.CardImage.create(session, 'https://res.cloudinary.com/alenvi/image/upload/v1499948101/images/bot/Pigi.png')
    ])
    .buttons([
      builder.CardAction.openUrl(session, uri, 'Clique ici')
    ]);
};

const showOptionalDocsCard = (session) => {
  session.sendTyping();
  const card = getEndSignupCardAttachment(session);
  const message = new builder.Message(session).addAttachment(card);
  session.send(message);
};

exports.optionalDocs = async (session, schedule) => {
  later.date.localTime();
  const sched = later.parse.text(schedule);
  return later.setInterval(async () => {
    await checkToken(session);
    showOptionalDocsCard(session);
  }, sched);
};
