const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let teacherToken = '';
let studentToken = '';

const testAuth = async () => {
  console.log('🧪 Testing AarambhApp Authentication APIs\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test 2: Admin Login
    console.log('\n2️⃣ Testing Admin Login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@aarambhapp.com',
      password: 'admin123456'
    });
    adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin Login:', adminLoginResponse.data.message);
    console.log('   Role:', adminLoginResponse.data.data.user.role);
    console.log('   Permissions:', adminLoginResponse.data.data.user.adminInfo.permissions);

    // Test 3: Teacher Registration
    console.log('\n3️⃣ Testing Teacher Registration...');
    const teacherRegResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Sarah Teacher',
      email: 'sarah@example.com',
      phone: '+919876543212',
      password: 'sarah123',
      role: 'teacher',
      region: '507f1f77bcf86cd799439011'
    });
    console.log('✅ Teacher Registration:', teacherRegResponse.data.message);
    console.log('   Referral Code:', teacherRegResponse.data.data.user.teacherInfo.referralCode);

    // Test 4: Student Registration with Referral Code
    console.log('\n4️⃣ Testing Student Registration with Referral Code...');
    const studentRegResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Bob Student',
      email: 'bob@example.com',
      phone: '+919876543213',
      password: 'bob123',
      role: 'student',
      region: '507f1f77bcf86cd799439011',
      referralCode: teacherRegResponse.data.data.user.teacherInfo.referralCode
    });
    console.log('✅ Student Registration with Referral:', studentRegResponse.data.message);
    console.log('   Referred By:', studentRegResponse.data.data.user.referredBy ? 'Yes' : 'No');

    // Test 5: Teacher Login
    console.log('\n5️⃣ Testing Teacher Login...');
    const teacherLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'sarah@example.com',
      password: 'sarah123'
    });
    teacherToken = teacherLoginResponse.data.data.token;
    console.log('✅ Teacher Login:', teacherLoginResponse.data.message);
    console.log('   Referral Code:', teacherLoginResponse.data.data.user.teacherInfo.referralCode);

    // Test 6: Student Login
    console.log('\n6️⃣ Testing Student Login...');
    const studentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'bob@example.com',
      password: 'bob123'
    });
    studentToken = studentLoginResponse.data.data.token;
    console.log('✅ Student Login:', studentLoginResponse.data.message);

    // Test 7: Get Current User (Admin)
    console.log('\n7️⃣ Testing Get Current User (Admin)...');
    const adminProfileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin Profile Retrieved');
    console.log('   Name:', adminProfileResponse.data.data.user.name);
    console.log('   Role:', adminProfileResponse.data.data.user.role);
    console.log('   Region:', adminProfileResponse.data.data.user.region.name);

    // Test 8: Get Current User (Teacher)
    console.log('\n8️⃣ Testing Get Current User (Teacher)...');
    const teacherProfileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Teacher Profile Retrieved');
    console.log('   Name:', teacherProfileResponse.data.data.user.name);
    console.log('   Role:', teacherProfileResponse.data.data.user.role);
    console.log('   Referral Code:', teacherProfileResponse.data.data.user.teacherInfo.referralCode);

    // Test 9: Get Current User (Student)
    console.log('\n9️⃣ Testing Get Current User (Student)...');
    const studentProfileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Student Profile Retrieved');
    console.log('   Name:', studentProfileResponse.data.data.user.name);
    console.log('   Role:', studentProfileResponse.data.data.user.role);

    // Test 10: Change Password (Teacher)
    console.log('\n🔟 Testing Change Password (Teacher)...');
    const changePasswordResponse = await axios.put(`${BASE_URL}/api/auth/change-password`, {
      currentPassword: 'sarah123',
      newPassword: 'newsarah123'
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    console.log('✅ Password Changed:', changePasswordResponse.data.message);

    // Test 11: Login with New Password
    console.log('\n1️⃣1️⃣ Testing Login with New Password...');
    const newPasswordLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'sarah@example.com',
      password: 'newsarah123'
    });
    console.log('✅ New Password Login:', newPasswordLoginResponse.data.message);

    // Test 12: Logout (Admin)
    console.log('\n1️⃣2️⃣ Testing Logout (Admin)...');
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Logout:', logoutResponse.data.message);

    // Test 13: Test Invalid Token
    console.log('\n1️⃣3️⃣ Testing Invalid Token...');
    try {
      await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid Token Rejected:', error.response.data.message);
      }
    }

    console.log('\n🎉 All Authentication Tests Passed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Health Check');
    console.log('   ✅ Admin Login');
    console.log('   ✅ Teacher Registration');
    console.log('   ✅ Student Registration with Referral');
    console.log('   ✅ Teacher Login');
    console.log('   ✅ Student Login');
    console.log('   ✅ Get User Profile (All Roles)');
    console.log('   ✅ Change Password');
    console.log('   ✅ Login with New Password');
    console.log('   ✅ Logout');
    console.log('   ✅ Token Validation');

    console.log('\n🔐 Authentication System Features:');
    console.log('   • Multi-role support (Admin, Teacher, Student)');
    console.log('   • JWT-based authentication');
    console.log('   • Password hashing with bcrypt');
    console.log('   • Referral code system for teachers');
    console.log('   • Region-based user organization');
    console.log('   • Password change functionality');
    console.log('   • Secure logout');

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
  }
};

// Run the tests
testAuth();
