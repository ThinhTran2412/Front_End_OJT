const formatTestOrderData = (data, isUpdate = false) => {
  // Basic required fields
  const formatted = {
    identifyNumber: data.identifyNumber || '',
    patientName: data.patientName || '',
    dateOfBirth: data.dateOfBirth || new Date().toISOString().split('T')[0],
    age: parseInt(data.age) || 0,
    gender: data.gender || '',
    address: data.address || '',
    phoneNumber: data.phoneNumber || '',
    email: data.email || '',
    priority: data.priority || 'Normal',
    status: data.status || 'Created',
    note: data.note || '',
    testType: data.testType || '',
  };

  // Add testOrderId for updates
  if (isUpdate && data.testOrderId) {
    formatted.testOrderId = data.testOrderId;
  }

  // Remove any undefined or null values
  Object.keys(formatted).forEach(key => {
    if (formatted[key] === undefined || formatted[key] === null) {
      delete formatted[key];
    }
  });

  return formatted;
};

export default formatTestOrderData;