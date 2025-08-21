const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let teacherToken = '';
let studentToken = '';
let createdPlanId = '';
let createdUserId = '';
let createdReferralId = '';

// Test data
const testData = {
  admin: {
    email: 'admin@aarambhapp.com',
    password: 'admin123456'
  },
  teacher: {
    email: 'teacher@test.com',
    password: 'teacher123'
  },
  student: {
    email: 'student@test.com',
    password: 'student123'
  },
  plan: {
    name: `Test Premium Plan ${Date.now()}`,
    description: 'A comprehensive premium plan for testing purposes with extended features and capabilities for English learning platform',
    price: 999.99,
    duration: 30,
    durationType: 'days',
    features: [
      { name: 'Unlimited games', description: 'Access to all games', isIncluded: true },
      { name: 'Video calls', description: 'HD video calling', isIncluded: true },
      { name: 'Premium lectures', description: 'Exclusive content', isIncluded: true }
    ],
    isActive: true,
    isPopular: true,
    maxSessions: -1,
    maxGames: -1,
    maxLectures: -1,
    includesVideoCalls: true,
    includesVoiceCalls: true,
    includesGroupCalls: true,
    includesChat: true,
    includesGames: true,
    includesLectures: true,
    priority: 1
  },
  user: {
    name: `Test User ${Date.now()}`,
    email: `testuser${Date.now()}@example.com`,
    phone: `+91${(9000000000 + (Date.now() % 1000000000)).toString()}`,
    password: 'testuser123',
    role: 'student',
    region: '', // Will be set after getting a region
    studentInfo: {
      age: 25,
      subscriptionStatus: 'inactive'
    }
  },
  referral: {
    teacher: '', // Will be set after teacher login
    referralCode: `REF${Date.now().toString().slice(-6)}`,
    discountPercentage: 25,
    isActive: true,
    maxUses: 100,
    description: 'Test referral code for 25% discount'
  }
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    return { success: false, message: error.message };
  }
};

// Test functions
const testAdminLogin = async () => {
  console.log('🔐 Testing Admin Login...');
  const response = await makeRequest('POST', '/auth/login', testData.admin);
  
  if (response.success) {
    adminToken = response.data.token;
    console.log('✅ Admin Login Successful');
    return true;
  } else {
    console.log('❌ Admin Login Failed:', response.message);
    return false;
  }
};

const testTeacherLogin = async () => {
  console.log('🔐 Testing Teacher Login...');
  const response = await makeRequest('POST', '/auth/login', testData.teacher);
  
  if (response.success) {
    teacherToken = response.data.token;
    testData.referral.teacher = response.data.user._id;
    console.log('✅ Teacher Login Successful');
    return true;
  } else {
    console.log('❌ Teacher Login Failed:', response.message);
    return false;
  }
};

const testStudentLogin = async () => {
  console.log('🔐 Testing Student Login...');
  const response = await makeRequest('POST', '/auth/login', testData.student);
  
  if (response.success) {
    studentToken = response.data.token;
    console.log('✅ Student Login Successful');
    return true;
  } else {
    console.log('❌ Student Login Failed:', response.message);
    return false;
  }
};

const testGetRegions = async () => {
  console.log('🌍 Testing Get Regions...');
  const response = await makeRequest('GET', '/regions', null, adminToken);
  
  if (response.success && response.data.regions.length > 0) {
    testData.user.region = response.data.regions[0]._id;
    console.log('✅ Get Regions Successful');
    return true;
  } else {
    console.log('❌ Get Regions Failed:', response.message);
    return false;
  }
};

// Plans API Tests
const testCreatePlan = async () => {
  console.log('📋 Testing Create Plan (Admin)...');
  const response = await makeRequest('POST', '/plans', testData.plan, adminToken);
  
  if (response.success) {
    createdPlanId = response.data.id;
    console.log('✅ Create Plan Successful');
    return true;
  } else {
    console.log('❌ Create Plan Failed:', response.message);
    return false;
  }
};

const testGetAllPlans = async () => {
  console.log('📋 Testing Get All Plans...');
  const response = await makeRequest('GET', '/plans');
  
  if (response.success) {
    console.log('✅ Get All Plans Successful');
    return true;
  } else {
    console.log('❌ Get All Plans Failed:', response.message);
    return false;
  }
};

const testGetPlanById = async () => {
  if (!createdPlanId) {
    console.log('⏭️ Skipping Get Plan by ID - no plan created');
    return true;
  }
  
  console.log('📋 Testing Get Plan by ID...');
  const response = await makeRequest('GET', `/plans/${createdPlanId}`);
  
  if (response.success) {
    console.log('✅ Get Plan by ID Successful');
    return true;
  } else {
    console.log('❌ Get Plan by ID Failed:', response.message);
    return false;
  }
};

const testUpdatePlan = async () => {
  if (!createdPlanId) {
    console.log('⏭️ Skipping Update Plan - no plan created');
    return true;
  }
  
  console.log('📋 Testing Update Plan (Admin)...');
  const updateData = {
    name: `Updated ${testData.plan.name}`,
    price: 1299.99,
    description: 'Updated description for testing'
  };
  
  const response = await makeRequest('PUT', `/plans/${createdPlanId}`, updateData, adminToken);
  
  if (response.success) {
    console.log('✅ Update Plan Successful');
    return true;
  } else {
    console.log('❌ Update Plan Failed:', response.message);
    return false;
  }
};

const testTogglePlanStatus = async () => {
  if (!createdPlanId) {
    console.log('⏭️ Skipping Toggle Plan Status - no plan created');
    return true;
  }
  
  console.log('📋 Testing Toggle Plan Status (Admin)...');
  const response = await makeRequest('PATCH', `/plans/${createdPlanId}/toggle-status`, {}, adminToken);
  
  if (response.success) {
    console.log('✅ Toggle Plan Status Successful');
    return true;
  } else {
    console.log('❌ Toggle Plan Status Failed:', response.message);
    return false;
  }
};

// Users API Tests
const testCreateUser = async () => {
  console.log('👤 Testing Create User (Admin)...');
  const response = await makeRequest('POST', '/auth/register', testData.user);
  
  if (response.success) {
    createdUserId = response.data.user._id;
    console.log('✅ Create User Successful');
    return true;
  } else {
    console.log('❌ Create User Failed:', response.message);
    return false;
  }
};

const testGetAllUsers = async () => {
  console.log('👤 Testing Get All Users (Admin)...');
  const response = await makeRequest('GET', '/users', null, adminToken);
  
  if (response.success) {
    console.log('✅ Get All Users Successful');
    return true;
  } else {
    console.log('❌ Get All Users Failed:', response.message);
    return false;
  }
};

const testGetUserById = async () => {
  if (!createdUserId) {
    console.log('⏭️ Skipping Get User by ID - no user created');
    return true;
  }
  
  console.log('👤 Testing Get User by ID (Admin)...');
  const response = await makeRequest('GET', `/users/${createdUserId}`, null, adminToken);
  
  if (response.success) {
    console.log('✅ Get User by ID Successful');
    return true;
  } else {
    console.log('❌ Get User by ID Failed:', response.message);
    return false;
  }
};

const testUpdateUser = async () => {
  if (!createdUserId) {
    console.log('⏭️ Skipping Update User - no user created');
    return true;
  }
  
  console.log('👤 Testing Update User (Admin)...');
  const updateData = {
    name: `Updated ${testData.user.name}`,
    studentInfo: {
      age: 26,
      subscriptionStatus: 'active'
    }
  };
  
  const response = await makeRequest('PUT', `/users/${createdUserId}`, updateData, adminToken);
  
  if (response.success) {
    console.log('✅ Update User Successful');
    return true;
  } else {
    console.log('❌ Update User Failed:', response.message);
    return false;
  }
};

const testGetUserStatistics = async () => {
  console.log('👤 Testing Get User Statistics (Admin)...');
  const response = await makeRequest('GET', '/users/admin/statistics', null, adminToken);
  
  if (response.success) {
    console.log('✅ Get User Statistics Successful');
    return true;
  } else {
    console.log('❌ Get User Statistics Failed:', response.message);
    return false;
  }
};

const testSearchUsers = async () => {
  console.log('👤 Testing Search Users (Admin)...');
  const searchData = {
    query: 'test',
    role: 'student',
    status: 'active'
  };
  
  const response = await makeRequest('POST', '/users/admin/search', searchData, adminToken);
  
  if (response.success) {
    console.log('✅ Search Users Successful');
    return true;
  } else {
    console.log('❌ Search Users Failed:', response.message);
    return false;
  }
};

// Referrals API Tests
const testCreateReferral = async () => {
  console.log('🎫 Testing Create Referral (Admin)...');
  const response = await makeRequest('POST', '/referrals', testData.referral, adminToken);
  
  if (response.success) {
    createdReferralId = response.data._id;
    console.log('✅ Create Referral Successful');
    return true;
  } else {
    console.log('❌ Create Referral Failed:', response.message);
    return false;
  }
};

const testGetAllReferrals = async () => {
  console.log('🎫 Testing Get All Referrals (Admin)...');
  const response = await makeRequest('GET', '/referrals', null, adminToken);
  
  if (response.success) {
    console.log('✅ Get All Referrals Successful');
    return true;
  } else {
    console.log('❌ Get All Referrals Failed:', response.message);
    return false;
  }
};

const testGetReferralById = async () => {
  if (!createdReferralId) {
    console.log('⏭️ Skipping Get Referral by ID - no referral created');
    return true;
  }
  
  console.log('🎫 Testing Get Referral by ID (Admin)...');
  const response = await makeRequest('GET', `/referrals/${createdReferralId}`, null, adminToken);
  
  if (response.success) {
    console.log('✅ Get Referral by ID Successful');
    return true;
  } else {
    console.log('❌ Get Referral by ID Failed:', response.message);
    return false;
  }
};

const testUpdateReferral = async () => {
  if (!createdReferralId) {
    console.log('⏭️ Skipping Update Referral - no referral created');
    return true;
  }
  
  console.log('🎫 Testing Update Referral (Admin)...');
  const updateData = {
    discountPercentage: 30,
    description: 'Updated referral code with 30% discount'
  };
  
  const response = await makeRequest('PUT', `/referrals/${createdReferralId}`, updateData, adminToken);
  
  if (response.success) {
    console.log('✅ Update Referral Successful');
    return true;
  } else {
    console.log('❌ Update Referral Failed:', response.message);
    return false;
  }
};

const testGetTeacherReferrals = async () => {
  if (!testData.referral.teacher) {
    console.log('⏭️ Skipping Get Teacher Referrals - no teacher ID');
    return true;
  }
  
  console.log('🎫 Testing Get Teacher Referrals (Teacher)...');
  const response = await makeRequest('GET', `/referrals/teacher/${testData.referral.teacher}`, null, teacherToken);
  
  if (response.success) {
    console.log('✅ Get Teacher Referrals Successful');
    return true;
  } else {
    console.log('❌ Get Teacher Referrals Failed:', response.message);
    return false;
  }
};

const testGetReferralStatistics = async () => {
  console.log('🎫 Testing Get Referral Statistics (Admin)...');
  const response = await makeRequest('GET', '/referrals/admin/statistics', null, adminToken);
  
  if (response.success) {
    console.log('✅ Get Referral Statistics Successful');
    return true;
  } else {
    console.log('❌ Get Referral Statistics Failed:', response.message);
    return false;
  }
};

const testValidateReferralCode = async () => {
  if (!testData.referral.referralCode) {
    console.log('⏭️ Skipping Validate Referral Code - no referral code');
    return true;
  }
  
  console.log('🎫 Testing Validate Referral Code...');
  const response = await makeRequest('POST', '/referrals/validate', {
    referralCode: testData.referral.referralCode
  });
  
  if (response.success) {
    console.log('✅ Validate Referral Code Successful');
    return true;
  } else {
    console.log('❌ Validate Referral Code Failed:', response.message);
    return false;
  }
};

const testToggleReferralStatus = async () => {
  if (!createdReferralId) {
    console.log('⏭️ Skipping Toggle Referral Status - no referral created');
    return true;
  }
  
  console.log('🎫 Testing Toggle Referral Status (Admin)...');
  const response = await makeRequest('PATCH', `/referrals/${createdReferralId}/toggle-status`, {}, adminToken);
  
  if (response.success) {
    console.log('✅ Toggle Referral Status Successful');
    return true;
  } else {
    console.log('❌ Toggle Referral Status Failed:', response.message);
    return false;
  }
};

// Cleanup tests
const testDeleteReferral = async () => {
  if (!createdReferralId) {
    console.log('⏭️ Skipping Delete Referral - no referral created');
    return true;
  }
  
  console.log('🗑️ Testing Delete Referral (Admin)...');
  const response = await makeRequest('DELETE', `/referrals/${createdReferralId}`, null, adminToken);
  
  if (response.success) {
    console.log('✅ Delete Referral Successful');
    return true;
  } else {
    console.log('❌ Delete Referral Failed:', response.message);
    return false;
  }
};

const testDeletePlan = async () => {
  if (!createdPlanId) {
    console.log('⏭️ Skipping Delete Plan - no plan created');
    return true;
  }
  
  console.log('🗑️ Testing Delete Plan (Admin)...');
  const response = await makeRequest('DELETE', `/plans/${createdPlanId}`, null, adminToken);
  
  if (response.success) {
    console.log('✅ Delete Plan Successful');
    return true;
  } else {
    console.log('❌ Delete Plan Failed:', response.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive API Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Authentication tests
  const authTests = [
    testAdminLogin,
    testTeacherLogin,
    testStudentLogin
  ];
  
  for (const test of authTests) {
    totalTests++;
    if (await test()) passedTests++;
  }
  
  // Setup tests
  const setupTests = [
    testGetRegions
  ];
  
  for (const test of setupTests) {
    totalTests++;
    if (await test()) passedTests++;
  }
  
  // Plans tests
  const planTests = [
    testCreatePlan,
    testGetAllPlans,
    testGetPlanById,
    testUpdatePlan,
    testTogglePlanStatus
  ];
  
  for (const test of planTests) {
    totalTests++;
    if (await test()) passedTests++;
  }
  
  // Users tests
  const userTests = [
    testCreateUser,
    testGetAllUsers,
    testGetUserById,
    testUpdateUser,
    testGetUserStatistics,
    testSearchUsers
  ];
  
  for (const test of userTests) {
    totalTests++;
    if (await test()) passedTests++;
  }
  
  // Referrals tests
  const referralTests = [
    testCreateReferral,
    testGetAllReferrals,
    testGetReferralById,
    testUpdateReferral,
    testGetTeacherReferrals,
    testGetReferralStatistics,
    testValidateReferralCode,
    testToggleReferralStatus
  ];
  
  for (const test of referralTests) {
    totalTests++;
    if (await test()) passedTests++;
  }
  
  // Cleanup tests
  const cleanupTests = [
    testDeleteReferral,
    testDeletePlan
  ];
  
  for (const test of cleanupTests) {
    totalTests++;
    if (await test()) passedTests++;
  }
  
  // Results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above for details.');
  }
};

// Run tests
runAllTests().catch(console.error);
