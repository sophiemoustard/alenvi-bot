const builder = require('botbuilder');
const _ = require('lodash');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const customersHelper = require('../helpers/customers');
const customers = require('./../models/Ogust/customers');

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
    text.push(`Code Porte: ${customer.door_code}`);
  }
  if (customer.intercom_code) {
    text.push(`Code Interphone: ${customer.intercom_code}`);
  }
  textToDisplay = text.join('  \n');
  return textToDisplay;
};

const getCardsAttachments = async (session) => {
  const myCards = [];
  const myRawCustomers = await customersHelper.getCustomers(session, session.userData.alenvi.employee_id);
  for (const k in myRawCustomers) {
    if (myRawCustomers[k].id_customer != '286871430') {
      const encoded = encodeURI(`${myRawCustomers[k].main_address.line} ${myRawCustomers[k].main_address.zip}`);
      const person = await formatPerson(myRawCustomers[k]);
      const text = await formatText(myRawCustomers[k]);
      myCards.push(
        new builder.HeroCard(session)
          .title(person)
          // .subtitle(`${myRawCustomers[k].main_address.line} ${myRawCustomers[k].main_address.zip} ${myRawCustomers[k].main_address.city}`)
          .text(text)
          .images([
            builder.CardImage.create(session, `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=14&size=640x640&markers=${encoded}`)
          ])
          .tap(builder.CardAction.openUrl(session, `http://maps.google.fr/maps/place/${encoded}/`))
          .buttons([
            // builder.CardAction.dialogAction(session, 'myCustomersMoreDetails', myRawCustomers[k].comment, 'Plus de détails...')
            builder.CardAction.dialogAction(session, 'myCustomersMoreDetails', myRawCustomers[k].id_customer, 'Plus de détails...')
          ])
      );
    }
  }
  // "url":"http://maps.google.fr/maps/place/" + customer.main_address.line + customer.main_address.zip_code + "/",
  return myCards;
};

exports.moreDetails = async (session, args) => {
  try {
    session.sendTyping();
    if (args.data) {
      const myRawCustomers = await customersHelper.getCustomers(session, session.userData.alenvi.employee_id);
      const customerById = _.find(myRawCustomers, customer => customer.id_customer === args.data);
      let customerContactDetails = [];
      const customerDetailsTitles = {
        customerContactDetails: 'Coordonnées bénéficiaire',
        customerComments: 'Commentaires bénéficiaire',
        pathology: 'Pathologie',
        pathologyComment: 'Commentaires',
        interventionDetails: 'Détails intervention',
        miscComments: 'Autres'
      };
      const customerComments = customerById.comment || '';
      console.log(customerComments);
      if (customerById.landline) {
        customerContactDetails.push(customerById.landline);
      }
      if (customerById.mobile_phone) {
        customerContactDetails.push(customerById.mobile_phone);
      }
      if (!customerContactDetails.length) {
        customerContactDetails = '';
      }
      const thirdPartyInfoRaw = await customers.getThirdPartyInformationsByCustomerId(session.userData.ogust.tokenConfig.token, customerById.id_customer, { nbPerPage: 30, pageNum: 1 });
      const thirdPartyInfo = thirdPartyInfoRaw.body.thirdPartyInformations.array_values || {};
      const customerDetails = {};
      customerDetails.customerContactDetails = customerContactDetails;
      customerDetails.customerComments = customerComments;
      customerDetails.pathology = thirdPartyInfo.NIVEAU;
      customerDetails.pathologyComment = thirdPartyInfo.COMMNIV || '';
      customerDetails.interventionDetails = thirdPartyInfo.DETAILEVE || '';
      customerDetails.miscComments = thirdPartyInfo.AUTRESCOMM || '';
      if (customerDetails.pathology === '-') {
        customerDetails.pathology = '';
      }
      let title = '';
      let text = '';
      for (const k in customerDetails) {
        session.sendTyping();
        if (customerDetails[k] && customerDetails[k] !== '') {
          title = `## ${customerDetailsTitles[k]}`;
          if (k === 'customerContactDetails') {
            text = customerDetails[k].join(' \n\n');
          } else {
            text = customerDetails[k];
          }
          session.send(`${title} \n\n ${text}`);
        }
      }
      if (title === '' && text === '') {
        session.endDialog('Le bénéficiaire ne possède pas plus de détails.');
      } else {
        session.endDialog();
      }
    } else {
      throw new Error('id_customer empty');
    }
  } catch (err) {
    console.error(err);
    return session.endDialog("Je n'ai pas réussi à récupérer plus de détails :/");
  }
};

const showMyCustomers = async (session) => {
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
    return session.endDialog("Oh non, je n'ai pas réussi à récupérer tes bénéficiaires :/ Si le problème persiste, essaie de contacter un administrateur !");
  }
};

exports.showCustomers = [showMyCustomers];

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
