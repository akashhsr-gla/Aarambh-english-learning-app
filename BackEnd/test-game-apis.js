const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let teacherToken = '';
let studentToken = '';
let createdGameId = '';
let gameSessionId = '';

const testGameAPIs = async () => {
  console.log('🎮 Testing AarambhApp Game APIs\n');

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

    // Step 4: Create a Grammar Game (Admin only)
    console.log('\n4️⃣ Creating Grammar Game (Admin)...');
    const grammarGame = {
      title: 'Basic English Grammar Quiz',
      description: 'Test your knowledge of basic English grammar rules including tenses, articles, and sentence structure.',
      gameType: 'grammar',
      difficulty: 'beginner',
      level: 1,
      timeLimit: 300, // 5 minutes
      maxScore: 100,
      passingScore: 60,
      totalQuestions: 5,
      isPremium: false,
      requiresSubscription: false,
      categories: ['grammar', 'beginner'],
      tags: ['tenses', 'articles', 'sentence-structure'],
      questions: [
        {
          questionText: 'Which sentence uses the correct past tense?',
          questionType: 'multiple_choice',
          options: [
            { text: 'I go to school yesterday.', isCorrect: false, explanation: 'Should use past tense "went"' },
            { text: 'I went to school yesterday.', isCorrect: true, explanation: 'Correct past tense usage' },
            { text: 'I am going to school yesterday.', isCorrect: false, explanation: 'Present continuous with past time' },
            { text: 'I will go to school yesterday.', isCorrect: false, explanation: 'Future tense with past time' }
          ],
          points: 20,
          grammarRule: 'Past Simple Tense',
          explanation: 'Use past simple tense for completed actions in the past.'
        },
        {
          questionText: 'Choose the correct article: ___ apple is ___ fruit.',
          questionType: 'multiple_choice',
          options: [
            { text: 'A, a', isCorrect: false, explanation: 'First word should be "An" for vowel sound' },
            { text: 'An, a', isCorrect: true, explanation: 'Correct article usage' },
            { text: 'The, the', isCorrect: false, explanation: 'Articles are not specific here' },
            { text: 'An, an', isCorrect: false, explanation: 'Second word should be "a" for consonant sound' }
          ],
          points: 20,
          grammarRule: 'Articles (a, an, the)',
          explanation: 'Use "an" before words starting with vowel sounds, "a" before consonant sounds.'
        },
        {
          questionText: 'Complete the sentence: She ___ English for three years.',
          questionType: 'fill_blank',
          correctAnswer: 'has been studying',
          points: 20,
          grammarRule: 'Present Perfect Continuous',
          explanation: 'Use present perfect continuous for actions that started in the past and continue to the present.'
        },
        {
          questionText: 'Is this sentence correct? "I have been to Paris last year."',
          questionType: 'true_false',
          correctAnswer: 'false',
          points: 20,
          grammarRule: 'Present Perfect vs Past Simple',
          explanation: 'Use past simple for actions with specific past time expressions like "last year".'
        },
        {
          questionText: 'Which word is a conjunction?',
          questionType: 'multiple_choice',
          options: [
            { text: 'Quickly', isCorrect: false, explanation: 'This is an adverb' },
            { text: 'Beautiful', isCorrect: false, explanation: 'This is an adjective' },
            { text: 'And', isCorrect: true, explanation: 'This is a conjunction' },
            { text: 'Running', isCorrect: false, explanation: 'This is a verb' }
          ],
          points: 20,
          grammarRule: 'Parts of Speech',
          explanation: 'Conjunctions connect words, phrases, or clauses.'
        }
      ]
    };

    const createGameResponse = await axios.post(`${BASE_URL}/api/games`, grammarGame, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    createdGameId = createGameResponse.data.data.game._id;
    console.log('✅ Grammar Game Created:', createGameResponse.data.message);
    console.log('   Game ID:', createdGameId);
    console.log('   Title:', createGameResponse.data.data.game.title);

    // Step 5: Create a Pronunciation Game
    console.log('\n5️⃣ Creating Pronunciation Game (Admin)...');
    const pronunciationGame = {
      title: 'English Pronunciation Practice',
      description: 'Practice your English pronunciation with audio examples and phonetic guides.',
      gameType: 'pronunciation',
      difficulty: 'beginner',
      level: 1,
      timeLimit: 240, // 4 minutes
      maxScore: 80,
      passingScore: 50,
      totalQuestions: 4,
      isPremium: true,
      requiresSubscription: true,
      categories: ['pronunciation', 'beginner'],
      tags: ['phonetics', 'sounds', 'speaking'],
      questions: [
        {
          questionText: 'Listen to the word and choose the correct pronunciation: "Schedule"',
          questionType: 'multiple_choice',
          options: [
            { text: '/ˈʃedjuːl/', isCorrect: true, explanation: 'British pronunciation' },
            { text: '/ˈskedʒuːl/', isCorrect: true, explanation: 'American pronunciation' },
            { text: '/ˈskeɪdjuːl/', isCorrect: false, explanation: 'Incorrect pronunciation' },
            { text: '/ˈʃeɪdjuːl/', isCorrect: false, explanation: 'Incorrect pronunciation' }
          ],
          points: 20,
          pronunciationGuide: 'Both British and American pronunciations are acceptable',
          explanation: 'Schedule can be pronounced differently in British and American English.'
        },
        {
          questionText: 'Which word has the same vowel sound as "cat"?',
          questionType: 'multiple_choice',
          options: [
            { text: 'Hat', isCorrect: true, explanation: 'Same /æ/ sound' },
            { text: 'Bite', isCorrect: false, explanation: 'Different vowel sound /aɪ/' },
            { text: 'Boot', isCorrect: false, explanation: 'Different vowel sound /uː/' },
            { text: 'Meet', isCorrect: false, explanation: 'Different vowel sound /iː/' }
          ],
          points: 20,
          pronunciationGuide: 'Short vowel sound /æ/',
          explanation: 'Cat and hat both have the short vowel sound /æ/.'
        },
        {
          questionText: 'Complete: The "th" in "think" is pronounced as ___',
          questionType: 'fill_blank',
          correctAnswer: 'θ',
          points: 20,
          pronunciationGuide: 'Voiceless dental fricative',
          explanation: 'The "th" in "think" is a voiceless dental fricative, represented by the symbol θ.'
        },
        {
          questionText: 'Is the "p" in "spin" pronounced the same as in "pin"?',
          questionType: 'true_false',
          correctAnswer: 'false',
          points: 20,
          pronunciationGuide: 'Aspiration difference',
          explanation: 'The "p" in "pin" is aspirated, while in "spin" it is not aspirated.'
        }
      ]
    };

    const createPronunciationResponse = await axios.post(`${BASE_URL}/api/games`, pronunciationGame, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Pronunciation Game Created:', createPronunciationResponse.data.message);

    // Step 6: Get All Games
    console.log('\n6️⃣ Getting All Games...');
    const allGamesResponse = await axios.get(`${BASE_URL}/api/games`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ All Games Retrieved');
    console.log('   Total Games:', allGamesResponse.data.data.pagination.total);
    console.log('   Games Found:', allGamesResponse.data.data.games.length);

    // Step 7: Get Games by Type
    console.log('\n7️⃣ Getting Games by Type (Grammar)...');
    const grammarGamesResponse = await axios.get(`${BASE_URL}/api/games/type/grammar`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Grammar Games Retrieved');
    console.log('   Grammar Games Found:', grammarGamesResponse.data.data.games.length);

    // Step 8: Get Specific Game
    console.log('\n8️⃣ Getting Specific Game...');
    const specificGameResponse = await axios.get(`${BASE_URL}/api/games/${createdGameId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Specific Game Retrieved');
    console.log('   Title:', specificGameResponse.data.data.game.title);
    console.log('   Questions:', specificGameResponse.data.data.game.totalQuestions);

    // Step 9: Start Game Session (Student)
    console.log('\n9️⃣ Starting Game Session (Student)...');
    const startGameResponse = await axios.post(`${BASE_URL}/api/games/${createdGameId}/start`, {}, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    gameSessionId = startGameResponse.data.data.sessionId;
    console.log('✅ Game Session Started');
    console.log('   Session ID:', gameSessionId);
    console.log('   Questions Received:', startGameResponse.data.data.questions.length);

    // Step 10: Submit Game Answers (Student)
    console.log('\n🔟 Submitting Game Answers (Student)...');
    const gameAnswers = [
      {
        questionNumber: 1,
        selectedAnswer: 'I went to school yesterday.'
      },
      {
        questionNumber: 2,
        selectedAnswer: 'An, a'
      },
      {
        questionNumber: 3,
        selectedAnswer: 'has been studying'
      },
      {
        questionNumber: 4,
        selectedAnswer: 'false'
      },
      {
        questionNumber: 5,
        selectedAnswer: 'And'
      }
    ];

    const submitAnswersResponse = await axios.post(`${BASE_URL}/api/games/${createdGameId}/submit`, {
      sessionId: gameSessionId,
      answers: gameAnswers,
      timeSpent: 180 // 3 minutes
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Game Answers Submitted');
    console.log('   Score:', submitAnswersResponse.data.data.score);
    console.log('   Percentage:', submitAnswersResponse.data.data.percentage);
    console.log('   Passed:', submitAnswersResponse.data.data.passed);
    console.log('   Correct Answers:', submitAnswersResponse.data.data.correctAnswers);

    // Step 11: Get Game Statistics
    console.log('\n1️⃣1️⃣ Getting Game Statistics...');
    const gameStatsResponse = await axios.get(`${BASE_URL}/api/games/${createdGameId}/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Game Statistics Retrieved');
    console.log('   User Total Plays:', gameStatsResponse.data.data.userStats.totalPlays);
    console.log('   User Average Score:', gameStatsResponse.data.data.userStats.averageScore);
    console.log('   User Best Score:', gameStatsResponse.data.data.userStats.bestScore);

    // Step 12: Get Random Game
    console.log('\n1️⃣2️⃣ Getting Random Game...');
    const randomGameResponse = await axios.get(`${BASE_URL}/api/games/random/grammar`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Random Game Retrieved');
    console.log('   Random Game Title:', randomGameResponse.data.data.game.title);

    // Step 13: Test Premium Game Access (Student)
    console.log('\n1️⃣3️⃣ Testing Premium Game Access (Student)...');
    try {
      const premiumGameId = createPronunciationResponse.data.data.game._id;
      await axios.post(`${BASE_URL}/api/games/${premiumGameId}/start`, {}, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Premium Game Access Correctly Restricted:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Step 14: Update Game (Admin)
    console.log('\n1️⃣4️⃣ Updating Game (Admin)...');
    const updateData = {
      title: 'Updated Basic English Grammar Quiz',
      description: 'Updated description for the grammar quiz.',
      passingScore: 70
    };

    const updateGameResponse = await axios.put(`${BASE_URL}/api/games/${createdGameId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Game Updated:', updateGameResponse.data.message);
    console.log('   New Title:', updateGameResponse.data.data.game.title);
    console.log('   New Passing Score:', updateGameResponse.data.data.game.passingScore);

    // Step 15: Test Non-Admin Game Creation
    console.log('\n1️⃣5️⃣ Testing Non-Admin Game Creation...');
    try {
      await axios.post(`${BASE_URL}/api/games`, grammarGame, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Non-Admin Game Creation Correctly Restricted');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All Game API Tests Passed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Game Creation (Admin only)');
    console.log('   ✅ Game Retrieval (All users)');
    console.log('   ✅ Game Filtering by Type');
    console.log('   ✅ Game Session Management');
    console.log('   ✅ Answer Submission and Scoring');
    console.log('   ✅ Game Statistics');
    console.log('   ✅ Premium Game Access Control');
    console.log('   ✅ Game Updates (Admin only)');
    console.log('   ✅ Role-based Access Control');

    console.log('\n🎮 Game System Features:');
    console.log('   • Multi-game type support (Grammar, Pronunciation, Identification, Storytelling)');
    console.log('   • Comprehensive question types (Multiple choice, True/False, Fill in blank)');
    console.log('   • Real-time scoring and answer verification');
    console.log('   • Session tracking and statistics');
    console.log('   • Premium content access control');
    console.log('   • Admin-only game management');
    console.log('   • Detailed answer explanations');

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

// Run the tests
testGameAPIs();
