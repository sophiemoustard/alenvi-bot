const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const { getTeamBySector } = require('../helpers/team');

const formatPerson = async (coworker) => {
  let person = {};
  if (!coworker.first_name) {
    person = coworker.last_name;
  } else {
    person = `${coworker.first_name} ${coworker.last_name}`;
  }
  return person;
};

const getCardsAttachments = async (session) => {
  const myCards = [];
  const myRawTeam = await getTeamBySector(session, session.userData.alenvi.sector);
  const lengthTeam = Object.keys(myRawTeam).length;
  for (const k in myRawTeam) {
    if (myRawTeam[k].id_employee == session.userData.alenvi.employee_id && lengthTeam === 1) {
      return session.endDialog('Il semble que tu sois le premier membre de ta communauté ! :)');
    }
    if (myRawTeam[k].id_employee != session.userData.alenvi.employee_id) {
      const person = await formatPerson(myRawTeam[k]);
      const mobilePhone = myRawTeam[k].mobile_phone || 'N/A';
      const contact = `https://m.me/${myRawTeam[k].skype_id}`;
      const picture = myRawTeam[k].picture || 'https://cdn.head-fi.org/g/2283245_l.jpg';
      myCards.push(
        new builder.ThumbnailCard(session)
          .title(person)
          .text(mobilePhone)
          .images([
            builder.CardImage.create(session, picture)
          ])
          .buttons([
            builder.CardAction.openUrl(session, contact, 'Contacter')
          ])
      );
    }
  }
  return myCards;
};

const showMyTeam = async (session) => {
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
    return session.endDialog("Oh non, je n'ai pas réussi à récupérer ton équipe :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showTeam = [showMyTeam];
