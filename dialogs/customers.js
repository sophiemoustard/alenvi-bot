const builder = require('botbuilder');
const _ = require('lodash');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const employees = require('./../models/Ogust/employees');
const customers = require('./../models/Ogust/customers');

const whichCustomers = async (session) => {
  session.sendTyping();
  await checkOgustToken(session);
  builder.Prompts.choice(session, 'Quelles fiches souhaites-tu consulter ?', 'Mes bénéficiaires|Bénéficiaires commu.', { maxRetries: 0 });
};

const redirectToDeclarationSelected = (session, results) => {
  if (results.response) {
    if (session.userData.alenvi) {
      switch (results.response.entity) {
        case 'Mes bénéficiaires':
          session.replaceDialog('/show_customers', { self: true });
          break;
        case 'Bénéficiaires commu.':
          session.replaceDialog('/show_customers', { self: false });
          break;
      }
    } else {
      return session.endDialog('Tu dois te connecter pour accéder à cette fonctionnalité ! :)');
    }
  } else {
    session.cancelDialog(0, '/not_understand');
  }
};

exports.whichCustomers = [whichCustomers, redirectToDeclarationSelected];

const formatPerson = async (customer) => {
  let person = {};
  if (!customer.first_name) {
    person = `${customer.title} ${customer.last_name}`;
  } else {
    person = `${customer.title} ${customer.first_name} ${customer.last_name}`;
  }
  return person;
};

const formatText = async (customer) => {
  const text = [];
  let textToDisplay = '';
  text.push(`${customer.main_address.line}`);
  text.push(`${customer.main_address.zip} ${customer.main_address.city}`);
  if (customer.door_code) {
    text.push(`🚪 ${customer.door_code}`);
  }
  if (customer.intercom_code) {
    text.push(`🔔 ${customer.intercom_code}`);
  }
  textToDisplay = text.join('  \n');
  return textToDisplay;
};

const getCardsAttachments = async (session, self) => {
  const myCards = [];
  let myRawCustomers = null;
  let myCustomers = null;
  if (self) {
    myRawCustomers = await employees.getCustomers(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id);
    myCustomers = myRawCustomers.body.data.customers;
  } else {
    myRawCustomers = await customers.getCustomers(session.userData.ogust.tokenConfig.token, { sector: session.userData.alenvi.sector });
    myCustomers = myRawCustomers.body.data.customers.array_customer.result;
  }
  const myFilteredCustomers = _.filter(myCustomers, customer => !customer.last_name.match(/^ALENVI/i));
  if (myFilteredCustomers.length === 0) throw new Error('No customers found');
  for (let i = 0, l = myFilteredCustomers.length; i < l; i++) {
    const encoded = encodeURI(`${myFilteredCustomers[i].main_address.line} ${myFilteredCustomers[i].main_address.zip}`);
    const person = await formatPerson(myFilteredCustomers[i]);
    const text = await formatText(myFilteredCustomers[i]);
    const uri = `${process.env.WEBSITE_HOSTNAME}/bot/editCustomerInfo?id_customer=${myFilteredCustomers[i].id_customer}&_id=${session.userData.alenvi._id}&access_token=${session.userData.alenvi.token}&address=${encodeURIComponent(JSON.stringify(session.message.address))}`;
    myCards.push(
      new builder.HeroCard(session)
        .title(person)
        .text(text)
        .images([
          builder.CardImage.create(session, `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=14&size=640x640&markers=${encoded}`)
        ])
        .tap(builder.CardAction.openUrl(session, `http://maps.google.fr/maps/place/${encoded}/`))
        .buttons([
          builder.CardAction.openUrl(session, uri, 'Consulter')
        ])
    );
  }
  return myCards;
};

exports.moreDetails = async (session, args) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    if (args.data) {
      const myRawCustomers = await employees.getCustomers(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id);
      const customerById = _.find(myRawCustomers.body.data.customers, customer => customer.id_customer === args.data);
      const uri = `${process.env.WEBSITE_HOSTNAME}/ni/${session.userData.alenvi._id}/customers/${customerById.id_customer}`;
      const msg = new builder.Message(session).sourceEvent({
        facebook: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              image_aspect_ratio: 'square',
              elements: [{
                title: 'Modification fiche',
                buttons: [{
                  type: 'web_url',
                  url: uri,
                  title: '📝  Modification',
                  webview_height_ratio: 'full',
                  webview_share_button: 'hide',
                  messenger_extensions: true
                }],
              }]
            }
          }
        }
      });
      session.endDialog(msg);
    } else {
      throw new Error('id_customer empty');
    }
  } catch (err) {
    console.error(err);
    return session.endDialog("Je n'ai pas réussi à récupérer plus de détails :/");
  }
};

const showCustomers = async (session, args) => {
  try {
    session.sendTyping();
    await checkOgustToken(session);
    args = args || {};
    const cards = Object.prototype.hasOwnProperty.call(args, 'self') ? await getCardsAttachments(session, args.self) : await getCardsAttachments(session, true);
    const message = new builder.Message(session)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(cards);
    session.endDialog(message);
  } catch (err) {
    console.error(err);
    if (err.statusCode === 404) {
      return session.endDialog("Il semble que tu n'aies aucune intervention de prévues d'ici 2 semaines !");
    }
    return session.endDialog("Oh non, je n'ai pas réussi à récupérer tes bénéficiaires :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showCustomers = [showCustomers];

// SHARE LOCATION => IT WORKS !
// const message = new builder.Message(session).sourceEvent({
//   facebook: {
//     text: 'Partage ton emplacement:',
//     quick_replies: [
//       {
//         content_type: 'location'
//       }
//     ]
//   },
// });
// session.endDialog(message);
