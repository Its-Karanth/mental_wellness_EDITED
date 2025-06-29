const axios = require('axios');

// Test user data
const testUser = {
  name: "Test User",
  email: `testuser${Date.now()}@example.com`,
  password: "testpass123"
};

let userId = null;
let sessionToken = null;

async function testChatbotVariety() {
  console.log("🧪 Testing Chatbot Response Variety...\n");

  try {
    // Step 1: Register a test user
    console.log("1. Registering test user...");
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log("✅ User registered successfully\n");

    // Step 2: Login as the test user to get token and userId
    console.log("2. Logging in as test user...");
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    sessionToken = loginResponse.data.token;
    userId = loginResponse.data.user.id;
    console.log("✅ User login successful\n");

    // Step 3: Test multiple conversations with different messages
    const testMessages = [
      "I'm feeling anxious today",
      "I'm feeling anxious today", // Same message to test variety
      "I'm feeling anxious today", // Same message again
      "I'm having trouble sleeping",
      "I'm stressed about work",
      "I feel lonely",
      "I'm worried about my relationship",
      "I'm feeling depressed",
      "I need help with my mental health",
      "I'm feeling overwhelmed"
    ];

    console.log("3. Testing chatbot responses...");
    const responses = [];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n   Message ${i + 1}: "${message}"`);
      try {
        const chatResponse = await axios.post('http://localhost:5000/api/chat', {
          message: message,
          user: userId
        }, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        const botReply = chatResponse.data.reply;
        if (!botReply) {
          console.log('   ❌ No reply received from chatbot');
        } else {
          console.log(`   Bot Reply: "${botReply}"`);
          responses.push({
            message: message,
            reply: botReply,
            timestamp: new Date()
          });
        }
      } catch (err) {
        console.log('   ❌ Error sending message:', err.message);
      }
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Analyze response variety
    console.log("\n4. Analyzing response variety...");
    
    // Check for duplicate responses
    const uniqueReplies = [...new Set(responses.map(r => r.reply))];
    const duplicateCount = responses.length - uniqueReplies.length;
    
    console.log(`   Total responses: ${responses.length}`);
    console.log(`   Unique responses: ${uniqueReplies.length}`);
    console.log(`   Duplicate responses: ${duplicateCount}`);
    
    if (duplicateCount === 0) {
      console.log("   ✅ All responses are unique!");
    } else {
      console.log("   ⚠️  Some responses are duplicated");
    }

    // Check response length variety
    const replyLengths = responses.map(r => r.reply.length);
    const avgLength = replyLengths.reduce((a, b) => a + b, 0) / replyLengths.length;
    const minLength = Math.min(...replyLengths);
    const maxLength = Math.max(...replyLengths);
    
    console.log(`   Average response length: ${avgLength.toFixed(1)} characters`);
    console.log(`   Response length range: ${minLength} - ${maxLength} characters`);

    // Check for similar responses (basic similarity check)
    let similarCount = 0;
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const similarity = calculateSimilarity(responses[i].reply, responses[j].reply);
        if (similarity > 0.8) {
          similarCount++;
          console.log(`   ⚠️  High similarity (${(similarity * 100).toFixed(1)}%) between responses ${i + 1} and ${j + 1}`);
        }
      }
    }

    if (similarCount === 0) {
      console.log("   ✅ No highly similar responses detected");
    } else {
      console.log(`   ⚠️  Found ${similarCount} pairs of similar responses`);
    }

    // Step 5: Test conversation context
    console.log("\n5. Testing conversation context...");
    
    const conversationMessages = [
      "I'm feeling sad",
      "It's been going on for a week",
      "I don't know what to do",
      "I feel hopeless"
    ];

    console.log("   Testing conversation flow:");
    for (let i = 0; i < conversationMessages.length; i++) {
      const message = conversationMessages[i];
      console.log(`   User: "${message}"`);
      try {
        const chatResponse = await axios.post('http://localhost:5000/api/chat', {
          message: message,
          user: userId
        }, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        const botReply = chatResponse.data.reply;
        if (!botReply) {
          console.log('   ❌ No reply received from chatbot');
        } else {
          console.log(`   Bot: "${botReply}"`);
        }
      } catch (err) {
        console.log('   ❌ Error sending message:', err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Step 6: Test error handling
    console.log("\n6. Testing error handling...");
    
    try {
      const errorResponse = await axios.post('http://localhost:5000/api/chat', {
        message: "Test message",
        user: "invalid-user-id"
      });
      if (errorResponse.data && errorResponse.data.reply) {
        console.log("   ✅ Error handling works correctly (fallback reply received)");
      } else {
        console.log("   ⚠️  Error handling did not return a fallback reply");
      }
    } catch (error) {
      console.log("   ✅ Error handling works correctly (caught error)");
    }

    console.log("\n🎉 Chatbot variety test completed successfully!");
    console.log("\nSummary:");
    console.log(`- Tested ${responses.length} different messages`);
    console.log(`- Generated ${uniqueReplies.length} unique responses`);
    console.log(`- Response variety: ${((uniqueReplies.length / responses.length) * 100).toFixed(1)}%`);
    
    if (duplicateCount === 0 && similarCount === 0) {
      console.log("✅ Chatbot is successfully generating varied responses!");
    } else {
      console.log("⚠️  Some improvements may be needed for response variety");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(' ');
  const words2 = str2.toLowerCase().split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

// Run the test
testChatbotVariety(); 