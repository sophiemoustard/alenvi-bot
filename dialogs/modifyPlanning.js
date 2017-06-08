const builder = require('botbuilder');
const rp = require('request-promise');

//=========================================================
// Root 'Select modify planning' dialog
//=========================================================
exports.select = [
  (session, args) => {
    session.sendTyping();
    builder.Prompts.choice(session, "Que souhaites-tu déclarer ?", "Heures internes|Modif. intervention");
  },
  (session, results) => {
    if (results.response) {
      if (session.userData.alenvi) {
        console.log(results.response);
        switch (results.response.entity) {
          case "Heures internes":
            session.beginDialog("/ask_for_request");
            break;
          case "Modif. intervention":
            session.beginDialog("/show_customers", { isModifying: true });
            break;
        }
      }
      else {
        session.endDialog("Vous devez vous connecter pour accéder à cette fonctionnalité ! :)");
      }
    }
  }
];

exports.askForRequest = [
  (session, args) => {
    session.sendTyping();
    session.endDialog("Test avant ta demande :)");
    // builder.Prompts.text(session, "Type something to send to Slack !");
    // var card = new builder.HeroCard(session)
    //   // .title('BotFramework Hero Card')
    //   // .subtitle('Your bots — wherever your users are talking')
    //   .text("Ecris ta demande, je m'occuperai de l'envoyer aux coach ! ;)")
    //   // .images([
    //   //   builder.CardImage.create(session, 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg')
    //   // ])
    //   .buttons([
    //     // builder.Prompts.text(session, "Type something to send to Slack !")
    //     builder.CardAction.dialogAction()
    //   ])
    // var msg = new builder.Message(session).addAttachment(card);
    // session.send(msg);
  },
  async (session, results) => {
    try {
      if (results.response) {
        var sendToSlack = await sendRequestToSlack(results.response);
        session.endDialog("Ta demande a bien été envoyé, merci :)");
      }
    }
    catch(err) {
      console.error(err);
    }
  }
]

const sendRequestToSlack = (textToSend) => {
  var options = {
    uri: "https://slack.com/api/chat.postMessage",
    form: {
      "token": "xoxb-186442362724-VuA61egPYzNmY3WlbF4jRFiz",
      "channel": "G5QLJ49KL",
      "text": textToSend
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  return rp.post(options);
}
