// =========================================================
// Not understand
// =========================================================

module.exports = (session) => {
  session.sendTyping();
  // session.endDialog("Je n'ai pas compris :(");
  if (!session.userData.alenvi) {
    session.replaceDialog('/hello_first');
  } else {
    session.replaceDialog('/hello');
  }
};
