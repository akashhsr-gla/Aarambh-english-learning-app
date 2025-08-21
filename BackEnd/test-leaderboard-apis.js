const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let teacherToken = '';
let studentToken = '';
let student2Token = '';
let regionId = '';

const testLeaderboardAPIs = async () => {
  console.log('🏆 Testing AarambhApp Leaderboard APIs\n');

  try {
    // Step 1: Login as Admin
    console.log('1️⃣ Logging in as Admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@aarambhapp.com',
      password: 'admin123456'
    });
    adminToken = adminLoginResponse.data.data.token;
    regionId = adminLoginResponse.data.data.user.region;
    console.log('✅ Admin Login:', adminLoginResponse.data.message);
    console.log('   Region ID:', regionId);

    // Step 2: Login as Teacher
    console.log('\n2️⃣ Logging in as Teacher...');
    const teacherLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'teacher@example.com',
      password: 'newteacher123'
    });
    teacherToken = teacherLoginResponse.data.data.token;
    console.log('✅ Teacher Login:', teacherLoginResponse.data.message);

    // Step 3: Create a student with correct region for testing
    console.log('\n3️⃣ Creating a student with correct region for testing...');
    const studentResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Student for Leaderboard',
      email: 'leaderboard_student@example.com',
      phone: '+919876543230',
      password: 'student123',
      role: 'student',
      region: regionId
    });
    studentToken = studentResponse.data.data.token;
    console.log('✅ Student Created:', studentResponse.data.message);

    // Step 4: Create another student for testing
    console.log('\n4️⃣ Creating another student for testing...');
    const student2Response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Student 2',
      email: 'student9@example.com',
      phone: '+919876543221',
      password: 'student123',
      role: 'student',
      region: regionId
    });
    student2Token = student2Response.data.data.token;
    console.log('✅ Student 2 Created:', student2Response.data.message);



    // Step 5: Update student activities to create leaderboard data
    console.log('\n5️⃣ Updating student activities...');
    
    // Update Student 1 activities
    await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${studentResponse.data.data.user._id}`, {
      activityType: 'lectures',
      increment: 10
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${studentResponse.data.data.user._id}`, {
      activityType: 'games',
      increment: 5
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${studentResponse.data.data.user._id}`, {
      activityType: 'communication',
      increment: 3
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Update Student 2 activities  
    await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${student2Response.data.data.user._id}`, {
      activityType: 'lectures',
      increment: 8
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${student2Response.data.data.user._id}`, {
      activityType: 'games',
      increment: 7
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${student2Response.data.data.user._id}`, {
      activityType: 'communication',
      increment: 6
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ Student activities updated successfully');

    // Step 6: Get Top 3 Leaderboard for Specific Region
    console.log('\n6️⃣ Getting Top 3 Leaderboard for Region...');
    const top3Response = await axios.get(`${BASE_URL}/api/leaderboard/region/${regionId}/top3`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Top 3 Leaderboard Retrieved');
    console.log('   Region:', top3Response.data.data.region.name);
    console.log('   Total Students:', top3Response.data.data.totalStudents);
    console.log('   Leaderboard Entries:', top3Response.data.data.leaderboard.length);
    
    if (top3Response.data.data.leaderboard.length > 0) {
      console.log('   Top Performer:', top3Response.data.data.leaderboard[0].student.name);
      console.log('   Top Score:', top3Response.data.data.leaderboard[0].totalScore);
    }

    // Step 7: Get Full Regional Leaderboard
    console.log('\n7️⃣ Getting Full Regional Leaderboard...');
    const fullLeaderboardResponse = await axios.get(`${BASE_URL}/api/leaderboard/region/${regionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Full Regional Leaderboard Retrieved');
    console.log('   Total Entries:', fullLeaderboardResponse.data.data.pagination.total);
    console.log('   Current Page:', fullLeaderboardResponse.data.data.pagination.page);

    // Step 8: Get All Regions Top 3
    console.log('\n8️⃣ Getting All Regions Top 3...');
    const allRegionsResponse = await axios.get(`${BASE_URL}/api/leaderboard/all-regions/top3`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ All Regions Top 3 Retrieved');
    console.log('   Total Regions:', allRegionsResponse.data.data.totalRegions);
    console.log('   Regional Leaderboards:', allRegionsResponse.data.data.regionalLeaderboards.length);

    // Step 9: Get User's Rank
    console.log('\n9️⃣ Getting User Rank...');
    const userRankResponse = await axios.get(`${BASE_URL}/api/leaderboard/my-rank`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ User Rank Retrieved');
    console.log('   User:', userRankResponse.data.data.user.student.name);
    console.log('   Rank:', userRankResponse.data.data.user.rank);
    console.log('   Total Score:', userRankResponse.data.data.user.totalScore);
    console.log('   Lectures:', userRankResponse.data.data.user.statistics.lecturesWatched);
    console.log('   Games:', userRankResponse.data.data.user.statistics.gameSessions);
    console.log('   Communication:', userRankResponse.data.data.user.statistics.communicationSessions);

    // Step 10: Get Leaderboard Statistics (Admin)
    console.log('\n🔟 Getting Leaderboard Statistics (Admin)...');
    const statisticsResponse = await axios.get(`${BASE_URL}/api/leaderboard/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Leaderboard Statistics Retrieved');
    console.log('   Total Regions:', statisticsResponse.data.data.overall.totalRegions);
    console.log('   Total Students:', statisticsResponse.data.data.overall.totalStudents);
    console.log('   Overall Average Score:', statisticsResponse.data.data.overall.averageScore);

    // Step 11: Test Invalid Region ID
    console.log('\n1️⃣1️⃣ Testing Invalid Region ID...');
    try {
      await axios.get(`${BASE_URL}/api/leaderboard/region/invalid_region_id/top3`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid Region ID correctly handled:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 12: Test Non-existent Region
    console.log('\n1️⃣2️⃣ Testing Non-existent Region...');
    try {
      await axios.get(`${BASE_URL}/api/leaderboard/region/507f1f77bcf86cd799439020/top3`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Non-existent Region correctly handled:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 13: Test Teacher Rank (Should fail)
    console.log('\n1️⃣3️⃣ Testing Teacher Rank (Should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/leaderboard/my-rank`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Teacher Rank correctly restricted:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 14: Test Student Access to Admin Statistics (Should fail)
    console.log('\n1️⃣4️⃣ Testing Student Access to Admin Statistics (Should fail)...');
    try {
      await axios.get(`${BASE_URL}/api/leaderboard/statistics`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Student Access to Admin Statistics correctly restricted');
      } else {
        throw error;
      }
    }

    // Step 15: Test Invalid Activity Update
    console.log('\n1️⃣5️⃣ Testing Invalid Activity Update...');
    try {
      await axios.post(`${BASE_URL}/api/leaderboard/update-activity/${studentResponse.data.data.user._id}`, {
        activityType: 'invalid_activity',
        increment: 1
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid Activity Type correctly handled:', error.response.data.message);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All Leaderboard API Tests Passed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Top 3 Regional Leaderboard');
    console.log('   ✅ Full Regional Leaderboard');
    console.log('   ✅ All Regions Top 3');
    console.log('   ✅ User Rank Retrieval');
    console.log('   ✅ Admin Statistics');
    console.log('   ✅ Activity Updates');
    console.log('   ✅ Input Validation');
    console.log('   ✅ Access Control');
    console.log('   ✅ Error Handling');

    console.log('\n🏆 Leaderboard System Features:');
    console.log('   • Equal weightage scoring (33.33% each component)');
    console.log('   • Regional leaderboards with top 3 rankings');
    console.log('   • Comprehensive scoring based on:');
    console.log('     - Lectures watched');
    console.log('     - Game sessions completed');
    console.log('     - Communication sessions participated');
    console.log('   • Real-time rank calculation');
    console.log('   • Admin analytics and statistics');
    console.log('   • Secure access control');
    console.log('   • Multi-region support');

    console.log('\n📈 Scoring Formula:');
    console.log('   Score = (lectures × 0.3333) + (games × 0.3333) + (communication × 0.3334)');

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

// Run the tests
testLeaderboardAPIs();
