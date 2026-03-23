import React, { useState, useEffect } from 'react';

const Landing = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-75"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 lg:p-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">∞</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SmartChatix
            </span>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-2 border border-gray-700 rounded-full hover:border-blue-500 transition-all duration-300 hover:bg-blue-500/10"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105"
            >
              Empezar Revolución
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className={`text-center py-20 px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
          <div className="mb-8">
            <h1 className="text-6xl lg:text-8xl font-bold mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                EL FUTURO
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DE LA PRODUCTIVIDAD
              </span>
              <br />
              <span className="text-white">YA ESTÁ AQUÍ</span>
            </h1>
          </div>

          <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            SmartChatix • Tu asistente AI revolucionario<br />
            <span className="text-blue-400">Piensa más rápido.</span>
            <span className="text-purple-400"> Trabaja más inteligente.</span>
            <span className="text-pink-400"> Logra lo imposible.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xl font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              🚀 EMPEZAR REVOLUCIÓN
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-4 border-2 border-gray-700 rounded-full text-xl font-semibold hover:border-blue-500 transition-all duration-300 hover:bg-blue-500/10"
            >
              ⚡ VER DEMO
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">∞</div>
              <div className="text-gray-400">Posibilidades Infinitas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">⚡</div>
              <div className="text-gray-400">Velocidad Cuántica</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">🧠</div>
              <div className="text-gray-400">Inteligencia Neural</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 lg:px-8 py-20">
          <h2 className="text-4xl lg:text-6xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              IMPOSIBLE HECHO POSIBLE
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Neural Task Processing</h3>
              <p className="text-gray-400">AI que entiende el contexto de tus proyectos y anticipa lo que necesitas antes de que lo pidas.</p>
            </div>

            <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">Quantum Sync</h3>
              <p className="text-gray-400">Sincronización instantánea en tiempo real. Tus ideas se guardan antes de que termines de pensarlas.</p>
            </div>

            <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-pink-500/50 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🌌</div>
              <h3 className="text-xl font-bold mb-4 text-pink-400">Infinite Canvas</h3>
              <p className="text-gray-400">Proyectos sin límites. Organiza desde startups hasta misiones espaciales con la misma facilidad.</p>
            </div>

            <div className="p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🔮</div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Predictive Insights</h3>
              <p className="text-gray-400">Análisis predictivo que sugiere mejoras y optimizaciones antes de que las necesites.</p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center py-20 px-6">
          <h3 className="text-3xl lg:text-5xl font-bold mb-8">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ¿LISTO PARA EL FUTURO?
            </span>
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            No es solo una app. Es tu copiloto hacia el éxito.<br />
            Mientras otros usan to-do lists, tú usas el futuro.
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            🚀 UNIRSE A LA REVOLUCIÓN
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 px-6 border-t border-gray-800">
          <p className="text-gray-500">
            © 2026 SmartChatix. El futuro de la productividad personal.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;