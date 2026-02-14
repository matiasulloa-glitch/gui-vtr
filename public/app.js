const API_URL = 'http://localhost:3000';

// 🧠 Cambios pendientes
let cambiosPendientes = {};
//Orden de las columnas en la tabla
const ORDEN_COLUMNAS = [
    "IVR",
    "PLATAFORMA",
    "OPC_MENU",
    "TEMPLATE",
    "ESTADO",
    "CORTE"
];


// ============================================
// MENSAJES
// ============================================

function mostrarError(mensaje) {
    const errorDiv = document.getElementById('mensajeError');
    errorDiv.textContent = '❌ Error: ' + mensaje;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function mostrarMensaje(mensaje, tipo = 'success') {
    const mensajeEstado = document.getElementById('mensajeEstado');
    mensajeEstado.textContent = mensaje;
    mensajeEstado.className = 'mensaje-estado ' + tipo;

    setTimeout(() => {
        mensajeEstado.textContent = '';
        mensajeEstado.className = 'mensaje-estado';
    }, 3000);
}

// ============================================
// CARGA DATOS
// ============================================

async function cargarConfiguraciones() {
    const tablaBody = document.getElementById('tablaBody');

    tablaBody.innerHTML = '<tr><td colspan="100%" class="loading">⏳ Cargando...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/api/configuraciones`);
        const data = await response.json();

        if (response.ok && data.success) {
            tablaBody.innerHTML = '';

            if (data.data.length === 0) {
                tablaBody.innerHTML = '<tr><td>No hay datos</td></tr>';
                return;
            }

            const columnas = ORDEN_COLUMNAS.filter(col =>
                data.data[0].hasOwnProperty(col)
            );
            
            

            document.getElementById('tablaHead').innerHTML =
                '<tr>' + columnas.map(c => `<th>${c}</th>`).join('') + '</tr>';

            data.data.forEach(config => {
                tablaBody.appendChild(crearFilaTabla(config));
            });

            mostrarMensaje('✅ Datos cargados');
        }

    } catch (e) {
        mostrarError('Error cargando datos');
        console.error(e);
    }
}

// ============================================
// CREAR FILA
// ============================================

function crearFilaTabla(config) {
    const fila = document.createElement('tr');

    const columnas = ORDEN_COLUMNAS.filter(col =>
        config.hasOwnProperty(col)
    );
    

    fila.innerHTML = columnas.map(col => {
        const valor = config[col];
        const isSwitch = col.toUpperCase() === 'ESTADO' || col.toUpperCase() === 'CORTE';

        if (isSwitch) {
            const checked = valor === true || valor === 'true';

            return `
                <td>
                    <label class="switch">
                        <input type="checkbox"
                            data-id="${config.id}"
                            data-campo="${col.toLowerCase()}"
                            ${checked ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span class="switch-label">${checked ? 'Activado' : 'Desactivado'}</span>
                </td>
            `;
        }

        return `<td>${valor ?? ''}</td>`;
    }).join('');

    // 🔥 EVENTO CAMBIO (YA NO LLAMA API)
    fila.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const id = this.dataset.id;
            const campo = this.dataset.campo;
            const valor = this.checked;

            if (!cambiosPendientes[id]) {
                cambiosPendientes[id] = {};
            }

            cambiosPendientes[id][campo] = valor;

            console.log('🧠 cambiosPendientes:', cambiosPendientes);

            const label = this.closest('td').querySelector('.switch-label');
            label.textContent = valor ? 'Activado' : 'Desactivado';

            this.closest('tr').style.backgroundColor = '#fff3cd';

            document.getElementById('btnGuardar').disabled = false;
        });
    });

    return fila;
}

// ============================================
// GUARDAR CAMBIOS
// ============================================

async function guardarCambios() {

    if (Object.keys(cambiosPendientes).length === 0) {
        mostrarMensaje('⚠️ No hay cambios', 'info');
        return;
    }

    if (!confirm('¿Guardar cambios?')) return;

    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = '⏳ Guardando...';

    try {
        for (const id in cambiosPendientes) {
            const cambios = cambiosPendientes[id];

            console.log('📤 Enviando:', id, cambios);

            const res = await fetch(`${API_URL}/api/configuraciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cambios)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error');
            }
        }

        mostrarMensaje('✅ Guardado exitoso');

        cambiosPendientes = {};

        cargarConfiguraciones();

    } catch (e) {
        mostrarError('Error guardando');
        console.error(e);
    } finally {
        btn.disabled = true;
        btn.textContent = '💾 Guardar Cambios';
    }
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    cargarConfiguraciones();

    document.getElementById('btnRecargar')
        .addEventListener('click', cargarConfiguraciones);

    document.getElementById('btnGuardar')
        .addEventListener('click', guardarCambios);
});
