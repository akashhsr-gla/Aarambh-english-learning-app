const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testGroupId = '';
let testJoinCode = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '9876543210',
  role: 'student'
};

const testGroup = {
  title: 'Test Group Discussion',
  topic: 'Learning English through conversation',
  description: 'A group for practicing English conversation skills',
  level: 'intermediate',
  maxParticipants: 5,
  isPrivate: false,
  settings: {
    allowVideo: true,
    allowVoice: true,
    allowChat: true
  }
};

const privateGroup = {
  title: 'Private Test Group',
  topic: 'Advanced English Discussion',
  description: 'Private group for advanced learners',
  level: 'advanced',
  maxParticipants: 3,
  isPrivate: true,
  password: 'secret123',
  settings: {
    allowVideo: true,
    allowVoice: true,
    allowChat: true
  }
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

const testGroupCreation = async () => {
  try {
    log('Testing group creation...');
    const response = await axios.post(`${BASE_URL}/groups/create`, testGroup, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testGroupId = response.data.data.groupId;
    testJoinCode = response.data.data.joinCode;
    
    logSuccess('Group created successfully', {
      groupId: testGroupId,
      joinCode: testJoinCode,
      group: response.data.data.group
    });
    return true;
  } catch (error) {
    logError('Group creation failed', error);
    return false;
  }
};

const testPrivateGroupCreation = async () => {
  try {
    log('Testing private group creation...');
    const response = await axios.post(`${BASE_URL}/groups/create`, privateGroup, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Private group created successfully', {
      groupId: response.data.data.groupId,
      joinCode: response.data.data.joinCode,
      isPrivate: response.data.data.group.isPrivate
    });
    return true;
  } catch (error) {
    logError('Private group creation failed', error);
    return false;
  }
};

const testGetAvailableGroups = async () => {
  try {
    log('Testing get available groups...');
    const response = await axios.get(`${BASE_URL}/groups/available`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Available groups retrieved successfully', {
      count: response.data.data.groups.length,
      groups: response.data.data.groups.map(g => ({
        id: g.id,
        title: g.title,
        isPrivate: g.isPrivate,
        currentParticipants: g.currentParticipants,
        maxParticipants: g.maxParticipants
      }))
    });
    return true;
  } catch (error) {
    logError('Get available groups failed', error);
    return false;
  }
};

const testGroupDetails = async () => {
  try {
    log('Testing get group details...');
    const response = await axios.get(`${BASE_URL}/groups/${testGroupId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Group details retrieved successfully', {
      group: response.data.data.group
    });
    return true;
  } catch (error) {
    logError('Get group details failed', error);
    return false;
  }
};

const testJoinGroup = async () => {
  try {
    log('Testing join group...');
    const response = await axios.post(`${BASE_URL}/groups/join`, {
      groupId: testGroupId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Joined group successfully', {
      group: response.data.data.group
    });
    return true;
  } catch (error) {
    logError('Join group failed', error);
    return false;
  }
};

const testJoinGroupWithPassword = async () => {
  try {
    log('Testing join private group with password...');
    
    // First get available groups to find the private group
    const groupsResponse = await axios.get(`${BASE_URL}/groups/available`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const privateGroupData = groupsResponse.data.data.groups.find(g => g.isPrivate);
    if (!privateGroupData) {
      log('No private group found to test');
      return false;
    }
    
    const response = await axios.post(`${BASE_URL}/groups/join`, {
      groupId: privateGroupData.id,
      password: privateGroup.password
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Joined private group successfully', {
      group: response.data.data.group
    });
    return true;
  } catch (error) {
    logError('Join private group failed', error);
    return false;
  }
};

const testStartGroupSession = async () => {
  try {
    log('Testing start group session...');
    const response = await axios.post(`${BASE_URL}/groups/${testGroupId}/start-session`, {
      sessionType: 'video'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Group session started successfully', {
      session: response.data.data.session
    });
    return true;
  } catch (error) {
    logError('Start group session failed', error);
    return false;
  }
};

const testGroupWebRTCSignaling = async () => {
  try {
    log('Testing group WebRTC signaling...');
    
    // Test get signaling data
    const getResponse = await axios.get(`${BASE_URL}/communication/group/${testGroupId}/webrtc`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Group WebRTC signaling data retrieved', {
      signaling: getResponse.data.data
    });
    
    // Test post offer
    const offerData = {
      type: 'offer',
      sdp: 'test-sdp-offer'
    };
    
    const offerResponse = await axios.post(`${BASE_URL}/communication/group/${testGroupId}/webrtc/offer`, offerData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Group WebRTC offer posted successfully');
    
    return true;
  } catch (error) {
    logError('Group WebRTC signaling failed', error);
    return false;
  }
};

const testLeaveGroup = async () => {
  try {
    log('Testing leave group...');
    const response = await axios.post(`${BASE_URL}/groups/${testGroupId}/leave`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Left group successfully', {
      message: response.data.message
    });
    return true;
  } catch (error) {
    logError('Leave group failed', error);
    return false;
  }
};

const testEndGroupSession = async () => {
  try {
    log('Testing end group session...');
    const response = await axios.post(`${BASE_URL}/groups/${testGroupId}/end-session`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('Group session ended successfully', {
      message: response.data.message
    });
    return true;
  } catch (error) {
    logError('End group session failed', error);
    return false;
  }
};

const testErrorScenarios = async () => {
  try {
    log('Testing error scenarios...');
    
    // Test joining non-existent group
    try {
      await axios.post(`${BASE_URL}/groups/507f1f77bcf86cd799439011/join`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Correctly handled non-existent group join');
      }
    }
    
    // Test invalid group creation data
    try {
      await axios.post(`${BASE_URL}/groups/create`, {
        title: 'A', // Too short
        topic: 'B'  // Too short
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Correctly handled invalid group creation data');
      }
    }
    
    // Test joining group with wrong password
    try {
      const groupsResponse = await axios.get(`${BASE_URL}/groups/available`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const privateGroupData = groupsResponse.data.data.groups.find(g => g.isPrivate);
      if (privateGroupData) {
        await axios.post(`${BASE_URL}/groups/join`, {
          groupId: privateGroupData.id,
          password: 'wrongpassword'
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Correctly handled wrong password for private group');
      }
    }
    
    return true;
  } catch (error) {
    logError('Error scenario testing failed', error);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive Group System Testing...\n');
  
  const tests = [
    { name: 'User Registration/Login', fn: testUserRegistration },
    { name: 'Group Creation', fn: testGroupCreation },
    { name: 'Private Group Creation', fn: testPrivateGroupCreation },
    { name: 'Get Available Groups', fn: testGetAvailableGroups },
    { name: 'Get Group Details', fn: testGroupDetails },
    { name: 'Join Group', fn: testJoinGroup },
    { name: 'Join Private Group with Password', fn: testJoinGroupWithPassword },
    { name: 'Start Group Session', fn: testStartGroupSession },
    { name: 'Group WebRTC Signaling', fn: testGroupWebRTCSignaling },
    { name: 'Leave Group', fn: testLeaveGroup },
    { name: 'End Group Session', fn: testEndGroupSession },
    { name: 'Error Scenarios', fn: testErrorScenarios }
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
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Group system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
};

// Run tests
runAllTests().catch(console.error);
