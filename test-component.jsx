import React from 'react';

const TestComponent = () => {
  console.log('TestComponent está renderizando!');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      padding: '20px',
      backgroundColor: '#ff0000',
      color: '#ffffff',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>React está funcionando!</h1>
      <p style={{ fontSize: '24px', marginBottom: '20px' }}>Este es un componente de prueba simple.</p>
      <button
        onClick={() => alert('¡Hola!')}
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: '#ffffff',
          color: '#000000',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Hacer clic aquí
      </button>
    </div>
  );
};

export default TestComponent;