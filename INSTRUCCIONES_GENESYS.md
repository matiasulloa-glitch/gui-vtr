# 🔧 Instrucciones para Configurar Genesys Cloud

Este documento te guía paso a paso para conectar la aplicación con Genesys Cloud.

## 📋 Requisitos Previos

1. Tener una cuenta de Genesys Cloud
2. Tener permisos de administrador o permisos para crear OAuth Clients
3. Tener acceso a Architect para ver las Data Tables

## 🚀 Paso 1: Crear OAuth Client en Genesys Cloud

### 1.1 Acceder a la configuración de OAuth
1. Inicia sesión en Genesys Cloud
2. Ve a **Admin** (⚙️) → **Integrations** → **OAuth**
3. Haz clic en **+ Add** para crear un nuevo OAuth Client

### 1.2 Configurar el OAuth Client
1. **Name**: Dale un nombre descriptivo (ej: "GUI VTR API Client")
2. **Grant Types**: Selecciona **Client Credentials Grant**
3. **Roles**: Asigna los roles necesarios:
   - `architect:datatable:view` - Para leer Data Tables
   - `architect:datatable:edit` - Para editar Data Tables
4. Haz clic en **Save**

### 1.3 Obtener las credenciales
1. Una vez creado, verás el **Client ID**
2. Haz clic en **Show Secret** para ver el **Client Secret**
   - ⚠️ **IMPORTANTE**: Copia el Client Secret AHORA, solo se muestra una vez
3. Guarda ambos valores en un lugar seguro

## 🔍 Paso 2: Obtener el ID de la Data Table

### 2.1 Acceder a Architect
1. Ve a **Architect** → **Data Tables**
2. Busca o crea la Data Table que contiene tus configuraciones IVR

### 2.2 Obtener el ID
1. Haz clic en la Data Table que quieres usar
2. En la URL del navegador, verás algo como:
   ```
   https://apps.mypurecloud.com/architect/#/view/dataTable/xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
   ```
3. El ID es la parte después de `/dataTable/` (xxxxx-xxxxx-xxxxx-xxxxx-xxxxx)
4. Copia este ID

### 2.3 Verificar las columnas
Asegúrate de que tu Data Table tenga estas columnas (o ajusta el código):
- **IVR** (o ivr)
- **PLATAFORMA** (o plataforma)
- **OPC_MENU** (o opc_menu)
- **TEMPLATE** (o template)
- **CORTE** (o corte) - tipo Boolean
- **ESTADO** (o estado) - tipo Boolean

## ⚙️ Paso 3: Configurar el archivo .env

### 3.1 Crear el archivo .env
1. Copia el archivo `.env.example` y renómbralo a `.env`
2. O crea un nuevo archivo llamado `.env` en la raíz del proyecto

### 3.2 Completar las variables
Abre el archivo `.env` y completa los valores:

```env
# Client ID de tu OAuth Client
GENESYS_CLIENT_ID=tu_client_id_aqui

# Client Secret de tu OAuth Client
GENESYS_CLIENT_SECRET=tu_client_secret_aqui

# ID de la Data Table
GENESYS_DATATABLE_ID=xxxxx-xxxxx-xxxxx-xxxxx-xxxxx

# Región de Genesys Cloud (opcional)
GENESYS_REGION=us_east_1

# Modo de operación (genesys o mock)
MODO=genesys

# Puerto del servidor (opcional)
PORT=3000
```

### 3.3 Regiones disponibles
- `us_east_1` - US East (Virginia) - **Por defecto**
- `us_west_2` - US West (Oregon)
- `eu_west_1` - EU West (Dublin)
- `ap_southeast_2` - Asia Pacific (Sydney)
- `ap_northeast_1` - Asia Pacific (Tokyo)
- `sa_east_1` - South America (São Paulo)
- `eu_central_1` - EU Central (Frankfurt)
- `ap_south_1` - Asia Pacific (Mumbai)
- `us_west_1` - US West (California)
- `ca_central_1` - Canada Central (Toronto)

## 📦 Paso 4: Instalar Dependencias

Ejecuta en la terminal:

```bash
npm install
```

Esto instalará:
- `purecloud-platform-client-v2` - SDK de Genesys Cloud
- `dotenv` - Para leer variables de entorno

## ✅ Paso 5: Probar la Conexión

### 5.1 Iniciar el servidor
```bash
npm start
```

### 5.2 Verificar los logs
Deberías ver mensajes como:
```
🔄 Intentando conectar con Genesys Cloud...
✅ Autenticación exitosa con Genesys Cloud
✅ Conexión con Genesys Cloud establecida
🚀 Servidor iniciado correctamente
📡 Escuchando en: http://localhost:3000
🔧 Modo: GENESYS
```

### 5.3 Probar la aplicación
1. Abre tu navegador en `http://localhost:3000`
2. La tabla debería cargar con datos de Genesys Cloud
3. Intenta activar/desactivar CORTE o ESTADO
4. Los cambios se guardarán en Genesys Cloud

## 🐛 Solución de Problemas

### Error: "GENESYS_CLIENT_ID y GENESYS_CLIENT_SECRET deben estar configurados"
- **Solución**: Verifica que el archivo `.env` existe y tiene los valores correctos

### Error: "Autenticación fallida"
- **Solución**: Verifica que el Client ID y Client Secret sean correctos
- Verifica que el OAuth Client tenga el Grant Type "Client Credentials Grant"

### Error: "Data Table no encontrada"
- **Solución**: Verifica que el GENESYS_DATATABLE_ID sea correcto
- Verifica que el OAuth Client tenga permisos para ver Data Tables

### Error: "No se puede actualizar la Data Table"
- **Solución**: Verifica que el OAuth Client tenga el rol `architect:datatable:edit`

### La aplicación funciona pero no muestra datos
- **Solución**: Verifica que la Data Table tenga filas (rows) con datos
- Verifica que los nombres de las columnas coincidan (pueden estar en mayúsculas o minúsculas)

## 🔒 Seguridad

⚠️ **IMPORTANTE**: 
- **NUNCA** subas el archivo `.env` a Git (ya está en .gitignore)
- **NUNCA** compartas tu Client Secret
- Si alguien obtiene tu Client Secret, revócalo inmediatamente en Genesys Cloud

## 🧪 Modo de Desarrollo (Mock)

Si no quieres usar Genesys Cloud durante el desarrollo, puedes usar datos de ejemplo:

En el archivo `.env`, cambia:
```env
MODO=mock
```

O simplemente no configures las variables de Genesys Cloud y el sistema usará datos de ejemplo automáticamente.

## 📚 Recursos Adicionales

- [Documentación de Genesys Cloud API](https://developer.genesys.cloud/)
- [Documentación del SDK de Node.js](https://developer.genesys.cloud/api/rest/client-libraries/javascript/)
- [Guía de Data Tables](https://help.mypurecloud.com/articles/about-architect-data-tables/)

---

¿Necesitas ayuda? Revisa los logs del servidor para más detalles sobre errores específicos.


