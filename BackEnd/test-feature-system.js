const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let adminToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '9876543210',
  role: 'student'
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  phone: '9876543211',
  role: 'admin'
};

// Utility functions
const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const logError = (message, error) => {
  console.log(`\n❌ ${message}`);
  console.log(error.response?.data || error.message);
};

const logSuccess = (message, data = null) => {
  console.log(`\n✅ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// Test functions
const testUserRegistration = async () => {
  try {
    log('Testing user registration...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    authToken = response.data.data.token;
    logSuccess('User registered successfully', { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      log('User already exists, trying to login...');
      return await testUserLogin();
    }
    logError('User registration failed', error);
    return false;
  }
};

const testUserLogin = async () => {
  try {
    log('Testing user login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = response.data.data.token;
    logSuccess('User logged in successfully', { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    logError('User login failed', error);
    return false;
  }
};

const testAdminRegistration = async () => {
  try {
    log('Testing admin registration...');
    const response = await axios.post(`${BASE_URL}/auth/register`, adminUser);
    adminToken = response.data.data.token;
    logSuccess('Admin registered successfully', { token: adminToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      log('Admin already exists, trying to login...');
      return await testAdminLogin();
    }
    logError('Admin registration failed', error);
    return false;
  }
};

const testAdminLogin = async () => {
  try {
    log('Testing admin login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminUser.email,
      password: adminUser.password
    });
    adminToken = response.data.data.token;
    logSuccess('Admin logged in successfully', { token: adminToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    logError('Admin login failed', error);
    return false;
  }
};

const testGetUserFeatures = async () => {
  try {
    log('Testing get user features...');
    const response = await axios.get(`${BASE_URL}/features/user`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('User features retrieved successfully', {
      featuresCount: response.data.data.features.length,
      userPlan: response.data.data.userPlan,
      features: response.data.data.features.map(f => ({
        key: f.key,
        name: f.name,
        canAccess: f.canAccess,
        isPaid: f.isPaid,
        category: f.category
      }))
    });
    return true;
  } catch (error) {
    logError('Get user features failed', error);
    return false;
  }
};

const testCheckFeatureAccess = async () => {
  try {
    log('Testing check feature access...');
    
    // Test free feature
    const freeResponse = await axios.get(`${BASE_URL}/features/user/word_game/access`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Test paid feature
    const paidResponse = await axios.get(`${BASE_URL}/features/user/group_calls/access`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Feature access checked successfully', {
      freeFeature: {
        key: freeResponse.data.data.key,
        canAccess: freeResponse.data.data.canAccess,
        isPaid: freeResponse.data.data.isPaid
      },
      paidFeature: {
        key: paidResponse.data.data.key,
        canAccess: paidResponse.data.data.canAccess,
        isPaid: paidResponse.data.data.isPaid
      }
    });
    return true;
  } catch (error) {
    logError('Check feature access failed', error);
    return false;
  }
};

const testRecordFeatureUsage = async () => {
  try {
    log('Testing record feature usage...');
    const response = await axios.post(`${BASE_URL}/features/user/word_game/usage`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Feature usage recorded successfully', {
      message: response.data.message
    });
    return true;
  } catch (error) {
    logError('Record feature usage failed', error);
    return false;
  }
};

const testGetAllFeaturesAdmin = async () => {
  try {
    log('Testing get all features (admin)...');
    const response = await axios.get(`${BASE_URL}/features/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('All features retrieved successfully (admin)', {
      totalFeatures: response.data.data.total,
      features: response.data.data.features.map(f => ({
        key: f.key,
        name: f.name,
        isPaid: f.isPaid,
        isActive: f.isActive,
        category: f.category
      }))
    });
    return true;
  } catch (error) {
    logError('Get all features (admin) failed', error);
    return false;
  }
};

const testToggleFeatureAccess = async () => {
  try {
    log('Testing toggle feature access (admin)...');
    
    // Toggle group_calls to free
    const response = await axios.patch(`${BASE_URL}/features/admin/group_calls/toggle`, {
      isPaid: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('Feature access toggled successfully', {
      feature: response.data.data.name,
      isPaid: response.data.data.isPaid,
      isActive: response.data.data.isActive
    });
    
    // Toggle it back to paid
    const toggleBackResponse = await axios.patch(`${BASE_URL}/features/admin/group_calls/toggle`, {
      isPaid: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('Feature access toggled back to paid', {
      feature: toggleBackResponse.data.data.name,
      isPaid: toggleBackResponse.data.data.isPaid
    });
    
    return true;
  } catch (error) {
    logError('Toggle feature access failed', error);
    return false;
  }
};

const testBulkUpdateFeatures = async () => {
  try {
    log('Testing bulk update features (admin)...');
    
    const updates = [
      { featureKey: 'word_game', isPaid: false, isActive: true },
      { featureKey: 'grammar_game', isPaid: true, isActive: true },
      { featureKey: 'group_calls', isPaid: true, isActive: true }
    ];
    
    const response = await axios.patch(`${BASE_URL}/features/admin/bulk-update`, {
      updates
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('Bulk update features successful', {
      updated: response.data.data.updated.length,
      errors: response.data.data.errors.length,
      results: response.data.data.updated
    });
    return true;
  } catch (error) {
    logError('Bulk update features failed', error);
    return false;
  }
};

const testGetFeatureStatistics = async () => {
  try {
    log('Testing get feature statistics (admin)...');
    const response = await axios.get(`${BASE_URL}/features/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('Feature statistics retrieved successfully', {
      overview: response.data.data.overview,
      categoryBreakdown: response.data.data.categoryBreakdown,
      topUsedFeatures: response.data.data.topUsedFeatures
    });
    return true;
  } catch (error) {
    logError('Get feature statistics failed', error);
    return false;
  }
};

const testCreateNewFeature = async () => {
  try {
    log('Testing create new feature (admin)...');
    
    const newFeature = {
      key: 'test_feature',
      name: 'Test Feature',
      description: 'A test feature for testing purposes',
      category: 'premium',
      isPaid: true,
      isActive: true,
      icon: 'star',
      color: '#FF6B6B',
      order: 100,
      requiredPlan: 'premium',
      freeLimit: 0,
      freeLimitType: 'per_day',
      showInMenu: true,
      requiresAuth: true
    };
    
    const response = await axios.post(`${BASE_URL}/features/admin/create`, newFeature, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('New feature created successfully', {
      id: response.data.data.id,
      key: response.data.data.key,
      name: response.data.data.name,
      category: response.data.data.category,
      isPaid: response.data.data.isPaid
    });
    return true;
  } catch (error) {
    logError('Create new feature failed', error);
    return false;
  }
};

const testFeatureAccessAfterToggle = async () => {
  try {
    log('Testing feature access after toggle...');
    
    // First, make group_calls free
    await axios.patch(`${BASE_URL}/features/admin/group_calls/toggle`, {
      isPaid: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Check if user can now access it
    const response = await axios.get(`${BASE_URL}/features/user/group_calls/access`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Feature access after toggle checked', {
      feature: response.data.data.key,
      canAccess: response.data.data.canAccess,
      isPaid: response.data.data.isPaid,
      reason: response.data.data.reason
    });
    
    // Toggle it back to paid
    await axios.patch(`${BASE_URL}/features/admin/group_calls/toggle`, {
      isPaid: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    return true;
  } catch (error) {
    logError('Feature access after toggle failed', error);
    return false;
  }
};

// Main test runner
const runFeatureSystemTests = async () => {
  console.log('🚀 Starting Feature Access Control System Testing...\n');
  
  const tests = [
    { name: 'User Registration/Login', fn: testUserRegistration },
    { name: 'Admin Registration/Login', fn: testAdminRegistration },
    { name: 'Get User Features', fn: testGetUserFeatures },
    { name: 'Check Feature Access', fn: testCheckFeatureAccess },
    { name: 'Record Feature Usage', fn: testRecordFeatureUsage },
    { name: 'Get All Features (Admin)', fn: testGetAllFeaturesAdmin },
    { name: 'Toggle Feature Access (Admin)', fn: testToggleFeatureAccess },
    { name: 'Bulk Update Features (Admin)', fn: testBulkUpdateFeatures },
    { name: 'Get Feature Statistics (Admin)', fn: testGetFeatureStatistics },
    { name: 'Create New Feature (Admin)', fn: testCreateNewFeature },
    { name: 'Feature Access After Toggle', fn: testFeatureAccessAfterToggle }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`${test.name} failed with exception`, error);
      failed++;
    }
  }
  
  console.log('\n📊 Feature System Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All feature system tests passed! Feature access control is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
};

// Run tests
runFeatureSystemTests().catch(console.error);
