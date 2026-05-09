const { assertRepositoryShape } = require('./assertRepositoryShape');

const aiGenerationsRepositoryMethods = [
  'createAiGeneration',
  'createAnalyzeResult',
  'createGenerateResult',
  'deleteHistoryItem',
  'listHistoryByUserId',
  'saveHistoryItem',
  'updateAiGenerationStatus',
];

function assertAiGenerationsRepository(repository) {
  return assertRepositoryShape(
    'aiGenerationsRepository',
    repository,
    aiGenerationsRepositoryMethods
  );
}

module.exports = {
  aiGenerationsRepositoryMethods,
  assertAiGenerationsRepository,
};
