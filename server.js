/**
 * SERVIDOR.JS - El archivo principal de nuestra API
 * 
 * Este archivo es como el "cerebro" de nuestra aplicación. 
 * Se encarga de:
 * 1. Iniciar el servidor web
 * 2. Conectarse a Genesys Cloud para obtener y actualizar configuraciones
 * 3. Permitir consultar y actualizar configuraciones a través de la API REST
 * 
 * Express es una librería que nos facilita crear APIs en Node.js
 */

// Cargar variables de entorno desde .env
// IMPORTANTE: Crea un archivo .env basado en .env.example
require('dotenv').config();

// Importamos las librerías que necesitamos
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importamos nuestro módulo de Genesys Cloud
const genesysClient = require('./genesysClient.js');

// Creamos una aplicación Express
// Piénsalo como crear una "tienda" que atenderá a los clientes
const app = express();

// Configuramos CORS para permitir que el frontend se conecte
// CORS es como un "permiso" que damos al navegador
app.use(cors());

// Configuramos Express para entender datos en formato JSON
// JSON es como enviar una carta con formato específico que ambos entendemos
app.use(express.json());

// Le decimos a Express que sirva archivos estáticos desde la carpeta 'public'
// Los archivos estáticos son HTML, CSS, imágenes, etc.
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// CONFIGURACIÓN Y VARIABLES
// ============================================

/**
 * Modo de operación:
 * - 'genesys': Usa Genesys Cloud (requiere .env configurado)
 * - 'mock': Usa datos de ejemplo en memoria (para desarrollo sin Genesys)
 */
const MODO_OPERACION = process.env.MODO || 'genesys';
const USAR_GENESYS = MODO_OPERACION === 'genesys';

// Datos de ejemplo (solo se usan si MODO=mock o si Genesys falla)
let configuracionesMock = [
    {
        id: 1,
        ivr: 'IVR_001',
        plataforma: 'Genesys Cloud',
        opc_menu: 'Menu Principal',
        template: 'Template_Voz_001',
        corte: true,
        estado: true
    },
    {
        id: 2,
        ivr: 'IVR_002',
        plataforma: 'Genesys Cloud',
        opc_menu: 'Menu Soporte',
        template: 'Template_Voz_002',
        corte: false,
        estado: true
    },
    {
        id: 3,
        ivr: 'IVR_003',
        plataforma: 'Genesys Engage',
        opc_menu: 'Menu Ventas',
        template: 'Template_Voz_003',
        corte: true,
        estado: false
    },
    {
        id: 4,
        ivr: 'IVR_004',
        plataforma: 'Genesys Cloud',
        opc_menu: 'Menu Facturacion',
        template: 'Template_Voz_004',
        corte: false,
        estado: true
    },
    {
        id: 5,
        ivr: 'IVR_005',
        plataforma: 'Genesys Engage',
        opc_menu: 'Menu Emergencias',
        template: 'Template_Voz_005',
        corte: true,
        estado: true
    }
];

// ============================================
// RUTAS DE LA API REST
// ============================================

/**
 * RUTA 1: GET /
 * Esta es la ruta "raíz". Si alguien visita http://localhost:3000/
 * mostrará el archivo index.html desde la carpeta public
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * RUTA 2: GET /api/configuraciones
 * Esta ruta devuelve TODAS las configuraciones disponibles
 * El frontend llama a esta ruta para cargar la tabla
 * 
 * Si está configurado, obtiene los datos de Genesys Cloud
 * Si no, usa datos de ejemplo
 */
app.get('/api/configuraciones', async (req, res) => {
    try {
        let configuraciones;

        if (USAR_GENESYS && genesysClient.estaAutenticado()) {
            // Obtener configuraciones desde Genesys Cloud
            try {
                configuraciones = await genesysClient.obtenerConfiguraciones();
                console.log(`✅ ${configuraciones.length} configuración(es) obtenidas de Genesys Cloud`);
            } catch (genesysError) {
                console.error('⚠️ Error al obtener de Genesys Cloud, usando datos mock:', genesysError.message);
                configuraciones = configuracionesMock;
            }
        } else {
            // Usar datos de ejemplo
            console.log('ℹ️ Usando datos mock (modo desarrollo)');
            configuraciones = configuracionesMock;
        }

        res.json({
            success: true,
            data: configuraciones,
            total: configuraciones.length,
            fuente: USAR_GENESYS && genesysClient.estaAutenticado() ? 'genesys' : 'mock'
        });
    } catch (error) {
        console.error('❌ Error al obtener configuraciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuraciones: ' + error.message
        });
    }
});

/**
 * RUTA 3: PUT /api/configuraciones/:id
 * Esta ruta actualiza una configuración específica
 * Permite cambiar solo ESTADO y CORTE
 * 
 * :id es un parámetro dinámico (ejemplo: /api/configuraciones/1)
 * 
 * Si está configurado, actualiza en Genesys Cloud
 * Si no, actualiza en datos mock
 */
app.put('/api/configuraciones/:id', async (req, res) => {
    try {
        // Obtenemos el ID de la URL
        const id = req.params.id;
        
        // Obtenemos los datos que el usuario quiere actualizar
        const { estado, corte } = req.body;
        
        // Validamos que se hayan enviado los datos necesarios
        if (estado === undefined && corte === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Debes enviar al menos uno de estos campos: estado o corte'
            });
        }

        let configuracionActualizada;

        if (USAR_GENESYS && genesysClient.estaAutenticado()) {
            // Actualizar en Genesys Cloud
            try {
                const cambios = {};
                if (estado !== undefined) cambios.estado = estado === true || estado === 'true';
                if (corte !== undefined) cambios.corte = corte === true || corte === 'true';

                await genesysClient.actualizarConfiguracion(id, cambios);
                
                // Obtener la configuración actualizada para devolverla
                const todasConfiguraciones = await genesysClient.obtenerConfiguraciones();
                configuracionActualizada = todasConfiguraciones.find(c => c.id === id);
                
                if (!configuracionActualizada) {
                    throw new Error('Configuración no encontrada después de actualizar');
                }

                console.log(`✅ Configuración ${id} actualizada en Genesys Cloud`);
            } catch (genesysError) {
                console.error('❌ Error al actualizar en Genesys Cloud:', genesysError.message);
                return res.status(500).json({
                    success: false,
                    error: 'Error al actualizar en Genesys Cloud: ' + genesysError.message
                });
            }
        } else {
            // Actualizar en datos mock
            const idNum = parseInt(id);
            const configIndex = configuracionesMock.findIndex(c => c.id === idNum || c.id === id);
            
            if (configIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Configuración no encontrada'
                });
            }
            
            // Actualizamos solo los campos que se enviaron
            if (estado !== undefined) {
                configuracionesMock[configIndex].estado = estado === true || estado === 'true';
            }
            
            if (corte !== undefined) {
                configuracionesMock[configIndex].corte = corte === true || corte === 'true';
            }
            
            configuracionActualizada = configuracionesMock[configIndex];
            console.log(`✅ Configuración ${id} actualizada (modo mock)`);
        }
        
        // Devolvemos la configuración actualizada
        res.json({
            success: true,
            message: 'Configuración actualizada correctamente',
            data: configuracionActualizada,
            fuente: USAR_GENESYS && genesysClient.estaAutenticado() ? 'genesys' : 'mock'
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar configuración: ' + error.message
        });
    }
});

// ============================================
// INICIAR EL SERVIDOR
// ============================================

// Definimos el puerto (como el "número de puerta" donde escuchamos)
const PORT = process.env.PORT || 3000;

/**
 * Función para inicializar el servidor
 * Primero intenta conectarse a Genesys Cloud si está configurado
 */
async function iniciarServidor() {
    // Intentar conectar a Genesys Cloud si está configurado
    if (USAR_GENESYS) {
        console.log('🔄 Intentando conectar con Genesys Cloud...');
        try {
            await genesysClient.inicializarGenesysClient();
            console.log('✅ Conexión con Genesys Cloud establecida');
        } catch (error) {
            console.error('⚠️ No se pudo conectar a Genesys Cloud:', error.message);
            console.log('ℹ️ El servidor funcionará en modo MOCK (datos de ejemplo)');
            console.log('💡 Para usar Genesys Cloud, configura las variables en .env');
        }
    } else {
        console.log('ℹ️ Modo MOCK activado (usando datos de ejemplo)');
        console.log('💡 Para usar Genesys Cloud, configura MODO=genesys en .env');
    }

    // Iniciamos el servidor web
    app.listen(PORT, () => {
        console.log('=================================');
        console.log('🚀 Servidor iniciado correctamente');
        console.log(`📡 Escuchando en: http://localhost:${PORT}`);
        console.log(`🔧 Modo: ${USAR_GENESYS ? 'GENESYS' : 'MOCK'}`);
        console.log('=================================');
    });
}

// Iniciar el servidor
iniciarServidor().catch(error => {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
});

