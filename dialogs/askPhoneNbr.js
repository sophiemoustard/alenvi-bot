require('dotenv').config();
const builder = require('botbuilder');
const checkOgustToken = require('../helpers/checkOgustToken').checkToken;
const employees = require('../models/Ogust/employees');

const twilio = require('twilio')(process.env.accountSid, process.env.authToken);

// =========================================================
// Ask for phone number
// =========================================================

const askPhoneNbr = (session, args) => {
  session.sendTyping();
  if (args) {
    builder.Prompts.text(session, 'Il semble que le numéro que tu as entré ne soit pas au bon format (forme: 0642424242 tout attaché). Réessaie !', { maxRetries: 0 });
  } else {
    builder.Prompts.text(session, 'Entre le numéro de téléphone mobile de l\'auxiliaire que tu veux accueillir (sous la forme 0642424242):', { maxRetries: 0 });
  }
};

const checkPhoneNbrNew = async (session, results) => {
  try {
    if (results.response && session.userData.alenvi) {
      await checkOgustToken(session);
      const regex = /^(0[1-68])(?:[ _.-]?(\d{2})){4}$/;
      if (regex.test(results.response)) {
        const params = {
          token: session.userData.ogust.tokenConfig.token,
          status: 'A',
          mobile_phone: results.response || ''
        };
        const newEmployeeRaw = await employees.getEmployees(params);
        const newEmployee = newEmployeeRaw.body.data.users.array_employee.result[0];
        session.dialogData.phoneNbr = newEmployee.mobile_phone;
        builder.Prompts.confirm(session, `Est-ce bien l'auxiliaire ${newEmployee.first_name} ${newEmployee.last_name} que tu veux accueillir ?`);
      } else {
        session.replaceDialog('/ask_phone_nbr', { reprompt: true });
      }
    } else {
      return session.cancelDialog(0, '/not_understand');
    }
  } catch (e) {
    console.error(e);
    session.endDialog('J\'ai eu un problème lors de la récupération de l\'auxiliaire :/');
  }
};

const confirmPerson = async (session, results) => {
  try {
    if (results.response && session.userData.alenvi) {
      await checkOgustToken(session);
      const welcomeMessage = `Bienvenue chez Alenvi ! :) Pour te connecter à Pigi, assure-toi que tu as bien l’application Messenger sur ton téléphone et clique sur le lien suivant : ${process.env.MESSENGER_LINK} et sers-toi du code 123456 pour te connecter`;
      const internationalNbr = `+33${session.dialogData.phoneNbr.substring(1)}`;
      twilio.messages.create({
        to: internationalNbr,
        from: process.env.TWILIO_PHONE_NBR,
        body: welcomeMessage
      }, (err, message) => {
        if (err) {
          throw new Error(err);
        }
        console.log('SMS message =');
        console.log(message);
        return session.endDialog('SMS bien envoyé !');
      });
    } else {
      return session.endDialog('Envoi de SMS annulé !');
    }
  } catch (e) {
    console.error(e);
    session.endDialog('J\'ai eu un problème lors de l\'envoi du sms :/');
  }
};

exports.askPhoneNbr = [askPhoneNbr, checkPhoneNbrNew, confirmPerson];
