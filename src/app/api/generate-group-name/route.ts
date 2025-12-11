import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { matchedIdeas } = await request.json();

    if (!matchedIdeas || matchedIdeas.length === 0) {
      return NextResponse.json({ error: "No matched ideas provided" }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      console.error("SILICONFLOW_API_KEY is not set");
      return NextResponse.json(
        { error: "SiliconFlow API key is not configured" },
        { status: 500 }
      );
    }

    // Prepare ideas summary for naming
    const ideasSummary = matchedIdeas
      .slice(0, 3) // Use first 3 ideas
      .map((idea: any, idx: number) => `灵感${idx + 1}：${idea.title}`)
      .join('\n');

    // Prepare prompt for group name generation
    const prompt = `基于以下几个相似的灵感，生成一个简洁有创意的小组名称：

${ideasSummary}

要求：
1. 只返回小组名称，不要其他内容
2. 小组名称要简洁（4-8个字）
3. 能概括这些灵感的共同主题
4. 有创意、有吸引力
5. 使用中文

示例输出：
智能家居创新组`;

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
            content: "你是一个创意命名专家，擅长为创意团队起简洁有吸引力的名字。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("SiliconFlow API error:", errorData);
      return NextResponse.json(
        { error: `Group name generation failed: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const groupName = data.choices[0]?.message?.content?.trim() || "创意小组";
    
    console.log(`✅ Generated group name: ${groupName}`);

    return NextResponse.json({ groupName });
  } catch (error: any) {
    console.error("Error generating group name:", error);
    return NextResponse.json(
      { error: `Failed to generate group name: ${error.message}` },
      { status: 500 }
    );
  }
}
