const builder = require('botbuilder');
const _ = require('lodash');
const cloudinary = require('cloudinary');

const checkOgustToken = require('./../helpers/checkOgustToken').checkToken;
const { comVideosList } = require('./../models/Alenvi/Training/communication');
const { memVideosList } = require('./../models/Alenvi/Training/memory');
const cloudinaryConfig = require('../config').Cloudinary;

cloudinary.config(cloudinaryConfig);

const whichTrainingType = async (session, args, next) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    session.dialogData.trainingType = args.trainingType || '';
    switch (session.dialogData.trainingType) {
      case 'memory':
        session.dialogData.trainingTypeData = memVideosList;
        next();
        break;

      case 'com': {
        session.dialogData.trainingTypeData = comVideosList;
        // const comVideosListCategories = Object.keys(comVideosList.categories);
        builder.Prompts.choice(session, 'Quelle partie souhaites-tu consulter ?', 'Ecoute active', { maxRetries: 0 });
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
    if (results.response || session.dialogData.trainingType === 'memory') {
      if (session.dialogData.trainingType === 'com') {
        cards = session.dialogData.trainingTypeData.categories[_.snakeCase(results.response.entity)];
      } else {
        cards = session.dialogData.trainingTypeData;
      }
      for (let i = 0, l = cards.length; i < l; i++) {
        const buttonList = [];
        let showLink;
        if (cards[i].show_link) {
          //   buttonList.push(builder.CardAction.openUrl(session, cards[i].show_link, 'Visionner'));
          showLink = cards[i].show_link;
        }
        if (cards[i].script_link) {
          buttonList.push(builder.CardAction.openUrl(session, cards[i].script_link, 'Script'));
        }
        if (cards[i].questionnaire_link) {
          buttonList.push(builder.CardAction.openUrl(session, cards[i].questionnaire_link, 'Questionnaire'));
        }
        const image = cards[i].image_link || cloudinary.url('images/bot/Pigi.png');
        const card = new builder.HeroCard(session)
          .title(`${cards[i].number}. ${cards[i].title}`)
          .images([
            builder.CardImage.create(
              session,
              image
            )])
          .tap(builder.CardAction.openUrl(session, showLink))
          .buttons(buttonList);
        trainingCards.push(card);
      }
      const message = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(trainingCards);
      session.endDialog(message);
    } else {
      session.cancelDialog(0, '/not_understand');
    }
  } catch (err) {
    console.error(err);
    return session.endDialog("Arf, je n'ai pas réussi à récupérer les documents :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showTraining = [whichTrainingType, displayTrainingCards];
