const path = require("path");

function loadWithMocks(targetModulePath, mocks) {
  const resolvedTarget = require.resolve(targetModulePath);
  const targetDir = path.dirname(resolvedTarget);
  const originalEntries = new Map();

  for (const [requestPath, mockExports] of Object.entries(mocks)) {
    const resolvedDependency = require.resolve(requestPath, {
      paths: [targetDir]
    });

    originalEntries.set(
      resolvedDependency,
      Object.prototype.hasOwnProperty.call(require.cache, resolvedDependency)
        ? require.cache[resolvedDependency]
        : null
    );

    require.cache[resolvedDependency] = {
      id: resolvedDependency,
      filename: resolvedDependency,
      loaded: true,
      exports: mockExports
    };
  }

  const originalTarget = Object.prototype.hasOwnProperty.call(require.cache, resolvedTarget)
    ? require.cache[resolvedTarget]
    : null;

  delete require.cache[resolvedTarget];
  const loadedModule = require(resolvedTarget);

  function restore() {
    delete require.cache[resolvedTarget];

    if (originalTarget) {
      require.cache[resolvedTarget] = originalTarget;
    }

    for (const [resolvedDependency, originalEntry] of originalEntries.entries()) {
      if (originalEntry) {
        require.cache[resolvedDependency] = originalEntry;
      } else {
        delete require.cache[resolvedDependency];
      }
    }
  }

  return {
    module: loadedModule,
    restore
  };
}

module.exports = {
  loadWithMocks
};
