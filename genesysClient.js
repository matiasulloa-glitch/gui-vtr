/**
 * GENESYS_CLIENT.JS
 * Cliente Genesys Cloud con lectura cruda de DataTables
 */

require('dotenv').config();
const platformClient = require('purecloud-platform-client-v2');

/* ===============================
   VARIABLES GLOBALES DEL MÓDULO
================================ */
let client;
let architectApi;
let isAuthenticated = false;

// 👉 DEFINIDO UNA SOLA VEZ
const DATATABLE_ID = process.env.GENESYS_DATATABLE_ID;

if (!DATATABLE_ID) {
    console.warn('⚠️ GENESYS_DATATABLE_ID NO está definido en el .env');
}

/* ===============================
   INIT / AUTH
================================ */
async function inicializarGenesysClient() {
    client = platformClient.ApiClient.instance;

    const region = process.env.GENESYS_REGION || 'us_east_1';

    const regionMap = {
        us_east_1: platformClient.PureCloudRegionHosts.us_east_1,
        us_west_2: platformClient.PureCloudRegionHosts.us_west_2,
        eu_west_1: platformClient.PureCloudRegionHosts.eu_west_1,
        sa_east_1: platformClient.PureCloudRegionHosts.sa_east_1
    };

    client.setEnvironment(regionMap[region]);
    console.log(`🌍 Región Genesys: ${region}`);

    if (!process.env.GENESYS_CLIENT_ID || !process.env.GENESYS_CLIENT_SECRET) {
        throw new Error('❌ Faltan credenciales Genesys');
    }

    await client.loginClientCredentialsGrant(
        process.env.GENESYS_CLIENT_ID,
        process.env.GENESYS_CLIENT_SECRET
    );

    architectApi = new platformClient.ArchitectApi();
    isAuthenticated = true;

    console.log('✅ Autenticado en Genesys Cloud');
}

/* ===============================
   READ DATATABLE - Obtiene todas las columnas excepto "key"
================================ */
async function obtenerConfiguraciones() {
    if (!isAuthenticated) {
        throw new Error('Genesys no autenticado');
    }

    if (!DATATABLE_ID) {
        throw new Error('GENESYS_DATATABLE_ID no configurado');
    }

    try {
        // Usar showbrief=false para obtener TODAS las columnas con sus valores
        const response = await architectApi.getFlowsDatatableRows(
            DATATABLE_ID,
            {
                pageSize: 100,
                pageNumber: 1,
                showbrief: false  // Esto trae la estructura completa con todos los datos
            }
        );

        if (!response?.entities || response.entities.length === 0) {
            console.log('⚠️ No se encontraron filas en la DataTable');
            return [];
        }

        console.log(`✅ ${response.entities.length} fila(s) obtenida(s) de Genesys Cloud`);

        // Mapear cada fila, incluyendo TODAS las columnas excepto "key"
        const configuraciones = response.entities.map(row => {
            // Obtener todas las propiedades de la fila
            const propiedades = row.properties || row;
            
            // Crear objeto con todas las columnas excepto "key"
            const configuracion = {
                id: row.key || row.id,  // Usar key como ID para actualizar después
                // Incluir todas las propiedades excepto "key"
            };

            // Agregar todas las columnas dinámicamente (excepto key)
            for (const [nombreColumna, valor] of Object.entries(propiedades)) {
                if (nombreColumna.toLowerCase() !== 'key' && nombreColumna !== 'id') {
                    // Convertir booleanos si es necesario
                    if (typeof valor === 'string' && (valor.toLowerCase() === 'true' || valor.toLowerCase() === 'false')) {
                        configuracion[nombreColumna] = valor.toLowerCase() === 'true';
                    } else {
                        configuracion[nombreColumna] = valor;
                    }
                }
            }

            // Si no hay propiedades, intentar acceder directamente a las columnas conocidas
            if (Object.keys(configuracion).length === 1) { // Solo tiene 'id'
                configuracion.ivr = row.IVR ?? row.ivr ?? '';
                configuracion.plataforma = row.PLATAFORMA ?? row.plataforma ?? '';
                configuracion.opc_menu = row.OPC_MENU ?? row.opc_menu ?? '';
                configuracion.template = row.TEMPLATE ?? row.template ?? '';
                configuracion.estado = Boolean(row.ESTADO ?? row.estado ?? false);
                configuracion.corte = Boolean(row.CORTE ?? row.corte ?? false);
            }

            return configuracion;
        });

        // Log de ejemplo para debugging
        if (configuraciones.length > 0) {
            console.log('📋 Ejemplo de configuración mapeada:', JSON.stringify(configuraciones[0], null, 2));
        }

        return configuraciones;

    } catch (error) {
        console.error('❌ Error al obtener configuraciones de Genesys Cloud:', error);
        throw error;
    }
}


/* ===============================
   UPDATE DATATABLE - Actualiza CORTE y ESTADO
================================ */
async function actualizarConfiguracion(rowKey, cambios) {
    if (!isAuthenticated) {
        throw new Error('Genesys no autenticado');
    }

    if (!DATATABLE_ID) {
        throw new Error('GENESYS_DATATABLE_ID no configurado');
    }

    console.log('=================================');
    console.log('✏️ Actualizando fila DataTable');
    console.log('🔑 Row Key:', rowKey);
    console.log('🛠 Cambios recibidos:', cambios);
    console.log('=================================');

    try {
        // 1️⃣ Obtener fila actual completa
        const filaActual = await architectApi.getFlowsDatatableRow(
            DATATABLE_ID,
            rowKey,
            { showbrief: false }
        );

        const propiedades = filaActual.properties || filaActual;

        // 2️⃣ Copiar todas las columnas actuales
        const filaActualizada = {};

        for (const [key, value] of Object.entries(propiedades)) {
            if (key.toLowerCase() !== 'key' && key.toLowerCase() !== 'id') {
                filaActualizada[key] = value;
            }
        }

        // 3️⃣ Aplicar cambios SOLO a ESTADO y CORTE
        if (cambios.corte !== undefined || cambios.CORTE !== undefined) {
            const valorCorte = cambios.corte !== undefined ? cambios.corte : cambios.CORTE;
            filaActualizada['CORTE'] = Boolean(valorCorte);
        }

        if (cambios.estado !== undefined || cambios.ESTADO !== undefined) {
            const valorEstado = cambios.estado !== undefined ? cambios.estado : cambios.ESTADO;
            filaActualizada['ESTADO'] = Boolean(valorEstado);
        }

        // 4️⃣ 🔥 BODY FINAL (FORMATO CORRECTO PARA SDK)
        const bodyFinal = {
            key: rowKey,
            ...filaActualizada
        };

        const opts = {
            body: bodyFinal
        };

        console.log('📤 BODY FINAL A ENVIAR:');
        console.log(JSON.stringify(opts, null, 2));

        // 5️⃣ PUT correcto
        const response = await architectApi.putFlowsDatatableRow(
            DATATABLE_ID,
            rowKey,
            opts
        );

        console.log('✅ Fila actualizada correctamente');
        return response;

    } catch (error) {
        console.error('❌ Error al actualizar DataTable:', error.message);

        if (error.body) {
            console.error('📄 Detalle del error:', JSON.stringify(error.body, null, 2));
        }

        throw error;
    }
}






/* ===============================
   EXPORTS
================================ */
module.exports = {
    inicializarGenesysClient,
    obtenerConfiguraciones,
    actualizarConfiguracion
};
