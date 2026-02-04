/**
 * SERVER.JS - API principal
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const genesysClient = require('./genesysClient');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================
   CONFIGURACIÓN
============================================ */

const MODO_OPERACION = process.env.MODO || 'genesys';
const USAR_GENESYS = MODO_OPERACION === 'genesys';

// bandera real de estado Genesys
let GENESYS_OK = false;

/* ============================================
   MOCK DATA (fallback)
============================================ */

let configuracionesMock = [
    { id: '1', ivr: 'IVR_001', plataforma: 'Genesys', opc_menu: 'Menu 1', template: 'T1', corte: true, estado: true },
    { id: '2', ivr: 'IVR_002', plataforma: 'Genesys', opc_menu: 'Menu 2', template: 'T2', corte: false, estado: true }
];

/* ============================================
   RUTAS
============================================ */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * GET configuraciones
 */
app.get('/api/configuraciones', async (req, res) => {
    try {
        let data;

        if (USAR_GENESYS && GENESYS_OK) {
            try {
                data = await genesysClient.obtenerConfiguraciones();
                console.log(`✅ ${data.length} filas obtenidas desde Genesys`);
            } catch (err) {
                console.error('⚠️ Error Genesys, usando MOCK:', err.message);
                data = configuracionesMock;
            }
        } else {
            data = configuracionesMock;
        }

        res.json({
            success: true,
            fuente: GENESYS_OK ? 'genesys' : 'mock',
            total: data.length,
            data
        });

    } catch (error) {
        console.error('❌ Error general:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT actualizar configuración
 */
app.put('/api/configuraciones/:id', async (req, res) => {
    const id = req.params.id;
    const { estado, corte } = req.body;

    if (estado === undefined && corte === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Debes enviar estado o corte'
        });
    }

    try {
        let resultado;

        if (USAR_GENESYS && GENESYS_OK) {
            const cambios = {};
            if (estado !== undefined) cambios.estado = estado === true || estado === 'true';
            if (corte !== undefined) cambios.corte = corte === true || corte === 'true';

            await genesysClient.actualizarConfiguracion(id, cambios);

            const todas = await genesysClient.obtenerConfiguraciones();
            resultado = todas.find(r => r.id === id);

        } else {
            const idx = configuracionesMock.findIndex(r => r.id === id);
            if (idx === -1) {
                return res.status(404).json({ success: false, error: 'No encontrado' });
            }

            if (estado !== undefined) configuracionesMock[idx].estado = estado;
            if (corte !== undefined) configuracionesMock[idx].corte = corte;

            resultado = configuracionesMock[idx];
        }

        res.json({
            success: true,
            fuente: GENESYS_OK ? 'genesys' : 'mock',
            data: resultado
        });

    } catch (error) {
        console.error('❌ Error actualizando:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/* ============================================
   INIT SERVER
============================================ */

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    if (USAR_GENESYS) {
        console.log('🔄 Inicializando Genesys...');
        try {
            await genesysClient.inicializarGenesysClient();
            GENESYS_OK = true;
            console.log('✅ Genesys Cloud conectado');
        } catch (err) {
            GENESYS_OK = false;
            console.error('⚠️ Genesys NO disponible:', err.message);
            console.log('➡️ Usando modo MOCK');
        }
    } else {
        console.log('ℹ️ Modo MOCK forzado');
    }

    app.listen(PORT, () => {
        console.log('=================================');
        console.log(`🚀 Server OK → http://localhost:${PORT}`);
        console.log(`🔧 Modo: ${GENESYS_OK ? 'GENESYS' : 'MOCK'}`);
        console.log('=================================');
    });
}

iniciarServidor();
