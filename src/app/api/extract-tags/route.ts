import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();

    if (!title && !content) {
      return NextResponse.json({ error: "Title or content is required" }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      console.error("SILICONFLOW_API_KEY is not set");
      return NextResponse.json(
        { error: "SiliconFlow API key is not configured" },
        { status: 500 }
      );
    }

    // Prepare prompt for tag extraction
    const prompt = `从以下灵感中提取3-5个关键词标签：

标题：${title || '无'}
内容：${content || '无'}

要求：
1. 只返回JSON数组格式：["标签1", "标签2", "标签3"]
2. 标签要简洁、有意义、能概括核心主题
3. 使用中文
4. 不要包含任何其他内容，只返回JSON数组

示例输出：
["人工智能", "智能家居", "物联网"]`;

    // Call SiliconFlow Chat API
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          {
            role: "system",
            content: "你是一个关键词提取专家，擅长从文本中提取简洁有意义的标签。只返回JSON数组，不要有其他内容。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("SiliconFlow API error:", errorData);
      return NextResponse.json(
        { error: `Tag extraction failed: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "[]";
    
    console.log("Raw LLM response:", assistantMessage);

    // Parse the JSON array from response
    let tags: string[] = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = assistantMessage.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to parse directly
        tags = JSON.parse(assistantMessage);
      }
      
      // Filter and validate tags
      tags = tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .slice(0, 5); // Max 5 tags
      
    } catch (parseError) {
      console.error("Failed to parse tags:", parseError);
      return NextResponse.json(
        { error: "Failed to parse tags from LLM response" },
        { status: 500 }
      );
    }

    console.log(`✅ Extracted ${tags.length} tags:`, tags);

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error("Error extracting tags:", error);
    return NextResponse.json(
      { error: `Failed to extract tags: ${error.message}` },
      { status: 500 }
    );
  }
}
