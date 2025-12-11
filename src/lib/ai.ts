import { Idea, MatchIdea, IdeaWithAuthors } from '../types';

// Calculate cosine similarity between two embeddings
export const calculateSimilarity = (embedding1: number[], embedding2: number[]): number => {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] ** 2;
    norm2 += embedding2[i] ** 2;
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (norm1 * norm2);
};

// Match ideas based on embedding similarity
// Now expects the newIdea to already have an embedding generated
export const matchIdeas = (
  newIdea: Idea,
  existingIdeas: IdeaWithAuthors[],
  userId: string,
  threshold: number = 0.8
): MatchIdea[] => {
  if (!newIdea.embedding) {
    console.warn('New idea has no embedding, cannot match');
    return [];
  }

  const matches: MatchIdea[] = [];

  for (const idea of existingIdeas) {
    // Skip ideas from the same user
    if (idea.author_id.includes(userId)) continue;
    
    if (idea.embedding) {
      const similarity = calculateSimilarity(newIdea.embedding, idea.embedding);
      if (similarity >= threshold) {
        matches.push({
          idea,
          similarity,
        });
      }
    }
  }

  // Sort matches by similarity score in descending order
  matches.sort((a, b) => b.similarity - a.similarity);

  return matches;
};

// Database-level matching using Supabase RPC for efficient vector search
export const matchIdeasFromDatabase = async (
  embedding: number[],
  currentAuthor: string,
  threshold: number = 0.7,
  limit: number = 10
): Promise<MatchIdea[]> => {
  console.log('📡 调用数据库匹配 RPC...');
  console.log('参数:', { threshold, limit, currentAuthor, embeddingLength: embedding.length });
  
  try {
    const { supabase } = await import('./supabase');
    
    // Call the RPC function
    const { data, error } = await supabase.rpc('match_ideas_by_embedding', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      current_author: currentAuthor
    });

    if (error) {
      console.error('❌ RPC 调用失败:', error);
      throw error;
    }

    console.log('✅ RPC 调用成功，返回数据:', data);

    if (!data || data.length === 0) {
      console.log('ℹ️ 数据库没有返回匹配结果');
      return [];
    }

    // Transform the RPC result to MatchIdea format
    const matches: MatchIdea[] = data.map((item: any) => ({
      idea: {
        id: item.id,
        author_id: item.author_id,
        title: item.title,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        is_public: item.is_public,
        tags: item.tags || [],
        comments_count: 0,
        likes_count: 0,
        authors: item.author_id.map((name: string) => ({
          id: name,
          name: name,
          email: '',
          role: '',
          created_at: new Date().toISOString()
        }))
      },
      similarity: item.similarity
    }));

    console.log('🎉 成功转换为 MatchIdea 格式，数量:', matches.length);
    return matches;
  } catch (error) {
    console.error('💥 数据库匹配失败:', error);
    return [];
  }
};

