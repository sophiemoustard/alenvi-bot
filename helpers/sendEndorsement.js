const rp = require('request-promise');
const users = require('../models/Alenvi/users');

function once(fn, context) {
  let result;

  return ((...args) => {
    if (fn) {
      result = fn.apply(context || this, args);
      fn = null;
    }
    return result;
  });
}

exports.sendEndorsementToSlack = once(async (session) => {
  try {
    const managerRaw = await users.getAlenviUserById(session.userData.alenvi.managerId);
    console.log(managerRaw.body.data);
    const manager = managerRaw.body.data.user;
    const options = {
      uri: 'https://slack.com/api/chat.postMessage',
      form: {
        token: process.env.SLACK_TOKEN,
        channel: manager.slack.slackId,
        as_user: true,
        attachments: JSON.stringify([
          {
            callback_id: `${session.userData.alenvi._id}_endorsement_processed`,
            title: 'Avenant 35h',
            text: `Me confirmes-tu que l'auxiliaire ${session.userData.alenvi.firstname} ${session.userData.alenvi.firstname} souhaite passer à 35h ?`,
            actions: [
              {
                name: 'endorsement_yes',
                text: 'Oui',
                type: 'button',
                value: 'yes'
              },
              {
                name: 'endorsement_non',
                text: 'Non',
                type: 'button',
                value: 'no'
              }
            ]
          },
        ]),
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    };
    const res = await rp.post(options);
    if (res.ok === false) {
      throw new Error(res);
    }
    return res;
  } catch (e) {
    console.error(e);
  }
});

