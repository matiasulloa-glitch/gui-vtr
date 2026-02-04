# 📋 Gestión de Configuraciones IVR

Este es un proyecto simple con una GUI web que permite consultar y actualizar configuraciones de IVR a través de una API REST.

## 📋 ¿Qué hace este proyecto?

Este proyecto es una interfaz gráfica simple que:
1. **Muestra una tabla** con configuraciones IVR (IVR, PLATAFORMA, OPC_MENU, TEMPLATE, CORTE, ESTADO)
2. **Permite activar/desactivar** los campos ESTADO y CORTE mediante switches
3. **Se comunica con una API REST** para consultar y guardar los cambios
4. **NO tiene conexión directa a Genesys** - solo funciona a través de la API

## 🗂️ Estructura del Proyecto

```
proyecto-simple-api-frontend/
│
├── server.js              # El servidor API (cerebro de la aplicación)
├── package.json           # Lista de dependencias del proyecto
├── README.md              # Este archivo (documentación)
│
└── public/                # Carpeta con archivos del frontend
    ├── index.html         # La página web principal (tabla)
    ├── styles.css         # Estilos visuales de la página
    └── app.js             # Lógica interactiva de la página
```

## 📁 Explicación de Cada Archivo

### 1. `package.json`
**¿Qué es?** Es como un "índice" del proyecto. Contiene:
- El nombre del proyecto
- Las dependencias (librerías que necesitamos)
- Scripts para ejecutar el proyecto

**Dependencias principales:**
- **express**: Librería para crear el servidor web fácilmente
- **cors**: Permite que el frontend se comunique con la API

### 2. `server.js`
**¿Qué es?** El archivo principal del servidor. Es como el "cerebro" de la aplicación.

**Funciones principales:**
- Almacena configuraciones en memoria (simula una base de datos)
- Escucha peticiones en el puerto 3000
- Define rutas REST que la API puede recibir

**Rutas disponibles:**
- `GET /` → Muestra la página principal (index.html)
- `GET /api/configuraciones` → Obtiene todas las configuraciones
- `PUT /api/configuraciones/:id` → Actualiza ESTADO o CORTE de una configuración específica

**Datos almacenados:**
Cada configuración tiene:
- `id`: Identificador único
- `ivr`: Código del IVR
- `plataforma`: Nombre de la plataforma (ej: "Genesys Cloud")
- `opc_menu`: Opción de menú
- `template`: Nombre del template
- `corte`: Booleano (true/false) - puede activarse/desactivarse
- `estado`: Booleano (true/false) - puede activarse/desactivarse

### 3. `public/index.html`
**¿Qué es?** La estructura de la página web. Define qué elementos hay en la página.

**Contiene:**
- Un encabezado con el título
- Un botón para recargar datos
- Una tabla con las columnas: IVR, PLATAFORMA, OPC_MENU, TEMPLATE, CORTE, ESTADO
- Switches (interruptores) para activar/desactivar CORTE y ESTADO
- Mensajes de estado y error

### 4. `public/styles.css`
**¿Qué es?** Los estilos visuales de la página. Define colores, tamaños, espaciados.

**Características:**
- Diseño moderno y atractivo
- Tabla responsive (se adapta a diferentes tamaños de pantalla)
- Switches animados para activar/desactivar
- Colores degradados (gradientes)
- Diseño responsivo (se adapta a móviles)

### 5. `public/app.js`
**¿Qué es?** La lógica interactiva de la página. Hace que la página responda a las acciones del usuario.

**Funciones principales:**
- `cargarConfiguraciones()`: Carga los datos de la API y los muestra en la tabla
- `crearFilaTabla()`: Crea una fila de la tabla con los datos de una configuración
- `actualizarConfiguracion()`: Envía una petición a la API para actualizar ESTADO o CORTE
- Maneja errores y muestra mensajes apropiados

**Cómo funciona:**
1. Al cargar la página, llama a la API para obtener las configuraciones
2. Cuando el usuario cambia un switch (CORTE o ESTADO), detecta el cambio
3. Envía una petición PUT a la API para guardar el cambio
4. Muestra un mensaje de éxito o error según el resultado

## 🚀 Cómo Ejecutar el Proyecto

### Paso 1: Instalar Node.js
Si no tienes Node.js instalado, descárgalo desde: https://nodejs.org/

### Paso 2: Instalar las Dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto descargará todas las librerías necesarias (express, cors).

### Paso 3: Iniciar el Servidor
Ejecuta el siguiente comando:

```bash
npm start
```

O también puedes usar:

```bash
node server.js
```

Deberías ver un mensaje como:
```
=================================
🚀 Servidor iniciado correctamente
📡 Escuchando en: http://localhost:3000
=================================
```

### Paso 4: Abrir en el Navegador
Abre tu navegador web y visita:

```
http://localhost:3000
```

¡Listo! Ya puedes usar la aplicación.

## 📖 Cómo Usar la Aplicación

1. **Ver la tabla:**
   - Al cargar la página, verás una tabla con todas las configuraciones
   - Las columnas son: IVR, PLATAFORMA, OPC_MENU, TEMPLATE, CORTE, ESTADO

2. **Activar/Desactivar CORTE o ESTADO:**
   - Usa los switches (interruptores) en las columnas CORTE y ESTADO
   - Al cambiar un switch, se guarda automáticamente en la API
   - Verás un mensaje de "⏳ Guardando..." mientras se procesa
   - Si es exitoso, verás "✅ CORTE actualizado correctamente" o "✅ ESTADO actualizado correctamente"

3. **Recargar datos:**
   - Haz clic en el botón "🔄 Recargar Datos" para volver a cargar la tabla desde la API

## 🔍 Conceptos Importantes para Principiantes

### ¿Qué es una API REST?
Una API REST es como un "mesero" que recibe pedidos (peticiones) y trae respuestas (datos). 
- **GET**: Para obtener/consultar datos (como pedir el menú)
- **PUT**: Para actualizar datos (como pedir cambiar un plato)

### ¿Qué es el Frontend?
El frontend es lo que el usuario VE y con lo que INTERACTÚA. En nuestro caso, es la página web con la tabla y los switches.

### ¿Qué es el Backend?
El backend es la parte que el usuario NO VE. Es el servidor que procesa la información. En nuestro caso, es el archivo `server.js` que almacena y devuelve las configuraciones.

### ¿Qué son los Switches?
Los switches son esos interruptores que puedes activar/desactivar. Son como los interruptores de luz, pero en la pantalla. Al cambiar uno, se envía automáticamente una petición a la API para guardar el cambio.

## 🛠️ Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución para JavaScript en el servidor
- **Express**: Framework para crear APIs rápidamente
- **HTML/CSS/JavaScript**: Tecnologías estándar del web
- **JSON**: Formato para intercambiar datos

## 📝 Notas Adicionales

- El servidor corre en el puerto 3000 por defecto
- Si el puerto 3000 está ocupado, puedes cambiarlo en `server.js` (línea `const PORT = 3001;`)
- Los datos se almacenan en memoria, por lo que se pierden al reiniciar el servidor
- En un proyecto real, estos datos estarían en una base de datos
- Todos los archivos tienen comentarios explicativos en español
- Este es un proyecto educativo, ideal para aprender

## 🔌 Integración con API Externa

Si quieres conectar esta GUI con una API externa (por ejemplo, una API de Genesys), solo necesitas modificar las funciones en `server.js`:

1. En lugar de usar el array `configuraciones`, haz peticiones HTTP a tu API externa
2. En `GET /api/configuraciones`, llama a tu API para obtener los datos
3. En `PUT /api/configuraciones/:id`, llama a tu API para actualizar los datos

**Ejemplo de cómo modificar para conectar a una API externa:**

```javascript
// En lugar de devolver configuraciones directamente:
app.get('/api/configuraciones', async (req, res) => {
    try {
        // Llamar a tu API externa
        const response = await fetch('https://tu-api-genesys.com/configuraciones');
        const data = await response.json();
        res.json({ success: true, data: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

## 🐛 Solución de Problemas

**Problema:** "No se puede conectar con el servidor"
- **Solución:** Asegúrate de que `npm start` esté corriendo

**Problema:** "Error al instalar dependencias"
- **Solución:** Asegúrate de tener Node.js instalado y actualizado

**Problema:** "Puerto 3000 ya en uso"
- **Solución:** Cambia el puerto en `server.js` (línea `const PORT = 3001;`)

**Problema:** "Los cambios no se guardan"
- **Solución:** Verifica que el servidor esté corriendo y que no haya errores en la consola del navegador (F12)

## 🎓 Próximos Pasos para Aprender

1. Modifica los datos de ejemplo en `server.js`
2. Agrega más columnas a la tabla
3. Conecta la API con una base de datos real (MySQL, MongoDB, etc.)
4. Agrega validaciones adicionales
5. Mejora el diseño visual en `styles.css`

¡Diviértete aprendiendo! 🚀
