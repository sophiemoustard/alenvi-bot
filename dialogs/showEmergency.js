const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const showEmergency = async (session) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
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
    return session.endDialog("Arf, je n'ai pas réussi à récupérer le document :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showEmergency = [showEmergency];
