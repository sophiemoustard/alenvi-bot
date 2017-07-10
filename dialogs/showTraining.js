const builder = require('botbuilder');
const _ = require('lodash');

const checkOgustToken = require('./../helpers/checkOgustToken').checkToken;
const { comVideosList } = require('./../models/Alenvi/Training/communication');
const { memVideosList } = require('./../models/Alenvi/Training/memory');

const whichTrainingType = async (session, args, next) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    session.dialogData.trainingType = args.trainingType || '';
    switch (session.dialogData.trainingType) {
      case 'memory':
        console.log(memVideosList);
        session.dialogData.trainingTypeData = memVideosList;
        next();
        break;

      case 'com': {
        session.dialogData.trainingTypeData = comVideosList;
        // const comVideosListCategories = Object.keys(comVideosList.categories);
        builder.Prompts.choice(session, 'Quelle partie souhaites-tu consulter ?', 'Ecoute active');
        break;
      }

      case '':
        throw new Error('trainingType argument is empty');
    }
  } catch (err) {
    console.error(err);
    return session.endDialog("Mince, je n'ai pas réussi à récupérer le contenu :/ Si le problème persiste, n'hésite pas à contacter l'équipe technique !");
  }
};

const displayTrainingCards = async (session, results) => {
  try {
    session.sendTyping();
    let cards;
    const trainingCards = [];
    if (results.response && session.dialogData.trainingType === 'com') {
      cards = session.dialogData.trainingTypeData.categories[_.snakeCase(results.response.entity)];
    } else {
      cards = session.dialogData.trainingTypeData;
    }
    for (let i = 0, l = cards.length; i < l; i++) {
      const buttonList = [];
      if (cards[i].show_link) {
        buttonList.push(builder.CardAction.openUrl(session, cards[i].show_link, 'Visionner'));
      }
      if (cards[i].script_link) {
        buttonList.push(builder.CardAction.openUrl(session, cards[i].script_link, 'Script'));
      }
      if (cards[i].questionnaire_link) {
        buttonList.push(builder.CardAction.openUrl(session, cards[i].questionnaire_link, 'Questionnaire'));
      }
      const card = new builder.HeroCard(session)
        .title(`${cards[i].number} - ${cards[i].title}`)
        .images([
          builder.CardImage.create(
            session,
            `${process.env.WEBSITE_HOSTNAME}/images/Pigi.png`
          )])
        .buttons(buttonList);
      trainingCards.push(card);
    }
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(trainingCards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    return session.endDialog("Arf, je n'ai pas réussi à récupérer les documents :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showTraining = [whichTrainingType, displayTrainingCards];
