/**
 * APP.JS - Archivo JavaScript del Frontend
 * 
 * Este archivo contiene toda la "lógica" de nuestra página web.
 * JavaScript es el lenguaje que hace que la página sea INTERACTIVA.
 * 
 * Se encarga de:
 * 1. Cargar los datos de la tabla al iniciar
 * 2. Escuchar cambios en los switches de ESTADO y CORTE
 * 3. Enviar actualizaciones a la API cuando el usuario cambia algo
 * 4. Mostrar mensajes de éxito o error
 */

// ============================================
// CONFIGURACIÓN
// ============================================

// La URL base de nuestra API
// 'http://localhost:3000' es donde está corriendo nuestro servidor
const API_URL = 'http://localhost:3000';

// ============================================
// FUNCIONES PARA MOSTRAR MENSAJES
// ============================================

/**
 * Función para mostrar un mensaje de error
 * 
 * @param {string} mensaje - El mensaje de error a mostrar
 */
function mostrarError(mensaje) {
    const errorDiv = document.getElementById('mensajeError');
    errorDiv.textContent = '❌ Error: ' + mensaje;
    errorDiv.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Función para mostrar un mensaje de éxito
 * 
 * @param {string} mensaje - El mensaje de éxito a mostrar
 */
function mostrarMensaje(mensaje, tipo = 'success') {
    const mensajeEstado = document.getElementById('mensajeEstado');
    mensajeEstado.textContent = mensaje;
    mensajeEstado.className = 'mensaje-estado ' + tipo;
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
        mensajeEstado.textContent = '';
        mensajeEstado.className = 'mensaje-estado';
    }, 3000);
}

// ============================================
// FUNCIONES PARA CARGAR DATOS
// ============================================

/**
 * Función para cargar las configuraciones desde la API
 * y mostrarlas en la tabla
 */
async function cargarConfiguraciones() {
    const tablaBody = document.getElementById('tablaBody');
    
    // Mostrar mensaje de carga
    tablaBody.innerHTML = '<tr><td colspan="6" class="loading">⏳ Cargando datos...</td></tr>';
    
    try {
        // Hacemos una petición GET a la API
        // fetch() es una función de JavaScript para hacer peticiones HTTP
        const response = await fetch(`${API_URL}/api/configuraciones`);
        const data = await response.json();
        
        // Si la respuesta fue exitosa
        if (response.ok && data.success) {
            // Limpiamos la tabla
            tablaBody.innerHTML = '';
            
            // Si no hay datos, mostramos un mensaje
            if (data.data.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="6" class="loading">No hay configuraciones disponibles</td></tr>';
                return;
            }
            
            // Recorremos cada configuración y creamos una fila en la tabla
            data.data.forEach(config => {
                const fila = crearFilaTabla(config);
                tablaBody.appendChild(fila);
            });
            
            mostrarMensaje(`✅ ${data.total} configuración(es) cargada(s)`, 'success');
        } else {
            mostrarError(data.error || 'Error al cargar los datos');
            tablaBody.innerHTML = '<tr><td colspan="6" class="error">Error al cargar datos</td></tr>';
        }
        
    } catch (error) {
        // Si algo salió mal (por ejemplo, el servidor no está corriendo)
        mostrarError('No se pudo conectar con el servidor. Asegúrate de que esté corriendo en http://localhost:3000');
        tablaBody.innerHTML = '<tr><td colspan="6" class="error">Error de conexión</td></tr>';
        console.error('Error:', error);
    }
}

/**
 * Función para crear una fila de la tabla con los datos de una configuración
 * 
 * @param {Object} config - Objeto con los datos de la configuración
 * @returns {HTMLElement} - Elemento <tr> (table row) con los datos
 */
function crearFilaTabla(config) {
    // Creamos el elemento <tr> (fila de tabla)
    const fila = document.createElement('tr');
    
    // Creamos las celdas con los datos
    // Las primeras 4 columnas son solo lectura (no se pueden modificar)
    fila.innerHTML = `
        <td>${config.ivr}</td>
        <td>${config.plataforma}</td>
        <td>${config.opc_menu}</td>
        <td>${config.template}</td>
        <td>
            <label class="switch">
                <input 
                    type="checkbox" 
                    data-id="${config.id}" 
                    data-campo="corte"
                    ${config.corte ? 'checked' : ''}
                >
                <span class="slider"></span>
            </label>
            <span class="switch-label">${config.corte ? 'Activado' : 'Desactivado'}</span>
        </td>
        <td>
            <label class="switch">
                <input 
                    type="checkbox" 
                    data-id="${config.id}" 
                    data-campo="estado"
                    ${config.estado ? 'checked' : ''}
                >
                <span class="slider"></span>
            </label>
            <span class="switch-label">${config.estado ? 'Activado' : 'Desactivado'}</span>
        </td>
    `;
    
    // Agregamos un "escuchador" a cada checkbox para detectar cambios
    const checkboxes = fila.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            actualizarConfiguracion(
                this.dataset.id, 
                this.dataset.campo, 
                this.checked,
                this
            );
        });
    });
    
    return fila;
}

// ============================================
// FUNCIONES PARA ACTUALIZAR DATOS
// ============================================

/**
 * Función para actualizar una configuración en el servidor
 * 
 * @param {string} id - El ID de la configuración a actualizar
 * @param {string} campo - El campo a actualizar ('estado' o 'corte')
 * @param {boolean} valor - El nuevo valor (true o false)
 * @param {HTMLElement} checkbox - El elemento checkbox que se cambió
 */
async function actualizarConfiguracion(id, campo, valor, checkbox) {
    // Deshabilitamos el checkbox mientras se procesa
    checkbox.disabled = true;
    
    // Actualizamos el label temporalmente
    const label = checkbox.closest('td').querySelector('.switch-label');
    const labelOriginal = label.textContent;
    label.textContent = '⏳ Guardando...';
    
    try {
        // Hacemos una petición PUT a la API
        // PUT es el método HTTP para actualizar recursos
        const response = await fetch(`${API_URL}/api/configuraciones/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json' // Le decimos que enviamos JSON
            },
            body: JSON.stringify({
                [campo]: valor // Esto crea un objeto como {estado: true} o {corte: false}
            })
        });
        
        // Convertimos la respuesta a JSON
        const data = await response.json();
        
        // Si la respuesta fue exitosa
        if (response.ok && data.success) {
            // Actualizamos el label con el nuevo estado
            label.textContent = valor ? 'Activado' : 'Desactivado';
            mostrarMensaje(`✅ ${campo.toUpperCase()} actualizado correctamente`, 'success');
        } else {
            // Si hubo un error, revertimos el checkbox a su estado anterior
            checkbox.checked = !valor;
            label.textContent = labelOriginal;
            mostrarError(data.error || 'Error al actualizar');
        }
        
    } catch (error) {
        // Si algo salió mal, revertimos el checkbox
        checkbox.checked = !valor;
        label.textContent = labelOriginal;
        mostrarError('Error de conexión al guardar cambios');
        console.error('Error:', error);
    } finally {
        // Rehabilitamos el checkbox
        checkbox.disabled = false;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Esperamos a que la página cargue completamente
 * Luego cargamos los datos y configuramos los botones
 */
document.addEventListener('DOMContentLoaded', function() {
    // Cargamos las configuraciones al iniciar
    cargarConfiguraciones();
    
    // Configuramos el botón de recargar
    const btnRecargar = document.getElementById('btnRecargar');
    btnRecargar.addEventListener('click', function() {
        mostrarMensaje('🔄 Recargando datos...', 'info');
        cargarConfiguraciones();
    });
});

/**
 * NOTA IMPORTANTE SOBRE ASYNC/AWAIT:
 * 
 * Las palabras clave 'async' y 'await' hacen que el código espere
 * a que una operación termine antes de continuar.
 * 
 * Ejemplo sin async/await:
 *   fetch(url) → no espera
 *   console.log(resultado) → se ejecuta inmediatamente (resultado aún no existe)
 * 
 * Ejemplo con async/await:
 *   const resultado = await fetch(url) → espera
 *   console.log(resultado) → se ejecuta después de obtener el resultado
 */

