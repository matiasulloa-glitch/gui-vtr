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
   READ DATATABLE (RAW DEBUG)
================================ */
async function obtenerConfiguraciones() {
    if (!isAuthenticated) {
        throw new Error('Genesys no autenticado');
    }

    const response = await architectApi.getFlowsDatatableRows(
        DATATABLE_ID,
        {
            pageSize: 100,
            pageNumber: 1,
            showbrief: false
        }
    );

    if (!response?.entities) {
        return [];
    }

    return response.entities.map(row => {
        // 🔹 Caso actual: columnas FLAT
        return {
            id: row.key,
            ivr: row.IVR ?? null,
            plataforma: row.PLATAFORMA ?? null,
            opc_menu: row.OPC_MENU ?? null,
            template: row.TEMPLATE ?? null,
            estado: Boolean(row.ESTADO),
            corte: Boolean(row.CORTE)
        };
    });
}


/* ===============================
   UPDATE DATATABLE
================================ */
async function actualizarConfiguracion(rowKey, cambios) {
    if (!isAuthenticated) {
        throw new Error('Genesys no autenticado');
    }

    const datatableId = process.env.GENESYS_DATATABLE_ID;

    console.log('=================================');
    console.log('✏️ Actualizando fila DataTable');
    console.log('📌 DataTable ID:', datatableId);
    console.log('🔑 Row Key:', rowKey);
    console.log('🛠 Cambios recibidos:', cambios);
    console.log('=================================');

    try {
        // 1️⃣ Obtener fila actual
        const filaActual = await architectApi.getFlowsDatatableRow(
            datatableId,
            rowKey,
            { showbrief: false }
        );

        console.log('📥 Fila actual:');
        console.log(JSON.stringify(filaActual, null, 2));

        // 2️⃣ Construir fila completa actualizada
        const filaActualizada = {
            key: rowKey,
            ESTADO: cambios.ESTADO !== undefined ? Boolean(cambios.ESTADO) : filaActual.ESTADO,
            CORTE: cambios.CORTE !== undefined ? Boolean(cambios.CORTE) : filaActual.CORTE,
            IVR: cambios.IVR || filaActual.IVR,
            TEMPLATE: cambios.TEMPLATE || filaActual.TEMPLATE,
            PLATAFORMA: cambios.PLATAFORMA || filaActual.PLATAFORMA,
            OPC_MENU: cambios.OPC_MENU || filaActual.OPC_MENU
        };

        // 3️⃣ Opciones para el SDK
        const opts = { body: filaActualizada };

        console.log('📤 Payload enviado a Genesys:');
        console.log(JSON.stringify(opts, null, 2));

        // 4️⃣ PUT
        const response = await architectApi.putFlowsDatatableRow(
            datatableId,
            rowKey,
            opts
        );

        console.log('✅ Actualización exitosa');
        return response;

    } catch (error) {
        console.error('❌ Error actualizando DataTable:', error);
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
