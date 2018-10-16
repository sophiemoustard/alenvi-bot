// =========================================================
// Not understand
// =========================================================

module.exports = (session) => {
  session.sendTyping();
  if (!session.userData.alenvi) {
    session.replaceDialog('/hello_first');
  } else {
    session.replaceDialog('/hello');
  }
};
