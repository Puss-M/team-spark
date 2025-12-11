import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!apiKey) {
      console.error("SILICONFLOW_API_KEY is not set");
      return NextResponse.json(
        { error: "SiliconFlow API key is not configured" },
        { status: 500 }
      );
    }

    // Call SiliconFlow Embedding API (OpenAI-compatible)
    const response = await fetch("https://api.siliconflow.cn/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "BAAI/bge-large-zh-v1.5",
        input: text.substring(0, 2000), // Truncate to 2000 chars to avoid token limit errors
        encoding_format: "float",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("SiliconFlow API error:", errorData);
      return NextResponse.json(
        { error: `SiliconFlow API failed: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    return NextResponse.json(
      { error: `Failed to generate embedding: ${error.message}` },
      { status: 500 }
    );
  }
}
