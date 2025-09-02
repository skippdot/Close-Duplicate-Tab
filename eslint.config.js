import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['extension/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Chrome Extension APIs
        chrome: 'readonly',
        
        // Browser globals
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        document: 'readonly',
        window: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        
        // Test globals (for tests/ directory)
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        global: 'readonly',
        
        // Custom test helpers
        resetAllMocks: 'readonly',
        simulateError: 'readonly',
        createMockTab: 'readonly',
        createSuspendedUrl: 'readonly'
      }
    },
    rules: {
      // Error prevention
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-undef': 'error',
      'no-console': 'off', // Allow console for debugging in extensions
      'no-debugger': 'error',
      
      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'no-implicit-globals': 'off', // Allow global functions in Chrome extensions
      'no-global-assign': 'error',
      
      // Chrome extension specific
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      
      // Style consistency
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'eol-last': 'error',
      'no-trailing-spaces': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-mixed-spaces-and-tabs': 'error',
      
      // Function and variable naming
      'camelcase': ['error', { properties: 'never' }],
      'new-cap': 'error',
      
      // Error handling
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error'
    }
  },
  {
    // Specific rules for test files
    files: ['tests/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs'
    },
    rules: {
      // Allow longer lines in tests for readability
      'max-len': 'off',
      // Allow more flexible naming in tests
      'camelcase': 'off',
      'no-undef': 'off'
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'coverage/**',
      'arch/**',
      'docs/**/*.js' // Ignore standalone test files in docs
    ]
  }
];
