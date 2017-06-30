const builder = require('botbuilder');

const checkOgustToken = require('../helpers/checkOgustToken').checkToken;

// =========================================================
// HR documents dialog
// =========================================================

const showHRDocs = (session) => {
  session.sendTyping();
  session.endDialog(`[Conditions de remboursement de mutuelle](https://drive.google.com/file/d/0B9x9rvBHVX1TTWlPbHpFZlpUVzQ/view?usp=sharing)  \n
  [Accord d'intéressement](https://drive.google.com/open?id=0B3bqjy-Bj6OHeUxoN2RTVmlOUVk)  \n
  [Plan d’épargne entreprise](https://drive.google.com/open?id=0B3CkiGZsxsSpQ0cwYjlMMk9KeWs)  \n
  [Convention collective des services à la personne](https://drive.google.com/open?id=0B3bqjy-Bj6OHeWx5RVZLYjM5eGM)  \n
  [Evaluation des risques professionnels](https://drive.google.com/drive/folders/0B9x9rvBHVX1TQ2VVZ3cxb0ZsYVE)`);
  // builder.Prompts.choice(session, 'Quelle information souhaites-tu obtenir précisement ?', 'Feuilles de paie|Documents RH|Contacts Utiles', { maxRetries: 0 });
};

// const redirectToInfoSelected = (session, results) => {
//   if (results.response) {
//     if (session.userData.alenvi) {
//       switch (results.response.entity) {
//         case 'Feuilles de paie':
//           session.replaceDialog('/pay_sheets');
//           break;
//         case 'Documents RH':
//           session.replaceDialog('/hr_docs');
//           break;
//         case 'Contacts utiles':
//           session.replaceDialog('/usefull_contacts');
//           break;
//         default:
//           break;
//       }
//     } else {
//       session.endDialog('Vous devez vous connecter pour accéder à cette fonctionnalité ! :)');
//     }
//   } else {
//     session.cancelDialog(0, '/not_understand');
//   }
// };

exports.showHRDocs = [showHRDocs];