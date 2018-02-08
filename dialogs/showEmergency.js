const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const users = require('./../models/Alenvi/users');

const whichEmergency = async (session) => {
  session.sendTyping();
  builder.Prompts.choice(session, 'De quoi as-tu besoin ?', 'Doc d\'urgence|Contacter Permanent(s)', { listStyle: builder.ListStyle.button, maxRetries: 0 });
};

const showEmergency = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const msg = new builder.Message(session);
    msg
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments([
        new builder.HeroCard(session)
          .title("Situations d'urgence")
          .buttons([
            builder.CardAction.openUrl(session, 'https://drive.google.com/open?id=0B3bqjy-Bj6OHN1hzUkh4Zy1WNUk', 'Visionner')
          ])
      ]);
    session.endDialog(msg);
  } catch (err) {
    console.log(err);
    return session.endDialog("Arf, je n'ai pas réussi à récupérer le document :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const getCardsAttachments = async (session) => {
  const myCards = [];
  const usersConstrainedRaw = await users.getAlenviUsers(session.userData.alenvi.token, { isConstrained: true });
  const usersConstrained = usersConstrainedRaw.body.data.users;
  for (const k in usersConstrained) {
    const person = `${usersConstrained[k].firstname} ${usersConstrained[k].lastname}`;
    const mobilePhone = usersConstrained[k].mobilePhone || null;
    // const contact = `https://m.me/${usersConstrained[k].facebook.facebookId}`;
    const picture = usersConstrained[k].picture || 'https://cdn.head-fi.org/g/2283245_l.jpg';
    const buttons = [];
    if (mobilePhone) {
      buttons.push(builder.CardAction.openUrl(session, `tel:+33${mobilePhone}`, '📱 Contacter'));
    }
    myCards.push(
      new builder.ThumbnailCard(session)
        .title(person)
        .text(mobilePhone)
        .images([
          builder.CardImage.create(session, picture)
        ])
        .buttons(buttons)
    );
  }
  return myCards;
};

const showPermanentCoach = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const cards = await getCardsAttachments(session);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    return session.endDialog(message);
  } catch (e) {
    console.error(e);
    if (e.statusCode === '404') {
      return session.endDialog('Il n\'y a pas de coach de permanence ce week-end');
    }
    return session.endDialog("Je n'ai pas réussi à récupérer le coach de permanence :/ Si le problème persiste, essaie de contacter l'équipe technique !");
  }
};

const redirectToEmergencySelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Doc d\'urgence':
          showEmergency(session);
          break;
        case 'Contacter Permanent(s)':
          showPermanentCoach(session);
          break;
        default:
          break;
      }
    } else {
      session.endDialog('Vous devez vous connecter pour accéder à cette fonctionnalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.showEmergency = [whichEmergency, redirectToEmergencySelected];
