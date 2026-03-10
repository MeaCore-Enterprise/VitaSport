import { User, Bell, Shield, Database, Globe } from 'lucide-react';
import Button from '../components/Button';
import { invoke } from '@tauri-apps/api';
import { useAuth } from '../contexts/AuthContext';

const isTauriEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { __TAURI__?: unknown; __TAURI_IPC__?: unknown };
  return Boolean(win.__TAURI__ || win.__TAURI_IPC__);
};

export default function Settings() {
  const { user } = useAuth();

  const handleResetDatabase = async () => {
    if (!isTauriEnvironment()) {
      alert('Esta acción solo está disponible en la app de escritorio (Tauri).');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Esta acción borrará TODOS los datos (productos, ventas, movimientos de stock y caja, usuarios) y dejará solo el usuario admin/admin.\n\n¿Seguro que quieres continuar?'
    );
    if (!confirmed) return;

    try {
      await invoke('reset_database');
      alert('Base de datos limpiada correctamente.\n\nUsuario por defecto: admin / admin');
    } catch (error) {
      console.error('Error al limpiar la base de datos:', error);
      alert('Error al limpiar la base de datos. Revisa la consola para más detalles.');
    }
  };

  if (user?.role !== 'Administrador') {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acceso restringido
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Solo los usuarios con rol Administrador pueden acceder a la configuración avanzada.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configuración</h1>

      <div className="space-y-6">
        {/* Perfil */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Perfil de Usuario</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                defaultValue="Admin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue="admin@vitasport.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button>Guardar Cambios</Button>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Notificaciones</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Alertas de stock bajo', checked: true },
              { label: 'Nuevas ventas', checked: true },
              { label: 'Actualizaciones del sistema', checked: false },
              { label: 'Reportes automáticos', checked: true },
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Seguridad</h2>
          </div>
          <div className="space-y-4">
            <Button variant="secondary">Cambiar Contraseña</Button>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Autenticación de dos factores</span>
              </label>
            </div>
          </div>
        </div>

        {/* Base de Datos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Base de Datos</h2>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">Exportar Datos</Button>
            <Button variant="secondary">Importar Datos</Button>
            <Button variant="danger" onClick={handleResetDatabase}>
              Limpiar Base de Datos
            </Button>
          </div>
        </div>

        {/* Idioma */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-primary-600" size={24} />
            <h2 className="text-xl font-semibold">Idioma y Región</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option>Español</option>
                <option>English</option>
                <option>Português</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option>GMT-3 (Buenos Aires)</option>
                <option>GMT-5 (New York)</option>
                <option>GMT+0 (London)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
