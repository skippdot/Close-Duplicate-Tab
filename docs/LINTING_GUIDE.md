# Linting and Code Quality Guide

This project uses ESLint and Prettier to maintain consistent code quality and formatting across all JavaScript files.

## 🛠️ Tools Used

### ESLint
- **Purpose**: Static code analysis to find and fix problems
- **Config**: `eslint.config.js` (ESM format)
- **Rules**: Chrome extension specific rules with modern JavaScript standards

### Prettier
- **Purpose**: Code formatting for consistent style
- **Config**: `.prettierrc`
- **Integration**: Works alongside ESLint without conflicts

## 📋 Available Scripts

### Linting
```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix
```

### Formatting
```bash
# Format all files
npm run format

# Check if files are properly formatted
npm run format:check
```

### Quality Check
```bash
# Run all quality checks (lint + format + tests)
npm run quality
```

## 🎯 Linting Rules

### Chrome Extension Specific
- **Global Functions**: Allowed (Chrome extensions commonly use global functions)
- **Console Logging**: Allowed (useful for debugging extensions)
- **Chrome APIs**: Pre-configured as global variables

### Code Quality
- **No unused variables**: Error (prefix with `_` to ignore)
- **Prefer const**: Error (use `const` over `let` when possible)
- **No var**: Error (use `const`/`let` instead)
- **Strict equality**: Error (use `===` instead of `==`)

### Style Rules
- **Indentation**: 2 spaces
- **Quotes**: Single quotes preferred
- **Semicolons**: Required
- **Trailing commas**: Not allowed
- **Object spacing**: `{ key: value }` (spaces inside braces)

## 🔧 Configuration Details

### ESLint Configuration (`eslint.config.js`)
```javascript
// Key rules for Chrome extensions
rules: {
  'no-implicit-globals': 'off', // Allow global functions
  'no-console': 'off',          // Allow console logging
  'space-before-function-paren': ['error', {
    anonymous: 'always',        // function () {}
    named: 'never',            // function name() {}
    asyncArrow: 'always'       // async () => {}
  }]
}
```

### Prettier Configuration (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## 🚀 Development Workflow

### Before Committing
1. **Run quality check**: `npm run quality`
2. **Fix any issues**: Use `npm run lint:fix` and `npm run format`
3. **Verify tests pass**: All 24 tests should pass

### Adding New Code
1. **Write code** following existing patterns
2. **Run linter**: `npm run lint` to check for issues
3. **Format code**: `npm run format` for consistent styling
4. **Add tests** for new functionality
5. **Run quality check**: `npm run quality` before committing

### Fixing Linting Errors

#### Common Issues and Solutions

**Unused Variables**
```javascript
// ❌ Error: 'data' is defined but never used
function handler(event, data) {
  console.log(event);
}

// ✅ Fixed: Prefix unused params with underscore
function handler(event, _data) {
  console.log(event);
}
```

**Function Spacing**
```javascript
// ❌ Error: Unexpected space before function parentheses
const callback = function () { };

// ✅ Fixed: Anonymous functions should have space
const callback = function () { };

// ❌ Error: Expected no space before function parentheses  
function myFunction () { }

// ✅ Fixed: Named functions should not have space
function myFunction() { }
```

**Quotes and Semicolons**
```javascript
// ❌ Error: Strings must use singlequote
const message = "Hello world";

// ✅ Fixed: Use single quotes
const message = 'Hello world';

// ❌ Error: Missing semicolon
const value = 42

// ✅ Fixed: Add semicolon
const value = 42;
```

## 📁 File Coverage

### Linted Files
- `extension/*.js` - All extension JavaScript files
- `tests/*.js` - All test files

### Ignored Files
- `node_modules/` - Dependencies
- `coverage/` - Test coverage reports
- `arch/` - Archived versions
- `docs/*.js` - Standalone documentation scripts

## 🔍 IDE Integration

### VS Code
Install these extensions for the best experience:
- **ESLint**: `ms-vscode.vscode-eslint`
- **Prettier**: `esbenp.prettier-vscode`

### Settings
Add to your VS Code `settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🐛 Troubleshooting

### ESLint Errors
```bash
# Check specific file
npx eslint extension/close_tabs.js

# Fix specific file
npx eslint extension/close_tabs.js --fix
```

### Prettier Conflicts
```bash
# Check formatting
npx prettier --check extension/

# Fix formatting
npx prettier --write extension/
```

### Module Type Warnings
If you see warnings about module types, ensure `package.json` has:
```json
{
  "type": "module"
}
```

## 📈 Quality Metrics

### Current Status
- ✅ **ESLint**: 0 errors, 0 warnings
- ✅ **Prettier**: All files formatted correctly
- ✅ **Tests**: 24/24 passing
- ✅ **Coverage**: Comprehensive test coverage

### Quality Gates
Before merging code, ensure:
1. `npm run lint` passes with 0 errors
2. `npm run format:check` passes
3. `npm test` shows all tests passing
4. No console errors in extension testing

## 🎯 Best Practices

### Code Style
- Use descriptive variable names
- Keep functions small and focused
- Add comments for complex logic
- Use modern JavaScript features (const/let, arrow functions, template literals)

### Chrome Extension Specific
- Handle Chrome API errors properly
- Use appropriate permissions
- Test with large numbers of tabs
- Consider memory usage

### Testing
- Write tests for new functionality
- Test edge cases (null inputs, large datasets)
- Mock Chrome APIs properly
- Maintain high test coverage

This linting setup ensures consistent, high-quality code across the entire project while being specifically tailored for Chrome extension development.
