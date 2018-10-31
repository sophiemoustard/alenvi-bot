// =========================================================
// Usefull contacts dialog
// =========================================================

const showContacts = session => session.endDialog(`Médecine du travail:  \n
CIAMT  \n
1 Ter rue Balzac  \n
75008 Paris  \n
👩 Aminata BA  \n
📞 01 53 53 00 13  \n
📧 a.ba@ciamt.org`);

exports.showContacts = [showContacts];
