module.exports = {
  // ...existing code...
  module: {
    rules: [
      // ...existing code...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          // Exclude missing source maps
          /node_modules\/monaco-editor\/esm\/vs\/base\/common\/marked/
        ]
      }
    ]
  },
  // ...existing code...
};
