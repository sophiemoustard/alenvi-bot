const builder = require('botbuilder');
const rp = require('request-promise');
const moment = require('moment');
const _ = require('lodash');
const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning');
const config = require('../config');

const services = require('../Ogust/services');
const customers = require('../Ogust/customers');

// =========================================================
// Root 'Select modify planning' dialog
// =========================================================

const whichDeclaration = async (session) => {
  await checkOgustToken(session);
  session.sendTyping();
  builder.Prompts.choice(session, 'Que souhaites-tu déclarer ?', 'Heures internes|Intervention', { maxRetries: 0 });
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
        case 'Intervention':
          session.beginDialog('/show_customers');
          break;
      }
    } else {
      return session.endDialog('Tu dois te connecter pour accéder à cette fonctionnalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/hello');
  }
};

exports.select = [whichDeclaration, redirectToDeclarationSelected];

const getCustomers = async (session) => {
  // First we get services from Ogust by employee Id in a specific range
  // 249180689 || session.userData.alenvi.employee_id
  const servicesInFourWeeks = await services.getServicesByEmployeeIdInRange(session.userData.ogust.tokenConfig.token, 249180689, { slotToSub: 2, slotToAdd: 2, intervalType: 'week' }, { nbPerPage: 500, pageNum: 1 });
  if (servicesInFourWeeks.body.status === 'KO') {
    throw new Error(`Error while getting services in four weeks: ${servicesInFourWeeks.body.message}`);
  }
  // Put it in a variable so it's more readable
  const servicesRawObj = servicesInFourWeeks.body.array_service.result;
  if (Object.keys(servicesRawObj).length === 0) {
    return session.endDialog("Il semble que tu n'aies aucune intervention de prévue d'ici 2 semaines !");
  }
  // Transform this services object into an array, then pop all duplicates by id_customer
  const servicesUniqCustomers = _.uniqBy(_.values(servicesRawObj), 'id_customer');
  // Get only id_customer properties (without '0' id_customer)
  const uniqCustomers = servicesUniqCustomers.filter(
    (service) => {
      if (service.id_customer != 0 && service.id_customer != '271395715') { // Not Reunion Alenvi please
        return service;
      }
    }).map(service => service.id_customer); // Put it in array of id_customer
  const myRawCustomers = [];
  for (let i = 0; i < uniqCustomers.length; i++) {
    const getCustomer = await customers.getCustomerByCustomerId(
      session.userData.ogust.tokenConfig.token,
      uniqCustomers[i],
      { nbPerPage: 20, pageNum: 1 });
    if (getCustomer.body.status === 'KO') {
      throw new Error(`Error while getting customers: ${getCustomer.body.message}`);
    }
    myRawCustomers.push(getCustomer.body.customer);
  }
  const myCustomersToDisplay = await planning.formatPromptListPersons(session, myRawCustomers, 'id_customer');
  return myCustomersToDisplay;
};

const whichCustomer = async (session) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    const myCustomers = await getCustomers(session);
    builder.Prompts.choice(session, 'Quel(le) bénéficiaire précisément ?', myCustomers, { listStyle: builder.ListStyle.button, maxRetries: 0 });
  } catch (err) {
    console.error(err);
    return session.endDialog("Flute, impossible de récupérer ta liste de bénéficiaires pour le moment :/ Réessaie, et si le problème persiste n'hésite pas à contacter un administrateur !");
  }
};

// =========================================================
// 'Request to coach' dialog
// =========================================================

const promptDescription = (session, args) => {
  session.sendTyping();
  if (args.response) { // Modif. Intervention: Bénéficiaire selected
    session.dialogData.selectedPerson = args.response.entity;
    builder.Prompts.text(session, `Décris-moi les heures internes que tu souhaites déclarer (jour, heure, tâche) concernant ${args.response.entity}  \nSi tu souhaites annuler ta demande, dis-moi 'annuler' ! ;)`);
  } else if (args.resumed) { // User writes anything not related
    session.cancelDialog(0, '/hello');
  } else { // Heures Internes
    builder.Prompts.text(session, "Décris-moi les heures internes que tu souhaites déclarer (jour, heure, tâche)  \nSi tu souhaites annuler ta demande, dis-moi 'annuler' ! ;)");
  }
};

const sendRequestToSlack = (payload) => {
  const options = {
    uri: 'https://slack.com/api/chat.postMessage',
    form: {
      token: process.env.SLACK_TOKEN || config.Slack.TOKEN,
      channel: config.Slack.channels[payload.sector], // "G5QLJ49KL",
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
        session.replaceDialog('/select_modify_planning');
      } else { // User well describe his request
        const options = {
          type: session.dialogData.selectedPerson ? 'Modif. Intervention' : 'Heures internes',
          author: `${session.userData.alenvi.firstname} ${session.userData.alenvi.lastname}`,
          dateRequest: moment().format('DD/MM/YYYY, HH:mm'),
          textToSend: results.response,
          sector: session.userData.alenvi.sector,
          target: session.dialogData.selectedPerson ? session.dialogData.selectedPerson : (`${session.userData.alenvi.firstname} ${session.userData.alenvi.lastname}`),
        };
        const sent = await sendRequestToSlack(options);
        if (sent.ok === false) {
          throw new Error(sent);
        }
        session.endDialog('Ta demande a bien été envoyé, merci :)');
      }
    } else {
      session.endDialog("Je n'ai pas bien reçu ta demande :/");
    }
  } catch (err) {
    console.error(err);
    session.endDialog("Je n'ai pas réussis à envoyer ta demande aux coach, essaie encore stp :/");
  }
};

exports.showCustomers = [whichCustomer, promptDescription, handleRequest];
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
