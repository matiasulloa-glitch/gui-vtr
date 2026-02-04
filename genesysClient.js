/**
 * GENESYS_CLIENT.JS - Módulo para conectar con Genesys Cloud API
 * 
 * Este archivo maneja toda la conexión y comunicación con Genesys Cloud.
 * Se encarga de:
 * 1. Autenticarse con Genesys Cloud usando Client Credentials
 * 2. Consultar la Datatable para obtener configuraciones
 * 3. Actualizar configuraciones en la Datatable
 * 
 * IMPORTANTE: Asegúrate de tener configuradas las variables de entorno en .env
 */

const platformClient = require("purecloud-platform-client-v2");

// Variables globales para el cliente
let client = null;
let architectApi = null;
let isAuthenticated = false;

/**
 * Inicializa y autentica el cliente de Genesys Cloud
 * 
 * @returns {Promise} - Promesa que se resuelve cuando la autenticación es exitosa
 */
function inicializarGenesysClient() {
    return new Promise((resolve, reject) => {
        try {
            // Obtener instancia del cliente
            client = platformClient.ApiClient.instance;

            // Configurar región desde variables de entorno o usar us_east_1 por defecto
            const region = process.env.GENESYS_REGION || 'us_east_1';
            
            // Mapear el string de región al objeto correspondiente
            const regionMap = {
                'us_east_1': platformClient.PureCloudRegionHosts.us_east_1,
                'us_west_2': platformClient.PureCloudRegionHosts.us_west_2,
                'eu_west_1': platformClient.PureCloudRegionHosts.eu_west_1,
                'ap_southeast_2': platformClient.PureCloudRegionHosts.ap_southeast_2,
                'ap_northeast_1': platformClient.PureCloudRegionHosts.ap_northeast_1,
                'sa_east_1': platformClient.PureCloudRegionHosts.sa_east_1,
                'eu_central_1': platformClient.PureCloudRegionHosts.eu_central_1,
                'ap_south_1': platformClient.PureCloudRegionHosts.ap_south_1,
                'us_west_1': platformClient.PureCloudRegionHosts.us_west_1,
                'ca_central_1': platformClient.PureCloudRegionHosts.ca_central_1
            };

            const regionHost = regionMap[region] || platformClient.PureCloudRegionHosts.us_east_1;
            client.setEnvironment(regionHost);

            console.log(`🌍 Región configurada: ${region}`);

            // Obtener credenciales desde variables de entorno
            const clientId = process.env.GENESYS_CLIENT_ID;
            const clientSecret = process.env.GENESYS_CLIENT_SECRET;

            // Validar que existan las credenciales
            if (!clientId || !clientSecret) {
                throw new Error('GENESYS_CLIENT_ID y GENESYS_CLIENT_SECRET deben estar configurados en .env');
            }

            // Login usando Client Credentials Grant
            client.loginClientCredentialsGrant(clientId, clientSecret)
                .then(() => {
                    console.log('✅ Autenticación exitosa con Genesys Cloud');
                    isAuthenticated = true;
                    
                    // Crear instancia de ArchitectApi
                    architectApi = new platformClient.ArchitectApi();
                    
                    resolve();
                })
                .catch((err) => {
                    console.error('❌ Error en la autenticación con Genesys Cloud:', err);
                    isAuthenticated = false;
                    reject(err);
                });

        } catch (error) {
            console.error('❌ Error al inicializar cliente de Genesys Cloud:', error);
            reject(error);
        }
    });
}

/**
 * Obtiene todas las configuraciones de la Datatable
 * 
 * @returns {Promise<Array>} - Promesa que se resuelve con un array de configuraciones
 */
async function obtenerConfiguraciones() {
    if (!isAuthenticated || !architectApi) {
        throw new Error('Cliente de Genesys Cloud no autenticado. Llama a inicializarGenesysClient() primero.');
    }

    const datatableId = process.env.GENESYS_DATATABLE_ID;
    
    if (!datatableId) {
        throw new Error('GENESYS_DATATABLE_ID debe estar configurado en .env');
    }

    try {
        // Obtener la estructura de la datatable para conocer las columnas
        const datatable = await architectApi.getFlowsDatatable(datatableId, { expand: '' });
        
        // Log de la estructura de la datatable para debugging
        console.log('📋 Estructura de la DataTable:', JSON.stringify(datatable.schema, null, 2));
        
        // Obtener las filas (rows) de la datatable
        // getFlowsDatatableRows devuelve las filas con sus datos
        const rowsResponse = await architectApi.getFlowsDatatableRows(datatableId, { 
            pageNumber: 1,
            pageSize: 100 // Ajusta según necesites
        });

        console.log('📊 Respuesta completa de getFlowsDatatableRows:', JSON.stringify(rowsResponse, null, 2));
        
        // Las filas pueden venir en 'entities' o directamente como array
        const filas = rowsResponse.entities || rowsResponse || [];
        console.log(`📊 Total de filas obtenidas: ${Array.isArray(filas) ? filas.length : 0}`);

        // Si no hay filas, devolver array vacío
        if (!Array.isArray(filas) || filas.length === 0) {
            console.log('⚠️ No se encontraron filas en la DataTable');
            console.log('💡 Verifica que la DataTable tenga datos y que tengas permisos para leerla');
            return [];
        }

        // Log de una fila de ejemplo para ver su estructura
        console.log('🔍 Estructura completa de la primera fila:', JSON.stringify(filas[0], null, 2));

        // Obtener los nombres de las columnas del schema
        const columnas = datatable.schema ? datatable.schema.columns : [];
        const nombresColumnas = columnas.map(col => col.name);
        console.log('📝 Nombres de columnas en la DataTable:', nombresColumnas);

        // Mapear las filas a nuestro formato
        const configuraciones = filas.map((row, index) => {
            // En Genesys Cloud, las filas tienen esta estructura:
            // - row.id: ID único de la fila
            // - row.properties: Objeto con los valores de las columnas
            //   Ejemplo: { "IVR": "valor1", "PLATAFORMA": "valor2", ... }
            
            // Intentamos acceder a las propiedades de diferentes maneras
            let props = {};
            
            if (row.properties) {
                // Las propiedades están en row.properties
                props = row.properties;
            } else if (typeof row === 'object') {
                // Las propiedades pueden estar directamente en el objeto
                props = { ...row };
                delete props.id; // Remover el id para que no interfiera
            }
            
            console.log(`🔍 Fila ${index + 1} - propiedades encontradas:`, Object.keys(props));
            console.log(`🔍 Fila ${index + 1} - valores:`, props);
            
            // Función auxiliar para obtener un valor, probando diferentes variaciones del nombre
            const obtenerValor = (nombresPosibles, defaultValue = '') => {
                for (const nombre of nombresPosibles) {
                    if (props[nombre] !== undefined && props[nombre] !== null) {
                        return props[nombre];
                    }
                }
                return defaultValue;
            };

            // Función auxiliar para obtener un valor booleano
            const obtenerBooleano = (nombresPosibles, defaultValue = false) => {
                for (const nombre of nombresPosibles) {
                    const valor = props[nombre];
                    if (valor !== undefined && valor !== null) {
                        if (typeof valor === 'boolean') return valor;
                        if (typeof valor === 'string') {
                            return valor.toLowerCase() === 'true' || valor === '1';
                        }
                        if (typeof valor === 'number') return valor === 1;
                    }
                }
                return defaultValue;
            };

            // Mapear los campos - probamos múltiples variaciones de nombres
            const configuracion = {
                id: row.id || props.id || `row_${index}`,
                ivr: obtenerValor(['IVR', 'ivr', 'Ivr', 'IVR_NAME', 'ivr_name'], ''),
                plataforma: obtenerValor(['PLATAFORMA', 'plataforma', 'Plataforma', 'PLATFORM', 'platform'], ''),
                opc_menu: obtenerValor(['OPC_MENU', 'opc_menu', 'OpcMenu', 'OPC_MENU_NAME', 'opc_menu_name', 'MENU', 'menu'], ''),
                template: obtenerValor(['TEMPLATE', 'template', 'Template', 'TEMPLATE_NAME', 'template_name'], ''),
                corte: obtenerBooleano(['CORTE', 'corte', 'Corte', 'CUT', 'cut']),
                estado: obtenerBooleano(['ESTADO', 'estado', 'Estado', 'STATE', 'state', 'ACTIVE', 'active'])
            };

            console.log(`✅ Mapeada fila ${index + 1}:`, configuracion);
            
            return configuracion;
        });

        console.log(`✅ Total de configuraciones mapeadas: ${configuraciones.length}`);
        return configuraciones;

    } catch (error) {
        console.error('❌ Error al obtener configuraciones de Genesys Cloud:', error);
        throw error;
    }
}

/**
 * Actualiza una configuración en la Datatable
 * 
 * @param {string} rowId - ID de la fila a actualizar
 * @param {Object} cambios - Objeto con los campos a actualizar (ej: { CORTE: true, ESTADO: false })
 * @returns {Promise<Object>} - Promesa que se resuelve con la fila actualizada
 */
async function actualizarConfiguracion(rowId, cambios) {
    if (!isAuthenticated || !architectApi) {
        throw new Error('Cliente de Genesys Cloud no autenticado. Llama a inicializarGenesysClient() primero.');
    }

    const datatableId = process.env.GENESYS_DATATABLE_ID;
    
    if (!datatableId) {
        throw new Error('GENESYS_DATATABLE_ID debe estar configurado en .env');
    }

    try {
        // Primero obtenemos la fila actual y la estructura de la datatable
        const [rowActual, datatable] = await Promise.all([
            architectApi.getFlowsDatatableRow(datatableId, rowId),
            architectApi.getFlowsDatatable(datatableId, { expand: '' })
        ]);

        console.log('📋 Fila actual antes de actualizar:', JSON.stringify(rowActual, null, 2));
        
        // Obtener los nombres reales de las columnas de la datatable
        const columnas = datatable.schema ? datatable.schema.columns : [];
        const nombresColumnas = columnas.map(col => col.name);
        
        // Preparar los datos actualizados
        // En Genesys Cloud, las propiedades van en el objeto 'properties'
        const datosActualizados = {
            ...rowActual,
            properties: {
                ...(rowActual.properties || {})
            }
        };

        // Función para actualizar un campo probando diferentes nombres
        const actualizarCampo = (valor, nombresPosibles) => {
            // Primero intentamos con los nombres que están en la datatable
            for (const nombreColumna of nombresColumnas) {
                const nombreUpper = nombreColumna.toUpperCase();
                const nombreLower = nombreColumna.toLowerCase();
                
                for (const nombreBuscar of nombresPosibles) {
                    if (nombreColumna === nombreBuscar || 
                        nombreUpper === nombreBuscar.toUpperCase() || 
                        nombreLower === nombreBuscar.toLowerCase()) {
                        datosActualizados.properties[nombreColumna] = valor;
                        console.log(`✅ Campo actualizado: ${nombreColumna} = ${valor}`);
                        return;
                    }
                }
            }
            
            // Si no encontramos coincidencia exacta, probamos con los nombres comunes
            for (const nombre of nombresPosibles) {
                if (nombresColumnas.some(col => col.toUpperCase() === nombre.toUpperCase())) {
                    const nombreExacto = nombresColumnas.find(col => col.toUpperCase() === nombre.toUpperCase());
                    datosActualizados.properties[nombreExacto] = valor;
                    console.log(`✅ Campo actualizado (variación): ${nombreExacto} = ${valor}`);
                    return;
                }
            }
            
            // Último recurso: usar el primer nombre de la lista
            datosActualizados.properties[nombresPosibles[0]] = valor;
            console.log(`⚠️ Campo actualizado con nombre por defecto: ${nombresPosibles[0]} = ${valor}`);
        };
        
        if (cambios.corte !== undefined) {
            actualizarCampo(cambios.corte, ['CORTE', 'corte', 'Corte', 'CUT', 'cut']);
        }
        
        if (cambios.estado !== undefined) {
            actualizarCampo(cambios.estado, ['ESTADO', 'estado', 'Estado', 'STATE', 'state', 'ACTIVE', 'active']);
        }

        console.log('📤 Datos a enviar para actualizar:', JSON.stringify(datosActualizados, null, 2));

        // Actualizar la fila en Genesys
        const rowActualizada = await architectApi.putFlowsDatatableRow(datatableId, rowId, datosActualizados);

        console.log('✅ Fila actualizada exitosamente');
        return rowActualizada;

    } catch (error) {
        console.error('❌ Error al actualizar configuración en Genesys Cloud:', error);
        throw error;
    }
}

/**
 * Verifica si el cliente está autenticado
 * 
 * @returns {boolean} - true si está autenticado, false si no
 */
function estaAutenticado() {
    return isAuthenticated;
}

// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = {
    inicializarGenesysClient,
    obtenerConfiguraciones,
    actualizarConfiguracion,
    estaAutenticado
};

