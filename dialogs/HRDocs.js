const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

// =========================================================
// HR documents dialog
// =========================================================

const getCardsAttachments = (session) => {
  return [
    new builder.HeroCard(session)
      .title(`Conditions de remboursement de mutuelle`)
      .buttons([
        builder.CardAction.openUrl(session, 'https://drive.google.com/file/d/0B9x9rvBHVX1TTWlPbHpFZlpUVzQ/view?usp=sharing', 'Visionner')
      ]),
    new builder.HeroCard(session)
      .title(`Accord d'intéressement`)
      .buttons([
        builder.CardAction.openUrl(session, 'https://drive.google.com/open?id=0B3bqjy-Bj6OHeUxoN2RTVmlOUVk', 'Visionner')
      ]),
    new builder.HeroCard(session)
      .title('Plan d’épargne entreprise')
      .buttons([
        builder.CardAction.openUrl(session, 'https://drive.google.com/open?id=0B3CkiGZsxsSpQ0cwYjlMMk9KeWs', 'Visionner')
      ]),
    new builder.HeroCard(session)
      .title('Convention collective des services à la personne')
      .buttons([
        builder.CardAction.openUrl(session, 'https://drive.google.com/open?id=0B3bqjy-Bj6OHeWx5RVZLYjM5eGM', 'Visionner')
      ]),
    new builder.HeroCard(session)
      .title('Evaluation des risques professionnels')
      .buttons([
        builder.CardAction.openUrl(session, 'https://drive.google.com/drive/folders/0B9x9rvBHVX1TQ2VVZ3cxb0ZsYVE', 'Visionner')
      ]),
    new builder.HeroCard(session)
      .title("Protocole d'accord pré électoral élections CSE")
      .buttons([
        builder.CardAction.openUrl(session, 'https://drive.google.com/open?id=1coedSMEz9WrQYgQdW5zpCu6ZsNP8hABU', 'Visionner')
      ])
  ];
};

const showHRDocs = async (session) => {
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
    return session.endDialog("Arf, je n'ai pas réussi à récupérer les documents :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showHRDocs = [showHRDocs];
