const builder = require('botbuilder');
const rp = require('request-promise');
const moment = require('moment');

const config = require('../config');

//=========================================================
// Root 'Select modify planning' dialog
//=========================================================

const whichDeclaration = (session, args) => {
  session.sendTyping();
  builder.Prompts.choice(session, "Que souhaites-tu déclarer ?", "Heures internes|Modif. intervention");
}

const redirectToDeclarationSelected = (session, results) => {
  if (results.response != null) {
    console.log(results.response);
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
  else {
    console.log(results.response);
    session.cancelDialog(0, "/hello");
  }
}

exports.select = [whichDeclaration, redirectToDeclarationSelected];

//=========================================================
// 'Request to coach' dialog
//=========================================================

const requestDescription = (session, args) => {
  session.sendTyping();
  builder.Prompts.text(session, "Décris-moi les heures internes que tu souhaites déclarer (jour, heure, tâche)  \nSi tu souhaites annuler ta demande, dis-moi 'annuler' ! ;)");
  // var card = new builder.HeroCard(session)
  //   .title('BotFramework Hero Card')
  //   .subtitle('Your bots — wherever your users are talking')
  //   .text("Décris-moi les heures internes que tu souhaites déclarer (jour, heure, tâche), je m'occuperai de l'envoyer aux coach ! ;)")
  //   // .images([
  //   //   builder.CardImage.create(session, 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg')
  //   // ])
  //   // .buttons([
  //     // builder.Prompts.text(session, "Type something to send to Slack !")
  //     // builder.CardAction.dialogAction()
  //   // ])
  // var msg = new builder.Message(session).addAttachment(card);
  // session.send(msg);
}

const handleRequest = async (session, results) => {
  try {
    if (results.response) {
      console.log(results.response);
      if (/^annuler$/i.test(results.response)){
        session.endDialog("Tu as bien annulé ta demande ! Reparle-moi quand tu veux :)");
      } else {
        let author = session.userData.alenvi.firstname + " " + session.userData.alenvi.lastname;
        let date = moment().format('DD/MM/YYYY, HH:mm');
        // let textToSend = author + ":\n" + results.response;
        var sent = await sendRequestToSlack(author, date, results.response, session.userData.alenvi.sector);
        if (sent.ok == false) {
          throw new Error(sent);
        }
        session.endDialog("Ta demande a bien été envoyé, merci :)");
      }
    }
    else {
      session.endDialog("Je n'ai pas bien reçu ta demande :/");
    }
  }
  catch(err) {
    console.error(err);
    session.endDialog("Je n'ai pas réussis à envoyer ta demande aux coach, essaie encore stp :/");
  }
}

exports.askForRequest = [requestDescription, handleRequest];

const sendRequestToSlack = (author, date, textToSend, sector) => {
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

  var options = {
    uri: "https://slack.com/api/chat.postMessage",
    form: {
      "token": "***REMOVED***",
      "channel": config.Slack.channels[sector], // "G5QLJ49KL",
      "attachments": JSON.stringify([
        {
          "callback_id": "request_processed",
          "title": "Demande:",
          "text": textToSend,
          "fields": [
            {
              "title": "Name",
              "value": author,
              "short": true
            },
            {
              "title": "Date",
              "value": date,
              "short": true
            }
          ]
          // "actions": [
          //   {
          //     "name": "is_processed",
          //     "text": "Traité",
          //     "type": "button",
          //     "value": "done"
          //   }
          // ]
        }
      ])
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  return rp.post(options);
}
