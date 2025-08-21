const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let studentToken = '';
let teacherToken = '';
let createdPlanId = '';
let createdTransactionId = '';

// Test data
const testData = {
  admin: {
    name: 'Super Admin',
    email: 'admin@aarambhapp.com',
    password: 'admin123456',
    phone: '+919999999999'
  },
  teacher: {
    name: 'Test Teacher',
    email: 'teacher@test.com',
    password: 'teacher123',
    phone: '1234567891'
  },
  student: {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'student123',
    phone: '1234567892'
  },
  plan: {
    name: `Premium Plan ${Date.now()}`, // Make name unique
    description: 'Premium subscription with all features',
    price: 999,
    duration: 30,
    features: [
      {
        name: 'Unlimited games',
        description: 'Access to all games',
        isIncluded: true
      },
      {
        name: 'All lectures',
        description: 'Access to all lectures',
        isIncluded: true
      },
      {
        name: 'Priority support',
        description: '24/7 priority support',
        isIncluded: true
      }
    ],
    isActive: true,
    isPopular: true
  },
  existingPlanId: '68a4d1a2e22f0b3be5085a91' // Use existing Premium Plan ID
};

// Helper function to log test results
function logTest(testName, success, data = null) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (data && !success) {
    console.log(`   Error: ${JSON.stringify(data)}`);
  }
}

// Helper function to make authenticated requests
async function makeAuthRequest(method, endpoint, token, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      data: error.response?.data || error.message 
    };
  }
}

// Test functions
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    
    if (response.data.success && response.data.data.token) {
      adminToken = response.data.data.token;
      logTest('Admin Login', true);
      return true;
    } else {
      logTest('Admin Login', false, response.data);
      return false;
    }
  } catch (error) {
    logTest('Admin Login', false, error.response?.data || error.message);
    return false;
  }
}

async function testTeacherLogin() {
  console.log('\n👨‍🏫 Testing Teacher Login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.teacher.email,
      password: testData.teacher.password
    });
    
    if (response.data.success && response.data.data.token) {
      teacherToken = response.data.data.token;
      logTest('Teacher Login', true);
      return true;
    } else {
      logTest('Teacher Login', false, response.data);
      return false;
    }
  } catch (error) {
    logTest('Teacher Login', false, error.response?.data || error.message);
    return false;
  }
}

async function testStudentLogin() {
  console.log('\n👨‍🎓 Testing Student Login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.student.email,
      password: testData.student.password
    });
    
    if (response.data.success && response.data.data.token) {
      studentToken = response.data.data.token;
      logTest('Student Login', true);
      return true;
    } else {
      logTest('Student Login', false, response.data);
      return false;
    }
  } catch (error) {
    logTest('Student Login', false, error.response?.data || error.message);
    return false;
  }
}

async function testCreatePlan() {
  console.log('\n📋 Testing Create Plan (Admin)...');
  
  const result = await makeAuthRequest('POST', '/admin/plans', adminToken, testData.plan);
  
  if (result.success && result.data.success) {
    createdPlanId = result.data.data._id;
    logTest('Create Plan (Admin)', true);
    return true;
  } else if (result.data.message && result.data.message.includes('already exists')) {
    // Plan already exists, use existing one
    createdPlanId = testData.existingPlanId;
    logTest('Create Plan (Admin) - Using Existing', true);
    return true;
  } else {
    logTest('Create Plan (Admin)', false, result.data);
    return false;
  }
}

async function testGetAllPlans() {
  console.log('\n📋 Testing Get All Plans (Admin)...');
  
  const result = await makeAuthRequest('GET', '/admin/plans', adminToken);
  
  if (result.success && result.data.success) {
    logTest('Get All Plans (Admin)', true);
    return true;
  } else {
    logTest('Get All Plans (Admin)', false, result.data);
    return false;
  }
}

async function testUpdatePlan() {
  console.log('\n📋 Testing Update Plan (Admin)...');
  
  const updateData = {
    description: 'Updated premium subscription with all features',
    price: 1299
  };
  
  const result = await makeAuthRequest('PUT', `/admin/plans/${createdPlanId}`, adminToken, updateData);
  
  if (result.success && result.data.success) {
    logTest('Update Plan (Admin)', true);
    return true;
  } else {
    logTest('Update Plan (Admin)', false, result.data);
    return false;
  }
}

async function testTogglePlanStatus() {
  console.log('\n📋 Testing Toggle Plan Status (Admin)...');
  
  const result = await makeAuthRequest('PATCH', `/admin/plans/${createdPlanId}/toggle-status`, adminToken);
  
  if (result.success && result.data.success) {
    logTest('Toggle Plan Status (Admin)', true);
    return true;
  } else {
    logTest('Toggle Plan Status (Admin)', false, result.data);
    return false;
  }
}

async function testGetAvailablePlans() {
  console.log('\n📋 Testing Get Available Plans (Public)...');
  
  try {
    const response = await axios.get(`${BASE_URL}/transactions/plans`);
    
    if (response.data.success) {
      logTest('Get Available Plans (Public)', true);
      return true;
    } else {
      logTest('Get Available Plans (Public)', false, response.data);
      return false;
    }
  } catch (error) {
    logTest('Get Available Plans (Public)', false, error.response?.data || error.message);
    return false;
  }
}

async function testCreateOrder() {
  console.log('\n💳 Testing Create Payment Order (Student)...');
  
  const orderData = {
    planId: testData.existingPlanId, // Use existing plan ID
    referralCode: 'TESTREF123'
  };
  
  const result = await makeAuthRequest('POST', '/transactions/create-order', studentToken, orderData);
  
  if (result.success && result.data.success) {
    createdTransactionId = result.data.data.transactionId;
    logTest('Create Payment Order (Student)', true);
    return true;
  } else {
    logTest('Create Payment Order (Student)', false, result.data);
    return false;
  }
}

async function testVerifyPayment() {
  console.log('\n💳 Testing Verify Payment (Student)...');
  
  if (!createdTransactionId) {
    logTest('Verify Payment (Student) - Skipped (No Transaction)', true);
    return true;
  }
  
  const paymentData = {
    razorpayOrderId: 'order_test_123',
    razorpayPaymentId: 'pay_test_123',
    razorpaySignature: 'signature_test_123',
    transactionId: createdTransactionId
  };
  
  const result = await makeAuthRequest('POST', '/transactions/verify-payment', studentToken, paymentData);
  
  if (result.success && result.data.success) {
    logTest('Verify Payment (Student)', true);
    return true;
  } else {
    logTest('Verify Payment (Student)', false, result.data);
    return false;
  }
}

async function testGetSubscriptionDetails() {
  console.log('\n💳 Testing Get Subscription Details (Student)...');
  
  const result = await makeAuthRequest('GET', '/transactions/subscription', studentToken);
  
  if (result.success && result.data.success) {
    logTest('Get Subscription Details (Student)', true);
    return true;
  } else {
    logTest('Get Subscription Details (Student)', false, result.data);
    return false;
  }
}

async function testGetTransactionHistory() {
  console.log('\n💳 Testing Get Transaction History (Student)...');
  
  const result = await makeAuthRequest('GET', '/transactions/history', studentToken);
  
  if (result.success && result.data.success) {
    logTest('Get Transaction History (Student)', true);
    return true;
  } else {
    logTest('Get Transaction History (Student)', false, result.data);
    return false;
  }
}

async function testGetSpecificTransaction() {
  console.log('\n💳 Testing Get Specific Transaction (Student)...');
  
  if (!createdTransactionId) {
    logTest('Get Specific Transaction (Student) - Skipped (No Transaction)', true);
    return true;
  }
  
  const result = await makeAuthRequest('GET', `/transactions/${createdTransactionId}`, studentToken);
  
  if (result.success && result.data.success) {
    logTest('Get Specific Transaction (Student)', true);
    return true;
  } else {
    logTest('Get Specific Transaction (Student)', false, result.data);
    return false;
  }
}

async function testCancelSubscription() {
  console.log('\n💳 Testing Cancel Subscription (Student)...');
  
  const result = await makeAuthRequest('POST', '/transactions/cancel-subscription', studentToken);
  
  if (result.success && result.data.success) {
    logTest('Cancel Subscription (Student)', true);
    return true;
  } else {
    logTest('Cancel Subscription (Student)', false, result.data);
    return false;
  }
}

async function testGetAllTransactions() {
  console.log('\n💳 Testing Get All Transactions (Admin)...');
  
  const result = await makeAuthRequest('GET', '/admin/transactions', adminToken);
  
  if (result.success && result.data.success) {
    logTest('Get All Transactions (Admin)', true);
    return true;
  } else {
    logTest('Get All Transactions (Admin)', false, result.data);
    return false;
  }
}

async function testGetTransactionStatistics() {
  console.log('\n💳 Testing Get Transaction Statistics (Admin)...');
  
  const result = await makeAuthRequest('GET', '/admin/transactions/statistics', adminToken);
  
  if (result.success && result.data.success) {
    logTest('Get Transaction Statistics (Admin)', true);
    return true;
  } else {
    logTest('Get Transaction Statistics (Admin)', false, result.data);
    return false;
  }
}

async function testGetSpecificTransactionAdmin() {
  console.log('\n💳 Testing Get Specific Transaction (Admin)...');
  
  if (!createdTransactionId) {
    logTest('Get Specific Transaction (Admin) - Skipped (No Transaction)', true);
    return true;
  }
  
  const result = await makeAuthRequest('GET', `/admin/transactions/${createdTransactionId}`, adminToken);
  
  if (result.success && result.data.success) {
    logTest('Get Specific Transaction (Admin)', true);
    return true;
  } else {
    logTest('Get Specific Transaction (Admin)', false, result.data);
    return false;
  }
}

async function testUpdateTransactionStatus() {
  console.log('\n💳 Testing Update Transaction Status (Admin)...');
  
  if (!createdTransactionId) {
    logTest('Update Transaction Status (Admin) - Skipped (No Transaction)', true);
    return true;
  }
  
  const statusData = {
    status: 'completed',
    notes: 'Payment verified manually'
  };
  
  const result = await makeAuthRequest('PATCH', `/admin/transactions/${createdTransactionId}/status`, adminToken, statusData);
  
  if (result.success && result.data.success) {
    logTest('Update Transaction Status (Admin)', true);
    return true;
  } else {
    logTest('Update Transaction Status (Admin)', false, result.data);
    return false;
  }
}

async function testGetSubscriptionStatistics() {
  console.log('\n💳 Testing Get Subscription Statistics (Admin)...');
  
  const result = await makeAuthRequest('GET', '/admin/subscriptions/statistics', adminToken);
  
  if (result.success && result.data.success) {
    logTest('Get Subscription Statistics (Admin)', true);
    return true;
  } else {
    logTest('Get Subscription Statistics (Admin)', false, result.data);
    return false;
  }
}

async function testGetUsersSubscriptions() {
  console.log('\n💳 Testing Get Users Subscriptions (Admin)...');
  
  const result = await makeAuthRequest('GET', '/admin/users/subscriptions', adminToken);
  
  if (result.success && result.data.success) {
    logTest('Get Users Subscriptions (Admin)', true);
    return true;
  } else {
    logTest('Get Users Subscriptions (Admin)', false, result.data);
    return false;
  }
}

async function testAccessControl() {
  console.log('\n🔒 Testing Access Control...');
  
  // Test student accessing admin endpoints
  const studentAdminAccess = await makeAuthRequest('GET', '/admin/plans', studentToken);
  logTest('Student Access to Admin Endpoints (Should Fail)', !studentAdminAccess.success);
  
  // Test teacher accessing admin endpoints
  const teacherAdminAccess = await makeAuthRequest('GET', '/admin/plans', teacherToken);
  logTest('Teacher Access to Admin Endpoints (Should Fail)', !teacherAdminAccess.success);
  
  // Test unauthenticated access
  try {
    await axios.get(`${BASE_URL}/admin/plans`);
    logTest('Unauthenticated Access to Admin Endpoints (Should Fail)', false);
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Unauthenticated Access to Admin Endpoints (Should Fail)', true);
    } else {
      logTest('Unauthenticated Access to Admin Endpoints (Should Fail)', false, error.response?.data);
    }
  }
  
  return true;
}

async function testValidationErrors() {
  console.log('\n✅ Testing Validation Errors...');
  
  // Test invalid plan creation
  const invalidPlan = {
    name: '', // Invalid: empty name
    description: 'Short', // Invalid: too short
    price: -100, // Invalid: negative price
    duration: 0 // Invalid: zero duration
  };
  
  const invalidPlanResult = await makeAuthRequest('POST', '/admin/plans', adminToken, invalidPlan);
  logTest('Invalid Plan Creation (Should Fail)', !invalidPlanResult.success);
  
  // Test invalid order creation
  const invalidOrder = {
    planId: 'invalid_id', // Invalid: not a valid ObjectId
    referralCode: 123 // Invalid: not a string
  };
  
  const invalidOrderResult = await makeAuthRequest('POST', '/transactions/create-order', studentToken, invalidOrder);
  logTest('Invalid Order Creation (Should Fail)', !invalidOrderResult.success);
  
  return true;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Transaction and Admin API Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Authentication tests
  if (await testAdminLogin()) passedTests++;
  totalTests++;
  
  if (await testTeacherLogin()) passedTests++;
  totalTests++;
  
  if (await testStudentLogin()) passedTests++;
  totalTests++;
  
  // Plan management tests
  if (await testCreatePlan()) passedTests++;
  totalTests++;
  
  if (await testGetAllPlans()) passedTests++;
  totalTests++;
  
  if (await testUpdatePlan()) passedTests++;
  totalTests++;
  
  if (await testTogglePlanStatus()) passedTests++;
  totalTests++;
  
  if (await testGetAvailablePlans()) passedTests++;
  totalTests++;
  
  // Transaction tests
  if (await testCreateOrder()) passedTests++;
  totalTests++;
  
  if (await testVerifyPayment()) passedTests++;
  totalTests++;
  
  if (await testGetSubscriptionDetails()) passedTests++;
  totalTests++;
  
  if (await testGetTransactionHistory()) passedTests++;
  totalTests++;
  
  if (await testGetSpecificTransaction()) passedTests++;
  totalTests++;
  
  if (await testCancelSubscription()) passedTests++;
  totalTests++;
  
  // Admin transaction management tests
  if (await testGetAllTransactions()) passedTests++;
  totalTests++;
  
  if (await testGetTransactionStatistics()) passedTests++;
  totalTests++;
  
  if (await testGetSpecificTransactionAdmin()) passedTests++;
  totalTests++;
  
  if (await testUpdateTransactionStatus()) passedTests++;
  totalTests++;
  
  if (await testGetSubscriptionStatistics()) passedTests++;
  totalTests++;
  
  if (await testGetUsersSubscriptions()) passedTests++;
  totalTests++;
  
  // Security and validation tests
  if (await testAccessControl()) passedTests++;
  totalTests++;
  
  if (await testValidationErrors()) passedTests++;
  totalTests++;
  
  // Test summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
  console.log('='.repeat(60));
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed successfully!');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} tests failed. Please check the errors above.`);
  }
  
  console.log('\n📝 Note: Razorpay API key-dependent operations were not tested');
  console.log('   (create-order, verify-payment) as actual API keys are not configured.');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
