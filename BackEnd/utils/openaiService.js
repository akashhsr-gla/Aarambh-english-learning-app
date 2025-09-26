const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = null;
    this.defaultModel = 'gpt-3.5-turbo';
    this.maxTokens = 500;
    this.temperature = 0.7;
    
    // Initialize client only if API key is available and valid
    if (this.isConfigured()) {
      try {
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ OpenAI client initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI client:', error.message);
        this.client = null;
      }
    } else {
      console.warn('⚠️ OpenAI API key not configured. Chat functionality will be limited.');
    }
  }

  /**
   * Generate a response from OpenAI ChatGPT
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Optional parameters
   * @returns {Object} Response object with content, model, tokens, etc.
   */
  async generateResponse(messages, options = {}) {
    try {
      if (!this.client) {
        throw new Error('OpenAI client not initialized. Please check your API key configuration.');
      }

      const {
        model = this.defaultModel,
        maxTokens = this.maxTokens,
        temperature = this.temperature,
        stream = false
      } = options;

      console.log('🤖 Generating OpenAI response...', {
        model,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.content?.substring(0, 100)
      });

      const startTime = Date.now();
      
      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const responseTime = Date.now() - startTime;
      
      const result = {
        content: response.choices[0].message.content,
        model: response.model,
        usage: response.usage,
        responseTime,
        finishReason: response.choices[0].finish_reason,
        timestamp: new Date()
      };

      console.log('✅ OpenAI response generated', {
        model: result.model,
        tokens: result.usage?.total_tokens,
        responseTime: `${responseTime}ms`,
        contentLength: result.content.length
      });

      return result;

    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      
      // Handle different types of errors
      if (error.response) {
        throw new Error(`OpenAI API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('OpenAI API Error: No response received from OpenAI servers');
      } else {
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
    }
  }

  /**
   * Generate a response specifically for English learning
   * @param {Array} messages - Conversation messages
   * @param {Object} context - Learning context (level, category, etc.)
   * @returns {Object} Response object
   */
  async generateEnglishLearningResponse(messages, context = {}) {
    const {
      level = 'intermediate',
      category = 'general',
      includeExercises = true,
      includeGameRecommendations = true
    } = context;

    // Enhanced system message for English learning
    const systemMessage = {
      role: 'system',
      content: `You are an expert English language tutor helping a ${level} level student with ${category} learning. 

Guidelines:
- Be encouraging, patient, and supportive
- Provide clear explanations with practical examples
- Use language appropriate for ${level} level learners
- ${level === 'beginner' ? 'Use simple vocabulary and short sentences' : ''}
- ${level === 'advanced' ? 'Use sophisticated vocabulary and complex structures when appropriate' : ''}

${includeGameRecommendations ? `
Game Recommendations:
- For pronunciation questions: Recommend "Pronunciation Practice" game
- For grammar questions: Recommend "Grammar Quiz" game  
- For vocabulary questions: Recommend "Object Identification" game
- For story creation: Recommend "Story Creation" game
` : ''}

${includeExercises ? `
When appropriate, provide:
- Simple practice exercises
- Example sentences
- Common mistakes to avoid
- Tips for improvement
` : ''}

Focus areas for ${category}:
${this.getCategoryGuidelines(category)}

Always end responses with encouragement and invite further questions.`
    };

    // Combine system message with conversation
    const enhancedMessages = [systemMessage, ...messages];

    return await this.generateResponse(enhancedMessages, {
      temperature: 0.7,
      maxTokens: 600
    });
  }

  /**
   * Get category-specific guidelines
   * @param {string} category - Learning category
   * @returns {string} Category guidelines
   */
  getCategoryGuidelines(category) {
    const guidelines = {
      grammar: `
- Explain grammar rules clearly with examples
- Show correct vs incorrect usage
- Provide memory tips and patterns
- Focus on common grammar mistakes`,
      
      pronunciation: `
- Break down difficult sounds phonetically
- Provide pronunciation tips and techniques
- Suggest mouth position and breathing
- Recommend practice words and phrases`,
      
      vocabulary: `
- Explain word meanings with context
- Provide synonyms and antonyms
- Show usage in different situations
- Give memory techniques for retention`,
      
      writing: `
- Help with structure and organization
- Suggest improvements for clarity
- Provide writing techniques and tips
- Focus on coherence and flow`,
      
      speaking: `
- Encourage conversation practice
- Provide common phrases and expressions
- Help with fluency and confidence
- Suggest speaking exercises`,
      
      listening: `
- Provide comprehension strategies
- Help with understanding accents
- Suggest listening practice materials
- Focus on key listening skills`
    };

    return guidelines[category] || guidelines.general || 'Provide general English learning support';
  }

  /**
   * Check if OpenAI API is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  }

  /**
   * Test the OpenAI connection
   * @returns {Object} Test result
   */
  async testConnection() {
    try {
      if (!this.client) {
        return {
          success: false,
          message: 'OpenAI client not initialized',
          error: true
        };
      }

      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'OpenAI API key not configured',
          error: true
        };
      }

      const testResponse = await this.generateResponse([
        { role: 'user', content: 'Hello, this is a test message.' }
      ], { maxTokens: 50 });

      return {
        success: true,
        message: 'OpenAI connection successful',
        model: testResponse.model,
        responseTime: testResponse.responseTime
      };

    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: true
      };
    }
  }

  /**
   * Generate suggestions for common English learning questions
   * @returns {Array} Array of suggested questions
   */
  getQuestionSuggestions() {
    return [
      "How can I improve my pronunciation?",
      "What's the difference between 'affect' and 'effect'?",
      "Can you help me with past tense verbs?",
      "How do I use articles (a, an, the) correctly?",
      "What are some common English idioms?",
      "How can I improve my writing skills?",
      "What's the best way to learn new vocabulary?",
      "Can you explain conditional sentences?",
      "How do I use prepositions correctly?",
      "What are some tips for better conversation?"
    ];
  }
}

module.exports = new OpenAIService();
