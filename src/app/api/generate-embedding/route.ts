import { NextResponse } from "next/server";

let embedder: any = null;

const initEmbedder = async () => {
  if (!embedder) {
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
};

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Initialize embedder and generate embedding
    const embedder = await initEmbedder();
    const result = await embedder(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to array
    const embedding = Array.from(result.data);

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error("Error generating embedding:", error);
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }
}
