const builder = require('botbuilder');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { tokenConfig } = require('./../config/config');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const customers = require('./../models/Ogust/customers');
const employees = require('./../models/Ogust/employees');

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

const getCardsAttachments = async (session) => {
  const myCards = [];
  const myRawCustomers = await employees.getCustomers(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id);
  const myCustomers = myRawCustomers.body.data.customers;
  for (const k in myCustomers) {
    if (myCustomers[k].id_customer != '286871430') {
      const encoded = encodeURI(`${myCustomers[k].main_address.line} ${myCustomers[k].main_address.zip}`);
      const person = await formatPerson(myCustomers[k]);
      const text = await formatText(myCustomers[k]);
      myCards.push(
        new builder.HeroCard(session)
          .title(person)
          // .subtitle(`${myCustomers[k].main_address.line} ${myCustomers[k].main_address.zip} ${myCustomers[k].main_address.city}`)
          .text(text)
          .images([
            builder.CardImage.create(session, `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=14&size=640x640&markers=${encoded}`)
          ])
          .tap(builder.CardAction.openUrl(session, `http://maps.google.fr/maps/place/${encoded}/`))
          .buttons([
            // builder.CardAction.dialogAction(session, 'myCustomersMoreDetails', myCustomers[k].comment, 'Plus de détails...')
            builder.CardAction.dialogAction(session, 'myCustomersMoreDetails', myCustomers[k].id_customer, 'Plus de détails...')
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
    await checkOgustToken(session);
    if (args.data) {
      const myRawCustomers = await employees.getCustomers(session.userData.ogust.tokenConfig.token, session.userData.alenvi.employee_id);
      const customerById = _.find(myRawCustomers.body.data.customers, customer => customer.id_customer === args.data);
      let customerContactDetails = [];
      const customerDetailsTitles = {
        customerContactDetails: 'Coordonnées bénéficiaire',
        pathology: 'Pathologie',
        pathologyComment: 'Commentaires',
        interventionDetails: 'Détails intervention',
        miscComments: 'Autres'
      };
      if (customerById.landline) {
        customerContactDetails.push(customerById.landline);
      }
      if (customerById.mobile_phone) {
        customerContactDetails.push(customerById.mobile_phone);
      }
      if (!customerContactDetails.length) {
        customerContactDetails = '';
      }
      const thirdPartyInfoRaw = await customers.getThirdPartyInformationByCustomerId(session.userData.ogust.tokenConfig.token, customerById.id_customer, 'C', { nbPerPage: 10, pageNum: 1 });
      const thirdPartyInfo = thirdPartyInfoRaw.body.data.info.thirdPartyInformations.array_values || {};
      const customerDetails = {};
      customerDetails.customerContactDetails = customerContactDetails;
      customerDetails.pathology = thirdPartyInfo.NIVEAU;
      customerDetails.pathologyComment = thirdPartyInfo.COMMNIV || '';
      customerDetails.interventionDetails = thirdPartyInfo.DETAILEVE || '';
      customerDetails.miscComments = thirdPartyInfo.AUTRESCOMM || '';
      let title = '';
      let text = '';
      for (const k in customerDetails) {
        if (customerDetails[k] && customerDetails[k] !== '') {
          session.sendTyping();
          title = `## ${customerDetailsTitles[k]}`;
          if (k === 'customerContactDetails') {
            text = customerDetails[k].join('  \n');
          } else {
            text = customerDetails[k];
          }
          session.send(`${title} \n\n ${text}`);
        }
      }
      if (title === '' && text === '') {
        session.send('Le bénéficiaire ne possède pas plus de détails.');
      }
      const payload = {
        _id: session.userData.alenvi._id
      };
      const accessToken = jwt.sign(payload, tokenConfig.secret, { expiresIn: tokenConfig.expiresIn });
      const uri = `${process.env.WEBSITE_HOSTNAME}/editCustomer.html?id_customer=${customerById.id_customer}&_id=${session.userData.alenvi._id}&access-token=${accessToken}&address=${encodeURIComponent(JSON.stringify(session.message.address))}`;
      const msg = new builder.Message(session).sourceEvent({
        facebook: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              image_aspect_ratio: 'square',
              elements: [{
                title: 'Modification fiche',
                // default_action: {
                //   type: 'web_url',
                //   url: uri,
                //   messenger_extensions: true,
                //   webview_height_ratio: 'tall',
                //   webview_share_button: 'hide'
                // },
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
