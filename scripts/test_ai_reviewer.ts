
import fs from 'fs';
import path from 'path';

// 1. Load environment variables FIRST
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    console.log('📂 Loading .env from:', envPath);
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
        process.env[key] = value;
      }
    });
  } else {
    console.warn('⚠️ .env file not found at:', envPath);
  }
} catch (e) {
  console.warn('⚠️ Could not load .env file manually:', e);
}

// 2. Dynamic import of the service (AFTER env is set)
// We need to use dynamic import because static imports are hoisted, 
// causing the service (and OpenAI client) to initialize before we set process.env
const runTest = async () => {
  const { analyzeIdeaWithAI, ArxivPaper } = await import('../src/services/aiReviewer');

  async function testAIReviewer() {
    console.log('🧪 Starting Unit Test for AI Reviewer...');
    console.log('🔑 Checking API Key:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Present' : 'Missing');
  
    // MOCK DATA: Instead of inserting to DB, we create a mock input
    const mockIdea = "I want to build a prediction market for scientific research ideas using blockchain.";
    const mockPapers = [
      {
        title: "Prediction Markets: Does Money Matter?",
        authors: ["Servan-Schreiber", "Wolfers"],
        summary: "We analyze the accuracy of prediction markets...",
        published: "2002",
        link: "http://arxiv.org/abs/example1"
      }
    ];
  
    console.log('\n📝 Testing: analyzeIdeaWithAI');
    const startTime = Date.now();
  
    try {
      // @ts-ignore
      const result = await analyzeIdeaWithAI(mockIdea, mockPapers);
      const duration = Date.now() - startTime;
  
      console.log(`\n⏱️ Response Time: ${duration}ms`);
      console.log('🤖 AI Response:\n', result);
  
      if (result.includes('AI助手正在升级中')) {
        console.log('\n❌ Test Failed: AI service returned error fallback.');
      } else {
        console.log('\n✅ Test Passed: AI returned a valid response.');
      }
  
    } catch (error) {
      console.error('❌ Test Error:', error);
    }
  }

  await testAIReviewer();
};

runTest();
