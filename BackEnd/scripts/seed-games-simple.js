require('dotenv').config({ path: './env.local' });
const mongoose = require('mongoose');
const Game = require('../models/Game');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected for seeding games'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample game data for all 4 types with correct structure
const gamesData = [
  {
    title: "Grammar Fundamentals - Level 1",
    createdBy: "68a49c8ef8f87b569c22404e", // Admin user ID
    description: "Basic grammar rules including parts of speech, sentence structure, and common mistakes. Perfect for beginners learning English grammar.",
    gameType: "grammar",
    difficulty: "beginner",
    level: 1,
    timeLimit: 300, // 5 minutes
    maxScore: 100,
    passingScore: 70,
    totalQuestions: 5,
    isPremium: false,
    requiresSubscription: false,
    categories: ["grammar", "beginner", "fundamentals"],
    tags: ["parts of speech", "sentence structure", "basic rules"],
    questions: [
      {
        questionNumber: 1,
        questionText: "Which word is a noun in the sentence: 'The cat sleeps peacefully'?",
        questionType: "multiple_choice",
        points: 20,
        options: [
          { text: "The", isCorrect: false, explanation: "This is an article, not a noun." },
          { text: "cat", isCorrect: true, explanation: "A noun is a person, place, thing, or idea. 'Cat' is a thing." },
          { text: "sleeps", isCorrect: false, explanation: "This is a verb, not a noun." },
          { text: "peacefully", isCorrect: false, explanation: "This is an adverb, not a noun." }
        ],
        correctAnswer: "cat",
        explanation: "A noun is a person, place, thing, or idea. 'Cat' is a thing."
      },
      {
        questionNumber: 2,
        questionText: "Choose the correct verb form: 'She _____ to school every day.'",
        questionType: "multiple_choice",
        points: 20,
        options: [
          { text: "go", isCorrect: false, explanation: "This is the base form, not correct for third person singular." },
          { text: "goes", isCorrect: true, explanation: "With singular third person (she), we use 'goes'." },
          { text: "going", isCorrect: false, explanation: "This is the present participle, not the simple present." },
          { text: "gone", isCorrect: false, explanation: "This is the past participle, not the simple present." }
        ],
        correctAnswer: "goes",
        explanation: "With singular third person (she), we use 'goes'."
      },
      {
        questionNumber: 3,
        questionText: "Which sentence is grammatically correct?",
        questionType: "multiple_choice",
        points: 20,
        options: [
          { text: "I am going to the store yesterday.", isCorrect: false, explanation: "Present continuous cannot be used with past time." },
          { text: "I went to the store yesterday.", isCorrect: true, explanation: "Past tense 'went' is correct for past time 'yesterday'." },
          { text: "I going to the store yesterday.", isCorrect: false, explanation: "Missing auxiliary verb 'am' for present continuous." },
          { text: "I go to the store yesterday.", isCorrect: false, explanation: "Simple present cannot be used with past time." }
        ],
        correctAnswer: "I went to the store yesterday.",
        explanation: "Past tense 'went' is correct for past time 'yesterday'."
      },
      {
        questionNumber: 4,
        questionText: "Identify the adjective: 'The beautiful red car'",
        questionType: "multiple_choice",
        points: 20,
        options: [
          { text: "The", isCorrect: false, explanation: "This is an article, not an adjective." },
          { text: "beautiful", isCorrect: true, explanation: "Both 'beautiful' and 'red' are adjectives, but 'beautiful' describes quality." },
          { text: "red", isCorrect: false, explanation: "This is also an adjective, but 'beautiful' describes quality." },
          { text: "car", isCorrect: false, explanation: "This is a noun, not an adjective." }
        ],
        correctAnswer: "beautiful",
        explanation: "Both 'beautiful' and 'red' are adjectives, but 'beautiful' describes quality."
      },
      {
        questionNumber: 5,
        questionText: "Fill in the blank: 'There _____ many students in the class.'",
        questionType: "multiple_choice",
        points: 20,
        options: [
          { text: "is", isCorrect: false, explanation: "Use 'is' with singular nouns." },
          { text: "are", isCorrect: true, explanation: "Use 'are' with plural nouns like 'students'." },
          { text: "was", isCorrect: false, explanation: "This is past tense, not present." },
          { text: "be", isCorrect: false, explanation: "This is the base form, not the correct form." }
        ],
        correctAnswer: "are",
        explanation: "Use 'are' with plural nouns like 'students'."
      }
    ]
  },
  {
    title: "Pronunciation Practice - Basic Sounds",
    createdBy: "68a49c8ef8f87b569c22404e", // Admin user ID
    description: "Learn to pronounce basic English sounds correctly. Practice with common words and improve your accent.",
    gameType: "pronunciation",
    difficulty: "beginner",
    level: 1,
    timeLimit: 240, // 4 minutes
    maxScore: 100,
    passingScore: 75,
    totalQuestions: 4,
    isPremium: false,
    requiresSubscription: false,
    categories: ["pronunciation", "beginner", "sounds"],
    tags: ["basic sounds", "accent", "speech"],
    questions: [
      {
        questionNumber: 1,
        questionText: "Which word has the same vowel sound as 'meet'?",
        questionType: "multiple_choice",
        points: 25,
        options: [
          { text: "meat", isCorrect: true, explanation: "Both 'meet' and 'meat' have the long 'ee' sound." },
          { text: "met", isCorrect: false, explanation: "This has a short 'e' sound, not long 'ee'." },
          { text: "mate", isCorrect: false, explanation: "This has a long 'a' sound, not long 'ee'." },
          { text: "moot", isCorrect: false, explanation: "This has a long 'oo' sound, not long 'ee'." }
        ],
        correctAnswer: "meat",
        explanation: "Both 'meet' and 'meat' have the long 'ee' sound."
      },
      {
        questionNumber: 2,
        questionText: "Choose the word with the correct stress pattern: 'photograph'",
        questionType: "multiple_choice",
        points: 25,
        options: [
          { text: "PHO-to-graph", isCorrect: true, explanation: "Primary stress is on the first syllable in 'photograph'." },
          { text: "pho-TO-graph", isCorrect: false, explanation: "This puts stress on the middle syllable." },
          { text: "pho-to-GRAPH", isCorrect: false, explanation: "This puts stress on the last syllable." },
          { text: "pho-to-graph", isCorrect: false, explanation: "This has no stress pattern indicated." }
        ],
        correctAnswer: "PHO-to-graph",
        explanation: "Primary stress is on the first syllable in 'photograph'."
      },
      {
        questionNumber: 3,
        questionText: "Which word rhymes with 'light'?",
        questionType: "multiple_choice",
        points: 25,
        options: [
          { text: "late", isCorrect: false, explanation: "This has a long 'a' sound, not long 'i'." },
          { text: "lit", isCorrect: false, explanation: "This has a short 'i' sound, not long 'i'." },
          { text: "bite", isCorrect: false, explanation: "This has a long 'i' sound but different ending." },
          { text: "night", isCorrect: true, explanation: "Both 'light' and 'night' end with the same sound." }
        ],
        correctAnswer: "night",
        explanation: "Both 'light' and 'night' end with the same sound."
      },
      {
        questionNumber: 4,
        questionText: "Identify the word with a silent letter:",
        questionType: "multiple_choice",
        points: 25,
        options: [
          { text: "know", isCorrect: true, explanation: "The 'k' in 'know' is silent." },
          { text: "now", isCorrect: false, explanation: "All letters in 'now' are pronounced." },
          { text: "new", isCorrect: false, explanation: "All letters in 'new' are pronounced." },
          { text: "knee", isCorrect: false, explanation: "The 'k' in 'knee' is silent, but this is not the primary example." }
        ],
        correctAnswer: "know",
        explanation: "The 'k' in 'know' is silent."
      }
    ]
  },
  {
    title: "Object Identification - Everyday Items",
    createdBy: "68a49c8ef8f87b569c22404e", // Admin user ID
    description: "Identify common objects from images. Test your vocabulary and recognition skills with everyday items.",
    gameType: "identification",
    difficulty: "beginner",
    level: 1,
    timeLimit: 180, // 3 minutes
    maxScore: 100,
    passingScore: 80,
    totalQuestions: 4,
    isPremium: false,
    requiresSubscription: false,
    categories: ["identification", "beginner", "vocabulary"],
    tags: ["objects", "vocabulary", "recognition"],
    questions: [
      {
        questionNumber: 1,
        questionText: "What is this object? (Image shows a pencil)",
        questionType: "image",
        points: 25,
        options: [
          { text: "pen", isCorrect: false, explanation: "A pen uses ink, not graphite." },
          { text: "pencil", isCorrect: true, explanation: "This is a pencil, a writing instrument with graphite." },
          { text: "marker", isCorrect: false, explanation: "A marker is thicker and uses ink." },
          { text: "crayon", isCorrect: false, explanation: "A crayon is made of wax, not graphite." }
        ],
        correctAnswer: "pencil",
        explanation: "This is a pencil, a writing instrument with graphite."
      },
      {
        questionNumber: 2,
        questionText: "Identify the object in the image: (Image shows a book)",
        questionType: "image",
        points: 25,
        options: [
          { text: "magazine", isCorrect: false, explanation: "A magazine is thinner and has different content." },
          { text: "book", isCorrect: true, explanation: "This is a book with a hard cover and pages." },
          { text: "notebook", isCorrect: false, explanation: "A notebook is for writing, not reading." },
          { text: "diary", isCorrect: false, explanation: "A diary is personal and usually has a lock." }
        ],
        correctAnswer: "book",
        explanation: "This is a book with a hard cover and pages."
      },
      {
        questionNumber: 3,
        questionText: "What do you see in this picture? (Image shows a car)",
        questionType: "image",
        points: 25,
        options: [
          { text: "bus", isCorrect: false, explanation: "A bus is larger and carries many passengers." },
          { text: "car", isCorrect: true, explanation: "This is a car, a four-wheeled passenger vehicle." },
          { text: "truck", isCorrect: false, explanation: "A truck is larger and used for carrying goods." },
          { text: "motorcycle", isCorrect: false, explanation: "A motorcycle has only two wheels." }
        ],
        correctAnswer: "car",
        explanation: "This is a car, a four-wheeled passenger vehicle."
      },
      {
        questionNumber: 4,
        questionText: "What object is this? (Image shows a clock)",
        questionType: "image",
        points: 25,
        options: [
          { text: "watch", isCorrect: false, explanation: "A watch is worn on the wrist." },
          { text: "clock", isCorrect: true, explanation: "This is a clock that shows the time." },
          { text: "timer", isCorrect: false, explanation: "A timer counts down, not shows current time." },
          { text: "alarm", isCorrect: false, explanation: "An alarm makes noise at a set time." }
        ],
        correctAnswer: "clock",
        explanation: "This is a clock that shows the time."
      }
    ]
  },
  {
    title: "Story Creation - Creative Writing",
    createdBy: "68a49c8ef8f87b569c22404e", // Admin user ID
    description: "Create stories using given keywords. Develop your imagination and writing skills with guided storytelling.",
    gameType: "storytelling",
    difficulty: "beginner",
    level: 1,
    timeLimit: 600, // 10 minutes
    maxScore: 100,
    passingScore: 70,
    totalQuestions: 3,
    isPremium: false,
    requiresSubscription: false,
    categories: ["storytelling", "beginner", "creative writing"],
    tags: ["story", "writing", "imagination", "keywords"],
    questions: [
      {
        questionNumber: 1,
        questionText: "Create a story using these keywords: 'forest', 'adventure', 'friendship', 'discovery'",
        questionType: "fill_blank",
        points: 33,
        keywords: ["forest", "adventure", "friendship", "discovery"],
        minWords: 50,
        explanation: "Write a story that naturally incorporates all the given keywords."
      },
      {
        questionNumber: 2,
        questionText: "Write a short story with these elements: 'magic', 'school', 'mystery', 'courage'",
        questionType: "fill_blank",
        points: 33,
        keywords: ["magic", "school", "mystery", "courage"],
        minWords: 60,
        explanation: "Create a story that includes all the magical elements."
      },
      {
        questionNumber: 3,
        questionText: "Tell a tale using: 'ocean', 'journey', 'family', 'hope'",
        questionType: "fill_blank",
        points: 34,
        keywords: ["ocean", "journey", "family", "hope"],
        minWords: 55,
        explanation: "Write about a family's journey across the ocean."
      }
    ]
  }
];

// Function to seed games
const seedGames = async () => {
  try {
    console.log('🌱 Starting to seed games...');
    
    // Clear existing games
    await Game.deleteMany({});
    console.log('🗑️ Cleared existing games');
    
    // Insert new games
    const createdGames = await Game.insertMany(gamesData);
    console.log(`✅ Successfully created ${createdGames.length} games`);
    
    // Log created games
    createdGames.forEach(game => {
      console.log(`📝 Created: ${game.title} (${game.gameType}) - ${game.questions.length} questions`);
    });
    
    console.log('\n🎮 Games seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Grammar Game: ${createdGames[0].questions.length} questions`);
    console.log(`   • Pronunciation Game: ${createdGames[1].questions.length} questions`);
    console.log(`   • Identification Game: ${createdGames[2].questions.length} questions`);
    console.log(`   • Storytelling Game: ${createdGames[3].questions.length} questions`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding games:', error);
    process.exit(1);
  }
};

// Run the seeding
seedGames();
