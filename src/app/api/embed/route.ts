import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    // Use dynamic import to load @xenova/transformers
    const { pipeline } = await import('@xenova/transformers');
    
    // Create a feature extraction pipeline
    const featureExtractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    
    // Generate embedding
    const result = await featureExtractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    // Convert to array
    const embedding = Array.from(result.data);
    
    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
}
