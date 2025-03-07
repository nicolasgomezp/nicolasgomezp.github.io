document.addEventListener('DOMContentLoaded', function() { // Asegurarse que todo el HTML esté cargado

    // 1. Obtener elementos del DOM
    const btnAgregar = document.getElementById('btn-agregar');
    const modal = document.getElementById('modal-agregar');
    const cerrarModal = document.getElementsByClassName('cerrar-modal')[0]; //Obtenemos la X
    const formulario = document.getElementById('formulario-paciente');
    const listaPacientes = document.getElementById('pacientes');

    // 2. Función para mostrar el modal
    function mostrarModal() {
        modal.style.display = 'block';
    }

    // 3. Función para cerrar el modal
    function ocultarModal() {
        modal.style.display = 'none';
    }

    // 4.  Función para agregar un paciente a la lista
    function agregarPaciente(nombre, rut, fecha, hora) {
        const li = document.createElement('li'); // Crea un nuevo elemento <li>

        //Creo un div para almacenar la info y otro para la fecha.
        const infoPacienteDiv = document.createElement('div');
        infoPacienteDiv.classList.add('paciente-info');

        const fechaHoraDiv = document.createElement('div');
        fechaHoraDiv.classList.add('paciente-fecha');

        //Se crea un span, es como un div pero inline (en la misma linea)
        const nombreSpan = document.createElement('span');
        nombreSpan.textContent = nombre + " (RUT: " + rut + ")";

        const fechaHoraSpan = document.createElement('span');
        fechaHoraSpan.textContent = fecha + " " + hora;

        infoPacienteDiv.appendChild(nombreSpan); //El nombre dentro del div de info
        fechaHoraDiv.appendChild(fechaHoraSpan); //La fecha dentro de su div.


        li.appendChild(infoPacienteDiv);
        li.appendChild(fechaHoraDiv);
        listaPacientes.appendChild(li);       // Lo añade a la lista
    }

    // 5. Evento: Mostrar modal al hacer clic en "Agregar Paciente"
    btnAgregar.addEventListener('click', mostrarModal);

    // 6. Evento: Cerrar modal al hacer clic en la "x"
    cerrarModal.addEventListener('click', ocultarModal);

    // 7. Evento: Cerrar modal al hacer clic fuera del modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            ocultarModal();
        }
    });

    // 8. Evento:  Guardar paciente al enviar el formulario
    formulario.addEventListener('submit', function(event) {
        event.preventDefault(); // Evita que la página se recargue

        // Obtener valores del formulario
        const nombre = document.getElementById('nombre').value;
        const rut = document.getElementById('rut').value;
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;

        // Agregar paciente a la lista
        agregarPaciente(nombre, rut, fecha, hora);

        // Cerrar modal y limpiar el formulario
        ocultarModal();
        formulario.reset();  //Limpia el formulario
    });
});
