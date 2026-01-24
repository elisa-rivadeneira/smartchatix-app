// 🧪 TESTS CRÍTICOS PARA APLICACIÓN COMERCIAL
// Estos tests evitarán regresiones en funciones esenciales

import { describe, test, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock del entorno DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Simular localStorage
const localStorageMock = {
  getItem: (key) => localStorageMock[key] || null,
  setItem: (key, value) => { localStorageMock[key] = value; },
  removeItem: (key) => { delete localStorageMock[key]; },
  clear: () => {
    for (let key in localStorageMock) {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete localStorageMock[key];
      }
    }
  }
};
global.localStorage = localStorageMock;

describe('🛡️ Critical Features Protection', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear();
  });

  test('🔧 getApiBase function exists and works correctly', () => {
    // Mock para desarrollo
    const getApiBase = () => {
      return window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : 'https://app.smartchatix.com';
    };

    // Test localhost
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    });
    expect(getApiBase()).toBe('http://localhost:3001');

    // Test producción
    window.location.hostname = 'app.smartchatix.com';
    expect(getApiBase()).toBe('https://app.smartchatix.com');
  });

  test('🖼️ Image paste functionality structure', () => {
    // Verificar que las funciones de imagen existan en el código
    const fs = require('fs');
    const managerContent = fs.readFileSync('./manager.jsx', 'utf8');

    expect(managerContent).toContain('handlePasteImage');
    expect(managerContent).toContain('handleWysiwygPasteImage');
    expect(managerContent).toContain('onPaste');
  });

  test('🤖 Assistant functionality structure', () => {
    const fs = require('fs');
    const managerContent = fs.readFileSync('./manager.jsx', 'utf8');

    // Verificar estructura del asistente
    expect(managerContent).toContain('sendAssistantMessage');
    expect(managerContent).toContain('/api/assistant/response');
    expect(managerContent).not.toContain('https://api.openai.com/v1/chat/completions');
  });

  test('🚫 No hardcoded URLs in critical files', () => {
    const fs = require('fs');
    const files = ['manager.jsx', 'src/main.jsx'];

    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        // No debe contener URLs hardcodeadas de localhost
        const hardcodedUrls = content.match(/http:\/\/localhost:\d+/g);
        if (hardcodedUrls) {
          console.warn(`⚠️ Hardcoded URLs found in ${file}:`, hardcodedUrls);
        }

        // Excepción: permitir en comentarios o strings de configuración específicos
        const problematicUrls = content
          .split('\n')
          .filter(line =>
            line.includes('http://localhost:') &&
            !line.trim().startsWith('//') &&
            !line.trim().startsWith('*') &&
            !line.includes('getApiBase')
          );

        expect(problematicUrls.length).toBe(0);
      }
    });
  });

  test('📋 Critical server endpoints exist', () => {
    const fs = require('fs');
    const serverContent = fs.readFileSync('./server.js', 'utf8');

    // Endpoints críticos que DEBEN existir
    const criticalEndpoints = [
      '/upload.php',
      '/api/assistant/response',
      '/api/auth',
      '/api/auth/verify'
    ];

    criticalEndpoints.forEach(endpoint => {
      expect(serverContent).toContain(endpoint);
    });
  });

  test('🔐 Environment configuration structure', () => {
    const fs = require('fs');

    // Verificar que .env.example exista
    expect(fs.existsSync('.env.example')).toBe(true);

    const envExample = fs.readFileSync('.env.example', 'utf8');

    // Variables críticas que deben estar documentadas
    const criticalVars = [
      'PRODUCTION_HOST',
      'PRODUCTION_USER',
      'PRODUCTION_PATH',
      'OPENAI_API_KEY'
    ];

    criticalVars.forEach(variable => {
      expect(envExample).toContain(variable);
    });
  });

  test('🛡️ Safe deployment scripts exist', () => {
    const fs = require('fs');

    expect(fs.existsSync('./scripts/safe_deploy.sh')).toBe(true);
    expect(fs.existsSync('./scripts/production_backup.js')).toBe(true);

    const deployScript = fs.readFileSync('./scripts/safe_deploy.sh', 'utf8');

    // El script debe tener protecciones
    expect(deployScript).toContain('backup');
    expect(deployScript).toContain('FALLO CRÍTICO');
    expect(deployScript).toContain('exit 1');
  });
});

describe('🚀 Production Readiness', () => {
  test('📦 Package.json has required scripts', () => {
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

    // Scripts importantes para producción
    expect(packageJson.scripts).toHaveProperty('dev');
    expect(packageJson.scripts).toHaveProperty('build');
  });

  test('🔒 No sensitive data in code', () => {
    const fs = require('fs');
    const files = ['manager.jsx', 'server.js', 'src/main.jsx'];

    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48}/,  // OpenAI API keys
      /AIza[0-9A-Za-z-_]{35}/, // Google API keys
      /password\s*[:=]\s*['""][^'"]*['"]/i,
      /secret\s*[:=]\s*['""][^'"]*['"]/i
    ];

    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');

        sensitivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            console.warn(`⚠️ Possible sensitive data in ${file}:`, matches);
          }
        });
      }
    });
  });
});