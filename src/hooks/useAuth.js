import { useState, useEffect } from 'react';

// Configuración dinámica de API para autenticación
const getAuthApiBase = () => {
  const hostname = window.location.hostname;

  // En producción (cualquier dominio que no sea localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    console.log('🔐 Auth modo producción detectado:', hostname);
    return '/api/auth';
  }

  // En desarrollo - usar variable de entorno si está disponible
  const devHost = import.meta.env.VITE_DEV_SERVER_HOST || 'localhost';
  console.log('🔧 Auth modo desarrollo detectado, usando:', devHost);
  return `http://${devHost}:3001/api/auth`;
};

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primero verificar si hay parámetros de OAuth callback en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const loginSuccess = urlParams.get('login');
        const userParam = urlParams.get('user');
        const tokenParam = urlParams.get('token');

        if (loginSuccess === 'success' && userParam && tokenParam) {
          console.log('🔐 [useAuth] OAuth callback detectado, procesando...');

          try {
            const userData = JSON.parse(decodeURIComponent(userParam));
            const authToken = decodeURIComponent(tokenParam);

            // Guardar datos de autenticación
            setUser(userData);
            setToken(authToken);
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(userData));

            console.log('✅ [useAuth] OAuth login exitoso:', userData);

            // Limpiar parámetros de URL
            window.history.replaceState({}, document.title, window.location.pathname);

            setLoading(false);
            return;
          } catch (parseError) {
            console.error('❌ [useAuth] Error parseando parámetros OAuth:', parseError);
          }
        }

        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          // Verificar que el token siga siendo válido
          const response = await fetch(`${getAuthApiBase()}/verify`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token inválido, limpiar almacenamiento
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // En caso de error, limpiar almacenamiento
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, authToken) => {
    console.log('🔐 [useAuth] Login ejecutado:', { userData, authToken });
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    // Asegurar que el loading se desactive
    setLoading(false);
  };

  const logout = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        // Notificar al servidor del logout
        await fetch(`${getAuthApiBase()}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  // Función para hacer peticiones autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const authToken = localStorage.getItem('authToken');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
      }
    };

    try {
      const response = await fetch(url, config);

      // Si el token expiró, hacer logout automático
      if (response.status === 401 || response.status === 403) {
        await logout();
        throw new Error('Sesión expirada');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    authenticatedFetch
  };
};

export default useAuth;