import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue } from "firebase/database";

// Configuración de Firebase (reemplaza con la tuya)
const firebaseConfig = {
apiKey: "AIzaSyCgVRfZijmjhIh6UFCTC5l7gjud_SQEjS4",
  authDomain: "neuroeva-258ae.firebaseapp.com",
  databaseURL: "https://neuroeva-258ae-default-rtdb.firebaseio.com",
  projectId: "neuroeva-258ae",
  storageBucket: "neuroeva-258ae.firebasestorage.app",
  messagingSenderId: "817146369774",
  appId: "1:817146369774:web:002a5e6167eeb9970b05ff",
  measurementId: "G-MBWL2J9QE8"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Referencia a la lista de pacientes en la base de datos
const pacientesRef = ref(db, 'pacientes');


// --- Elementos del DOM ---
const btnAgregar = document.getElementById('btn-agregar');
const modalAgregar = document.getElementById('modal-agregar');
const cerrarModal = document.querySelector('.cerrar-modal'); //  Usa querySelector para el span
const formularioPaciente = document.getElementById('formulario-paciente');
const listaPacientes = document.getElementById('pacientes');


// --- Funciones ---

// Mostrar modal para agregar paciente
function mostrarModal() {
    modalAgregar.style.display = 'block';
}

// Ocultar modal
function ocultarModal() {
    modalAgregar.style.display = 'none';
}

// Guardar paciente en Firebase
function guardarPaciente(event) {
    event.preventDefault(); // Evita que el formulario se envíe de forma tradicional

    const nombre = document.getElementById('nombre').value;
    const rut = document.getElementById('rut').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    // Crea una nueva referencia con un ID único (push)
    const nuevoPacienteRef = push(pacientesRef);

    // Guarda los datos en la nueva referencia
    set(nuevoPacienteRef, {
        nombre: nombre,
        rut: rut,
        fecha: fecha,
        hora: hora
    })
    .then(() => {
        console.log("Paciente guardado correctamente");
        formularioPaciente.reset(); // Limpia el formulario
        ocultarModal(); // Cierra el modal
    })
    .catch((error) => {
        console.error("Error al guardar el paciente:", error);
        alert("Error al guardar el paciente.  Revisa la consola para más detalles.");
    });
}

// Mostrar pacientes en la lista (actualización en tiempo real)
function mostrarPacientes() {
    onValue(pacientesRef, (snapshot) => {
        listaPacientes.innerHTML = ''; // Limpia la lista actual

        snapshot.forEach((childSnapshot) => {
            const paciente = childSnapshot.val();
            const pacienteId = childSnapshot.key; //  Obtiene el ID único

            const li = document.createElement('li');
            li.textContent = `${paciente.nombre} (${paciente.rut}) - ${paciente.fecha} ${paciente.hora}`;

          // Botón eliminar
            const botonEliminar = document.createElement('button');
            botonEliminar.textContent = 'Eliminar';
            botonEliminar.classList.add('boton-eliminar');  //Añadí una clase
            botonEliminar.addEventListener('click', () => eliminarPaciente(pacienteId));
            li.appendChild(botonEliminar);

            listaPacientes.appendChild(li);
        });
    }, {
        onlyOnce: false //  Para que se actualice en tiempo real
    });
}


// --- Event Listeners ---
btnAgregar.addEventListener('click', mostrarModal);
cerrarModal.addEventListener('click', ocultarModal);
formularioPaciente.addEventListener('submit', guardarPaciente);

//Cargar pacientes al inicio
mostrarPacientes();


// -----  NUEVA FUNCIÓN: Eliminar Paciente -----
function eliminarPaciente(pacienteId) {
    const pacienteRef = ref(db, `pacientes/${pacienteId}`); // Referencia al paciente específico

    if (confirm(`¿Estás seguro de eliminar este paciente?`)) {
        set(pacienteRef, null) // Elimina el nodo (establece el valor en null)
            .then(() => {
                console.log("Paciente eliminado correctamente");
            })
            .catch((error) => {
                console.error("Error al eliminar el paciente:", error);
                alert("Error al eliminar el paciente.");
            });
    }
}

//Añade estilos al botón eliminar:
const style = document.createElement('style');
style.textContent = `
    .boton-eliminar {
        background-color: #ff4444;
        color: white;
        border: none;
        padding: 5px 10px;
        margin-left: 10px;
        cursor: pointer;
        border-radius: 4px;
    }
    .boton-eliminar:hover {
        background-color: #cc0000;
    }
`;
document.head.appendChild(style);
