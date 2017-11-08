const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const getCardsAttachments = async (session, args) => {
  if (!args) {
    throw new Error('No personType and/or personChosen');
  }
  let employeeId = '';
  let customerId = '';
  let title;
  switch (args.personType) {
    case 'Self':
      employeeId = session.userData.alenvi.employee_id;
      title = 'Consulter mon planning';
      break;
    case 'Auxiliary':
      employeeId = args.personChosen.employee_id;
      title = 'Consulter son planning';
      break;
    case 'Customer':
      customerId = args.personChosen.customer_id;
      title = 'Consulter son planning';
  }
  const myCards = [];
  const url = `${process.env.WEBSITE_HOSTNAME}/calendar?id_customer=${customerId}&id_employee=${employeeId}&access_token=${session.userData.alenvi.token}`;
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
