require('dotenv').config();
const builder = require('botbuilder');
const rp = require('request-promise');
const moment = require('moment-timezone');
// const _ = require('lodash');
const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning');
const config = require('../config');

// const services = require('../Ogust/services');
// const customers = require('../Ogust/customers');

// =========================================================
// Root 'Select modify planning' dialog
// =========================================================

const whichDeclaration = async (session) => {
  await checkOgustToken(session);
  session.sendTyping();
  builder.Prompts.choice(session, 'Que souhaites-tu déclarer ?', 'Heures internes|Modif. intervention', { maxRetries: 0 });
};

const redirectToDeclarationSelected = (session, results) => {
  if (results.response) {
    console.log(results.response);
    if (session.userData.alenvi) {
      console.log(results.response);
      switch (results.response.entity) {
        case 'Heures internes':
          session.beginDialog('/ask_for_request');
          break;
        case 'Modif. intervention':
          session.beginDialog('/change_intervention');
          break;
      }
    } else {
      return session.endDialog('Tu dois te connecter pour accéder à cette fonctionnalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.select = [whichDeclaration, redirectToDeclarationSelected];

const whichCustomer = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const myRawCustomers = await planning.getCustomers(session);
    const myCustomersToDisplay = await planning.formatPromptListPersons(session, myRawCustomers, 'id_customer');
    builder.Prompts.choice(session, 'Quel(le) bénéficiaire précisément ?', myCustomersToDisplay, { listStyle: builder.ListStyle.button, maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Flûte, impossible de récupérer ta liste de bénéficiaires pour le moment :/ Réessaie, et si le problème persiste n'hésite pas à contacter l'équipe technique !");
  }
};

// =========================================================
// 'Request to coach' dialog
// =========================================================

const promptDescription = (session, args) => {
  session.sendTyping();
  args = args || {};
  if (args.response) { // Modif. Intervention: Bénéficiaire selected
    session.dialogData.selectedPerson = args.response.entity;
    builder.Prompts.text(session, `Décris-moi les modifications d'intervention que tu souhaites déclarer (jour, heure, tâche) concernant ${args.response.entity}  \nSi tu souhaites annuler ta demande, dis-moi 'annuler' ! ;)`);
  } else if (args.resumed) { // User writes anything not related
    session.cancelDialog(0, '/not_understand');
  } else { // Heures Internes
    builder.Prompts.text(session, "Décris-moi les heures internes que tu souhaites déclarer (jour, heure, tâche)  \nSi tu souhaites annuler ta demande, dis-moi 'annuler' ! ;)");
  }
};

const sendRequestToSlack = (payload) => {
  const options = {
    uri: 'https://slack.com/api/chat.postMessage',
    form: {
      token: process.env.SLACK_TOKEN,
      channel: process.env.NODE_ENV == 'development' ? config.Slack.channels['test'] : config.Slack.channels[payload.sector],
      attachments: JSON.stringify([
        {
          callback_id: 'request_processed',
          title: 'Demande:',
          text: payload.textToSend,
          fields: [
            {
              title: 'Auteur:',
              value: payload.author,
              short: true,
            },
            {
              title: 'Date requête:',
              value: payload.dateRequest,
              short: true,
            },
            {
              title: 'Concerné(e):',
              value: payload.target,
              short: true,
            },
            {
              title: 'Type:',
              value: payload.type,
              short: true,
            },
          ],
          // "actions": [
          //   {
          //     "name": "is_processed",
          //     "text": "Traité",
          //     "type": "button",
          //     "value": "done"
          //   }
          // ]
        },
      ]),
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  };
  return rp.post(options);
};

const handleRequest = async (session, results) => {
  try {
    if (results.response) {
      // User type "annuler"
      if (/^annuler|anuler$/i.test(results.response)) {
        session.sendTyping();
        session.send('Tu as bien annulé ta demande ! :)');
        // session.replaceDialog('/select_modify_planning');
        session.cancelDialog(0, '/hello');
      } else { // User well describe his request
        const options = {
          type: session.dialogData.selectedPerson ? 'Modif. Intervention' : 'Heures internes',
          author: `${session.userData.alenvi.firstname} ${session.userData.alenvi.lastname}`,
          dateRequest: moment().tz('Europe/Paris').format('DD/MM/YYYY, HH:mm'),
          textToSend: results.response,
          sector: session.userData.alenvi.sector,
          target: session.dialogData.selectedPerson ? session.dialogData.selectedPerson : (`${session.userData.alenvi.firstname} ${session.userData.alenvi.lastname}`),
        };
        const sent = await sendRequestToSlack(options);
        if (sent.ok === false) {
          throw new Error(sent);
        }
        session.endDialog('Ta demande a bien été envoyée, merci :)');
      }
    } else {
      session.endDialog("Je n'ai pas bien reçu ta demande :/");
    }
  } catch (err) {
    console.error(err);
    session.endDialog("Je n'ai pas réussi à envoyer ta demande aux coach, essaie encore stp :/");
  }
};

exports.changeIntervention = [whichCustomer, promptDescription, handleRequest];
exports.askForRequest = [promptDescription, handleRequest];

// var message = new builder.Message(session).sourceEvent({
//   slack: {
//     "channel": config.Slack.channels[sector], // "G5QLJ49KL",
//     "attachments": JSON.stringify([
//       {
//         "callback_id": "request_processed",
//         "title": "Demande:",
//         "text": textToSend,
//         "fields": [
//           {
//             "title": "Name",
//             "value": author,
//             "short": true
//           },
//           {
//             "title": "Date",
//             "value": date,
//             "short": true
//           }
//         ],
//         "actions": [
//           {
//             "name": "is_processed",
//             "text": "Traité",
//             "type": "button",
//             // "value": "done"
//           }
//         ]
//       }
//     ])
//   }
