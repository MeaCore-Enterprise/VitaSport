import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import Button from '../components/Button';
import { invoke } from '@tauri-apps/api';

export default function Reports() {
  const [reportType, setReportType] = useState<'Ventas' | 'Inventario' | 'Financiero'>('Ventas');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  /**
   * Maneja la exportación de todos los reportes
   */
  const handleExportAll = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const paths = await invoke<string[]>('export_all_reports');
        alert(`✅ Reportes exportados en CSV:\n\n${paths.join('\n')}`);
      } else {
        alert('⚠️ Ejecuta en modo Tauri para exportar reportes (npm run tauri:dev)');
      }
    } catch (e) {
      alert('❌ Error exportando reportes');
    }
  };

  /**
   * Maneja la descarga de un reporte específico
   */
  const handleDownloadReport = async (reportTitle: string) => {
    try {
      if (!(typeof window !== 'undefined' && '__TAURI__' in window)) {
        alert('⚠️ Ejecuta en modo Tauri para exportar reportes (npm run tauri:dev)');
        return;
      }
      if (reportTitle === 'Reporte de Ventas') {
        const p = await invoke<string>('export_sales_report', { start_date: null, end_date: null });
        alert(`✅ Reporte de Ventas exportado:\n${p}`);
      } else if (reportTitle === 'Reporte de Inventario') {
        const p = await invoke<string>('export_inventory_report');
        alert(`✅ Reporte de Inventario exportado:\n${p}`);
      } else if (reportTitle === 'Productos Más Vendidos') {
        const p = await invoke<string>('export_top_products_report');
        alert(`✅ Reporte de Productos Más Vendidos exportado:\n${p}`);
      } else if (reportTitle === 'Análisis de Rentabilidad') {
        const p = await invoke<string>('export_profitability_report');
        alert(`✅ Reporte de Análisis de Rentabilidad exportado:\n${p}`);
      } else if (reportTitle === 'Movimientos de Stock') {
        const p = await invoke<string>('export_stock_movements_report');
        alert(`✅ Reporte de Movimientos de Stock exportado:\n${p}`);
      } else if (reportTitle === 'Reporte Financiero') {
        const p = await invoke<string>('export_financial_report', { start_date: null, end_date: null });
        alert(`✅ Reporte Financiero exportado:\n${p}`);
      } else {
        alert('🛠️ Ese reporte está en desarrollo');
      }
    } catch (e) {
      alert('❌ Error exportando el reporte');
    }
  };

  /**
   * Maneja la generación de reporte personalizado
   */
  const handleGenerateReport = async () => {
    try {
      if (!(typeof window !== 'undefined' && '__TAURI__' in window)) {
        alert('⚠️ Ejecuta en modo Tauri para exportar reportes (npm run tauri:dev)');
        return;
      }
      if (reportType === 'Ventas') {
        const p = await invoke<string>('export_sales_report', {
          start_date: startDate || null,
          end_date: endDate || null,
        });
        alert(`✅ Reporte de Ventas exportado:\n${p}`);
      } else if (reportType === 'Inventario') {
        const p = await invoke<string>('export_inventory_report');
        alert(`✅ Reporte de Inventario exportado:\n${p}`);
      } else {
        const p = await invoke<string>('export_financial_report', {
          start_date: startDate || null,
          end_date: endDate || null,
        });
        alert(`✅ Reporte Financiero exportado:\n${p}`);
      }
    } catch (e) {
      alert('❌ Error generando el reporte');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Reportes</h1>
        <Button icon={Download} onClick={handleExportAll}>Exportar Reportes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[
          { title: 'Reporte de Ventas', description: 'Análisis detallado de ventas por período', icon: FileText },
          { title: 'Reporte de Inventario', description: 'Estado actual del inventario', icon: FileText },
          { title: 'Productos Más Vendidos', description: 'Top 10 productos por ventas', icon: FileText },
          { title: 'Análisis de Rentabilidad', description: 'Márgenes y ganancias por producto', icon: FileText },
          { title: 'Movimientos de Stock', description: 'Historial de entradas y salidas', icon: FileText },
          { title: 'Reporte Financiero', description: 'Resumen financiero mensual', icon: FileText },
        ].map((report, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <report.icon className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <Button 
                variant="secondary" 
                icon={Download} 
                className="!p-2"
                onClick={() => handleDownloadReport(report.title)}
              >
                <span className="sr-only">Descargar</span>
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{report.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Generar Reporte Personalizado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Reporte</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="Ventas">Ventas</option>
              <option value="Inventario">Inventario</option>
              <option value="Financiero">Financiero</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
        <Button icon={FileText} onClick={handleGenerateReport}>Generar Reporte</Button>
      </div>
    </div>
  );
}
