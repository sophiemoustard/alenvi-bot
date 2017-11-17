require('dotenv').config();
const builder = require('botbuilder');
// const moment = require('moment-timezone');
// const _ = require('lodash');
const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const employees = require('../models/Ogust/employees');
const planningUpdates = require('../models/Alenvi/planningUpdates');
const planning = require('../helpers/planning/format');
// const slack = require('../models/Slack/planning');

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
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Heures internes':
          session.replaceDialog('/ask_for_request');
          break;
        case 'Modif. intervention':
          session.replaceDialog('/change_intervention');
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
    const myCustomersRaw = await employees.getCustomers(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id);
    const myCustomers = await planning.formatPromptListPersons(session, myCustomersRaw.body.data.customers, 'id_customer');
    builder.Prompts.choice(session, 'Quel(le) bénéficiaire précisément ?', myCustomers, { listStyle: builder.ListStyle.button, maxRetries: 0 });
  } catch (err) {
    console.error(err);
    if (err.statusCode === 404) {
      return session.endDialog("Il semble que tu n'aies pas de bénéficiaire pour le moment ! :)");
    }
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
          content: results.response,
          involved: session.dialogData.selectedPerson ? session.dialogData.selectedPerson : (`${session.userData.alenvi.firstname} ${session.userData.alenvi.lastname}`),
        };
        // await planningUpdates.sendRequestToSlack(options);
        await planningUpdates.storePlanningUpdate(session.userData.alenvi._id, session.userData.alenvi.token, options);
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
