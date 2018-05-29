exports.checkOptionalDocs = (adminObj) => {
  const optionalDocs = ['navigoInvoice', 'mutualFund', 'phoneInvoice', 'certificates'];
  return optionalDocs.every((value) => {
    if (!adminObj[value]) {
      return true;
    }
    if (adminObj[value] && adminObj[value].has && value !== 'certificates') {
      return !!adminObj[value].link;
    }
    if (adminObj[value] && adminObj[value].has && value === 'certificates') {
      return adminObj[value].docs.length > 0;
    }
    if (adminObj[value] && !adminObj[value].has) {
      return true;
    }
  });
};
