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
