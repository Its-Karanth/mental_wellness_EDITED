const axios = require('axios');
require('dotenv').config();

// Get API key from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testGroqAPI() {
  console.log('🧪 Testing Groq API Key...\n');
  
  console.log('API Key exists:', !!GROQ_API_KEY);
  console.log('API Key length:', GROQ_API_KEY ? GROQ_API_KEY.length : 0);
  console.log('API Key starts with:', GROQ_API_KEY ? GROQ_API_KEY.substring(0, 10) + '...' : 'N/A');
  
  if (!GROQ_API_KEY) {
    console.log('❌ No GROQ_API_KEY provided');
    console.log('Please set GROQ_API_KEY in your .env file');
    return;
  }
  
  try {
    console.log('\n📤 Testing Groq API with simple request...');
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, how are you?" }
        ],
        max_tokens: 50,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Groq API test successful!');
    console.log('Response status:', response.status);
    console.log('Bot reply:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Groq API test failed');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('🔑 API Key is invalid or expired');
      } else if (error.response.status === 429) {
        console.log('⏰ Rate limit exceeded');
      } else if (error.response.status === 400) {
        console.log('📝 Bad request - check request format');
      } else {
        console.log('❓ Unknown API error');
      }
    } else if (error.request) {
      console.log('🌐 Network error - no response received');
    } else {
      console.log('💻 Other error:', error);
    }
  }
}

testGroqAPI(); 