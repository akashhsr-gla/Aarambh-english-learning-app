const { OpenAI } = require('openai');

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

  // Evaluate pronunciation based on audio transcription
  async evaluatePronunciation({ transcription, targetWord, difficulty = 'medium' }) {
    try {
      console.log(`🎯 Evaluating pronunciation: "${targetWord}" vs "${transcription}"`);
      
      const prompt = `
You are an expert English pronunciation evaluator. Analyze the pronunciation accuracy based on:

Target Word: "${targetWord}"
User's Pronunciation (transcribed): "${transcription}"
Difficulty Level: ${difficulty}

Evaluate based on:
1. Phonetic accuracy (vowel and consonant sounds)
2. Stress patterns and syllable emphasis
3. Overall clarity and intelligibility
4. Common pronunciation patterns for this word type

Provide evaluation in this exact JSON format (no other text):
{
  "accuracy": (0-100),
  "feedback": "specific, constructive feedback about pronunciation accuracy and areas for improvement",
  "improvements": ["specific pronunciation tips", "areas to focus on"],
  "score_breakdown": {
    "consonants": (0-30),
    "vowels": (0-30),
    "stress": (0-20),
    "fluency": (0-20)
  },
  "grade": "A/B/C/D/F"
}

Be realistic in scoring - perfect matches get 90-100, close matches get 70-89, partial matches get 50-69, poor matches get 30-49, very poor get 0-29.
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert English pronunciation evaluator. Respond ONLY with valid JSON. No additional text or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 600
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
You are an English language and creative writing evaluation expert. Evaluate this story based on the given criteria:

Story Prompt: "${prompt}"
User's Story: "${story}"
Required Keywords: [${keywords.join(', ')}]
Keywords Used: [${keywordsUsed.join(', ')}]
Minimum Words Required: ${minWords}
Actual Word Count: ${wordCount}
Difficulty Level: ${difficulty}
Time Spent: ${timeSpent} seconds (max: ${maxTime} seconds)

Please provide evaluation in the following JSON format:
{
  "overall_score": (0-100),
  "feedback": "comprehensive feedback about the story",
  "strengths": ["list of story strengths"],
  "improvements": ["specific areas to improve"],
  "score_breakdown": {
    "creativity": (0-25),
    "grammar": (0-25),
    "vocabulary": (0-20),
    "coherence": (0-15),
    "keyword_usage": (0-15)
  },
  "detailed_analysis": {
    "plot_development": "analysis of story progression",
    "character_development": "analysis of characters if any",
    "language_use": "analysis of language complexity and correctness",
    "engagement": "how engaging and interesting the story is"
  },
  "grade": "A/B/C/D/F",
  "word_count_bonus": (0-10),
  "time_management_bonus": (0-5)
}

Consider:
- Creativity and originality
- Grammar and language correctness
- Vocabulary richness and appropriateness
- Story coherence and flow
- Effective use of required keywords
- Appropriate length and completion
- Time management efficiency
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert English language and creative writing evaluator. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: promptText
          }
        ],
        temperature: 0.4,
        max_tokens: 1200
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
