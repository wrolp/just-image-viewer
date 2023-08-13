module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard',
    '@vue/typescript/recommended'
  ],
  globals: {
    NodeJS: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2020
    // parser: '@typescript-eslint/parser',
    // sourceType: 'module'
  },
  plugins: ['vue', 'html', 'standard', 'import', 'node', 'promise'],
  rules: {
    indent: ['error', 2],
    'vue/script-indent': ['error', 2, { baseIndent: 0 }],
    quotes: ['error', 'single', { allowTemplateLiterals: true }]
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        indent: 'off'
      }
    }
  ]
}
