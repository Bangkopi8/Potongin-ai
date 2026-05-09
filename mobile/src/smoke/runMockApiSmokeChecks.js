import { aiService } from '../services/aiService.js';
import { exploreService } from '../services/exploreService.js';

/**
 * @returns {Promise<import('../types/apiContracts').AnalyzePhotoResponse>}
 */
export function runAnalyzeSmokeCheck() {
  return aiService.analyzePhoto({
    imageUrl: 'https://example.com/reference-photo.jpg',
    notes: 'Prefer short styles',
  });
}

/**
 * @returns {Promise<import('../types/apiContracts').GeneratePreviewResponse>}
 */
export function runGenerateSmokeCheck() {
  return aiService.generatePreview({
    prompt: 'Show modern crop previews',
    analysisId: 'analysis-mock-001',
    variations: 2,
  });
}

/**
 * @returns {Promise<{ items: import('../types/apiContracts').ExploreFeedItem[], nextCursor: string | null }>}
 */
export function runExploreSmokeCheck() {
  return exploreService.getFeed();
}

/**
 * Runs a minimal set of mobile service calls against the mocked backend.
 * @returns {Promise<{ analyze: import('../types/apiContracts').AnalyzePhotoResponse, generate: import('../types/apiContracts').GeneratePreviewResponse, explore: { items: import('../types/apiContracts').ExploreFeedItem[], nextCursor: string | null } }>}
 */
export async function runMockApiSmokeChecks() {
  const [analyze, generate, explore] = await Promise.all([
    runAnalyzeSmokeCheck(),
    runGenerateSmokeCheck(),
    runExploreSmokeCheck(),
  ]);

  return {
    analyze,
    generate,
    explore,
  };
}
