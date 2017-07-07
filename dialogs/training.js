const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

const getVideoCardsAttachments = (session) => {
  return [
    new builder.VideoCard(session)
      .title('Vidéo 1: les mémoires')
      .media([{
        url: 'https://vimeo.com/215223686/364e45ed62'
      }])
      .buttons([
        builder.cardAction.openUrl(session, 'https://docs.google.com/forms/d/e/1FAIpQLSdeT6GLIVdubFYW7yoxAtVyVd7YFYNzmcm4xXuO4AI2d5AjZg/viewform', 'Questionnaire')
      ]),
    new builder.VideoCard(session)
      .title('Vidéo 2: les mémoires')
      .media([{
        url: 'https://vimeo.com/218619824/d93a7eb05d'
      }])
      .buttons([
        builder.cardAction.openUrl(session, 'https://docs.google.com/forms/d/1sQAgxb77CbGzlkUXEH3q3qQ8IqPQkK-Y59am9BET56w/viewform', 'Questionnaire')
      ]),
    new builder.VideoCard(session)
      .title('Vidéo 3: les fonction exécutives')
      .media([{
        url: 'https://vimeo.com/220545373/f66d08e99a'
      }])
      .buttons([
        builder.cardAction.openUrl(session, 'https://docs.google.com/forms/d/e/1FAIpQLSeXyQCzme8BbuiQh6Vj67lpwbreAgbSPZ0z6kysaSc-QfCVjA/viewform', 'Questionnaire')
      ]),
    new builder.VideoCard(session)
      .title('Vidéo 4: les fonctions instrumentales')
      .media([{
        url: 'https://vimeo.com/222328774/4f611bf120'
      }])
      .buttons([
        builder.cardAction.openUrl(session, 'https://docs.google.com/forms/d/e/1FAIpQLSfBUaeevc7cz0nff10YADPrPzyT0hZLIdq4MmcQO4ROsaiMlw/viewform', 'Questionnaire')
      ]),
    new builder.VideoCard(session)
      .title("Vidéo 5: la maladie d'Alzheimer")
      .media([{
        url: 'https://vimeo.com/223966961/a1e7a13ba6'
      }])
      .buttons([
        builder.cardAction.openUrl(session, 'https://docs.google.com/forms/d/e/1FAIpQLSehlb_89ZxiiRettko1kwLS2088Ovoo2eIarZN83-K30pQSNQ/viewform', 'Questionnaire')
      ]),
  ];
};

const showTrainingVideosCards = async(session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const cards = await getVideoCardsAttachments(session);
    const message = new builder.Message(session)
          .attachmentLayout(builder.AttachmentLayout.carousel)
          .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Arf, je n'ai pas réussi à récupérer les documents :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.training = [showTrainingVideosCards];
