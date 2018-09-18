const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const getCardsAttachments = async (session) => {
  const url = `${process.env.WEBSITE_HOSTNAME}/dashboard/rh/auxiliary/${session.userData.alenvi._id}?&access_token=${session.userData.alenvi.token}`;
  const myCards = [];
  myCards.push(
    new builder.HeroCard(session)
      .title('Mes informations personnelles')
      .buttons([
        builder.CardAction.openUrl(session, url, 'Mettre à jour')
      ])
  );
  return myCards;
};

const displayMyInfo = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const cards = await getCardsAttachments(session);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Je n'ai pas réussi à récupérer tes informations personnelles :/");
  }
};

exports.displayMyInfo = [displayMyInfo];
