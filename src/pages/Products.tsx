import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { invoke } from '@tauri-apps/api';

interface Product {
  id?: number;
  sku?: string;
  name: string;
  sale_price?: number;
  cost_price?: number;
  brand?: string;
  category?: string;
  presentation?: string;
  flavor?: string;
  weight?: string;
  image_path?: string;
  expiry_date?: string;
  lot_number?: string;
  min_stock?: number;
  max_stock?: number;
  location?: string;
  status?: string;
  current_stock?: number;
}

interface StockBalance {
  product_id: number;
  current_stock: number;
}

const isTauriEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { __TAURI__?: unknown; __TAURI_IPC__?: unknown };
  return Boolean(win.__TAURI__ || win.__TAURI_IPC__);
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState<number>(0);
  const [stockNote, setStockNote] = useState<string>('');

  /**
   * Carga la lista de productos desde la base de datos SQLite
   * 
   * MODOS DE OPERACIÓN:
   * - Desarrollo (npm run dev): No carga datos, muestra interfaz vacía
   * - Producción (npm run tauri:dev): Carga datos reales desde SQLite
   * 
   * @returns {Promise<void>}
   */
  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Verificar si estamos en modo Tauri (con backend)
      if (isTauriEnvironment()) {
        // MODO TAURI: Invocar comandos de Rust para obtener productos y saldos de stock
        const [prods, balances] = await Promise.all([
          invoke<Product[]>('get_products'),
          invoke<StockBalance[]>('get_stock_balances'),
        ]);
        const balanceMap = new Map<number, number>(
          balances.map((b) => [b.product_id, Number(b.current_stock)])
        );
        const merged = prods.map((p) => ({
          ...p,
          current_stock: balanceMap.get(p.id as number) ?? 0,
        }));
        setProducts(merged);
        console.info(`✅ ${merged.length} productos cargados con stock actual`);
      } else {
        // MODO DESARROLLO: Sin backend, mostrar interfaz vacía
        console.info('🚀 Modo desarrollo: Interfaz lista para agregar productos');
        console.info('💡 Para backend completo, ejecuta: npm run tauri:dev');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      console.info('💡 Verifica que el backend Tauri esté corriendo');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const openStockModal = (product: Product) => {
    setTargetProduct(product);
    setStockQty(0);
    setStockNote('');
    setIsStockModalOpen(true);
  };

  const restockToMax = async () => {
    if (!targetProduct) return;
    const current = targetProduct.current_stock ?? 0;
    const max = targetProduct.max_stock ?? 0;
    const delta = max - current;
    if (delta <= 0) {
      alert('El stock ya está en el máximo');
      return;
    }
    if (!isTauriEnvironment()) {
      alert('Disponible solo con backend Tauri');
      return;
    }
    try {
      await invoke('add_stock_movement', { movement: { product_id: targetProduct.id, movement_type: 'ingreso', quantity: delta, note: 'Reabastecer a máximo', created_by: null } });
      setIsStockModalOpen(false);
      await loadProducts();
    } catch (e) {
      alert('Error reabasteciendo');
    }
  };

  const submitStockIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct) return;
    if (stockQty <= 0) {
      alert('Ingresa una cantidad mayor a 0');
      return;
    }
    if (!isTauriEnvironment()) {
      alert('Disponible solo con backend Tauri');
      return;
    }
    try {
      await invoke('add_stock_movement', { movement: { product_id: targetProduct.id, movement_type: 'ingreso', quantity: Math.floor(stockQty), note: stockNote || null, created_by: null } });
      setIsStockModalOpen(false);
      await loadProducts();
    } catch (e) {
      alert('Error aplicando ingreso');
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  /**
   * Abre el modal para agregar un nuevo producto
   * Limpia el producto en edición para empezar desde cero
   */
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  /**
   * Abre el modal para editar un producto existente
   * @param {Product} product - El producto a editar
   */
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  /**
   * Elimina un producto de la base de datos
   * Solicita confirmación antes de eliminar
   * 
   * @param {number} id - ID del producto a eliminar
   * @returns {Promise<void>}
   */
  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        // Solo intentar eliminar si Tauri está disponible
        if (isTauriEnvironment()) {
          await invoke('delete_product', { id });
          await loadProducts();
          console.info(`✅ Producto #${id} eliminado correctamente`);
        } else {
          console.warn('⚠️ Modo desarrollo: No se puede eliminar sin backend');
          window.alert('Función no disponible en modo desarrollo');
        }
      } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        window.alert('Error al eliminar el producto. Verifica la consola para más detalles.');
      }
    }
  };

  /**
   * Guarda un producto (nuevo o editado) en la base de datos
   * Decide entre crear o actualizar según si hay ID
   * 
   * @param {Product} data - Datos del producto a guardar
   * @returns {Promise<void>}
   */
  const handleSubmitProduct = async (data: Product) => {
    console.log('🎯 handleSubmitProduct llamado con:', data);
    
    try {
      // Solo intentar guardar si Tauri está disponible
      if (isTauriEnvironment()) {
        console.log('✅ Tauri detectado, guardando producto...');
        // Validación rápida de SKU duplicado en frontend
        const newSku = (data.sku || '').trim();
        if (newSku) {
          const duplicate = products.some(p =>
            p.sku && p.sku.trim().toLowerCase() === newSku.toLowerCase() && (editingProduct ? p.id !== editingProduct.id : true)
          );
          if (duplicate) {
            alert('El SKU ya existe. Usa otro SKU o edita el producto existente.');
            return;
          }
        }
        
        if (editingProduct?.id) {
          // ACTUALIZAR producto existente
          console.log(`🔄 Actualizando producto #${editingProduct.id}`);
          await invoke('update_product', { product: { ...data, id: editingProduct.id } });
          console.info(`✅ Producto #${editingProduct.id} actualizado`);
        } else {
          // CREAR nuevo producto
          console.log('➕ Creando nuevo producto');
          await invoke('add_product', { product: data });
          console.info('✅ Nuevo producto agregado');
        }
        
        // Recargar la lista de productos
        await loadProducts();
        setIsModalOpen(false);
      } else {
        console.warn('⚠️ Modo desarrollo: No se puede guardar sin backend');
        console.warn('🔧 Ejecuta: npm run tauri:dev para funcionalidad completa');
        window.alert('⚠️ Función no disponible en modo desarrollo.\n\nPara guardar productos, ejecuta:\nnpm run tauri:dev');
      }
    } catch (error) {
      console.error('❌ Error guardando producto:', error);
      const msg = String(error || 'Error al guardar');
      if (msg.includes('UNIQUE constraint failed: products.sku') || msg.toLowerCase().includes('sku ya existe')) {
        alert('El SKU ya existe. Usa otro SKU o edita el producto existente.');
      } else {
        alert(`❌ Error al guardar el producto:\n\n${msg}\n\nVerifica la consola para más detalles.`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header mejorado con modo oscuro */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Inventario de Productos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona tu catálogo de productos</p>
        </div>
        <Button icon={Plus} onClick={handleAddProduct}>Añadir Producto</Button>
      </div>

      {/* Card principal con mejor diseño y modo oscuro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
            >
              <option value="">Todas las categorías</option>
              <option value="Suplementos">Suplementos</option>
              <option value="Proteínas">Proteínas</option>
              <option value="Aminoácidos">Aminoácidos</option>
              <option value="Energéticos">Energéticos</option>
              <option value="Vitaminas">Vitaminas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No se encontraron productos</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Intenta ajustar los filtros o agrega nuevos productos</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Precio Venta
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Margen
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Stock Máximo
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {product.sku || <span className="text-gray-400 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {product.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.brand || <span className="text-gray-400 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      {product.category ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ${product.sale_price?.toLocaleString() || '0'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {product.cost_price != null ? `$${product.cost_price.toLocaleString()}` : <span className="text-gray-400 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {(() => {
                        const sale = Number(product.sale_price ?? 0);
                        const cost = Number(product.cost_price ?? 0);
                        if (!sale || !cost) return '-';
                        const diff = sale - cost;
                        if (diff < 0) {
                          const pctLoss = Math.round(Math.abs(diff) / sale * 100);
                          return `-$${Math.abs(diff).toLocaleString()} (${pctLoss}%)`;
                        }
                        const pct = Math.round((diff / sale) * 100);
                        return `$${diff.toLocaleString()} (${pct}%)`;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {product.current_stock ?? 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {product.max_stock ?? 0}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.expiry_date || <span className="text-gray-400 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => openStockModal(product)}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          title="Ajustar stock"
                        >
                          <Package size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => product.id && handleDeleteProduct(product.id)}
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

      {/* Modal para agregar/editar producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="xl"
      >
        <ProductForm
          initialData={editingProduct || undefined}
          onSubmit={handleSubmitProduct}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={targetProduct ? `Ajuste de Stock - ${targetProduct.name}` : 'Ajuste de Stock'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stock actual</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{targetProduct?.current_stock ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Stock máximo</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{targetProduct?.max_stock ?? 0}</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" onClick={restockToMax}>Reabastecer a máximo</Button>
          </div>
          <form onSubmit={submitStockIngreso} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingreso manual</label>
              <input type="number" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Cantidad a ingresar" />
            </div>
            <div>
              <input type="text" value={stockNote} onChange={(e) => setStockNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Nota (opcional)" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsStockModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Aplicar ingreso</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
