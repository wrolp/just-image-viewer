module.exports = {
  'env': {
    'browser': true,
    'es2020': true,
    'node': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:vue/essential',
    // "plugin:@typescript-eslint/recommended"
  ],
  'parserOptions': {
    'ecmaVersion': 2020,
    'parser': '@typescript-eslint/parser',
    'sourceType': 'module'
  },
  'plugins': [
    'vue',
    '@typescript-eslint'
  ],
  'rules': {
    'indent': ['error', 2],
    'vue/script-indent': ['error', 2, {'baseIndent': 0}],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }]
  },
  'overrides': [
    {
      'files': ['*.vue'],
      'rules': {
        'indent': 'off'
      }
    }
  ]
}
