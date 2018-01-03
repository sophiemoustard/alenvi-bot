require('dotenv').config();
const builder = require('botbuilder');
const moment = require('moment-timezone');
const _ = require('lodash');
const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const employees = require('../models/Ogust/employees');
const services = require('../models/Ogust/services');
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
    session.dialogData.myCustomers = myCustomers;
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

const getCardAttachments = async (session) => {
  const payload = {
    isDate: true,
    startDate: moment().subtract(1, 'day').tz('Europe/Paris').format('YYYYMMDDHHmm'),
    endDate: moment().add(10, 'days').tz('Europe/Paris').format('YYYYMMDDHHmm'),
    idCustomer: session.dialogData.myCustomers[session.dialogData.selectedPerson].customer_id
  };
  const myInterventionsRaw = await employees.getServices(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id, payload);
  const myInterventions = myInterventionsRaw.body.data.servicesRaw.array_service.result;
  if (Object.keys(myInterventions).length === 0) {
    return session.endDialog("Tu n'as pour le moment aucune intervention !");
  }
  const mySortedInterventions = _.sortBy(myInterventions, ['start_date']);
  const cards = [];
  for (const k in mySortedInterventions) {
    const startHour = moment.tz(mySortedInterventions[k].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const endHour = moment.tz(mySortedInterventions[k].end_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('HH:mm');
    const interventionInfo = {
      serviceId: mySortedInterventions[k].id_service,
      dayShort: moment.tz(mySortedInterventions[k].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('DD/MM'),
      day: moment.tz(mySortedInterventions[k].start_date, 'YYYYMMDDHHmm', 'Europe/Paris').format('DD/MM/YYYY'),
      customer: session.dialogData.selectedPerson
    };
    cards.push(
      new builder.HeroCard(session)
        .title(`${interventionInfo.dayShort}\n\n${startHour} - ${endHour}`)
        .buttons([
          builder.CardAction.dialogAction(session, 'setIntervention', JSON.stringify(interventionInfo), 'Modifier')
        ])
    );
  }
  return cards;
};

const whichIntervention = async (session, results) => {
  try {
    await checkOgustToken(session);
    session.sendTyping();
    if (results.response) {
      session.dialogData.selectedPerson = results.response.entity;
      const cards = await getCardAttachments(session);
      const message = new builder.Message(session)
        .text("Choisis l'intervention que tu souhaites modifier")
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
      // .suggestedActions(
      //   builder.SuggestedActions.create(session, [builder.CardAction.dialogAction(session, '', 'Autre intervention')])
      // );
      session.send(message);
      builder.Prompts.choice(session, "Si l'intervention que tu souhaites modifier n'apparaît pas, clique sur 'Autre intervention' :)", 'Autre intervention', { maxRetries: 0 });
    } else {
      session.cancelDialog(0, '/not_understand');
    }
  } catch (e) {
    return session.endDialog('Il y a eu un problème lors de la récupération de tes interventions! :/');
  }
};

const whichStartHour = (session, args, next) => {
  session.sendTyping();
  args = args || {};
  if (args.data || (session.privateConversationData.service && args.isReloaded)) {
    session.privateConversationData.service = session.privateConversationData.service || JSON.parse(args.data);
    builder.Prompts.time(session, "A quelle heure débute l'intervention ? (donne-moi l'heure au format hh:mm stp) \nSi tu souhaites recommencer, dis-moi 'recommencer'.\nPour annuler, dis-moi 'annuler'", { maxRetries: 1 });
  } else if (args.reprompt && args.hourInPast) { // when reprompt go to next step
    // session.privateConversationData.service = args.service;
    next();
  } else {
    session.endDialog('Il y a eu un problème lors de la modification de ton intervention. Essaie une nouvelle fois stp :/');
  }
};

const whichEndHour = (session, results) => {
  session.sendTyping();
  if (results.response) {
    session.privateConversationData.service.startHour = builder.EntityRecognizer.resolveTime([results.response]);
    builder.Prompts.time(session, "A quelle heure se termine l'intervention ? (donne-moi l'heure au format hh:mm stp)", { maxRetries: 1 });
  } else if (session.privateConversationData.service.endHour) { // endHour is set but invalid so we ask for it again
    builder.Prompts.time(session, "L'heure de fin d'intervention que tu m'as donnée n'est pas valide, peux-tu me la redonner ? (format hh:mm stp)", { maxRetries: 1 });
  } else {
    session.endDialog('Il y a eu un problème lors de la modification de ton intervention. Essaie une nouvelle fois stp :/');
  }
};

const promptDescription = (session, args) => {
  session.sendTyping();
  args = args || {};
  if (args.response) { // Modif. Intervention: Bénéficiaire selected
    session.dialogData.selectedPerson = args.response.entity === 'Autre intervention' ? session.dialogData.selectedPerson : args.response.entity;
    builder.Prompts.text(session, `Décris-moi les modifications d'intervention que tu souhaites déclarer (jour, heure, tâche) concernant ${session.dialogData.selectedPerson}  \nSi tu souhaites annuler ta demande, dis-moi 'annuler' ! ;)`);
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
      } else if (session.privateConversationData.service) { // request handled by Pigi
        session.sendTyping();
        session.privateConversationData.service.endHour = builder.EntityRecognizer.resolveTime([results.response]);
        if (moment(session.privateConversationData.service.endHour).isSameOrBefore(session.privateConversationData.service.startHour)) {
          return session.replaceDialog('/set_intervention', { reprompt: true, hourInPast: true });
        }
        const startHour = moment.tz(session.privateConversationData.service.startHour, 'Europe/Paris').format('HH:mm');
        const endHour = moment.tz(session.privateConversationData.service.endHour, 'Europe/Paris').format('HH:mm');
        console.log('START', startHour);
        console.log('END', endHour);
        const updateServiceParams = {
          startDate: moment.tz(`${session.privateConversationData.service.day}-${startHour}`, 'DD/MM/YYYY-HH:mm', true, 'Europe/Paris').format('YYYYMMDDHHmm'),
          endDate: moment.tz(`${session.privateConversationData.service.day}-${endHour}`, 'DD/MM/YYYY-HH:mm', true, 'Europe/Paris').format('YYYYMMDDHHmm')
        };
        const planningUpdateParams = {
          type: 'Modif. Intervention',
          content: `${session.privateConversationData.service.day}.\nIntervention chez ${session.privateConversationData.service.customer} de ${startHour} à ${endHour}`,
          involved: session.privateConversationData.service.customer,
          check: {
            isChecked: true,
            checkBy: process.env.ALENVI_BOT_ID
          }
        };
        await services.updateServiceById(session.userData.ogust.tokenConfig.token, session.privateConversationData.service.serviceId, updateServiceParams);
        await planningUpdates.storePlanningUpdate(session.userData.alenvi._id, session.userData.alenvi.token, planningUpdateParams);
        delete session.privateConversationData.service;
        session.endDialog('Ta demande a bien été prise en compte, merci :)');
      } else { // User well describe his request
        session.sendTyping();
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
    session.endDialog("Je n'ai pas réussi à envoyer ta demande aux coachs, essaie encore stp :/");
  }
};

exports.changeIntervention = [whichCustomer, whichIntervention, promptDescription, handleRequest];
exports.setIntervention = [whichStartHour, whichEndHour, handleRequest];
exports.askForRequest = [promptDescription, handleRequest];
