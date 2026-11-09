module.exports = function (api) {
  api.cache(true);
  return {
    // Sin plugin de worklets a mano: lo pone babel-preset-expo y nativewind/babel lo reenvía.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
