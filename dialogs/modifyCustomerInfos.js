const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const modifyCustomerInfos = async (session) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    const msg = new builder.Message(session);
    msg
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments([
        new builder.HeroCard(session)
          .title('Modification fiche')
          .buttons([
            builder.CardAction.openUrl(session, `${process.env.WEBSITE_HOSTNAME}/login.html`, 'Modification...')
          ])
      ]);
    session.endDialog(msg);
  } catch (err) {
    console.log(err);
    return session.endDialog("Arf, je n'ai pas réussi à récupérer le document :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.modifyCustomerInfos = [modifyCustomerInfos];
