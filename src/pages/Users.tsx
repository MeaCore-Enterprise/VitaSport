import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api';
import { Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id?: number;
  username: string;
  password_hash?: string;
  fullname: string;
  role: string;
}

interface UserFormData {
  username: string;
  fullname: string;
  password: string;
  role: string;
}

/**
 * Página de gestión de usuarios
 * Conectada a la base de datos SQLite
 */
export default function Users() {
  const { user } = useAuth();
  if (user?.role !== 'Administrador') {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Acceso restringido
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Solo los usuarios con rol Administrador pueden gestionar usuarios.
        </p>
      </div>
    );
  }
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    fullname: '',
    password: '',
    role: 'Vendedor',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Carga usuarios desde la base de datos
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const result = await invoke<User[]>('get_users');
        setUsers(result);
        console.info(`✅ ${result.length} usuarios cargados desde SQLite`);
      } else {
        console.info('🚀 Modo desarrollo: Interfaz lista');
        console.info('💡 Para backend completo, ejecuta: npm run tauri:dev');
        // Usuario por defecto en modo desarrollo
        setUsers([{ id: 1, username: 'admin', fullname: 'Administrador', role: 'Administrador' }]);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      // Mostrar usuario por defecto en caso de error
      setUsers([{ id: 1, username: 'admin', fullname: 'Administrador', role: 'Administrador' }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre el modal para agregar un nuevo usuario
   */
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      fullname: '',
      password: '',
      role: 'Vendedor',
    });
    setIsModalOpen(true);
  };

  /**
   * Abre el modal para editar un usuario existente
   */
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullname: user.fullname,
      password: '', // No mostramos la contraseña actual
      role: user.role,
    });
    setIsModalOpen(true);
  };

  /**
   * Elimina un usuario
   */
  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await invoke('delete_user', { id });
        console.info('✅ Usuario eliminado correctamente');
        await loadUsers();
      } else {
        alert('Función no disponible en modo desarrollo. Ejecuta: npm run tauri:dev');
      }
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  /**
   * Guarda el usuario (crear o actualizar)
   */
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        if (editingUser) {
          // Actualizar usuario
          await invoke('update_user', {
            id: editingUser.id,
            username: formData.username,
            fullname: formData.fullname,
            role: formData.role,
            // Solo actualizar contraseña si se proporciona una nueva
            ...(formData.password && { password: formData.password }),
          });
          console.info('✅ Usuario actualizado correctamente');
        } else {
          // Crear nuevo usuario
          await invoke('add_user', {
            username: formData.username,
            fullname: formData.fullname,
            password: formData.password,
            role: formData.role,
          });
          console.info('✅ Usuario creado correctamente');
        }
        
        setIsModalOpen(false);
        await loadUsers();
      } else {
        alert('Función no disponible en modo desarrollo. Ejecuta: npm run tauri:dev');
      }
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
      alert('Error al guardar el usuario. Verifica la consola.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header con modo oscuro */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Administra los usuarios del sistema</p>
        </div>
        <Button icon={Plus} onClick={handleAddUser}>Nuevo Usuario</Button>
      </div>

      {/* Tabla de usuarios con modo oscuro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No hay usuarios registrados</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Agrega tu primer usuario</p>
            </div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Nombre completo
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                    #{user.id}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.username}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {user.fullname}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => user.id && handleDeleteUser(user.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Ventas por producto</p>
              <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                Gráfico de ventas por producto
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Ventas por mes</p>
              <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                Gráfico de ventas por mes
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Alertas</h2>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">No hay alertas activas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Nombre de usuario"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña {!editingUser && <span className="text-red-500">*</span>}
              {editingUser && <span className="text-xs text-gray-500 dark:text-gray-400">(dejar vacío para mantener actual)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingUser}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="Administrador">Administrador</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Almacenero">Almacenero</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
