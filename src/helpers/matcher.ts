/**
 * Record the similar score
 * @param pattern
 * @param text
 * @returns
 */
function calculateSimilarScore(pattern: string, text: string): number {
  // TODO 改为编辑距离算法 -- Levenshtein Distance
  let score = 0;
  const patternLength = pattern.length;
  const textLength = text.length;

  let patternIndex = 0;
  let textIndex = 0;

  while (patternIndex < patternLength && textIndex < textLength) {
    if (pattern[patternIndex] === text[textIndex]) {
      score++;
      textIndex++;
    }

    patternIndex++;
  }

  return score;
}

/**
 * Find the most similar string in a collection
 * @param pattern
 * @param list
 * @returns
 */
export function matchMostSimilarString(pattern: string, list: string[]): string {
  let maxScore = 0;
  let result = '';

  list.forEach((text) => {
    const score = calculateSimilarScore(pattern, text);

    if (score > maxScore) {
      maxScore = score;
      result = text!;
    }
  });

  return result;
}
