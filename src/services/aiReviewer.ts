// AI 文献助手服务
import OpenAI from 'openai';

// 初始化OpenAI (支持硅基流动 SiliconFlow)
// 使用环境变量: NEXT_PUBLIC_OPENAI_API_KEY (你的硅基流动API Key)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  baseURL: 'https://api.siliconflow.cn/v1', // 硅基流动API端点
  dangerouslyAllowBrowser: true // 仅用于演示，生产环境应该在服务端
});

export interface ArxivPaper {
  title: string;
  authors: string[];
  summary: string;
  published: string;
  link: string;
}

/**
 * 从arXiv搜索相关论文
 */
export async function searchArxiv(query: string): Promise<ArxivPaper[]> {
  try {
    const searchQuery = encodeURIComponent(query);
    // 使用 HTTPS 避免混合内容错误
    const url = `https://export.arxiv.org/api/query?search_query=all:${searchQuery}&max_results=3&sortBy=relevance&sortOrder=descending`;
    
    console.log('🔍 Searching arXiv...');
    const response = await fetch(url);
    const xmlText = await response.text();
    
    // 简单的XML解析
    const papers: ArxivPaper[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = xmlDoc.getElementsByTagName('entry');
    
    for (let i = 0; i < Math.min(entries.length, 3); i++) {
      const entry = entries[i];
      
      const title = entry.getElementsByTagName('title')[0]?.textContent?.trim() || '';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim() || '';
      const published = entry.getElementsByTagName('published')[0]?.textContent?.trim() || '';
      const link = entry.getElementsByTagName('id')[0]?.textContent?.trim() || '';
      
      const authorElements = entry.getElementsByTagName('author');
      const authors: string[] = [];
      for (let j = 0; j < authorElements.length; j++) {
        const nameElement = authorElements[j].getElementsByTagName('name')[0];
        if (nameElement) {
          authors.push(nameElement.textContent?.trim() || '');
        }
      }
      
      papers.push({
        title,
        authors,
        summary,
        published,
        link
      });
    }
    
    console.log(`✅ Found ${papers.length} arXiv papers`);
    return papers;
  } catch (error) {
    console.warn('⚠️ arXiv unavailable, continuing without papers:', error);
    // 返回空数组，让 AI 继续分析（不依赖论文）
    return [];
  }
}

/**
 * 使用GPT分析灵感并生成文献综述
 */
export async function analyzeIdeaWithAI(ideaContent: string, papers: ArxivPaper[]): Promise<string> {
  try {
    const papersContext = papers.length > 0 
      ? papers.map((p, i) => `
[论文${i + 1}] ${p.title}
作者: ${p.authors.join(', ')}
摘要: ${p.summary.substring(0, 200)}...
链接: ${p.link}
`).join('\n')
      : '未找到相关论文';
    
    const prompt = `你是一个学术助手。用户提出了以下研究想法：

"${ideaContent}"

我为你找到了这些可能相关的论文：
${papersContext}

请以友好、专业的口吻分析：
1. 这个想法的创新性如何？
2. 与现有研究（上述论文）的关系是什么？
3. 可能的改进方向或差异点在哪里？

请用中文回复，保持简洁（200字以内），并使用emoji让回复更友好。`;

    const response = await openai.chat.completions.create({
      model: 'Qwen/Qwen2.5-7B-Instruct', // 硅基流动免费模型，也可用 'deepseek-ai/DeepSeek-V3'
      messages: [
        {
          role: 'system',
          content: '你是一个友好的学术研究助手，擅长文献综述和研究方向分析。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || '抱歉，AI分析暂时不可用';
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    return '🤖 AI助手正在升级中，暂时无法提供分析...';
  }
}

/**
 * 完整的AI文献助手流程
 */
export async function runAutoReviewer(ideaContent: string): Promise<string> {
  try {
    console.log('🤖 AI助手开始分析...');
    
    // 1. 搜索arXiv论文
    const papers = await searchArxiv(ideaContent);
    console.log(`📚 找到 ${papers.length} 篇相关论文`);
    
    // 2. 使用GPT分析
    const analysis = await analyzeIdeaWithAI(ideaContent, papers);
    console.log('✅ AI分析完成');
    
    // 3. 格式化输出
    let result = `🤖 **AI Research Assistant**\n\n${analysis}\n\n`;
    
    if (papers.length > 0) {
      result += `\n📚 **相关文献**:\n`;
      papers.forEach((paper, i) => {
        result += `\n${i + 1}. [${paper.title}](${paper.link})\n`;
        result += `   👤 ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}\n`;
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error in auto-reviewer:', error);
    return '🤖 AI助手遇到了问题，请稍后再试...';
  }
}
