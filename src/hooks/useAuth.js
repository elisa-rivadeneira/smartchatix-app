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
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
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