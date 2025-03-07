// script.js

// Function to show content after successful login
function showAppContent() {
    document.getElementById("sign-in-section").style.display = "none";
    document.getElementById("agregar-paciente").style.display = "block";
    document.getElementById("backup-restore").style.display = "block";
    document.getElementById("lista-pacientes").style.display = "block";
    document.getElementById("resumen").style.display = "block";
}

// Function to handle sign-out
function signOut() {
    google.accounts.id.disableAutoSelect();
    // Optional: Revoke access token (more advanced, consult Google documentation)
    //  See: https://developers.google.com/identity/gsi/web/guides/revoke
    localStorage.removeItem('userLoggedIn'); // Clear local storage
    window.location.reload(); // Refresh the page
}

// Check if the user is already logged in based on a stored flag
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('userLoggedIn')) {
    showAppContent();
  }
});

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
        objectStore.createIndex("edad", "edad", { unique: false });
        objectStore.createIndex("ocupacion", "ocupacion", { unique: false });
        objectStore.createIndex("diagnostico", "diagnostico", { unique: false });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    // Only load patients if user is logged in
    if (localStorage.getItem('userLoggedIn')) {
        cargarPacientes();
    }
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
    const edad = document.getElementById("edad").value;
    const ocupacion = document.getElementById("ocupacion").value;
    const diagnostico = document.getElementById("diagnostico").value;

    const transactionCheck = db.transaction(["pacientes"], "readonly");
    const objectStoreCheck = transactionCheck.objectStore("pacientes");
    const requestCheck = objectStoreCheck.get(rut);

    requestCheck.onsuccess = () => {
        if (requestCheck.result) {
            alert("Error: Ya existe un paciente con este RUT.");
            return;
        } else {
            const paciente = { nombre, rut, fecha, hora, edad, ocupacion, diagnostico };
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
            listItem.style.cursor = "pointer"; // Change cursor on hover

            listItem.addEventListener("click", () => showPatientDetails(paciente)); // Add click event listener


            const patientInfoDiv = document.createElement("div");
            patientInfoDiv.className = "patient-info";

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = paciente.nombre;
            patientInfoDiv.appendChild(nameSpan);

            const rutSpan = document.createElement("span");
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
            deleteButton.onclick = (event) => {
                event.stopPropagation(); // Prevent showing details when deleting
                eliminarPaciente(paciente.rut);
            }
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

// --- Patient Detail View ---
function showPatientDetails(paciente) {
    // Hide main content and show details
    document.querySelector('.main-content').classList.add('hidden');
    document.getElementById('patient-details').style.display = 'block';

    // Populate detail section with data
    document.getElementById('detail-nombre').textContent = paciente.nombre;
    document.getElementById('detail-rut').textContent = paciente.rut;
    document.getElementById('detail-edad').textContent = paciente.edad;
    document.getElementById('detail-ocupacion').textContent = paciente.ocupacion;
    document.getElementById('detail-diagnostico').textContent = paciente.diagnostico;
    document.getElementById('detail-fecha').textContent = paciente.fecha;
    document.getElementById('detail-hora').textContent = paciente.hora;
}

function returnToList() {
    // Show main content and hide details
    document.querySelector('.main-content').classList.remove('hidden');
    document.getElementById('patient-details').style.display = 'none';
}
