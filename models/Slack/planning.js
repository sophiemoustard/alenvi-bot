require('dotenv').config();
const rp = require('request-promise');
const config = require('../../config');

exports.sendRequestToSlack = async (payload) => {
  const options = {
    uri: 'https://slack.com/api/chat.postMessage',
    form: {
      token: process.env.SLACK_TOKEN,
      channel: process.env.NODE_ENV == 'development' ? config.Slack.channels['test'] : config.Slack.channels[payload.sector],
      attachments: JSON.stringify([
        {
          callback_id: 'request_processed',
          title: 'Auteur:',
          text: payload.author,
          fields: [
            {
              title: 'Demande:',
              value: payload.textToSend,
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
  const res = await rp.post(options);
  if (res.ok === false) {
    throw new Error(res);
  }
  return res;
};

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
