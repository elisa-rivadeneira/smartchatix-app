// 🛡️ REGLAS ESLINT PARA APLICACIÓN COMERCIAL
// Protege contra errores comunes que podrían romper producción

module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    // 🚫 PROHIBIR URLs hardcodeadas
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/^https?:\\/\\/localhost:/]',
        message: '❌ URLs hardcodeadas prohibidas. Usa getApiBase() en su lugar.'
      },
      {
        selector: 'TemplateLiteral[quasis.0.value.raw=/^https?:\\/\\/localhost:/]',
        message: '❌ URLs hardcodeadas prohibidas en template literals. Usa getApiBase().'
      }
    ],

    // 🔒 PROHIBIR datos sensibles
    'no-restricted-patterns': [
      {
        pattern: 'sk-[a-zA-Z0-9]{48}',
        message: '❌ API key de OpenAI detectada. Usa variables de entorno.'
      },
      {
        pattern: 'AIza[0-9A-Za-z-_]{35}',
        message: '❌ API key de Google detectada. Usa variables de entorno.'
      }
    ],

    // 📋 REQUERIR documentación en funciones críticas
    'require-jsdoc': [
      'error',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: false,
          ClassDeclaration: false,
          ArrowFunctionExpression: false,
          FunctionExpression: false
        }
      }
    ],

    // ⚠️ ADVERTENCIAS para mejores prácticas
    'no-console': ['warn'],
    'no-debugger': ['error'],
    'no-unused-vars': ['error'],

    // 🔧 CONSISTENCY para código comercial
    'indent': ['error', 2],
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    'semi': ['error', 'always'],
    'no-trailing-spaces': ['error'],
    'eol-last': ['error'],

    // 🛡️ SEGURIDAD
    'no-eval': ['error'],
    'no-implied-eval': ['error'],
    'no-script-url': ['error']
  },

  // Custom rules para este proyecto
  overrides: [
    {
      files: ['manager.jsx', 'src/**/*.jsx'],
      rules: {
        // Funciones críticas deben estar presentes
        'no-restricted-globals': [
          'error',
          {
            name: 'fetch',
            message: 'Considera usar authenticatedFetch para llamadas autenticadas'
          }
        ]
      }
    }
  ]
};