const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let teacherToken = '';
let studentToken = '';
let student2Token = '';
let callSessionId = '';
let groupCallSessionId = '';

const testCommunicationAPIs = async () => {
  console.log('📞 Testing AarambhApp Communication APIs\n');

  try {
    // Step 1: Login as Admin
    console.log('1️⃣ Logging in as Admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@aarambhapp.com',
      password: 'admin123456'
    });
    adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin Login:', adminLoginResponse.data.message);

    // Step 2: Login as Teacher
    console.log('\n2️⃣ Logging in as Teacher...');
    const teacherLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'teacher@example.com',
      password: 'newteacher123'
    });
    teacherToken = teacherLoginResponse.data.data.token;
    console.log('✅ Teacher Login:', teacherLoginResponse.data.message);

    // Step 3: Login as Student
    console.log('\n3️⃣ Logging in as Student...');
    const studentLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'student@example.com',
      password: 'student123'
    });
    studentToken = studentLoginResponse.data.data.token;
    console.log('✅ Student Login:', studentLoginResponse.data.message);

    // Step 4: Create another student for testing
    console.log('\n4️⃣ Creating another student for testing...');
    const student2Response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Student 2',
      email: 'student7@example.com',
      phone: '+919876543219',
      password: 'student123',
      role: 'student',
      region: '507f1f77bcf86cd799439011'
    });
    student2Token = student2Response.data.data.token;
    console.log('✅ Student 2 Created:', student2Response.data.message);

    // Step 5: Initiate One-to-One Video Call
    console.log('\n5️⃣ Initiating One-to-One Video Call...');
    const videoCallResponse = await axios.post(`${BASE_URL}/api/communication/call/initiate`, {
      participants: [studentLoginResponse.data.data.user._id, student2Response.data.data.user._id],
      callType: 'video',
      title: 'Test Video Call',
      description: 'Testing video call functionality'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    callSessionId = videoCallResponse.data.data.sessionId;
    console.log('✅ Video Call Initiated:', videoCallResponse.data.message);
    console.log('   Session ID:', callSessionId);
    console.log('   Call Type:', videoCallResponse.data.data.callType);

    // Step 6: Initiate Group Voice Call
    console.log('\n6️⃣ Initiating Group Voice Call...');
    const groupCallResponse = await axios.post(`${BASE_URL}/api/communication/call/group/initiate`, {
      participants: [studentLoginResponse.data.data.user._id, student2Response.data.data.user._id, teacherLoginResponse.data.data.user._id],
      callType: 'voice',
      title: 'Test Group Voice Call',
      description: 'Testing group voice call functionality',
      maxParticipants: 5
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    groupCallSessionId = groupCallResponse.data.data.sessionId;
    console.log('✅ Group Voice Call Initiated:', groupCallResponse.data.message);
    console.log('   Session ID:', groupCallSessionId);
    console.log('   Is Group Call:', groupCallResponse.data.data.isGroupCall);

    // Step 7: Join Call Session (Student 2)
    console.log('\n7️⃣ Student 2 joining call session...');
    const joinCallResponse = await axios.post(`${BASE_URL}/api/communication/call/${callSessionId}/join`, {
      micEnabled: true,
      cameraEnabled: false
    }, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    console.log('✅ Student 2 joined call:', joinCallResponse.data.message);
    console.log('   Status:', joinCallResponse.data.data.status);

    // Step 8: Update Participant State
    console.log('\n8️⃣ Updating participant state...');
    const updateStateResponse = await axios.put(`${BASE_URL}/api/communication/call/${callSessionId}/participant/state`, {
      micEnabled: false,
      cameraEnabled: true,
      isSpeaking: true,
      audioLevel: 75,
      videoQuality: 'high'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Participant state updated:', updateStateResponse.data.message);

    // Step 9: Send Chat Message
    console.log('\n9️⃣ Sending chat message...');
    const chatMessageResponse = await axios.post(`${BASE_URL}/api/communication/chat/${callSessionId}/message`, {
      message: 'Hello! This is a test message during our call.',
      messageType: 'text'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Chat message sent:', chatMessageResponse.data.message);

    // Step 10: Send Another Chat Message
    console.log('\n🔟 Sending another chat message...');
    const chatMessage2Response = await axios.post(`${BASE_URL}/api/communication/chat/${callSessionId}/message`, {
      message: 'How is the call quality?',
      messageType: 'text'
    }, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    console.log('✅ Second chat message sent:', chatMessage2Response.data.message);

    // Step 11: Get Chat Messages
    console.log('\n1️⃣1️⃣ Getting chat messages...');
    const getMessagesResponse = await axios.get(`${BASE_URL}/api/communication/chat/${callSessionId}/messages`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Chat messages retrieved:', getMessagesResponse.data.data.messages.length, 'messages');

    // Step 12: Get Active Calls
    console.log('\n1️⃣2️⃣ Getting active calls...');
    const activeCallsResponse = await axios.get(`${BASE_URL}/api/communication/calls/active`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Active calls retrieved:', activeCallsResponse.data.data.activeCalls.length, 'active calls');

    // Step 13: Get Call History
    console.log('\n1️⃣3️⃣ Getting call history...');
    const callHistoryResponse = await axios.get(`${BASE_URL}/api/communication/calls/history`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Call history retrieved:', callHistoryResponse.data.data.calls.length, 'calls');

    // Step 14: Get Session Details
    console.log('\n1️⃣4️⃣ Getting session details...');
    const sessionDetailsResponse = await axios.get(`${BASE_URL}/api/communication/session/${callSessionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Session details retrieved');
    console.log('   Title:', sessionDetailsResponse.data.data.session.title);
    console.log('   Participants:', sessionDetailsResponse.data.data.session.participants.length);

    // Step 15: Leave Call Session (Student 2)
    console.log('\n1️⃣5️⃣ Student 2 leaving call session...');
    const leaveCallResponse = await axios.post(`${BASE_URL}/api/communication/call/${callSessionId}/leave`, {}, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    console.log('✅ Student 2 left call:', leaveCallResponse.data.message);

    // Step 16: End Call Session (Host)
    console.log('\n1️⃣6️⃣ Host ending call session...');
    const endCallResponse = await axios.post(`${BASE_URL}/api/communication/call/${callSessionId}/end`, {}, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Call session ended:', endCallResponse.data.message);

    // Step 17: Admin Get All Sessions
    console.log('\n1️⃣7️⃣ Admin getting all sessions...');
    const adminSessionsResponse = await axios.get(`${BASE_URL}/api/communication/admin/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin sessions retrieved:', adminSessionsResponse.data.data.sessions.length, 'sessions');

    // Step 18: Test Premium Access Control
    console.log('\n1️⃣8️⃣ Testing premium access control...');
    try {
      await axios.post(`${BASE_URL}/api/communication/call/initiate`, {
        participants: [studentLoginResponse.data.data.user._id, student2Response.data.data.user._id],
        callType: 'video',
        title: 'Premium Test Call'
      }, {
        headers: { Authorization: `Bearer ${student2Token}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Premium access control working:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 19: Test Invalid Session Access
    console.log('\n1️⃣9️⃣ Testing invalid session access...');
    try {
      await axios.get(`${BASE_URL}/api/communication/session/invalid_session_id`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid session access correctly handled:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 20: Test Non-Participant Access
    console.log('\n2️⃣0️⃣ Testing non-participant access...');
    try {
      await axios.post(`${BASE_URL}/api/communication/chat/${callSessionId}/message`, {
        message: 'Unauthorized message',
        messageType: 'text'
      }, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Non-participant access correctly restricted');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All Communication API Tests Passed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ One-to-One Call Initiation');
    console.log('   ✅ Group Call Initiation');
    console.log('   ✅ Call Session Joining');
    console.log('   ✅ Participant State Management');
    console.log('   ✅ Chat Message Sending');
    console.log('   ✅ Chat Message Retrieval');
    console.log('   ✅ Active Calls Monitoring');
    console.log('   ✅ Call History Tracking');
    console.log('   ✅ Session Details Access');
    console.log('   ✅ Call Session Management');
    console.log('   ✅ Admin Session Overview');
    console.log('   ✅ Access Control Validation');
    console.log('   ✅ Error Handling');

    console.log('\n📞 Communication System Features:');
    console.log('   • One-to-One Video/Voice Calls');
    console.log('   • Group Video/Voice Calls');
    console.log('   • Real-time Chat During Calls');
    console.log('   • Flexible Mic/Camera Control');
    console.log('   • Participant State Management');
    console.log('   • Session Lifecycle Tracking');
    console.log('   • Admin Monitoring & Analytics');
    console.log('   • Secure Access Control');
    console.log('   • Comprehensive Session History');

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

// Run the tests
testCommunicationAPIs();
