import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-database-compat.js";

document.addEventListener('DOMContentLoaded', function() {

    const btnAgregar = document.getElementById('btn-agregar');
    const modal = document.getElementById('modal-agregar');
    const cerrarModal = document.getElementsByClassName('cerrar-modal')[0];
    const formulario = document.getElementById('formulario-paciente');
    const listaPacientes = document.getElementById('pacientes');

    // Configuración de Firebase (¡REEMPLAZA CON TU CONFIGURACIÓN!)
    const firebaseConfig = {
        apiKey: "AIzaSyCgVRfZijmjhIh6UFCTC5l7gjud_SQEjS4",
        authDomain: "neuroeva-258ae.firebaseapp.com",
        databaseURL: "https://neuroeva-258ae-default-rtdb.firebaseio.com/", // ¡MUY IMPORTANTE!
        projectId: "neuroeva-258ae",
        storageBucket: "neuroeva-258ae.firebasestorage.app",
        messagingSenderId: "817146369774",
        appId: "1:817146369774:web:002a5e6167eeb9970b05ff"
    };

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const pacientesRef = ref(database, 'pacientes');

    // Función para mostrar el modal
    function mostrarModal() {
        modal.style.display = 'block';
    }

    // Función para cerrar el modal
    function ocultarModal() {
        modal.style.display = 'none';
    }

    // Función para agregar un paciente al DOM
    function agregarPacienteDOM(pacienteId, paciente) {
        const li = document.createElement('li');
        const infoPacienteDiv = document.createElement('div');
        infoPacienteDiv.classList.add('paciente-info');
        const fechaHoraDiv = document.createElement('div');
        fechaHoraDiv.classList.add('paciente-fecha');
        const nombreSpan = document.createElement('span');
        nombreSpan.textContent = `${paciente.nombre} (RUT: ${paciente.rut})`;
        const fechaHoraSpan = document.createElement('span');

        const fecha = new Date(paciente.fechaIngreso);
        fechaHoraSpan.textContent = `${fecha.toLocaleDateString()} ${paciente.horaIngreso}`;

        infoPacienteDiv.appendChild(nombreSpan);
        fechaHoraDiv.appendChild(fechaHoraSpan);
        li.appendChild(infoPacienteDiv);
        li.appendChild(fechaHoraDiv);

        // Botón para eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.style.backgroundColor = 'red';
        btnEliminar.style.color = 'white';
        btnEliminar.style.border = 'none';
        btnEliminar.style.padding = '5px 10px';
        btnEliminar.style.borderRadius = '4px';
        btnEliminar.style.cursor = 'pointer';

        btnEliminar.addEventListener('click', () => {
            eliminarPaciente(pacienteId);
        });

        li.appendChild(btnEliminar);
        listaPacientes.appendChild(li);
    }

    // Función para eliminar un paciente
    function eliminarPaciente(pacienteId) {
        const pacienteRef = ref(database, `pacientes/${pacienteId}`);
        remove(pacienteRef)
            .then(() => console.log("Paciente eliminado"))
            .catch(error => console.error("Error al eliminar:", error));
    }

    // Cargar pacientes y escuchar cambios
    onValue(pacientesRef, (snapshot) => {
        listaPacientes.innerHTML = ''; // Limpiar la lista
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const pacienteId = childSnapshot.key;
                const paciente = childSnapshot.val();
                agregarPacienteDOM(pacienteId, paciente);
            });
        }
    });

    // Eventos para el modal
    btnAgregar.addEventListener('click', mostrarModal);
    cerrarModal.addEventListener('click', ocultarModal);
    window.addEventListener('click', event => {
        if (event.target === modal) ocultarModal();
    });

    // Validación básica del formulario
    function validarFormulario(nombre, rut, fecha, hora) {
        if (!nombre || !rut || !fecha || !hora) {
            alert("Por favor, complete todos los campos.");
            return false;
        }
        // Agregar más validaciones aquí (formato de RUT, etc.)
        return true;
    }

    // Evento: Guardar paciente
    formulario.addEventListener('submit', event => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const rut = document.getElementById('rut').value;
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;

        if (!validarFormulario(nombre, rut, fecha, hora)) return;

        const nuevoPaciente = {
            nombre,
            rut,
            fechaIngreso: fecha,
            horaIngreso: hora
        };

        // Guardar en Firebase
        const nuevaRef = push(pacientesRef); // Generar ID único
        nuevaRef.set(nuevoPaciente)
            .then(() => {
                console.log('Paciente guardado');
                ocultarModal();
                formulario.reset();
            })
            .catch(error => console.error('Error:', error));
    });
});
