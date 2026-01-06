import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import StatCard from '../components/StatCard';
import { invoke } from '@tauri-apps/api';

interface Product {
  id?: number;
  name: string;
  min_stock?: number;
  category?: string;
}

interface Sale {
  sale_price: number;
}

interface SalesByProduct {
  product_id: number;
  name: string;
  total_qty: number;
  total_revenue: number;
}

interface SalesTrendPoint {
  date: string; // YYYY-MM-DD
  sales_count: number;
  total_revenue: number;
}

interface SalesTotals {
  total_units: number;
  total_revenue: number;
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalSales: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<SalesByProduct[]>([]);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [orderBy, setOrderBy] = useState<'revenue' | 'qty'>('revenue');
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [totals, setTotals] = useState<SalesTotals>({ total_units: 0, total_revenue: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [orderBy, rangeDays, selectedCategory]);

  /**
   * Carga los datos del dashboard desde la base de datos
   * 
   * Esta función maneja dos escenarios:
   * 1. Modo desarrollo (npm run dev): Sin backend Tauri, usa datos vacíos
   * 2. Modo producción (npm run tauri:dev): Con backend Tauri completo
   * 
   * Esto permite desarrollar el frontend sin compilar Rust cada vez
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Verificar si Tauri está disponible (modo producción)
      // En desarrollo solo con Vite, __TAURI__ no existe
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // MODO TAURI: Cargar datos reales desde SQLite
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (rangeDays - 1));
        const fmt = (d: Date) => d.toISOString().split('T')[0];
        const start_date = fmt(start);
        const end_date = fmt(end);

        const [products, sales, top, tr, tot] = await Promise.all([
          invoke<Product[]>('get_products'),
          invoke<Sale[]>('get_sales'),
          invoke<SalesByProduct[]>('get_sales_by_product', { start_date, end_date, order_by: orderBy, category: selectedCategory || null, limit: 5 }),
          invoke<SalesTrendPoint[]>('get_sales_trend', { days: rangeDays }),
          invoke<SalesTotals>('get_sales_totals', { start_date, end_date, category: selectedCategory || null }),
        ]);

        // Calcular estadísticas desde los datos reales
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.name).length;
        const lowStockProducts = products.filter(p => (p.min_stock || 0) <= 5).length;
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_price, 0);

        setStats({
          totalProducts,
          activeProducts,
          lowStockProducts,
          totalSales,
          totalRevenue,
        });

        setTopProducts(top);
        setTrend(tr);
        setTotals(tot);
        const cats = Array.from(new Set(products.map(p => (p.category || '').trim()).filter(Boolean))).sort();
        setCategories(cats);
      } else {
        // MODO DESARROLLO: Sin Tauri, usar datos vacíos
        // Esto evita errores en la consola durante el desarrollo
        console.info('🚀 Modo desarrollo: Ejecutando sin backend Tauri');
        console.info('💡 Para ver datos reales, ejecuta: npm run tauri:dev');
        
        setStats({
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalSales: 0,
          totalRevenue: 0,
        });
        setTopProducts([]);
        setTrend([]);
        setTotals({ total_units: 0, total_revenue: 0 });
      }
    } catch (error) {
      // Si hay error, mostrar información útil en consola
      console.error('❌ Error cargando datos del dashboard:', error);
      console.info('💡 Asegúrate de que el backend Tauri esté corriendo');
      
      // Mantener el estado actual o usar valores por defecto
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
      });
      setTopProducts([]);
      setTrend([]);
      setTotals({ total_units: 0, total_revenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const maxQty = Math.max(...topProducts.map(t => Number(t.total_qty) || 0), 1);
  const maxRev = Math.max(...topProducts.map(t => Number(t.total_revenue) || 0), 1);
  const barData = topProducts.map(t => ({
    name: t.name,
    qty: Number(t.total_qty) || 0,
    revenue: Number(t.total_revenue) || 0,
    qtyN: Math.max(0, Math.round(((Number(t.total_qty) || 0) / maxQty) * 100)),
    revN: Math.max(0, Math.round(((Number(t.total_revenue) || 0) / maxRev) * 100)),
  }));

  return (
    <div className="space-y-6">
      {/* Header con mejor espaciado y modo oscuro */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Panel de Control</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Resumen general de tu inventario y ventas</p>
      </div>
      
      {/* Stats Cards con espaciado optimizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Productos"
          value={loading ? '...' : stats.totalProducts.toString()}
          icon={Package}
          trend={{ value: 0, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Ingresos Totales"
          value={loading ? '...' : `$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 0, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Ventas Realizadas"
          value={loading ? '...' : stats.totalSales.toString()}
          icon={ShoppingCart}
          trend={{ value: 0, isPositive: true }}
          color="purple"
        />
        <StatCard
          title="Stock Bajo"
          value={loading ? '...' : stats.lowStockProducts.toString()}
          icon={AlertTriangle}
          trend={{ value: 0, isPositive: false }}
          color="orange"
        />
      </div>

      {/* Gráficos con diseño más limpio y modo oscuro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ventas por Producto</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrderBy('revenue')}
                className={`px-3 py-1.5 text-xs rounded-lg border ${orderBy === 'revenue' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
              >Ingresos</button>
              <button
                onClick={() => setOrderBy('qty')}
                className={`px-3 py-1.5 text-xs rounded-lg border ${orderBy === 'qty' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
              >Unidades</button>
              <TrendingUp className="text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 text-xs rounded-lg border ${selectedCategory === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
              >Todas</button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                >{cat}</button>
              ))}
            </div>
          )}
          <div className="h-56 w-full min-w-0 rounded-lg">
            {topProducts.length === 0 ? (
              <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Package className="mx-auto mb-2 text-blue-400 dark:text-blue-500" size={32} />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin datos</p>
                </div>
              </div>
            ) : (
              <div className="h-full w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#9ca3af' }} />
                    <Tooltip formatter={(_: any, k: string, p: any) => { void _;
                      const original = k === 'revN' ? p.payload.revenue : p.payload.qty;
                      return k === 'revN' ? [`$${Number(original).toLocaleString()}`, 'Ingresos'] : [`${Number(original).toLocaleString()} uds`, 'Unidades'];
                    }} />
                    <Bar name="Ingresos" dataKey="revN" fill="#8b5cf6" radius={4} />
                    <Bar name="Unidades" dataKey="qtyN" fill="#3b82f6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="pt-4 text-xs text-gray-600 dark:text-gray-400">
            Total unidades: {totals.total_units.toLocaleString()} · Total ingresos: ${totals.total_revenue.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Tendencia de Ventas</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRangeDays(7)}
                className={`px-3 py-1.5 text-xs rounded-lg border ${rangeDays === 7 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
              >7 días</button>
              <button
                onClick={() => setRangeDays(30)}
                className={`px-3 py-1.5 text-xs rounded-lg border ${rangeDays === 30 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
              >30 días</button>
              <DollarSign className="text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>
          <div className="h-56 rounded-lg">
            {trend.length === 0 ? (
              <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="mx-auto mb-2 text-green-400 dark:text-green-500" size={32} />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin datos</p>
                </div>
              </div>
            ) : (
              <div className="h-full w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={trend} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} />
                    <YAxis tick={{ fill: '#9ca3af' }} />
                    <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} labelFormatter={(l: any) => l} />
                    <Area type="monotone" dataKey="total_revenue" stroke="#10b981" fill="url(#grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas con diseño mejorado y modo oscuro */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notificaciones</h2>
          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
            {stats.lowStockProducts}
          </span>
        </div>
        <div className="space-y-3">
          {stats.lowStockProducts > 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="text-amber-500 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Stock Bajo Detectado</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    {stats.lowStockProducts} {stats.lowStockProducts === 1 ? 'producto tiene' : 'productos tienen'} stock por debajo del mínimo
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
              <div className="flex items-start">
                <Package className="text-green-500 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-300 text-sm">Todo en Orden</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    No hay productos con stock bajo en este momento
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {stats.totalProducts === 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
              <div className="flex items-start">
                <Package className="text-blue-500 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300 text-sm">Comienza a Agregar Productos</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Dirígete a Inventario para agregar tus primeros productos
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
