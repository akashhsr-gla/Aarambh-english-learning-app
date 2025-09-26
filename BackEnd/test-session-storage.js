const { default: fetch } = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'test@test.com',
  password: 'Test@123'
};

let authToken = '';

async function login() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const result = await response.json();
    
    if (result.success) {
      authToken = result.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testGameSessionCreation() {
  try {
    console.log('\n🎮 Testing Game Session Creation...');
    
    const response = await fetch(`${API_BASE_URL}/sessions/games/create-or-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        gameId: 'test-game-id',
        gameType: 'grammar',
        difficulty: 'medium',
        currentQuestionIndex: 2,
        timeLeft: 180,
        answers: [],
        score: 20,
        totalQuestions: 10
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Game session created successfully');
      console.log('   Session ID:', result.data.sessionId);
      return result.data.sessionId;
    } else {
      console.log('❌ Game session creation failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Game session creation error:', error.message);
    return null;
  }
}

async function testActiveGameSession() {
  try {
    console.log('\n📱 Testing Active Game Session Retrieval...');
    
    const response = await fetch(`${API_BASE_URL}/sessions/games/active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      if (result.data) {
        console.log('✅ Active game session found');
        console.log('   Game Type:', result.data.gameSession?.gameType);
        console.log('   Current Question:', result.data.gameSession?.currentQuestionIndex);
        console.log('   Time Left:', result.data.gameSession?.timeLeft);
        console.log('   Score:', result.data.gameSession?.scores?.[0]?.score || 'No score yet');
      } else {
        console.log('✅ No active game session (expected if none exists)');
      }
      return true;
    } else {
      console.log('❌ Active game session retrieval failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Active game session retrieval error:', error.message);
    return false;
  }
}

async function testGroupSessionCreation() {
  try {
    console.log('\n👥 Testing Group Session Creation...');
    
    const response = await fetch(`${API_BASE_URL}/sessions/groups/create-or-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        groupId: 'test-group-id',
        groupName: 'Test Discussion Group',
        topic: 'English Learning',
        level: 'intermediate',
        discussionType: 'chat',
        maxParticipants: 8,
        isPrivate: false
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Group session created successfully');
      console.log('   Session ID:', result.data.sessionId);
      return result.data.sessionId;
    } else {
      console.log('❌ Group session creation failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Group session creation error:', error.message);
    return null;
  }
}

async function testActiveGroupSession() {
  try {
    console.log('\n🗣️ Testing Active Group Session Retrieval...');
    
    const response = await fetch(`${API_BASE_URL}/sessions/groups/active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      if (result.data) {
        console.log('✅ Active group session found');
        console.log('   Group Name:', result.data.groupSession?.groupName);
        console.log('   Topic:', result.data.groupSession?.topic);
        console.log('   Level:', result.data.groupSession?.level);
        console.log('   Discussion Type:', result.data.groupSession?.discussionType);
      } else {
        console.log('✅ No active group session (expected if none exists)');
      }
      return true;
    } else {
      console.log('❌ Active group session retrieval failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Active group session retrieval error:', error.message);
    return false;
  }
}

async function testRecentSessions() {
  try {
    console.log('\n📚 Testing Recent Sessions Retrieval...');
    
    const response = await fetch(`${API_BASE_URL}/sessions/recent?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Retrieved ${result.data.count} recent sessions`);
      result.data.sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.sessionType}: ${session.title}`);
      });
      return true;
    } else {
      console.log('❌ Recent sessions retrieval failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Recent sessions retrieval error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Session Storage Tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Tests failed - could not login');
    return;
  }

  // Test game sessions
  const gameSessionId = await testGameSessionCreation();
  if (gameSessionId) {
    await testActiveGameSession();
  }

  // Test group sessions
  const groupSessionId = await testGroupSessionCreation();
  if (groupSessionId) {
    await testActiveGroupSession();
  }

  // Test recent sessions
  await testRecentSessions();

  console.log('\n🎉 Session storage tests completed!');
}

// Run the tests
runTests().catch(console.error);
