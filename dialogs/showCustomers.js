const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const planning = require('../helpers/planning');

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
  text.push(customer.main_address.line);
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
  const myRawCustomers = await planning.getCustomers(session);
  // console.log(myRawCustomers);
  for (const k in myRawCustomers) {
    console.log('WENT IN FOR !');
    if (myRawCustomers[k].id_customer != '286871430') {
      const encoded = encodeURI(`${myRawCustomers[k].main_address.line} ${myRawCustomers[k].main_address.zip}`);
      const person = await formatPerson(myRawCustomers[k]);
      const text = await formatText(myRawCustomers[k]);
      myCards.push(
        new builder.HeroCard(session)
          .title(person)
          // .subtitle('Subtitle')
          .text(text)
          // .images([
          //   builder.CardImage.create(session, `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=14&size=640x640&markers=${encoded}`)
          // ])
          .tap(builder.CardAction.openUrl(session, `http://maps.google.fr/maps/place/${encoded}/`))
          .buttons([
            // builder.CardAction.openUrl(session, `http://maps.google.fr/maps/place/${encoded}/`, 'Localisation'),
            builder.CardAction.dialogAction(session, 'myCustomersMoreDetails', myRawCustomers[k].comment, 'Plus de détails...')
          ])
      );
    }
  }
  // "url":"http://maps.google.fr/maps/place/" + customer.main_address.line + customer.main_address.zip_code + "/",
  console.log('I RETURNED !');
  console.log(myCards);
  return myCards;
};

exports.moreDetails = async (session, args) => {
  if (args.data) {
    session.endDialog(args.data);
  } else {
    session.endDialog("Je n'ai pas réussi à récupérer plus de détails :/");
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
