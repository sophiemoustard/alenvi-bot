async function coucou() {
  var obj = {
    '0': {
      start_date: "201705300845"
    },
    '1': {
      start_date: "201705300900"
    },
    '2': {
      start_date: "201705301000"
    },
    '3': {
      start_date: "201705302000"
    }
  }
  var sortedServicesByDate = [];
  var test = await fillAndSortArrByStartDate(obj, sortedServicesByDate);
  console.log("TEST");
  console.log(test);
}

async function fillAndSortArrByStartDate(getServiceResult, sortedServicesByDate) {
  for (k in getServiceResult) {
    sortedServicesByDate.push(getServiceResult[k]);
  }
  await sortedServicesByDate.sort(function(service1, service2) {
    return (service1.start_date - service2.start_date);
  })
  console.log("SORTED = ");
  console.log(sortedServicesByDate);
  return sortedServicesByDate;

}

coucou();
