const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const { getNewsAlenvi } = require('../helpers/getNewsAlenvi');

const showNewsAlenvi = async (session) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    const newsAlenvi = await getNewsAlenvi();
    if (newsAlenvi.length === 0) {
      throw new Error('No files found');
    } else {
      const newsCards = [];
      for (let i = 0, l = newsAlenvi.length; i < l; i++) {
        let link = newsAlenvi[i].webViewLink;
        link = link.replace(/(.+\/view)\?.+/, '$1');
        const card = new builder.HeroCard(session)
          .title(newsAlenvi[i].name)
          .buttons([
            builder.CardAction.openUrl(session, link, 'Visionner')
          ]);
        newsCards.push(card);
      }
      const message = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(newsCards);
      session.endDialog(message);
    }
  } catch (err) {
    console.log(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer le contenu :/ Si le problème persiste, n'hésite pas à contacter l'équipe technique !");
  }
};

exports.showNewsAlenvi = [showNewsAlenvi];
