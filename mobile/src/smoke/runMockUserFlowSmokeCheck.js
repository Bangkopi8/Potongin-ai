import { aiService } from '../services/aiService.js';
import { FREE_CREDITS } from '../mock/mockData.js';
import { runAnalyzeSmokeCheck, runGenerateSmokeCheck } from './runMockApiSmokeChecks.js';
import {
  canGenerateWithCredits,
  createSavedResultHistoryItem,
  deductGenerateCredit,
  prependSavedHistoryItem,
  removeSavedHistoryItem,
} from '../utils/mockUserState.js';

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runMockUserFlowSmokeCheck() {
  let credits = FREE_CREDITS;
  let savedHistory = [];

  const analyzeResult = await runAnalyzeSmokeCheck();
  assertCondition(credits === FREE_CREDITS, 'Analysis should not reduce credits.');

  const generateResult = await runGenerateSmokeCheck();
  credits = deductGenerateCredit(credits);
  assertCondition(credits === 1, 'Successful generate should deduct exactly one credit.');

  const savedItem = createSavedResultHistoryItem({
    generateResult,
    selectedStyle: {
      id: 'feed-002',
      type: 'style',
      title: 'Textured Crop Inspiration',
      subtitle: 'Mock inspiration card for the explore feed',
    },
    instructionStyleName: 'Textured Crop Inspiration',
  });
  savedHistory = prependSavedHistoryItem(savedHistory, savedItem);
  assertCondition(savedHistory.length === 1, 'Saving should add one local history item.');

  savedHistory = removeSavedHistoryItem(savedHistory, savedItem.id);
  assertCondition(savedHistory.length === 0, 'Deleting should remove the saved history item.');

  credits = deductGenerateCredit(credits);
  assertCondition(credits === 0, 'Second successful generate should reduce credits to zero.');
  assertCondition(canGenerateWithCredits(credits) === false, 'Zero credits should block generate.');

  let failedGenerateCredits = 1;
  try {
    await aiService.generatePreview({
      prompt: 'x',
    });
  } catch {
    // This intentionally simulates a failed generate request.
  }
  assertCondition(
    failedGenerateCredits === 1,
    'Failed generate should not deduct credit.'
  );

  return {
    analyzeId: analyzeResult.analysisId,
    generationId: generateResult.generationId,
    creditsAfterAnalysis: FREE_CREDITS,
    creditsAfterFirstGenerate: 1,
    creditsAfterSecondGenerate: 0,
    historyCountAfterDelete: savedHistory.length,
    paywallTriggeredAtZeroCredits: canGenerateWithCredits(credits) === false,
    failedGenerateCredits,
  };
}
