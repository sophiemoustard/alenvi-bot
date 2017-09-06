const builder = require('botbuilder');
const jwt = require('jsonwebtoken');
const { tokenConfig } = require('./../config/config');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const getCardsAttachments = async (session) => {
  const myCards = [];
  const payload = {
    _id: session.userData.alenvi._id
  };
  const employeeId = session.userData.alenvi.employee_id;
  const accessToken = jwt.sign(payload, tokenConfig.secret, { expiresIn: tokenConfig.expiresIn });
  const url = `${process.env.WEBSITE_HOSTNAME}/calendar?id_person=${employeeId}&access_token=${accessToken}`;
  myCards.push(
    new builder.HeroCard(session)
      .title('Consulter mon planning')
      .buttons([
        builder.CardAction.openUrl(session, url, '📅  Consulter')
      ])
  );
  return myCards;
};

const displayCalendar = async (session) => {
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
    return session.endDialog("Je n'ai pas réussi à récupérer ton planning :/");
  }
};

exports.displayCalendar = [displayCalendar];
