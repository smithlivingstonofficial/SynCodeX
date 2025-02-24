const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

module.exports = function override(config, env) {
  // Add a rule to ignore missing source maps for monaco-editor
  config.module.rules.forEach(rule => {
    if (rule.use && rule.use.some(use => use.loader === 'source-map-loader')) {
      rule.exclude = (rule.exclude || []).concat([
        /node_modules\/monaco-editor/
      ]);
    }
  });

  // Add MonacoWebpackPlugin to handle worker files and include all languages
  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: [
        'abap', 'apex', 'azcli', 'bat', 'bicep', 'c', 'cameligo', 'clojure', 'coffee', 'cpp', 'csharp', 'csp', 'css', 'dart', 'dockerfile', 'ecl', 'elixir', 'fsharp', 'go', 'graphql', 'handlebars', 'hcl', 'html', 'ini', 'java', 'javascript', 'julia', 'kotlin', 'less', 'lexon', 'lua', 'markdown', 'mips', 'msdax', 'mysql', 'objective-c', 'pascal', 'pascaligo', 'perl', 'pgsql', 'php', 'pla', 'plaintext', 'postiats', 'powerquery', 'powershell', 'pug', 'python', 'r', 'razor', 'redis', 'redshift', 'restructuredtext', 'ruby', 'rust', 'sb', 'scala', 'scheme', 'scss', 'shell', 'solidity', 'sophia', 'sparql', 'sql', 'st', 'swift', 'systemverilog', 'tcl', 'twig', 'typescript', 'vb', 'xml', 'yaml'
      ],
    })
  );

  return config;
};
