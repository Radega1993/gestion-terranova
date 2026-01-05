# Análisis Detallado de Resúmenes de Recaudaciones

## 📋 Índice
1. [Flujo General](#flujo-general)
2. [Resumen General](#resumen-general)
3. [Resumen Detallado](#resumen-detallado)
4. [Estructura de Datos](#estructura-de-datos)
5. [Procesamiento de Datos](#procesamiento-de-datos)
6. [Generación de PDF](#generación-de-pdf)

---

## 🔄 Flujo General

### 1. Obtención de Datos (Backend)

**Endpoint:** `GET /api/ventas/recaudaciones`

**Ubicación:** `backend/src/modules/ventas/services/ventas.service.ts` → `getRecaudaciones()`

**Proceso:**
1. Se reciben filtros en el DTO `RecaudacionesFiltrosDto`:
   - `fechaInicio` y `fechaFin` (opcionales)
   - `codigoSocio` (opcional)
   - `usuario` (array de IDs de usuarios, opcional)
   - `trabajadorId` (array de IDs de trabajadores, opcional)

2. Se construyen dos consultas separadas:
   - **Ventas:** Se buscan en `Venta` con filtros de fecha, código de socio, usuario y/o trabajador
   - **Reservas:** Se buscan en `Reserva` con estado `COMPLETADA`, filtros de fecha y usuario de creación

3. Se transforman ambos tipos de datos a un formato común:
   ```typescript
   {
     _id: string;
     tipo: 'VENTA' | 'RESERVA';
     fecha: string;
     socio: { codigo: string; nombre: string };
     usuario: { _id: string; username: string };
     trabajador?: { _id: string; nombre: string; identificador: string };
     total: number;
     pagado: number;
     fianza?: number;
     metodoPago?: string;
     estado: string;
     detalles: Array<{
       nombre: string;
       cantidad: number;
       precio: number;
       total: number;
       categoria?: string;
     }>;
     pagos?: Array<{
       fecha: string;
       monto: number;
       metodoPago: string;
       observaciones?: string;
     }>;
   }
   ```

4. **Nota importante:** Las ventas con múltiples pagos se expanden en múltiples registros (uno por pago), usando la fecha del pago como fecha de la transacción.

5. Se combinan y ordenan por fecha (más reciente primero).

### 2. Visualización en Frontend

**Componente:** `RecaudacionesList.tsx`

**Proceso:**
1. El usuario aplica filtros y hace clic en "Buscar"
2. Se llama a `handleBuscar()` que hace fetch a `/api/ventas/recaudaciones`
3. Los datos se almacenan en el estado `ventas`
4. Se muestran en una tabla con:
   - Total recaudado
   - Total de fianzas
   - Totales por usuario/trabajador
   - Tabla detallada de todas las transacciones

5. Botones disponibles:
   - **"Resumen General"**: Abre modal con `ResumenGeneralPDF`
   - **"Resumen Detallado"**: Abre modal con `ResumenDetalladoPDF`

---

## 📊 Resumen General

**Componente:** `ResumenGeneralPDF.tsx`

### Información que Muestra

#### 1. Encabezado
- Título: "Resumen General de Recaudaciones"
- Subtítulo: "Comunidad de Vecinos Terranova"
- Período: Fecha inicio - Fecha fin

#### 2. Resumen por Trabajador/Usuario
Para cada trabajador/usuario que realizó ventas:
- **Categorías de productos vendidos:**
  - Cada categoría de producto (obtenida de `/api/inventory/types`)
  - Reservas (si hay reservas completadas)
  - Otros (productos sin categoría o con categoría no reconocida)
- **Total del trabajador:** Suma de todos los `pagado` de sus ventas

**Lógica de agrupación:**
```typescript
// Se agrupa por venta.usuario.username
// Para cada venta:
//   - Si es RESERVA → suma a categoría "reservas"
//   - Si es VENTA → clasifica cada producto por su categoría
//   - Suma el total pagado al trabajador
```

#### 3. Totales Generales
- Total por cada categoría (suma de todos los trabajadores)
- **Total General:** Suma de todos los totales de trabajadores

#### 4. Totales por Método de Pago
- **Total Efectivo:** Suma de ventas pagadas en efectivo
- **Total Tarjeta:** Suma de ventas pagadas con tarjeta
- **Total:** Suma de efectivo + tarjeta

**Lógica de método de pago:**
```typescript
// Se toma el método de pago de:
//   1. venta.metodoPago (si existe)
//   2. venta.pagos[0].metodoPago (si hay pagos)
//   3. Se clasifica como 'EFECTIVO' o 'TARJETA'
```

#### 5. Pie de Página
- Fecha y hora de generación del documento

### Características Técnicas

- **Obtiene categorías dinámicamente:** Hace fetch a `/api/inventory/types` al montar el componente
- **Agrupa por trabajador:** Usa `venta.usuario.username` como clave
- **Solo muestra categorías con total > 0:** Filtra categorías vacías antes de mostrar
- **Formato:** PDF generado con `@react-pdf/renderer`

---

## 📋 Resumen Detallado

**Componente:** `ResumenDetalladoPDF.tsx`

### Información que Muestra

#### 1. Encabezado
- Título: "Resumen Detallado de Ventas"
- Subtítulo: "Comunidad de Vecinos Terranova"
- Período: Fecha inicio - Fecha fin

#### 2. Tabla de Productos por Categoría
Para cada categoría que tiene productos vendidos:

**Tabla con columnas:**
- **Producto:** Nombre del producto
- **Unidades:** Cantidad total vendida
- **Precio Unit.:** Precio unitario del producto
- **Total:** Total recaudado por ese producto

**Lógica de agrupación:**
```typescript
// Para cada venta:
//   - Si es RESERVA:
//       → Crea entrada "Reserva - {tipoInstalacion}"
//       → Unidades = 1 (por reserva)
//       → Total = monto pagado de la reserva
//   - Si es VENTA:
//       → Para cada producto en venta.detalles:
//           → Agrupa por nombre de producto
//           → Suma unidades (cantidad)
//           → Suma total (precioTotal)
//           → Usa categoría del producto (o 'OTROS' si no tiene)
```

**Características:**
- Evita duplicados usando un `Set` para rastrear ventas únicas por producto
- Ordena productos por total descendente dentro de cada categoría
- Solo muestra categorías que tienen productos vendidos

#### 3. Pie de Página
- Fecha y hora de generación del documento

### Características Técnicas

- **Obtiene categorías dinámicamente:** Hace fetch a `/api/inventory/types` al montar el componente
- **Agrupa por producto:** Usa `producto.nombre` como clave
- **Agrupa por categoría:** Después agrupa productos por su categoría
- **Evita duplicados:** Usa `Set` para rastrear ventas ya contadas por producto
- **Formato:** PDF generado con `@react-pdf/renderer`

---

## 📦 Estructura de Datos

### Datos que Recibe el Componente PDF

```typescript
interface Venta {
  _id: string;
  tipo: 'VENTA' | 'RESERVA';
  fecha: string; // ISO date string
  socio: {
    codigo: string;
    nombre: string;
  };
  usuario: {
    _id: string;
    username: string;
  };
  trabajador?: {
    _id: string;
    nombre: string;
    identificador: string;
  };
  total: number;
  pagado: number;
  fianza?: number;
  metodoPago?: string;
  estado: string;
  detalles: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    total: number;
    categoria?: string;
  }>;
  pagos?: Array<{
    fecha: string;
    monto: number;
    metodoPago: string;
    observaciones?: string;
  }>;
}
```

### Transformación de Reservas

Las reservas se transforman así:
```typescript
{
  tipo: 'RESERVA',
  detalles: [{
    nombre: reserva.tipoInstalacion, // ej: "Piscina", "Barbacoa"
    cantidad: 1,
    precio: reserva.precio,
    total: reserva.precio
  }],
  pagado: reserva.montoAbonado,
  fianza: reserva.fianza || 0
}
```

### Transformación de Ventas

Las ventas se transforman así:
```typescript
{
  tipo: 'VENTA',
  detalles: venta.productos.map(p => ({
    nombre: p.nombre,
    cantidad: p.unidades,
    precio: p.precioUnitario,
    total: p.precioTotal,
    categoria: p.categoria // Si está disponible
  })),
  pagado: venta.pagado // O pago.monto si hay múltiples pagos
}
```

**Nota:** Si una venta tiene múltiples pagos, se crea un registro por cada pago, usando `pago.fecha` como fecha y `pago.monto` como `pagado`.

---

## 🔧 Procesamiento de Datos

### Resumen General - Procesamiento

1. **Obtener categorías:**
   ```typescript
   GET /api/inventory/types → ['BEBIDAS', 'COMIDA', 'OTROS', ...]
   ```

2. **Agrupar por trabajador:**
   ```typescript
   ventasPorTrabajador = {
     'username1': {
       total: 0,
       categorias: {
         'bebidas': 0,
         'comida': 0,
         'reservas': 0,
         'otros': 0
       }
     }
   }
   ```

3. **Clasificar cada venta:**
   - Si `tipo === 'RESERVA'` → suma a `categorias.reservas`
   - Si `tipo === 'VENTA'` → clasifica cada producto por `categoria`

4. **Calcular totales generales:**
   - Suma todos los totales de trabajadores
   - Suma todas las categorías

5. **Calcular métodos de pago:**
   - Recorre todas las ventas
   - Clasifica por `metodoPago` ('EFECTIVO' o 'TARJETA')

### Resumen Detallado - Procesamiento

1. **Obtener categorías:**
   ```typescript
   GET /api/inventory/types → ['BEBIDAS', 'COMIDA', 'OTROS', ...]
   ```

2. **Agrupar productos vendidos:**
   ```typescript
   productosVendidos = {
     'Coca Cola': {
       nombre: 'Coca Cola',
       unidades: 10,
       precioUnitario: 2.50,
       total: 25.00,
       categoria: 'BEBIDAS',
       ventas: Set(['venta_id_1', 'venta_id_2']) // Para evitar duplicados
     }
   }
   ```

3. **Evitar duplicados:**
   - Usa un `Set` para rastrear qué ventas ya se contaron para cada producto
   - Solo incrementa unidades/total si la venta no está en el Set

4. **Ordenar y agrupar:**
   - Convierte a array
   - Ordena por `total` descendente
   - Agrupa por `categoria`

5. **Generar tabla:**
   - Una tabla por categoría
   - Filas ordenadas por total descendente

---

## 📄 Generación de PDF

### Librería Utilizada
- `@react-pdf/renderer` - Genera PDFs desde componentes React

### Componentes PDF Utilizados
- `<Document>`: Contenedor del documento
- `<Page>`: Página del PDF (tamaño A4)
- `<View>`: Contenedor de elementos
- `<Text>`: Texto
- `<PDFViewer>`: Visor del PDF en el navegador con funcionalidad de descarga incorporada

### Estilos
- Definidos con `StyleSheet.create()` de `@react-pdf/renderer`
- Incluyen: headers, sections, tables, rows, cells, footers

### Modales
- Ambos resúmenes se muestran en un `Dialog` de Material-UI
- El PDF se renderiza dentro del `DialogContent` usando `PDFViewer`
- Validación de fechas antes de renderizar (evita `Invalid Date`)
- **Descarga:** El componente `PDFViewer` incluye funcionalidad de descarga incorporada
  - Los usuarios pueden descargar el PDF directamente desde el visor del navegador
  - El botón de descarga aparece en la barra de herramientas del visor PDF

---

## ⚠️ Consideraciones Importantes

### 1. Trabajadores vs Usuarios
- **Resumen General:** Agrupa por `venta.usuario.username`
- **Problema potencial:** Si una venta tiene `trabajador`, debería mostrar el trabajador, no el usuario
- **Solución actual:** En la tabla de recaudaciones se muestra correctamente el trabajador, pero en el resumen general se usa el usuario

### 2. Múltiples Pagos
- Las ventas con múltiples pagos se expanden en múltiples registros
- Cada pago tiene su propia fecha y monto
- Esto puede afectar los totales si no se maneja correctamente

### 3. Categorías Dinámicas
- Las categorías se obtienen del inventario
- Si un producto tiene una categoría que no existe en el inventario, se clasifica como 'OTROS'
- Las categorías se inicializan en minúsculas pero se muestran capitalizadas

### 4. Fechas
- Se validan antes de renderizar para evitar errores de `Invalid Date`
- Si no hay ventas, se muestra un mensaje en lugar del PDF

### 5. Rendimiento
- Los resúmenes procesan todos los datos en el cliente
- Para grandes volúmenes de datos, podría ser mejor procesar en el backend

---

## 🔍 Puntos de Mejora Identificados

1. **Resumen General debería mostrar trabajadores:**
   - Actualmente agrupa por `usuario.username`
   - Debería priorizar `trabajador.nombre` si existe

2. **Categorías de productos en reservas:**
   - Las reservas siempre se clasifican como "reservas"
   - Podría ser útil tener subcategorías (Piscina, Barbacoa, etc.)

3. **Método de pago en múltiples pagos:**
   - Si una venta tiene múltiples pagos con diferentes métodos, solo se cuenta el primero
   - Debería contar cada pago por su método

4. **Validación de datos:**
   - No hay validación de que los productos tengan categoría válida
   - Podría mejorar la clasificación de productos sin categoría

5. **Exportación:**
   - Los PDFs se muestran en un visor (`PDFViewer`) dentro del modal
   - El visor incluye funcionalidad de descarga incorporada
   - Los usuarios pueden descargar el PDF directamente desde el visor del navegador

---

## 📝 Resumen Ejecutivo

### Resumen General
- **Propósito:** Mostrar totales agrupados por trabajador/usuario y categorías
- **Audiencia:** Administradores que necesitan ver resúmenes por trabajador
- **Información clave:** Totales por trabajador, por categoría, por método de pago

### Resumen Detallado
- **Propósito:** Mostrar detalle de productos vendidos agrupados por categoría
- **Audiencia:** Administradores que necesitan ver qué productos se vendieron
- **Información clave:** Productos vendidos, unidades, precios, totales por categoría

### Flujo de Datos
1. Usuario aplica filtros → Frontend
2. Frontend llama a `/api/ventas/recaudaciones` → Backend
3. Backend consulta Ventas y Reservas → MongoDB
4. Backend transforma y combina datos → Formato común
5. Frontend recibe datos y los muestra en tabla
6. Usuario hace clic en "Resumen General" o "Resumen Detallado"
7. Componente PDF procesa datos y genera PDF → Visualización en modal

