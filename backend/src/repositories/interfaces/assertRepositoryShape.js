function assertRepositoryShape(repositoryName, repository, requiredMethods) {
  if (!repository || typeof repository !== 'object') {
    throw new Error(`${repositoryName} must be an object.`);
  }

  const missingMethods = requiredMethods.filter(
    (methodName) => typeof repository[methodName] !== 'function'
  );

  if (missingMethods.length > 0) {
    throw new Error(
      `${repositoryName} is missing required methods: ${missingMethods.join(', ')}`
    );
  }

  return repository;
}

module.exports = {
  assertRepositoryShape,
};
