require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const Game = require('../models/Game');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected for seeding advanced pronunciation'))
  .catch(err => console.error('MongoDB connection error:', err));

// Advanced pronunciation game data
const advancedPronunciationGame = {
  title: "Pronunciation Practice - Intermediate Words",
  createdBy: "68a49c8ef8f87b569c22404e", // Admin user ID
  description: "Practice pronouncing intermediate English words with more complex sounds and stress patterns. Perfect for improving your accent and fluency.",
  gameType: "pronunciation",
  difficulty: "intermediate",
  level: 2,
  timeLimit: 360, // 6 minutes
  maxScore: 100,
  passingScore: 75,
  totalQuestions: 6,
  isPremium: true,
  requiresSubscription: true,
  categories: ["pronunciation", "intermediate", "complex sounds"],
  tags: ["intermediate", "pronunciation", "stress patterns", "difficult sounds"],
  questions: [
    {
      questionNumber: 1,
      questionText: "Pronunciation",
      questionType: "audio",
      points: 17,
      phonetic: "/prəˌnʌnsiˈeɪʃən/",
      example: "Good pronunciation is important for clear communication.",
      tips: "Say 'pro-NUN-see-AY-shun' with stress on the third syllable. The 'ci' sounds like 'sh'.",
      pronunciationGuide: "The word itself! Focus on the 'sh' sound in the middle.",
      explanation: "The way in which a word is pronounced or spoken."
    },
    {
      questionNumber: 2,
      questionText: "Comfortable",
      questionType: "audio",
      points: 17,
      phonetic: "/ˈkʌmftəbəl/",
      example: "This chair is very comfortable.",
      tips: "Say 'KUMF-ter-bul' with stress on the first syllable. The 'or' is often silent in fast speech.",
      pronunciationGuide: "Common word with tricky spelling. Practice the 'ft' combination.",
      explanation: "Feeling relaxed and at ease; not worried or anxious."
    },
    {
      questionNumber: 3,
      questionText: "Vegetable",
      questionType: "audio",
      points: 17,
      phonetic: "/ˈvedʒtəbəl/",
      example: "Eat your vegetables for good health.",
      tips: "Say 'VEJ-tuh-bul' with stress on the first syllable. The 'e' in the middle is often silent.",
      pronunciationGuide: "Healthy food from plants. Practice the 'veg' sound.",
      explanation: "A plant or part of a plant used as food, such as carrots or lettuce."
    },
    {
      questionNumber: 4,
      questionText: "February",
      questionType: "audio",
      points: 17,
      phonetic: "/ˈfebruəri/",
      example: "My birthday is in February.",
      tips: "Say 'FEB-roo-air-ee' with stress on the first syllable. The first 'r' is often silent.",
      pronunciationGuide: "Second month of the year. Tricky 'r' sounds.",
      explanation: "The second month of the year, between January and March."
    },
    {
      questionNumber: 5,
      questionText: "Restaurant",
      questionType: "audio",
      points: 16,
      phonetic: "/ˈrestərɑːnt/",
      example: "Let's go to a nice restaurant for dinner.",
      tips: "Say 'RES-tuh-rant' with stress on the first syllable. The 'au' sounds like 'aw'.",
      pronunciationGuide: "Place where you eat out. Practice the 'au' sound.",
      explanation: "A place where people pay to sit and eat meals that are cooked and served on the premises."
    },
    {
      questionNumber: 6,
      questionText: "Temperature",
      questionType: "audio",
      points: 16,
      phonetic: "/ˈtemprətʃər/",
      example: "The temperature is rising today.",
      tips: "Say 'TEM-pruh-chur' with stress on the first syllable. The 'a' in the middle is often silent.",
      pronunciationGuide: "How hot or cold something is. Practice the 'per' sound.",
      explanation: "The degree of hotness or coldness of a body or environment."
    }
  ]
};

// Function to seed the advanced pronunciation game
const seedAdvancedPronunciation = async () => {
  try {
    console.log('🌱 Starting to seed advanced pronunciation game...');
    
    // Check if the game already exists
    const existingGame = await Game.findOne({ 
      title: "Pronunciation Practice - Intermediate Words",
      gameType: "pronunciation"
    });
    
    if (existingGame) {
      console.log('📝 Advanced pronunciation game already exists, updating...');
      await Game.findByIdAndUpdate(existingGame._id, advancedPronunciationGame);
      console.log('✅ Advanced pronunciation game updated successfully');
    } else {
      // Create new game
      const createdGame = await Game.create(advancedPronunciationGame);
      console.log('✅ Advanced pronunciation game created successfully');
      console.log(`📝 Created: ${createdGame.title} - ${createdGame.questions.length} questions`);
    }
    
    console.log('\n🎮 Advanced pronunciation seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding advanced pronunciation:', error);
    process.exit(1);
  }
};

// Run the seeding
seedAdvancedPronunciation();
