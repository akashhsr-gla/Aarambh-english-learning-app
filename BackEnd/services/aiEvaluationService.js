const { OpenAI } = require('openai');
const fs = require('fs');

class AIEvaluationService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not configured in environment variables');
      throw new Error('OpenAI API key is not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('✅ AI Evaluation Service initialized with OpenAI API key');
  }

  // Transcribe audio using OpenAI Whisper API
  async transcribeAudio(audioFilePath) {
    try {
      console.log(`🎤 Transcribing audio file: ${audioFilePath}`);
      
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      // Create a read stream for the audio file
      const audioStream = fs.createReadStream(audioFilePath);

      // Call Whisper API for transcription
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-1",
        language: "en", // English language
        response_format: "json"
      });

      console.log(`✅ Transcription successful: "${transcription.text}"`);
      return transcription.text;
      
    } catch (error) {
      console.error('❌ Whisper transcription error:', error);
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
  }

  // Evaluate pronunciation from audio file directly
  async evaluatePronunciationFromAudio({ audioFilePath, targetWord, difficulty = 'medium' }) {
    try {
      console.log(`🎯 Evaluating pronunciation from audio file for word: "${targetWord}"`);
      
      // Step 1: Transcribe audio using Whisper
      const transcription = await this.transcribeAudio(audioFilePath);
      
      // Step 2: Evaluate pronunciation using the transcription
      const evaluation = await this.evaluatePronunciation({
        transcription,
        targetWord,
        difficulty
      });
      
      // Add transcription to the result
      evaluation.transcription = transcription;
      
      console.log(`✅ Audio-based pronunciation evaluation completed`);
      return evaluation;
      
    } catch (error) {
      console.error('❌ Audio-based pronunciation evaluation error:', error);
      throw error;
    }
  }

  // Evaluate pronunciation based on audio transcription
  async evaluatePronunciation({ transcription, targetWord, difficulty = 'medium' }) {
    try {
      console.log(`🎯 Evaluating pronunciation: "${targetWord}" vs "${transcription}"`);
      
      const prompt = `
You are an expert English pronunciation evaluator with deep knowledge of phonetics, phonology, and language acquisition. Analyze the pronunciation accuracy meticulously:

Target Word: "${targetWord}"
User's Pronunciation (transcribed): "${transcription}"
Difficulty Level: ${difficulty}

EVALUATION CRITERIA (be strict but fair):

1. PHONETIC ACCURACY (40 points total):
   - Consonants (0-20): Evaluate individual consonant sounds. Check for:
     * Voicing (voiced vs voiceless: /p/ vs /b/, /t/ vs /d/)
     * Place of articulation (where sound is made: lips, teeth, tongue position)
     * Manner of articulation (stops, fricatives, nasals)
   - Vowels (0-20): Evaluate vowel quality and length. Check for:
     * Vowel height (high, mid, low)
     * Vowel backness (front, central, back)
     * Diphthongs vs monophthongs
     * Vowel length and tension

2. PROSODY & STRESS (30 points total):
   - Word Stress (0-15): Is the stressed syllable correct?
     * Primary stress placement
     * Secondary stress if applicable
   - Intonation (0-15): Natural speech melody
     * Rising vs falling intonation
     * Sentence-level prosody patterns

3. CLARITY & INTELLIGIBILITY (20 points total):
   - Overall clarity (0-10): Would a native speaker understand this?
   - Articulation precision (0-10): How clearly are sounds produced?

4. FLUENCY & NATURALNESS (10 points total):
   - Speech rate (0-5): Too fast, too slow, or natural?
   - Hesitations (0-5): Smooth production or choppy?

SCORING GUIDELINES:
- 95-100: Native-like pronunciation, no detectable errors
- 90-94: Excellent, only very minor deviations
- 85-89: Very good, slight accent but highly intelligible
- 80-84: Good, some pronunciation errors but clear
- 70-79: Acceptable, noticeable errors but understandable
- 60-69: Fair, significant errors affecting clarity
- 50-59: Poor, many errors, difficult to understand
- 40-49: Very poor, major errors throughout
- 0-39: Extremely poor, nearly unintelligible

IMPORTANT: Compare the ACTUAL sounds made (from transcription) with the TARGET sounds. Consider:
- Is the transcription phonetically similar or completely different?
- Are there systematic errors (e.g., /th/ → /t/, /r/ → /w/)?
- Are errors typical for learners at this level?

Provide evaluation in this exact JSON format (no other text):
{
  "accuracy": (0-100, be precise and realistic),
  "feedback": "Detailed, specific, constructive feedback explaining EXACTLY which sounds were correct/incorrect and WHY. Reference specific phonemes and articulation. Be encouraging but honest.",
  "improvements": ["Specific actionable tip with phonetic guidance", "Another specific tip", "Focus on systematic errors first"],
  "score_breakdown": {
    "consonants": (0-20, evaluate each consonant sound),
    "vowels": (0-20, evaluate each vowel sound),
    "stress": (0-15, evaluate stress placement accuracy),
    "intonation": (0-15, evaluate prosody and melody),
    "clarity": (0-10, overall intelligibility),
    "articulation": (0-10, precision of sound production),
    "fluency": (0-10, smoothness and naturalness)
  },
  "phonetic_analysis": {
    "correct_sounds": ["list of sounds produced correctly"],
    "incorrect_sounds": ["list of sounds with errors and what was said instead"],
    "stress_pattern": "description of stress pattern (correct/incorrect)",
    "common_errors": ["typical learner errors detected"]
  },
  "grade": "A+/A/A-/B+/B/B-/C+/C/C-/D/F",
  "difficulty_appropriate": "Is performance good for this difficulty level? (yes/no with explanation)"
}

BE THOROUGH: This is language learning evaluation. Your feedback impacts learner progress. Be specific about WHAT was wrong and HOW to fix it.
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert English pronunciation evaluator with professional training in phonetics and language assessment. Respond ONLY with valid JSON. No additional text or explanations. Be thorough and precise in your evaluation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      let evaluation;
      try {
        const content = response.choices[0].message.content.trim();
        console.log('🤖 AI Response:', content);
        
        // Clean the response to ensure it's valid JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.log('Raw response:', response.choices[0].message.content);
        throw new Error('Failed to parse AI response as JSON');
      }
      
      // Validate required fields
      if (!evaluation.accuracy || typeof evaluation.accuracy !== 'number') {
        throw new Error('Invalid accuracy score from AI');
      }
      
      // Ensure accuracy is within valid range
      evaluation.accuracy = Math.max(0, Math.min(100, evaluation.accuracy));
      
      // Calculate final score based on difficulty
      const difficultyMultiplier = {
        'easy': 0.9,
        'medium': 1.0,
        'hard': 1.1
      };
      
      const finalScore = Math.min(100, Math.round(evaluation.accuracy * (difficultyMultiplier[difficulty] || 1.0)));
      
      const result = {
        accuracy: evaluation.accuracy,
        final_score: finalScore,
        feedback: evaluation.feedback || `Pronunciation accuracy: ${evaluation.accuracy}%`,
        improvements: evaluation.improvements || [],
        score_breakdown: evaluation.score_breakdown || {
          consonants: Math.round(evaluation.accuracy * 0.3),
          vowels: Math.round(evaluation.accuracy * 0.3),
          stress: Math.round(evaluation.accuracy * 0.2),
          fluency: Math.round(evaluation.accuracy * 0.2)
        },
        grade: evaluation.grade || (evaluation.accuracy >= 90 ? 'A' : evaluation.accuracy >= 80 ? 'B' : evaluation.accuracy >= 70 ? 'C' : evaluation.accuracy >= 60 ? 'D' : 'F'),
        evaluation_type: 'pronunciation'
      };
      
      console.log('✅ Pronunciation evaluation completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AI Pronunciation Evaluation Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        targetWord,
        transcription,
        difficulty
      });
      
      // Instead of fallback, throw error to be handled by the route
      throw new Error(`AI evaluation failed: ${error.message}`);
    }
  }

  // Evaluate story based on content, creativity, grammar, etc.
  async evaluateStory({ 
    story, 
    prompt, 
    keywords = [], 
    minWords = 50, 
    difficulty = 'medium',
    timeSpent = 0,
    maxTime = 300
  }) {
    try {
      const wordCount = story.trim().split(/\s+/).length;
      const keywordsUsed = keywords.filter(keyword => 
        story.toLowerCase().includes(keyword.toLowerCase())
      );

      const promptText = `
You are an expert creative writing instructor and English language evaluator with years of experience assessing student work. Provide a comprehensive, rigorous evaluation of this story.

STORY DETAILS:
Story Text: "${story}"
Writing Prompt/Theme: "${prompt}"
Required Keywords: [${keywords.join(', ')}]
Keywords Successfully Used: [${keywordsUsed.join(', ')}] (${keywordsUsed.length}/${keywords.length})
Word Count: ${wordCount} words (required minimum: ${minWords})
Time Taken: ${timeSpent} seconds (time limit: ${maxTime} seconds)
Difficulty Level: ${difficulty}

EVALUATION FRAMEWORK (Total: 100 points):

1. CREATIVITY & ORIGINALITY (25 points):
   - Unique ideas and fresh perspectives (0-10)
   - Imaginative plot elements and settings (0-8)
   - Character originality and depth (0-7)
   Scoring: 23-25=Exceptional, 20-22=Excellent, 17-19=Good, 14-16=Fair, <14=Needs improvement

2. GRAMMAR & MECHANICS (25 points):
   - Sentence structure variety and correctness (0-10)
   - Punctuation and capitalization (0-5)
   - Verb tense consistency (0-5)
   - Spelling accuracy (0-5)
   Scoring: Be strict. Each error reduces score. 23-25=Nearly perfect, 18-22=Few errors, 12-17=Several errors, <12=Many errors

3. VOCABULARY & LANGUAGE (20 points):
   - Word choice sophistication (0-8)
   - Descriptive language and imagery (0-7)
   - Avoiding repetition (0-5)
   Scoring: Evaluate vocabulary level appropriateness for difficulty: ${difficulty}

4. COHERENCE & STRUCTURE (15 points):
   - Logical story flow and progression (0-8)
   - Clear beginning, middle, and end (0-7)
   Scoring: Can reader follow the story easily? Is there a clear narrative arc?

5. KEYWORD INTEGRATION (15 points):
   - Natural integration of required keywords (0-10)
   - Relevance of keyword use to story (0-5)
   Scoring: ${keywordsUsed.length}/${keywords.length} keywords used. Deduct 3-5 points per missed keyword. Natural use scores higher than forced inclusion.

SCORING RUBRIC:
95-100: Publication-quality writing, exceptional in all areas
90-94: Excellent work, minor improvements needed
85-89: Very good, shows strong skills
80-84: Good, solid competent writing
70-79: Acceptable, noticeable room for improvement
60-69: Fair, significant issues but shows effort
50-59: Poor, major problems in multiple areas
40-49: Very poor, lacks basic competency
0-39: Extremely poor or minimal effort

Provide evaluation in this EXACT JSON format (no other text, must be valid JSON):
{
  "overall_score": (0-100, be precise and realistic based on actual story quality),
  "feedback": "Comprehensive, specific feedback covering all evaluation areas. Be detailed about what worked and what didn't. Reference specific parts of the story. Be encouraging but honest and instructive.",
  "strengths": ["Specific strength with example from story", "Another specific strength", "Third strength if applicable"],
  "improvements": ["Specific, actionable improvement with clear guidance", "Another area to work on", "Third area if needed"],
  "score_breakdown": {
    "creativity": (0-25, how original and imaginative?),
    "grammar": (0-25, be strict on errors),
    "vocabulary": (0-20, sophistication and variety),
    "coherence": (0-15, does it flow logically?),
    "keyword_usage": (0-15, natural integration of ${keywords.length} keywords)
  },
  "detailed_analysis": {
    "plot_development": "Detailed analysis of story progression, pacing, and narrative arc. Cite specific examples.",
    "character_development": "Analysis of character depth, believability, and growth. Mention if characters feel real or flat.",
    "language_use": "Evaluation of sentence variety, vocabulary sophistication, and grammar accuracy. Note specific errors.",
    "engagement": "How interesting and engaging is the story? Would you want to keep reading? Why or why not?"
  },
  "grammar_errors": ["List specific grammar errors found", "Another error if found", "Etc."],
  "vocabulary_highlights": ["Notable vocabulary used well", "Impressive word choices if any"],
  "missed_keywords": ["list keywords not used from: ${keywords.join(', ')}"],
  "grade": "A+/A/A-/B+/B/B-/C+/C/C-/D+/D/D-/F",
  "difficulty_assessment": "Is this story appropriate for ${difficulty} level? Explain why.",
  "word_count_bonus": (0-10, based on exceeding minimum thoughtfully),
  "time_management_bonus": (0-5, for efficient time use)
}

IMPORTANT:
- Be thorough and specific, reference actual story content
- Balance encouragement with honest critique
- Provide actionable improvement suggestions
- Consider the difficulty level (${difficulty}) in your assessment
- This evaluation impacts learning, so be educational not just judgmental
- Cite specific examples from the story in your feedback
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert English language and creative writing evaluator with professional training in literary analysis and language assessment. Always respond with valid JSON only. Be thorough, specific, and educational in your feedback."
          },
          {
            role: "user",
            content: promptText
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      const evaluation = JSON.parse(response.choices[0].message.content);
      
      // Calculate bonuses
      const wordCountBonus = wordCount >= minWords ? 
        Math.min(10, Math.floor((wordCount / minWords - 1) * 5)) : 0;
      
      const timeBonus = timeSpent > 0 && timeSpent < maxTime ? 
        Math.min(5, Math.floor((maxTime - timeSpent) / maxTime * 5)) : 0;
      
      // Apply difficulty multiplier
      const difficultyMultiplier = {
        'easy': 0.9,
        'medium': 1.0,
        'hard': 1.15
      };
      
      const baseScore = evaluation.overall_score || 0;
      const finalScore = Math.min(100, Math.round(
        (baseScore + wordCountBonus + timeBonus) * (difficultyMultiplier[difficulty] || 1.0)
      ));
      
      return {
        ...evaluation,
        final_score: finalScore,
        word_count: wordCount,
        keywords_used: keywordsUsed,
        word_count_bonus: wordCountBonus,
        time_management_bonus: timeBonus,
        evaluation_type: 'storytelling'
      };
      
    } catch (error) {
      console.error('AI Story Evaluation Error:', error);
      return this.getFallbackStoryEvaluation(story, keywords, minWords);
    }
  }

  // Fallback evaluation for pronunciation when AI fails
  getFallbackPronunciationEvaluation(transcription, targetWord) {
    const similarity = this.calculateStringSimilarity(
      transcription.toLowerCase(), 
      targetWord.toLowerCase()
    );
    
    const accuracy = Math.round(similarity * 100);
    
    return {
      accuracy,
      final_score: accuracy,
      feedback: `Based on transcription analysis, your pronunciation accuracy is ${accuracy}%. ${
        accuracy >= 80 ? 'Great job!' : 
        accuracy >= 60 ? 'Good effort, keep practicing.' : 
        'Needs more practice. Focus on clear pronunciation.'
      }`,
      strengths: accuracy >= 70 ? ['Clear articulation'] : [],
      improvements: accuracy < 70 ? ['Practice pronunciation', 'Speak more clearly'] : [],
      phonetic_analysis: "Automated analysis based on transcription similarity",
      score_breakdown: {
        consonants: Math.round(accuracy * 0.3),
        vowels: Math.round(accuracy * 0.3),
        stress: Math.round(accuracy * 0.2),
        fluency: Math.round(accuracy * 0.2)
      },
      grade: accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 70 ? 'C' : accuracy >= 60 ? 'D' : 'F',
      evaluation_type: 'pronunciation'
    };
  }

  // Fallback evaluation for story when AI fails
  getFallbackStoryEvaluation(story, keywords, minWords) {
    const wordCount = story.trim().split(/\s+/).length;
    const keywordsUsed = keywords.filter(keyword => 
      story.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const lengthScore = Math.min(40, (wordCount / minWords) * 40);
    const keywordScore = (keywordsUsed.length / keywords.length) * 30;
    const basicScore = 30; // Base score for completion
    
    const overallScore = Math.round(lengthScore + keywordScore + basicScore);
    
    return {
      overall_score: overallScore,
      final_score: overallScore,
      feedback: `Your story has ${wordCount} words and uses ${keywordsUsed.length} of ${keywords.length} required keywords. ${
        overallScore >= 80 ? 'Well done!' : 
        overallScore >= 60 ? 'Good effort!' : 
        'Keep practicing your storytelling skills.'
      }`,
      strengths: wordCount >= minWords ? ['Adequate length'] : [],
      improvements: wordCount < minWords ? ['Write longer stories'] : [],
      score_breakdown: {
        creativity: Math.round(overallScore * 0.25),
        grammar: Math.round(overallScore * 0.25),
        vocabulary: Math.round(overallScore * 0.20),
        coherence: Math.round(overallScore * 0.15),
        keyword_usage: Math.round(keywordScore)
      },
      detailed_analysis: {
        plot_development: "Automated analysis - basic story structure detected",
        character_development: "Automated analysis - character elements present",
        language_use: "Automated analysis - standard language usage",
        engagement: "Automated analysis - engaging content"
      },
      grade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F',
      word_count: wordCount,
      keywords_used: keywordsUsed,
      word_count_bonus: 0,
      time_management_bonus: 0,
      evaluation_type: 'storytelling'
    };
  }

  // Calculate string similarity (Levenshtein distance based)
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = new AIEvaluationService();
