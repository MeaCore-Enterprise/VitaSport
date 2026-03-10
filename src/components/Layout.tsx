import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText,
  Users,
  LogOut,
  Settings
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/inventory', icon: Package, label: 'Inventario' },
  { path: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { path: '/reports', icon: FileText, label: 'Reportes' },
  { path: '/users', icon: Users, label: 'Usuarios' },
  { path: '/settings', icon: Settings, label: 'Configuración' },
];

/**
 * Layout principal de la aplicación
 * Incluye sidebar con navegación y modo oscuro automático
 */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, user, logout } = useAuth();
  
  // Detectar modo oscuro del sistema automáticamente
  useDarkMode();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role;

  const visibleItems = menuItems.filter((item) => {
    if (role === 'Administrador') return true;
    if (role === 'Vendedor') {
      return ['/dashboard', '/inventory', '/sales', '/reports'].includes(item.path);
    }
    if (role === 'Almacenero') {
      return ['/dashboard', '/inventory', '/reports'].includes(item.path);
    }
    // Si no hay rol definido, por seguridad oculta Usuarios y Configuración
    return item.path !== '/users' && item.path !== '/settings';
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar con soporte para modo oscuro */}
      <aside className="w-64 bg-gray-800 dark:bg-gray-950 shadow-lg flex flex-col relative">
        <div className="p-6 border-b border-gray-700 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-white">VitaSport Nutricion</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sistema de Inventario</p>
        </div>
        
        <nav className="p-4 flex-1 overflow-y-auto pb-32">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-gray-700 dark:bg-gray-800 text-white font-medium'
                    : 'text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Usuario y logout al final del sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{username}</p>
                <p className="text-xs text-gray-400">
                  {user?.role || 'Administrador'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content con soporte para modo oscuro */}
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
