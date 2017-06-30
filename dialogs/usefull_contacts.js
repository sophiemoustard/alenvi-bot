const builder = require('botbuilder');

// =========================================================
// Usefull contacts dialog
// =========================================================

const showContacts = (session) => {
  return session.endDialog(`Médecine du travail:  \n
CIAMT Centre Vaugirard  \n
242 rue de Vaugirard 75015 Paris  \n
Métro Vaugirard (ligne 12)  \n
👩 Jessica Silmar  \n
📞 01 53 53 00 15  \n
📧 j.silmar@ciamt.org`);
}

exports.showContacts = [showContacts];