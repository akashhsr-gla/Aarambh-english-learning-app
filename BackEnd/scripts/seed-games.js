const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
require('dotenv').config({ path: './env.local' });

const seedGames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found. Please run seed-admin.js first.');
      process.exit(1);
    }

    // Clear existing games
    await Game.deleteMany({});
    console.log('Cleared existing games');

    // 1. Grammar Game - Advanced
    const advancedGrammarGame = new Game({
      title: 'Advanced English Grammar Mastery',
      description: 'Test your knowledge of complex English grammar including subjunctive mood, passive voice, and advanced tenses.',
      gameType: 'grammar',
      difficulty: 'advanced',
      level: 3,
      timeLimit: 600, // 10 minutes
      maxScore: 150,
      passingScore: 90,
      totalQuestions: 6,
      isPremium: true,
      requiresSubscription: true,
      categories: ['grammar', 'advanced'],
      tags: ['subjunctive', 'passive-voice', 'advanced-tenses'],
      createdBy: admin._id,
      questions: [
        {
          questionNumber: 1,
          questionText: 'Which sentence uses the subjunctive mood correctly?',
          questionType: 'multiple_choice',
          options: [
            { text: 'If I was rich, I would travel the world.', isCorrect: false, explanation: 'Should use "were" for subjunctive' },
            { text: 'If I were rich, I would travel the world.', isCorrect: true, explanation: 'Correct subjunctive usage' },
            { text: 'If I am rich, I will travel the world.', isCorrect: false, explanation: 'This is conditional, not subjunctive' },
            { text: 'If I had been rich, I would have traveled the world.', isCorrect: false, explanation: 'This is past perfect conditional' }
          ],
          points: 25,
          grammarRule: 'Subjunctive Mood',
          explanation: 'Use "were" instead of "was" in subjunctive mood for hypothetical situations.'
        },
        {
          questionNumber: 2,
          questionText: 'Convert to passive voice: "The committee approved the proposal."',
          questionType: 'fill_blank',
          correctAnswer: 'The proposal was approved by the committee',
          points: 25,
          grammarRule: 'Passive Voice',
          explanation: 'In passive voice, the object becomes the subject and the verb uses "be" + past participle.'
        }
      ]
    });

    // 2. Identification Game
    const identificationGame = new Game({
      title: 'English Word Categories',
      description: 'Identify and categorize English words based on their parts of speech and meanings.',
      gameType: 'identification',
      difficulty: 'intermediate',
      level: 2,
      timeLimit: 300, // 5 minutes
      maxScore: 100,
      passingScore: 70,
      totalQuestions: 5,
      isPremium: false,
      requiresSubscription: false,
      categories: ['identification', 'intermediate'],
      tags: ['parts-of-speech', 'word-categories', 'vocabulary'],
      createdBy: admin._id,
      questions: [
        {
          questionNumber: 1,
          questionText: 'Which of these words is a noun?',
          questionType: 'multiple_choice',
          options: [
            { text: 'Beautiful', isCorrect: false, explanation: 'This is an adjective' },
            { text: 'Quickly', isCorrect: false, explanation: 'This is an adverb' },
            { text: 'Happiness', isCorrect: true, explanation: 'This is a noun' },
            { text: 'Running', isCorrect: false, explanation: 'This is a verb' }
          ],
          points: 20,
          wordCategory: 'Parts of Speech',
          explanation: 'Nouns are words that name people, places, things, or ideas.'
        },
        {
          questionNumber: 2,
          questionText: 'Identify the synonym for "enormous":',
          questionType: 'multiple_choice',
          options: [
            { text: 'Tiny', isCorrect: false, explanation: 'This is an antonym' },
            { text: 'Huge', isCorrect: true, explanation: 'This is a synonym' },
            { text: 'Average', isCorrect: false, explanation: 'This is neither synonym nor antonym' },
            { text: 'Small', isCorrect: false, explanation: 'This is an antonym' }
          ],
          points: 20,
          wordCategory: 'Synonyms and Antonyms',
          explanation: 'Synonyms are words with similar meanings.'
        }
      ]
    });

    // 3. Storytelling Game
    const storytellingGame = new Game({
      title: 'Creative Story Building',
      description: 'Build creative stories using given prompts and vocabulary words.',
      gameType: 'storytelling',
      difficulty: 'beginner',
      level: 1,
      timeLimit: 480, // 8 minutes
      maxScore: 120,
      passingScore: 80,
      totalQuestions: 4,
      isPremium: true,
      requiresSubscription: true,
      categories: ['storytelling', 'beginner'],
      tags: ['creative-writing', 'story-building', 'vocabulary'],
      createdBy: admin._id,
      questions: [
        {
          questionNumber: 1,
          questionText: 'Complete the story: "Once upon a time, there was a brave ___ who lived in a magical forest."',
          questionType: 'fill_blank',
          correctAnswer: 'knight',
          points: 30,
          storyContext: 'Fantasy Adventure',
          explanation: 'A knight fits well in a magical forest setting and can be described as brave.'
        },
        {
          questionNumber: 2,
          questionText: 'Choose the best word to continue: "The forest was filled with ___ trees and mysterious sounds."',
          questionType: 'multiple_choice',
          options: [
            { text: 'tall', isCorrect: true, explanation: 'Tall trees create a mysterious forest atmosphere' },
            { text: 'short', isCorrect: false, explanation: 'Short trees don\'t fit the mysterious forest theme' },
            { text: 'red', isCorrect: false, explanation: 'Color doesn\'t add to the mysterious atmosphere' },
            { text: 'old', isCorrect: false, explanation: 'While old could work, tall is more descriptive' }
          ],
          points: 30,
          storyContext: 'Forest Description',
          explanation: 'Tall trees help create the mysterious and magical atmosphere of the forest.'
        }
      ]
    });

    // 4. Pronunciation Game - Intermediate
    const intermediatePronunciationGame = new Game({
      title: 'Intermediate Pronunciation Challenge',
      description: 'Practice intermediate-level English pronunciation with focus on stress patterns and intonation.',
      gameType: 'pronunciation',
      difficulty: 'intermediate',
      level: 2,
      timeLimit: 360, // 6 minutes
      maxScore: 100,
      passingScore: 75,
      totalQuestions: 5,
      isPremium: true,
      requiresSubscription: true,
      categories: ['pronunciation', 'intermediate'],
      tags: ['stress-patterns', 'intonation', 'phonetics'],
      createdBy: admin._id,
      questions: [
        {
          questionNumber: 1,
          questionText: 'Which word has the primary stress on the second syllable?',
          questionType: 'multiple_choice',
          options: [
            { text: 'PHOto', isCorrect: false, explanation: 'Stress on first syllable' },
            { text: 'phoTOgraph', isCorrect: true, explanation: 'Stress on second syllable' },
            { text: 'PHOtoGRApher', isCorrect: false, explanation: 'Stress on first and third syllables' },
            { text: 'phoTOgraphic', isCorrect: false, explanation: 'Stress on second syllable, but this is the answer' }
          ],
          points: 20,
          pronunciationGuide: 'Primary stress patterns in compound words',
          explanation: 'In compound words, stress often falls on the second element.'
        },
        {
          questionNumber: 2,
          questionText: 'Complete: The word "record" as a noun has stress on the ___ syllable.',
          questionType: 'fill_blank',
          correctAnswer: 'first',
          points: 20,
          pronunciationGuide: 'Noun vs verb stress patterns',
          explanation: 'Nouns often have stress on the first syllable, while verbs have stress on the second.'
        }
      ]
    });

    // Save all games
    const games = [
      advancedGrammarGame,
      identificationGame,
      storytellingGame,
      intermediatePronunciationGame
    ];

    const savedGames = await Game.insertMany(games);
    console.log(`Created ${savedGames.length} games:`);
    
    savedGames.forEach(game => {
      console.log(`- ${game.title} (${game.gameType}, ${game.difficulty})`);
    });

    console.log('\nGames seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding games:', error);
    process.exit(1);
  }
};

seedGames();
