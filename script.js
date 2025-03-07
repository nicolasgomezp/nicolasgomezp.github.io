
// --- IndexedDB Setup ---
let db;
const request = indexedDB.open("NeuroEVADB", 1);

request.onerror = function(event) {
    console.error("Error opening database:", event);
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('pacientes')) {
        const objectStore = db.createObjectStore("pacientes", { keyPath: "rut" });
        objectStore.createIndex("nombre", "nombre", { unique: false });
        objectStore.createIndex("fecha", "fecha", { unique: false });
        objectStore.createIndex("edad", "edad", { unique: false });         // New index
        objectStore.createIndex("ocupacion", "ocupacion", { unique: false }); // New index
        objectStore.createIndex("diagnostico", "diagnostico", { unique: false }); // New index
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    cargarPacientes();
};

// --- Modal Logic ---
const modal = document.getElementById("modal-agregar");
const btnAgregar = document.getElementById("btn-agregar");
const spanCerrar = document.getElementsByClassName("cerrar-modal")[0];

btnAgregar.onclick = function() {
    modal.style.display = "block";
}

spanCerrar.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// --- Form Submission and Data Handling ---
const form = document.getElementById("formulario-paciente");
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const rut = document.getElementById("rut").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const edad = document.getElementById("edad").value; // Get edad
    const ocupacion = document.getElementById("ocupacion").value; // Get ocupacion
    const diagnostico = document.getElementById("diagnostico").value; // Get diagnostico

    const transactionCheck = db.transaction(["pacientes"], "readonly");
    const objectStoreCheck = transactionCheck.objectStore("pacientes");
    const requestCheck = objectStoreCheck.get(rut);

    requestCheck.onsuccess = () => {
        if (requestCheck.result) {
            alert("Error: Ya existe un paciente con este RUT.");
            return;
        } else {
            const paciente = { nombre, rut, fecha, hora, edad, ocupacion, diagnostico }; // Include extra fields
            const transaction = db.transaction(["pacientes"], "readwrite");
            const objectStore = transaction.objectStore("pacientes");
            const request = objectStore.add(paciente);

            request.onsuccess = function() {
                cargarPacientes();
                modal.style.display = "none";
                form.reset();
            };

            request.onerror = function(event) {
                console.error("Error adding patient:", event);
                alert("Error al guardar el paciente.  Revisa la consola para más detalles.");
            };
        }
    }
    requestCheck.onerror = (event) => {
        console.error("Error checking for duplicate RUT:", event);
        alert("Error al verificar si el RUT existe.");
    }
});

// --- Load Patients from IndexedDB ---
function cargarPacientes() {
    const listaPacientes = document.getElementById("pacientes");
    listaPacientes.innerHTML = "";

    const transaction = db.transaction(["pacientes"], "readonly");
    const objectStore = transaction.objectStore("pacientes");
    const request = objectStore.openCursor();

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const paciente = cursor.value;
            const listItem = document.createElement("li");

            // Create elements to display patient information, matching the image structure
            const patientInfoDiv = document.createElement("div");
            patientInfoDiv.className = "patient-info";

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = paciente.nombre;
            patientInfoDiv.appendChild(nameSpan);

            const rutSpan = document.createElement("span");  // Added for RUT display
            rutSpan.className = "rut";
            rutSpan.textContent = `RUT: ${paciente.rut}`;
            patientInfoDiv.appendChild(rutSpan);


            const detailsSpan = document.createElement("span");
            detailsSpan.className = "patient-details";
            detailsSpan.textContent = `${paciente.ocupacion} - ${paciente.diagnostico}`;
            patientInfoDiv.appendChild(detailsSpan);
            listItem.appendChild(patientInfoDiv);


            const dateSpan = document.createElement("span");
            dateSpan.className = "patient-date";
            dateSpan.textContent = `${paciente.fecha} ${paciente.hora}`;
            listItem.appendChild(dateSpan);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Eliminar";
            deleteButton.className = "delete-button";
            deleteButton.onclick = () => eliminarPaciente(paciente.rut);
            listItem.appendChild(deleteButton);


            listaPacientes.appendChild(listItem);
            cursor.continue();
        }
    };

    request.onerror = function(event) {
        console.error("Error loading patients:", event);
    };
}

// --- Delete Patient ---
function eliminarPaciente(rut) {
    if (!confirm("¿Estás seguro de que quieres eliminar este paciente?")) {
        return;
    }

    const transaction = db.transaction(["pacientes"], "readwrite");
    const objectStore = transaction.objectStore("pacientes");
    const request = objectStore.delete(rut);

    request.onsuccess = function() {
        cargarPacientes();
    };

    request.onerror = function(event) {
        console.error("Error deleting patient:", event);
        alert("Error al eliminar el paciente. Revisa la consola.");
    };
}

// --- Backup and Restore ---
document.getElementById("btn-backup").addEventListener("click", backupData);
document.getElementById("btn-restore").addEventListener("change", restoreData);

function backupData() {
    const transaction = db.transaction(["pacientes"], "readonly");
    const objectStore = transaction.objectStore("pacientes");
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const data = event.target.result;
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "neuroeva_backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    request.onerror = function(event) {
        console.error("Error backing up data:", event);
        alert("Error al respaldar los datos.");
    };
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const transaction = db.transaction(["pacientes"], "readwrite");
            const objectStore = transaction.objectStore("pacientes");

            objectStore.clear().onsuccess = () => {
                for (const paciente of data) {
                    objectStore.add(paciente);
                }
            }

            transaction.oncomplete = function() {
                cargarPacientes();
                alert("Datos restaurados exitosamente.");
            };

            transaction.onerror = function(event) {
                console.error("Error restoring data:", event);
                alert("Error al restaurar los datos.  Asegúrate de que el archivo sea válido.");
            };

        } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Error al procesar el archivo.  Asegúrate de que sea un archivo JSON válido.");
        }
    };

    reader.onerror = function(event) {
        console.error("Error reading file:", event);
        alert("Error al leer el archivo.");
    };

    reader.readAsText(file);
    event.target.value = '';
}
