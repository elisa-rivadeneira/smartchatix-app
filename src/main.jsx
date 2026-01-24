import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import PersonalCoachAssistant from '../manager.jsx'

console.log('=== MAIN.JSX INICIANDO ===');
console.log('✅ PersonalCoachAssistant importado correctamente');

// Componente simplificado de PersonalCoachAssistant para testing
const SimplePersonalCoach = () => {
  console.log('=== SimplePersonalCoach RENDERIZANDO ===');

  const [message, setMessage] = useState('');

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>
        🤖 Asistente Coach Personal - Versión Simplificada
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Estado: ✅ React funcionando correctamente</h2>
        <p>Si ves este mensaje, React está cargando y renderizando sin problemas.</p>
        <h3>Test de import del componente original:</h3>
        <p>PersonalCoachAssistant: {componentImported ? '✅ Importado correctamente' : '❌ Error'}</p>
        {componentError && <p style={{color: componentError === 'Cargando...' ? 'orange' : 'red'}}>Estado: {componentError}</p>}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Test de Interactividad</h3>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe algo aquí..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <p>Mensaje: {message || '(vacío)'}</p>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Test del componente original</h3>
        {componentImported && PersonalCoachAssistant ? (
          <div>
            <p>✅ El componente está listo para probar</p>
            <button
              onClick={() => {
                console.log('Intentando renderizar PersonalCoachAssistant...');
                try {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(<PersonalCoachAssistant />);
                  console.log('✅ PersonalCoachAssistant renderizado');
                } catch (error) {
                  console.log('❌ Error renderizando PersonalCoachAssistant:', error.message);
                  alert('Error renderizando: ' + error.message);
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Probar Componente Original
            </button>
          </div>
        ) : (
          <p>Esperando que se importe el componente...</p>
        )}
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
console.log('Root element encontrado:', !!rootElement);

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root creado');

  root.render(<PersonalCoachAssistant />);
  console.log('PersonalCoachAssistant renderizado');
} else {
  console.error('NO SE ENCONTRÓ EL ELEMENTO ROOT');
}