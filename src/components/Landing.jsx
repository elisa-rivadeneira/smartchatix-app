import React, { useState, useEffect } from 'react';

const Landing = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen text-white relative"
         style={{
           background: `
             linear-gradient(135deg, #000000 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #000000 100%)
           `
         }}>
      {/* Gradiente simple optimizado */}
      <div className="absolute inset-0 opacity-40"
           style={{
             background: `
               radial-gradient(ellipse 60% 40% at 20% 20%, #2672b8, transparent),
               radial-gradient(ellipse 50% 30% at 80% 80%, #8b5cf6, transparent)
             `
           }}></div>


      <div className="relative z-10">
        {/* Navigation con mejor contraste */}
        <nav className="flex justify-between items-center p-6 lg:p-8 bg-black/50 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img
                src="/smartchatix_logo.svg"
                alt="SmartChatix Logo"
                className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-300 via-blue-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                SmartChatix
              </span>
              <span className="text-xs text-gray-300 tracking-widest uppercase">
                Productividad Simple
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 rounded-lg border border-white/30 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white font-medium transition-all duration-300"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-orange-600 text-white font-semibold hover:from-pink-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Empezar Ahora
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className={`text-center py-16 lg:py-24 px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>

          {/* Logo simple y rápido */}
          <div className="flex justify-center mb-12">
            <img
              src="/smartchatix_logo.svg"
              alt="SmartChatix Logo"
              className="w-32 h-32 lg:w-48 lg:h-48 object-contain"
            />
          </div>

          {/* Título auténtico y directo */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <div className="mb-2">
                <span className="text-white drop-shadow-lg">
                  Organiza mejor.
                </span>
              </div>
              <div className="mb-2">
                <span className="bg-gradient-to-r from-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                  Trabaja mejor.
                </span>
              </div>
              <div className="mb-8">
                <span className="text-gray-200 drop-shadow-lg">
                  Vive mejor.
                </span>
              </div>
            </h1>

            {/* Botones CTA principales */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <button
                onClick={() => onNavigate('register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
              >
                Crear cuenta gratis
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="px-8 py-4 border border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-lg text-lg font-medium transition-all duration-300"
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>

          {/* Subtítulo honesto y directo */}
          <div className="mb-16 max-w-3xl mx-auto bg-black/30 rounded-2xl p-8">
            <p className="text-lg lg:text-xl text-gray-200 mb-12 leading-relaxed drop-shadow-md">
              La app que te ayuda a no perderte en tus proyectos.
              <br />
              <span className="text-white font-medium">Simple, práctica, efectiva.</span>
            </p>

            {/* Beneficios reales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base">
              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/10">
                <div className="text-3xl mb-3">📝</div>
                <span className="font-medium text-white block mb-2 drop-shadow-md">Todo en un lugar</span>
                <p className="text-gray-300 text-sm">Proyectos, tareas, ideas. Sin complicaciones.</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/10">
                <div className="text-3xl mb-3">💬</div>
                <span className="font-medium text-white block mb-2 drop-shadow-md">Chat inteligente</span>
                <p className="text-gray-300 text-sm">Pregúntale cualquier cosa sobre tus proyectos.</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-white/10 border border-white/10">
                <div className="text-3xl mb-3">✅</div>
                <span className="font-medium text-white block mb-2 drop-shadow-md">Simplemente funciona</span>
                <p className="text-gray-300 text-sm">Sin curva de aprendizaje. Empieza ya.</p>
              </div>
            </div>
          </div>


          {/* Números reales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center p-6 bg-black/30 rounded-lg border border-white/10">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">100% Gratis</div>
              <div className="text-gray-300">Para siempre</div>
            </div>
            <div className="text-center p-6 bg-black/30 rounded-lg border border-white/10">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Sin Límites</div>
              <div className="text-gray-300">Todos los proyectos que quieras</div>
            </div>
            <div className="text-center p-6 bg-black/30 rounded-lg border border-white/10">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Seguro</div>
              <div className="text-gray-300">Tus datos siempre privados</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 lg:px-8 py-20 bg-black/20">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 text-white drop-shadow-lg">
            Todo lo que necesitas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 bg-black/40 rounded-lg border border-white/20 hover:border-pink-400/50 transition-all duration-300">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-3 text-white drop-shadow-md">Gestión de proyectos</h3>
              <p className="text-gray-200">Organiza tus proyectos por categorías. Ve el progreso de un vistazo.</p>
            </div>

            <div className="p-6 bg-black/40 rounded-lg border border-white/20 hover:border-blue-400/50 transition-all duration-300">
              <div className="text-3xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-3 text-white drop-shadow-md">Tareas inteligentes</h3>
              <p className="text-gray-200">Crea tareas, subtareas, fechas límite. El sistema te recuerda lo importante.</p>
            </div>

            <div className="p-6 bg-black/40 rounded-lg border border-white/20 hover:border-orange-400/50 transition-all duration-300">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-3 text-white drop-shadow-md">Chat con IA</h3>
              <p className="text-gray-200">Pregúntale a tu asistente sobre cualquier proyecto. Obtén respuestas instantáneas.</p>
            </div>

            <div className="p-6 bg-black/40 rounded-lg border border-white/20 hover:border-purple-400/50 transition-all duration-300">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-lg font-semibold mb-3 text-white drop-shadow-md">Sincronización automática</h3>
              <p className="text-gray-200">Accede desde cualquier dispositivo. Tus datos siempre actualizados.</p>
            </div>

            <div className="p-6 bg-black/40 rounded-lg border border-white/20 hover:border-pink-400/50 transition-all duration-300">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold mb-3 text-white drop-shadow-md">Interfaz limpia</h3>
              <p className="text-gray-200">Diseño intuitivo que no se interpone en tu trabajo. Enfócate en lo importante.</p>
            </div>

            <div className="p-6 bg-black/40 rounded-lg border border-white/20 hover:border-blue-400/50 transition-all duration-300">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-3 text-white drop-shadow-md">Privacidad total</h3>
              <p className="text-gray-200">Tus proyectos son solo tuyos. Sin rastreo, sin publicidad, sin sorpresas.</p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center py-20 px-6 bg-black/20">
          <h3 className="text-2xl lg:text-3xl font-bold mb-6 text-white drop-shadow-lg">
            ¿Listo para organizarte mejor?
          </h3>
          <p className="text-lg text-gray-200 mb-8 max-w-xl mx-auto drop-shadow-md">
            Empieza gratis. No necesitas tarjeta de crédito.
            <br />
            En 2 minutos ya estarás usando SmartChatix.
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="px-10 py-4 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-lg text-lg font-medium hover:from-pink-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
          >
            Crear cuenta gratis
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 px-6 border-t border-gray-800">
          <p className="text-gray-500">
            © 2026 SmartChatix. Productividad simple y efectiva.
          </p>
        </footer>
      </div>

      {/* Estilos CSS para las animaciones */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 12s linear infinite;
        }

        .gradient-shift {
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;