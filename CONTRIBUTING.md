# 🤝 Guía de Contribución - VitaSport

## 🚀 Inicio Rápido

### Requisitos Previos

```bash
# Node.js 18 o superior
node --version

# Rust (para Tauri)
rustc --version

# npm o yarn
npm --version
```

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/KronoxYT/VitaSport.git
cd VitaSport

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo (solo frontend)
npm run dev

# 4. Para desarrollo completo con backend
npm run tauri:dev
```

---

## 🛠️ Flujo de Trabajo

### 1. Desarrollo de UI (Rápido)

Para cambios visuales o de interfaz:

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará en http://localhost:5173
# Hot reload automático al guardar cambios
```

**Ventajas:**
- ⚡ Extremadamente rápido
- 🔄 Hot reload instantáneo
- 🎨 Perfecto para diseño UI

**Limitaciones:**
- ❌ Sin base de datos
- ❌ Sin comandos Tauri
- ✅ UI completamente funcional

### 2. Desarrollo Completo (Backend + Frontend)

Para funcionalidades que requieren base de datos:

```bash
# Compilar y ejecutar con Tauri
npm run tauri:dev

# NOTA: Primera compilación puede tardar 3-5 minutos
# Compilaciones subsecuentes son más rápidas
```

**Ventajas:**
- ✅ Base de datos SQLite funcional
- ✅ Todos los comandos Tauri disponibles
- ✅ Comportamiento idéntico a producción

---

## 📝 Estándares de Código

### TypeScript

```typescript
// ✅ CORRECTO: Interfaces bien definidas
interface Product {
  id?: number;
  name: string;
  sku?: string;
  // ... más campos
}

// ✅ CORRECTO: Funciones con JSDoc
/**
 * Carga productos desde la base de datos
 * @returns {Promise<Product[]>} Lista de productos
 */
const loadProducts = async (): Promise<Product[]> => {
  // implementación
};

// ❌ INCORRECTO: Sin tipos
const loadData = async () => {
  const data = await fetchSomething();
  return data;
};
```

### React Components

```typescript
// ✅ CORRECTO: Componente funcional con TypeScript
interface MyComponentProps {
  title: string;
  count: number;
  onAction?: () => void;
}

export default function MyComponent({ title, count, onAction }: MyComponentProps) {
  const [state, setState] = useState<string>('');
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// ❌ INCORRECTO: Sin tipos en props
export default function MyComponent({ title, count }) {
  // ...
}
```

### Manejo de Errores

```typescript
// ✅ CORRECTO: Manejo completo de errores
const saveData = async () => {
  try {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      await invoke('save_data', { data });
      console.info('✅ Datos guardados correctamente');
    } else {
      console.warn('⚠️ Modo desarrollo: Sin backend');
      alert('Función no disponible en modo desarrollo');
    }
  } catch (error) {
    console.error('❌ Error guardando datos:', error);
    alert('Error al guardar. Revisa la consola.');
  }
};

// ❌ INCORRECTO: Sin manejo de modo desarrollo
const saveData = async () => {
  await invoke('save_data', { data }); // Falla en modo dev
};
```

### Estilos Tailwind

```tsx
// ✅ CORRECTO: Clases organizadas y legibles
<div className="flex items-center justify-between p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
  {/* contenido */}
</div>

// ✅ CORRECTO: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* contenido */}
</div>

// ❌ INCORRECTO: Clases inline largas sin orden
<div className="p-6 bg-white flex shadow-sm border-gray-100 rounded-xl items-center hover:shadow-md justify-between transition-all border">
```

---

## 🔧 Agregar Nueva Funcionalidad

### Ejemplo: Agregar Página de Proveedores

#### 1. Crear Interfaz TypeScript

```typescript
// src/types/supplier.ts
export interface Supplier {
  id?: number;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

#### 2. Crear Componente de Página

```typescript
// src/pages/Suppliers.tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Supplier } from '../types/supplier';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Carga proveedores desde la base de datos
   */
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const result = await invoke<Supplier[]>('get_suppliers');
        setSuppliers(result);
        console.info(`✅ ${result.length} proveedores cargados`);
      } else {
        console.info('🚀 Modo desarrollo');
        setSuppliers([]);
      }
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Proveedores</h1>
      {/* UI aquí */}
    </div>
  );
}
```

#### 3. Agregar Ruta

```typescript
// src/App.tsx
import Suppliers from './pages/Suppliers';

// En las rutas:
<Route path="suppliers" element={<Suppliers />} />
```

#### 4. Agregar al Menú

```typescript
// src/components/Layout.tsx
import { Truck } from 'lucide-react';

const menuItems = [
  // ... otros items
  { path: '/suppliers', icon: Truck, label: 'Proveedores' },
];
```

#### 5. Agregar Comando Tauri (si necesitas backend)

```rust
// src-tauri/src/main.rs

// Estructura
#[derive(Debug, Serialize, Deserialize)]
struct Supplier {
    id: Option<i32>,
    name: String,
    contact: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
}

// Comando
#[tauri::command]
fn get_suppliers(state: State<AppState>) -> Result<Vec<Supplier>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    // Implementación SQL
    Ok(vec![])
}

// Registrar en main()
.invoke_handler(tauri::generate_handler![
    get_suppliers,
    // ... otros comandos
])
```

#### 6. Crear Tabla en Database

```rust
// En init_database()
conn.execute(
    "CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT
    )",
    [],
)?;
```

---

## 🧪 Testing

### Testing Manual

1. Probar en modo desarrollo: `npm run dev`
2. Probar con backend: `npm run tauri:dev`
3. Verificar responsividad (DevTools > Responsive)
4. Probar en diferentes tamaños de pantalla

### Checklist Antes de Commit

- [ ] Código sin errores TypeScript
- [ ] Funciona en modo dev (`npm run dev`)
- [ ] Funciona con backend (`npm run tauri:dev`)
- [ ] UI responsive
- [ ] Comentarios JSDoc en funciones importantes
- [ ] Manejo de errores implementado
- [ ] Console logs útiles (✅, ❌, ⚠️, 💡)

---

## 📦 Convenciones de Commit

```bash
# Formato
<tipo>: <descripción corta>

# Tipos
feat:     Nueva funcionalidad
fix:      Corrección de bug
docs:     Cambios en documentación
style:    Formato, espacios, etc (sin cambio de código)
refactor: Refactorización de código
perf:     Mejora de performance
test:     Agregar o modificar tests
chore:    Tareas de mantenimiento

# Ejemplos
git commit -m "feat: agregar página de proveedores"
git commit -m "fix: corregir error al cargar productos"
git commit -m "docs: actualizar README con nuevas instrucciones"
git commit -m "style: mejorar espaciado en Dashboard"
```

---

## 🐛 Debugging Tips

### Frontend (React)

```typescript
// Console logs útiles
console.info('✅ Operación exitosa:', data);
console.error('❌ Error:', error);
console.warn('⚠️ Advertencia:', message);
console.info('💡 Sugerencia:', hint);

// React DevTools
// Instalar extensión: React Developer Tools

// Ver estado de componentes
console.log('Estado actual:', { products, loading, error });
```

### Backend (Rust/Tauri)

```rust
// En src-tauri/src/main.rs
println!("🔍 Debug: {:?}", variable);
eprintln!("❌ Error: {:?}", error);

// Logs aparecen en la terminal donde ejecutas tauri:dev
```

### Base de Datos

```bash
# Abrir base de datos SQLite
sqlite3 vitasport.db

# Ver tablas
.tables

# Ver estructura de tabla
.schema products

# Query datos
SELECT * FROM products LIMIT 10;

# Salir
.exit
```

---

## 🎨 Diseño UI/UX

### Paleta de Colores

```javascript
// Colores principales
primary: blue-600      // Acciones principales
success: emerald-600   // Éxito, confirmaciones
warning: amber-600     // Alertas, advertencias
danger: red-600        // Errores, eliminaciones

// Grises
gray-50   // Fondos
gray-100  // Bordes
gray-600  // Texto secundario
gray-900  // Texto principal
```

### Espaciado Consistente

```typescript
// Padding de cards
p-5, p-6

// Gaps entre elementos
gap-3, gap-4, gap-6

// Márgenes
mb-1, mb-2, mb-4, mb-6
```

### Iconos

```typescript
// Usar Lucide React
import { Package, Plus, Edit, Trash2 } from 'lucide-react';

// Tamaños consistentes
<Icon size={16} /> // Botones pequeños
<Icon size={20} /> // Tamaño normal
<Icon size={24} /> // Destacados
```

---

## 📚 Recursos

- [Tauri Docs](https://tauri.app/v1/guides/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

---

## ❓ Preguntas Frecuentes

### ¿Por qué tengo errores en consola en modo dev?

Esto es normal. El modo `npm run dev` no tiene backend Tauri. Los errores desaparecen al ejecutar `npm run tauri:dev`.

### ¿Cómo agrego una nueva tabla a la base de datos?

1. Edita `src-tauri/src/main.rs`
2. Agrega la estructura en `init_database()`
3. Crea el modelo en Rust
4. Agrega los comandos necesarios

### ¿Puedo usar otra base de datos?

Sí, pero requiere cambiar el código en `main.rs`. SQLite es ideal para aplicaciones de escritorio.

### ¿Cómo cambio el tema de colores?

Edita `tailwind.config.js` en la sección `theme.extend.colors`.

---

## 🙏 Agradecimientos

Gracias por contribuir a VitaSport! 🎉
