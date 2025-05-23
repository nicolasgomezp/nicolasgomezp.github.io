const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits = ['h', 'd', 'c', 's'];
let selectedColor = '';
let currentPosition = '';
let currentStackSize = 50;
let activeRangeButton = null;
let lastSelectedRangeIndex = 0;
let isDragging = false;
let currentRange = null;
let colorOptionsVisible = false;
let practiceMode = false;
let eloDisplay;
let currentPreflopRangeType = null;

let longPressTimer;
const longPressDuration = 500;

const colors = [
    { name: 'Rojo', class: 'red', hex: '#ff0000' },
    { name: 'Azul', class: 'blue', hex: '#0000ff' },
    { name: 'Verde', class: 'green', hex: '#00ff00' },
    { name: 'Negro', class: 'yellow', hex: '#000000' },
    { name: 'Naranja', class: 'orange', hex: '#ffa500' },
    { name: 'Morado', class: 'purple', hex: '#800080' }
];

const preflopRangeTypes = [
    { name: 'OR', key: 'or' },
    { name: 'Vs OR', key: 'vs_or' },
    { name: 'Vs 3bet', key: 'vs_3bet' },
    { name: 'Todos', key: 'todos' }
];

const levels = [
    { level: "Novato", elo: 0, emoji: "👶" },
    { level: "Principiante", elo: 1000, emoji: "🎓" },
    { level: "Aspirante", elo: 5000, emoji: "🧑‍🎓" },
    { level: "Intermedio", elo: 10000, emoji: "👨‍🏫" },
    { level: "Avanzado", elo: 25000, emoji: "🧙‍♂️" },
    { level: "Experto", elo: 50000, emoji: "🏆" },
    { level: "Maestro", elo: 100000, emoji: "👑" },
    { level: "Dios", elo: 1000000, emoji: "🐐" },
];

// Function to create an HTML element
function createElement(type, classes = [], text = '', attributes = {}) {
    const element = document.createElement(type);
    classes.forEach(cls => element.classList.add(cls));
    element.textContent = text;
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

// Function to copy a range
function copyRange() {
    if (!currentRange) {
        alert('Por favor, selecciona un rango para copiar.');
        return;
    }

    // Store the range data in a global variable or localStorage
    localStorage.setItem('copiedRange', JSON.stringify(currentRange));
    alert(`Rango "${currentRange.name}" copiado.`);
}

// Function to paste a range
function pasteRange() {
    if (!currentPosition) {
        alert('Por favor, selecciona una posición primero.');
        return;
    }

    if (!currentStackSize) {
        alert('Por favor, selecciona un tamaño de stack primero.');
        return;
    }
    if (!currentPreflopRangeType) {
        alert('Por favor, selecciona un tipo de rango (OR, Vs OR, Vs 3bet, Todos) primero.');
        return;
    }


    const copiedRangeJson = localStorage.getItem('copiedRange');
    if (!copiedRangeJson) {
        alert('No hay ningún rango copiado para pegar.');
        return;
    }

    const copiedRange = JSON.parse(copiedRangeJson);

    // Create a new range based on the copied range, but with the current position and stack size
    const newRange = {
        name: copiedRange.name + ' (Copia)', // Or any other naming convention
        position: currentPosition,
        stackSize: currentStackSize,
        rangeType: currentPreflopRangeType,
        combos: copiedRange.combos,
        legend: copiedRange.legend,
        elo: copiedRange.elo || 0,
        correctStreak: copiedRange.correctStreak || 0,
        incorrectStreak: copiedRange.incorrectStreak || 0
    };

    // Save the new range to localStorage
    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
    savedRanges.push(newRange);
    localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));

    loadRanges();
    alert(`Rango "${newRange.name}" pegado a la posición ${currentPosition} y stack size ${currentStackSize}.`);
}
// Function to attach all event listeners to the document
function attachEventListeners() {
    try {
        const container = document.querySelector('.container');

        // Preflop Range Type Buttons
        const preflopSelector = document.getElementById('range-preflop-selector');
        preflopRangeTypes.forEach(type => {
            const button = createElement('button', ['range-preflop-button'], type.name, { 'data-range-type': type.key });
            button.addEventListener('click', () => {
                setCurrentPreflopRangeType(type.key);
            });
            preflopSelector.appendChild(button);
        });

        function setCurrentPreflopRangeType(rangeType) {
            document.querySelectorAll('.range-preflop-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.range-preflop-button[data-range-type="${rangeType}"]`).classList.add('active');
            currentPreflopRangeType = rangeType;
            initializeRangeButtons(); // Refresh range buttons on preflop type change
        }

        //Color Options
        const colorOptionsDiv = document.querySelector('.color-options');
        colors.forEach(color => {
            const colorOptionDiv = createElement('div', ['color-option']);
            const colorButton = createElement('button', ['color-button'], '', { 'data-color-class': color.class });
            colorButton.style.backgroundColor = color.hex;
            colorButton.addEventListener('click', () => setColor(color.class));
            const colorNameInput = createElement('input', ['color-name'], '', { type: 'text', value: color.name });
            colorNameInput.addEventListener('change', (event) => color.name = event.target.value);
            const colorInput = createElement('input', ['color-input'], '', { type: 'color', value: color.hex });
            colorInput.addEventListener('change', (event) => {
                color.hex = event.target.value;
                colorButton.style.backgroundColor = color.hex;
                updateMatrixColors();
            });
            colorOptionDiv.appendChild(colorButton);
            colorOptionDiv.appendChild(colorNameInput);
            colorOptionDiv.appendChild(colorInput);
            colorOptionsDiv.appendChild(colorOptionDiv);
        });

        const toggleColorOptionsButton = document.getElementById('toggle-color-options');
        toggleColorOptionsButton.addEventListener('click', () => {
            colorOptionsVisible = !colorOptionsVisible;
            const colorOptionsDiv = document.getElementById('color-options');
            colorOptionsDiv.style.display = colorOptionsVisible ? 'flex' : 'none';
        });

        document.querySelectorAll('.position-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.position-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentPosition = button.dataset.position;
                initializeRangeButtons();
            });
        });

        document.querySelectorAll('.stack-size-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.stack-size-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentStackSize = parseInt(button.dataset.stackSize);
                initializeRangeButtons();
            });
        });

        const saveRangeButton = document.getElementById('save-range-button');
        if (saveRangeButton) saveRangeButton.addEventListener('click', saveRange);

        const exportRangesButton = document.getElementById('export-ranges-button');
        if (exportRangesButton) exportRangesButton.addEventListener('click', exportRanges);

        const importFileElement = document.getElementById('import-file');
        if (importFileElement) importFileElement.addEventListener('change', importRangesFromFile);

        const importRangesButton = document.getElementById('import-ranges-button');
        if (importRangesButton) importRangesButton.addEventListener('click', () => importFileElement.click());

        const cardMatrix = document.getElementById('card-matrix');
        cardMatrix.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });

        cardMatrix.addEventListener('mouseup', () => isDragging = false);

        cardMatrix.addEventListener('mouseleave', (e) => isDragging = false);

        eloDisplay = document.getElementById("elo-display");

        cardMatrix.addEventListener('mouseover', (e) => {
            if (isDragging && e.target.classList.contains('card-combo')) {
                toggleCombo({ target: e.target });
            }
        });

        const clearRangeButton = createElement('button', [], 'Vaciar Rango');
        clearRangeButton.addEventListener('click', clearCardSelections);
        container.insertBefore(clearRangeButton, document.getElementById('save-range-form'));

        const practiceModeButton = document.getElementById('practice-mode-button');
        practiceModeButton.addEventListener('click', togglePracticeMode);

        //Export ELO button
        const exportEloButton = document.getElementById('export-elo-button');
        if (exportEloButton) exportEloButton.addEventListener('click', exportElo);

        // Import ELO button
        const importEloFileElement = document.getElementById('import-elo-file');
        if (importEloFileElement) importEloFileElement.addEventListener('change', importEloFromFile);

        const importEloButton = document.getElementById('import-elo-button');
        if (importEloButton) importEloButton.addEventListener('click', () => importEloFileElement.click());

        // **COPY AND PASTE BUTTONS**
        const copyRangeButton = createElement('button', [], 'Copiar Rango');
        copyRangeButton.addEventListener('click', copyRange);
        container.insertBefore(copyRangeButton, document.getElementById('save-range-form'));

        const pasteRangeButton = createElement('button', [], 'Pegar Rango');
        pasteRangeButton.addEventListener('click', pasteRange);
        container.insertBefore(pasteRangeButton, document.getElementById('save-range-form'));


    } catch (error) {
        console.error('Error attaching event listeners:', error);
    }
}

// Function to toggle card combo
function toggleCombo(event) {
    const cardDiv = event.target;
    const combo = cardDiv.dataset.combo;

    if (!selectedColor) {
        const colorClasses = colors.map(c => `selected-${c.class}`);
        cardDiv.classList.remove(...colorClasses);
    } else {
        const colorClasses = colors.map(c => `selected-${c.class}`);
        cardDiv.classList.remove(...colorClasses);
        cardDiv.classList.add(`selected-${selectedColor}`);
    }
}

// Function to set a color
function setColor(color) {
    if (selectedColor === color) {
        selectedColor = '';
    } else {
        selectedColor = color;
    }
    updateColorSelectionIndicator();
    updateMatrixColors();
}

// Function to update color selection indicator
function updateColorSelectionIndicator() {
    document.querySelectorAll('.color-option').forEach(option => {
        const colorButton = option.querySelector('.color-button');
        const indicator = option.querySelector('.selected-indicator');
        if (selectedColor === colorButton.dataset.colorClass) {
            if (!indicator) {
                const newIndicator = createElement('span', ['selected-indicator'], '▼');
                option.appendChild(newIndicator);
            }
        } else {
            if (indicator) indicator.remove();
        }
    });
}

// Function to update matrix colors
function updateMatrixColors() {
    const styleSheet = document.styleSheets[0];

    for (let i = styleSheet.cssRules.length - 1; i >= 0; i--) {
        if (styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.startsWith('.selected-')) {
            styleSheet.deleteRule(i);
        }
    }

    colors.forEach(color => {
        const rule = `.selected-${color.class} {
            background-color: ${color.hex + '80'} !important;
        }`;
        try {
            styleSheet.insertRule(rule, styleSheet.cssRules.length);
        } catch (e) {
            console.log(e);
        }
    });
}

// Function to save a range
function saveRange() {
    try {
        if (!currentPosition) {
            alert('Por favor, selecciona una posición primero.');
            return;
        }

        if (!currentPreflopRangeType) {
            alert('Por favor, selecciona un tipo de rango (OR, Vs OR, Vs 3bet, Todos) primero.');
            return;
        }

        const rangeNameInput = document.getElementById('range-name');
        if (!rangeNameInput) {
            console.error('Range name input not found!');
            return;
        }

        const rangeName = rangeNameInput.value;
        if (!rangeName) {
            alert('Por favor, introduce un nombre para el rango.');
            return;
        }

        const selectedCombos = Array.from(document.querySelectorAll('.card-combo')).filter(cardDiv => {
            return colors.some(color => cardDiv.classList.contains(`selected-${color.class}`));
        }).map(cardDiv => {
            let colorClass = Array.from(cardDiv.classList).find(cls => cls.startsWith('selected-'));
            let color = colorClass ? colorClass.split('-')[1] : null;
            return {
                combo: cardDiv.dataset.combo,
                color: color
            };
        });

        if (selectedCombos.length === 0) {
            alert('Por favor, selecciona al menos un combo para guardar el rango.');
            return;
        }

        let legendToSave = currentRange ? currentRange.legend : [];

        const rangeData = {
            name: rangeName,
            position: currentPosition,
            stackSize: currentStackSize,
            rangeType: currentPreflopRangeType,
            combos: selectedCombos,
            legend: legendToSave,
            elo: currentRange ? currentRange.elo : 0,
            correctStreak: currentRange ? currentRange.correctStreak : 0,
            incorrectStreak: currentRange ? currentRange.incorrectStreak : 0
        };

        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        const existingRangeIndex = savedRanges.findIndex(range =>
            range.position === currentPosition &&
            range.stackSize == currentStackSize &&
            range.rangeType === currentPreflopRangeType &&
            range.name === rangeName
        );

        if (existingRangeIndex > -1) {
            savedRanges[existingRangeIndex] = rangeData;
        } else {
            savedRanges.push(rangeData);
        }

        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));

        loadRanges();
        alert("Rango guardado correctamente");
        rangeNameInput.value = '';
    } catch (error) {
        console.error('Error saving range:', error);
    }
}

// Function to get the Level according to the ELO
function getLevel(elo) {
    let currentLevel = levels[0];

    for (let i = 0; i < levels.length; i++) {
        if (elo >= levels[i].elo) {
            currentLevel = levels[i];
        } else {
            break;
        }
    }
    return currentLevel;
}

// Function to load all Ranges
function loadRanges() {
    try {
        const rangeList = document.getElementById('range-list');
        if (!rangeList) {
            console.error('Range list element not found!');
            return;
        }
        rangeList.innerHTML = '';

        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        let filteredRanges = [];

        if (currentPreflopRangeType === 'todos') {
            // Show all ranges for the current position and stack size
            filteredRanges = savedRanges.filter(range =>
                range.position === currentPosition &&
                range.stackSize == currentStackSize
            );
        } else {
            // Show ranges for the selected position, stack size, and range type
            filteredRanges = savedRanges.filter(range =>
                range.position === currentPosition &&
                range.stackSize == currentStackSize &&
                range.rangeType === currentPreflopRangeType
            );
        }

        if (filteredRanges.length > 0) {
            filteredRanges.forEach((range, index) => {
                const rangeButtonContainer = createElement('div');
                rangeButtonContainer.classList.add('range-button-container');

                const rangeButton = createElement('button', ['range-button'], `${range.name}`);
                rangeButton.addEventListener('click', () => selectRange(range, rangeButton, index));
                rangeButton.textContent = `${range.name}`;
                rangeButtonContainer.appendChild(rangeButton);

                // Conditionally add dropdown for recategorization
                if (currentPreflopRangeType === 'todos') {
                    const categorySelect = document.createElement('select');
                    categorySelect.classList.add('category-select');

                    // Add options for each category (OR, Vs OR, Vs 3bet)
                    preflopRangeTypes
                        .filter(type => type.key !== 'todos') // Exclude 'todos'
                        .forEach(type => {
                            const option = document.createElement('option');
                            option.value = type.key;
                            option.textContent = type.name;
                            categorySelect.appendChild(option);
                        });

                    // Set the current category as the selected option, if applicable
                    if (range.rangeType && preflopRangeTypes.some(type => type.key === range.rangeType)) {
                        categorySelect.value = range.rangeType;
                    } else {
                        categorySelect.value = 'or'; // Default to OR
                    }

                    // Attach event listener to update the range's category
                    categorySelect.addEventListener('change', (event) => {
                        const newRangeType = event.target.value;
                        changeRangeType(range, newRangeType, range);
                    });

                    rangeButtonContainer.appendChild(categorySelect);  // Add dropdown to the container
                }

                const deleteButton = createElement('span', ['delete-range-button'], 'X');
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deleteRange(range);
                });
                rangeButtonContainer.appendChild(deleteButton);

                rangeList.appendChild(rangeButtonContainer);
            });

            if (filteredRanges[lastSelectedRangeIndex]) {
                const range = filteredRanges[lastSelectedRangeIndex];
                const buttonToActivate = rangeList.children[lastSelectedRangeIndex].querySelector('.range-button');
                if (buttonToActivate) selectRange(range, buttonToActivate, lastSelectedRangeIndex);
            } else if (filteredRanges.length > 0) {
                const range = filteredRanges[0];
                const buttonToActivate = rangeList.children[0].querySelector('.range-button');
                if (buttonToActivate) selectRange(range, buttonToActivate, 0);
            } else {
                activeRangeButton = null;
                clearCardSelections();
            }
        } else {
            rangeList.textContent = 'No hay rangos guardados para esta posición, cantidad de ciegas y tipo de rango.';
            activeRangeButton = null;
            clearCardSelections();
        }


    } catch (error) {
        console.error('Error loading ranges:', error);
    }
}

// Function to change the range type
function changeRangeType(rangeToUpdate, newRangeType, range) {
    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];

    // Find the range to update
    const rangeIndex = savedRanges.findIndex(r =>
        r.position === rangeToUpdate.position &&
        r.stackSize === rangeToUpdate.stackSize &&
        r.rangeType === rangeToUpdate.rangeType &&
        r.name === rangeToUpdate.name
    );

    if (rangeIndex !== -1) {
        // Update the range type
        savedRanges[rangeIndex].rangeType = newRangeType;

        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
        loadRanges(); // Reload the ranges to reflect the change
    }
}

// Function to delete a Range
function deleteRange(rangeToDelete) {
    if (confirm(`¿Estás seguro de que quieres eliminar el rango "${rangeToDelete.name}"?`)) {
        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        savedRanges = savedRanges.filter(range =>
            !(range.position === rangeToDelete.position &&
                range.stackSize == rangeToDelete.stackSize &&
                range.rangeType === rangeToDelete.rangeType &&
                range.name === rangeToDelete.name)
        );
        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
        loadRanges();
    }
}

// Function to select a Range
function selectRange(range, button, index) {
    currentRange = range;
    loadRangeInMatrix(range);
    setActiveRangeButton(button);
    lastSelectedRangeIndex = index;
    displayLegend(range);
    displayLegendEditor(range);
    updateEloDisplay(currentRange.elo);
    updateEloProgressBar(currentRange.elo);
    displayStreakInformation(currentRange.correctStreak, currentRange.incorrectStreak);

    const badges = loadBadges();
    applyBadges(badges); // Apply badges for the selected range
}

// Function to display the legend Editor
function displayLegendEditor(range) {
    const editorContainer = document.getElementById('legend-editor');
    editorContainer.innerHTML = '';

    const editorTitle = createElement('h4', [], 'Editar Leyenda');
    editorContainer.appendChild(editorTitle);

    if (!range.legend) range.legend = [];

    range.legend.forEach((item, index) => {
        const itemContainer = createElement('div', ['legend-editor-item']);

        const colorInput = createElement('input', [], '', { type: 'color', value: item.color || '#FFFFFF' });
        colorInput.addEventListener('change', (e) => {
            range.legend[index].color = e.target.value;
            displayLegend(range);
            saveRangesToLocalStorage();
        });
        itemContainer.appendChild(colorInput);

        const textInput = createElement('input', [], '', { type: 'text', value: item.text || '' });
        textInput.addEventListener('change', (e) => {
            range.legend[index].text = e.target.value;
            displayLegend(range);
            saveRangesToLocalStorage();
        });
        itemContainer.appendChild(textInput); // Appended here

        const deleteButton = createElement('button', [], 'Eliminar');
        deleteButton.addEventListener('click', () => {
            range.legend.splice(index, 1);
            displayLegend(range);
            displayLegendEditor(range);
            saveRangesToLocalStorage();
        });
        itemContainer.appendChild(deleteButton);

        editorContainer.appendChild(itemContainer);
    });

    const addButton = createElement('button', [], 'Agregar Elemento');
    addButton.addEventListener('click', () => {
        range.legend.push({ color: '#FFFFFF', text: '' });
        displayLegend(range);
        displayLegendEditor(range);
        saveRangesToLocalStorage();
    });
    editorContainer.appendChild(addButton);
}

// Function to save the range to the local Storage
function saveRangesToLocalStorage() {
    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
    const rangeIndex = savedRanges.findIndex(range =>
        range.position === currentPosition &&
        range.stackSize === currentStackSize &&
        range.rangeType === currentPreflopRangeType &&
        range.name === document.getElementById('range-name').value
    );

    if (rangeIndex !== -1) {
        savedRanges[rangeIndex] = currentRange;
        if (typeof savedRanges[rangeIndex].elo !== 'number') {
            savedRanges[rangeIndex].elo = 0;
        }
        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
    }

    localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
}

// Function to load Range in Matrix
function loadRangeInMatrix(range) {
    try {
        clearCardSelections();
        range.combos.forEach(comboData => {
            const cardDiv = document.querySelector(`.card-combo[data-combo="${comboData.combo}"]`);
            if (cardDiv && comboData.color) {
                cardDiv.classList.add(`selected-${comboData.color}`);
            }
        });
    } catch (error) {
        console.error('Error loading range in matrix:', error);
    }
}

// Function to clear card Selection
function clearCardSelections() {
    try {
        document.querySelectorAll('.card-combo').forEach(cardDiv => {
            const colorClasses = colors.map(c => `selected-${c.class}`);
            cardDiv.classList.remove(...colorClasses);
        });
    } catch (error) {
        console.error('Error clearing card selections:', error);
    }
}

// Function to export Ranges
function exportRanges() {
    try {
        const savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        const jsonString = JSON.stringify(savedRanges);
        const blob = new Blob([jsonString], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pokerRanges.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting ranges:', error);
    }
}

// Function to import ranges from file
function importRangesFromFile(event) {
    try {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const importedRanges = JSON.parse(e.target.result);
                    localStorage.setItem('pokerRanges', JSON.stringify(importedRanges));
                    loadRanges();
                    alert('Rangos importados correctamente.');
                } catch (error) {
                    alert('Error al importar los rangos: ' + error);
                    console.error('Error parsing imported ranges:', error);
                }
            };
            reader.readAsText(file);
        }
    } catch (error) {
        console.error('Error importing ranges from file:', error);
    }
}

// Function to set Active Range Button
function setActiveRangeButton(button) {
    if (activeRangeButton) activeRangeButton.classList.remove('active');
    activeRangeButton = button;
    activeRangeButton.classList.add('active');
}

// Key for localStorage to store badges, now including the current position, stacksize and rangetype
function getBadgeStorageKey() {
    // Check if currentRange is defined and has a name property
    const rangeName = currentRange && currentRange.name ? currentRange.name : 'default'; // Use a default if no range selected
    return `pokerBadges_${currentPosition}_${currentStackSize}_${currentPreflopRangeType}_${rangeName}`;
}

// Function to load badges from localStorage
function loadBadges() {
    try {
        const badgeStorageKey = getBadgeStorageKey();
        const badges = JSON.parse(localStorage.getItem(badgeStorageKey)) || {};
        return badges;  // Return the loaded badges for use elsewhere
    } catch (error) {
        console.error('Error loading badges:', error);
        return {}; // Return an empty object in case of error
    }
}

// Function to save badges to localStorage
function saveBadges(badges) {
    try {
        const badgeStorageKey = getBadgeStorageKey();
        localStorage.setItem(badgeStorageKey, JSON.stringify(badges));
    } catch (error) {
        console.error('Error saving badges:', error);
    }
}

// Function to apply badges to the card matrix
function applyBadges(badges) {
    document.querySelectorAll('.card-combo').forEach(cardDiv => {
        const combo = cardDiv.dataset.combo;
        removeBadge(cardDiv); // Ensure no badges are left from other ranges
        if (badges[combo]) {
            addBadge(cardDiv, badges[combo]);
        }
    });
}

// Function to add a badge to a card combo
function addBadge(cardDiv, emoji) {
    removeBadge(cardDiv); // Remove any existing badge first

    const badge = document.createElement('span');
    badge.classList.add('badge');
    badge.textContent = emoji;
    cardDiv.appendChild(badge);
}

// Function to remove a badge from a card combo
function removeBadge(cardDiv) {
    const existingBadge = cardDiv.querySelector('.badge');
    if (existingBadge) {
        cardDiv.removeChild(existingBadge);
    }
}

// Function to toggle a badge (add if it doesn't exist, remove if it does)
function toggleBadge(cardDiv, emoji, badges) {
    const combo = cardDiv.dataset.combo;

    if (badges[combo]) {
        // Badge exists, remove it
        delete badges[combo];
        removeBadge(cardDiv);
    } else {
        // Badge doesn't exist, add it
        badges[combo] = emoji;
        addBadge(cardDiv, emoji);
    }

    saveBadges(badges); // Save changes to local storage
}

// Function to show a context menu for adding/removing badges
function showContextMenu(event, cardDiv, badges) {
    event.preventDefault();  // Prevent the default context menu

    // Remove any existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const contextMenu = document.createElement('div');
    contextMenu.classList.add('context-menu');
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;

    // Array of emoji choices
    const emojis = ['💰', '😈', '🔥', '🚩', '🚨'];

    emojis.forEach(emoji => {
        const menuItem = document.createElement('div');
        menuItem.classList.add('context-menu-item');
        menuItem.textContent = `Añadir ${emoji}`;
        menuItem.addEventListener('click', () => {
            toggleBadge(cardDiv, emoji, badges);
            contextMenu.remove(); // Close the menu after selection
        });
        contextMenu.appendChild(menuItem);
    });

    // Option to remove badge
    const removeMenuItem = document.createElement('div');
    removeMenuItem.classList.add('context-menu-item');
    removeMenuItem.textContent = 'Quitar Badge';
    removeMenuItem.addEventListener('click', () => {
        removeBadge(cardDiv);
        delete badges[cardDiv.dataset.combo]; // Remove from data
        saveBadges(badges); // Save changes
        contextMenu.remove();
    });

    contextMenu.appendChild(removeMenuItem);

    document.body.appendChild(contextMenu);

    // Close the context menu when clicking outside of it
    document.addEventListener('click', function closeMenu(e) {
        if (!contextMenu.contains(e.target)) {
            contextMenu.remove();
            document.removeEventListener('click', closeMenu); // Remove the listener
        }
    });

    // Prevent context menu from going off-screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > (window.innerWidth || document.documentElement.clientWidth)) {
        contextMenu.style.left = `${event.pageX - rect.width}px`;
    }
    if (rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
        contextMenu.style.top = `${event.pageY - rect.height}px`;
    }
}

// Function to generate the card matrix
function generateCardMatrix() {
    try {
        const matrix = document.getElementById('card-matrix');
        if (!matrix) {
            console.error('Card matrix element not found!');
            return;
        }
        matrix.innerHTML = '';

        // Load existing badges
        const badges = loadBadges(); // Load here to ensure badges are applied on matrix creation

        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 13; j++) {
                const rank1 = ranks[i];
                const rank2 = ranks[j];
                let combo = '';

                if (i === j) {
                    combo = rank1 + rank2;
                } else if (i < j) {
                    combo = rank1 + rank2 + 's';
                } else {
                    combo = rank2 + rank1 + 'o';
                }

                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card-combo');
                cardDiv.textContent = combo;
                cardDiv.dataset.combo = combo;
                cardDiv.addEventListener('click', toggleCombo);

                // Add context menu listener
                cardDiv.addEventListener('contextmenu', (event) => {
                    const badges = loadBadges();
                    showContextMenu(event, cardDiv, badges);
                });

                matrix.appendChild(cardDiv);

                // Apply badges if they exist for this combo
                if (badges[combo]) {
                    addBadge(cardDiv, badges[combo]);
                }
            }
        }

        // restoreCardSelections(); //Load saved Ranges
    } catch (error) {
        console.error('Error generating card matrix:', error);
    }
}

// Function to// Function to restore card selection
function restoreCardSelections() {
    try {
        clearCardSelections();

        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        let currentRanges = savedRanges.filter(range =>
            range.position === currentPosition &&
            range.stackSize == currentStackSize &&
            range.rangeType === currentPreflopRangeType
        );

        currentRanges.forEach(range => {
            range.combos.forEach(comboData => {
                const cardDiv = document.querySelector(`.card-combo[data-combo="${comboData.combo}"]`);
                if (cardDiv && comboData.color) {
                    cardDiv.classList.add(`selected-${comboData.color}`);
                }
            });
        });
    } catch (error) {
        console.error('Error restoring card selections:', error);
    }
}

// Function to display the Legend
function displayLegend(range) {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';

    if (range && range.legend && range.legend.length > 0) {
        range.legend.forEach(item => {
            const legendItem = createElement('div', ['legend-item']);
            const legendColor = createElement('div', ['legend-color']);
            legendColor.style.backgroundColor = item.color;
            const legendText = createElement('span', ['legend-text'], item.text);
            legendItem.appendChild(legendColor);
            legendItem.appendChild(legendText);
            legendContainer.appendChild(legendItem);
        });
    } else {
        legendContainer.textContent = 'No hay leyenda para este rango.';
    }
}

// Function to initilize the Range Buttons
function initializeRangeButtons() {
    loadRanges();
}

function displayPracticeCards(combo) {
    const card1Div = document.getElementById('practice-card1');
    const card2Div = document.getElementById('practice-card2');

    const cards = getVisualCards(combo);

    card1Div.innerHTML = cards.card1; // Render HTML
    card2Div.innerHTML = cards.card2;
}

// Function to Generate Visual Cards
function getVisualCards(combo) {
    let card1 = '';
    let card2 = '';
    const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades

    if (combo.length === 3) { // Suited or offsuit
        const rank1 = combo[0];
        const rank2 = combo[1];
        const suited = combo[2] === 's';

        // Random suit for first card
        const suit1 = suits[Math.floor(Math.random() * suits.length)];
        card1 = `<span class="card ${suit1} ${suit1}-color">${rank1}</span>`;

        let suit2;
        if (suited) {
            suit2 = suit1; // Same suit
        } else {
            // Different suit
            const otherSuits = suits.filter(s => s !== suit1);
            suit2 = otherSuits[Math.floor(Math.random() * otherSuits.length)];
        }
        card2 = `<span class="card ${suit2} ${suit2}-color">${rank2}</span>`;
    } else if (combo.length === 2) { // Pair
        const rank = combo[0];
        let suit1 = suits[Math.floor(Math.random() * suits.length)];
        let suit2;
        const otherSuits = suits.filter(s => s !== suit1);
        suit2 = otherSuits[Math.floor(Math.random() * otherSuits.length)];

        card1 = `<span class="card ${suit1} ${suit1}-color">${rank}</span>`;
        card2 = `<span class="card ${suit2} ${suit2}-color">${rank}</span>`;
    }

    return {
        card1: card1,
        card2: card2
    };
}

// Document Event Listener
document.addEventListener('DOMContentLoaded', () => {
    try {
        attachEventListeners();
        generateCardMatrix();
        updateMatrixColors();
        restoreCardSelections();

        // Set Default Values
        document.querySelector('.stack-size-button[data-stack-size="50"]').classList.add('active');
        document.querySelector('.position-button[data-position="utg"]').classList.add('active');
        document.querySelector(`.range-preflop-button[data-range-type="${preflopRangeTypes[0].key}"]`).classList.add('active');

        currentPosition = 'utg';
        currentPreflopRangeType = preflopRangeTypes[0].key;

        initializeRangeButtons();

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Function to know is Combo Selected
function isComboSelected(combo) {
    const cardDiv = document.querySelector(`.card-combo[data-combo="${combo}"]`);
    if (!cardDiv) return false;
    return colors.some(color => cardDiv.classList.contains(`selected-${c.class}`));
}

// Function to select higher Pairs
function selectHigherPairs(combo) {
    const rank = combo[0];
    const rankIndex = ranks.indexOf(rank);
    if (rankIndex === -1) return;

    for (let i = 0; i < rankIndex; i++) {
        const higherRank = ranks[i];
        const higherPairCombo = higherRank + higherPairCombo;
        if (!isComboSelected(higherPairCombo)) {
            const cardDiv = document.querySelector(`.card-combo[data-combo="${higherPairCombo}"]`);
            if (cardDiv) {
                toggleCombo({ target: cardDiv });
            }
        }
    }
}

// Function to Select SuitedLeft
function selectSuitedLeft(combo) {
    const rank = combo[0];
    const suitRank = combo[1];

    if (combo.length !== 3 || combo[2] !== 's') return;

    const rankIndex = ranks.indexOf(suitRank);

    if (rankIndex === -1) return;

    for (let i = 0; i <= rankIndex; i++) {
        const leftRank = ranks[i];
        const leftSuitedCombo = rank + leftRank + 's';
        if (!isComboSelected(leftSuitedCombo)) {
            const cardDiv = document.querySelector(`.card-combo[data-combo="${leftSuitedCombo}"]`);

            if (cardDiv) {
                toggleCombo({ target: cardDiv });
            }
        }
    }
}

// Function to Select Offsuit Above
function selectOffsuitAbove(combo) {
    if (combo.length !== 3 || combo[2] !== 'o') return;

    const firstRank = combo[0];
    const secondRank = combo[1];
    const firstRankIndex = ranks.indexOf(firstRank);
    const secondRankIndex = ranks.indexOf(secondRank);

    if (firstRankIndex === -1 || secondRankIndex === -1) return;

    for (let i = secondRankIndex - 1; i >= 0; i--) {
        const aboveRank = ranks[i];

        const aboveOffsuitCombo = firstRank + aboveRank + 'o';

        if (!isComboSelected(aboveOffsuitCombo)) {
            const cardDiv = document.querySelector(`.card-combo[data-combo="${aboveOffsuitCombo}"]`);

            if (cardDiv) {
                toggleCombo({ target: cardDiv });
            }
        }
    }
}

// NEW: Practice Mode Functions

// Function to toggle Practice Mode
function togglePracticeMode() {
    practiceMode = !practiceMode;
    const practiceCardsDiv = document.getElementById('practice-cards');

    if (practiceMode) {
        if (!currentRange) {
            alert('Selecciona un rango primero.');
            practiceMode = false;
            return;
        }

        practiceCardsDiv.style.display = 'block';

        let eloDisplay = document.getElementById('elo-display');
        if (eloDisplay) {
            updateEloDisplay(currentRange.elo);
        }

        updateEloProgressBar(currentRange.elo);

        if (!currentRange.correctStreak) currentRange.correctStreak = 0;
        if (!currentRange.incorrectStreak) currentRange.incorrectStreak = 0;
        startPracticeRound();

    } else {
        practiceCardsDiv.style.display = 'none';

        restoreCardSelections();
    }

    const colorOptions = document.getElementById('color-options');
    colorOptions.style.display = practiceMode ? 'none' : 'flex';
}

// Function to hide the color
function hideRangeColors() {
    document.querySelectorAll('.card-combo').forEach(cardDiv => {
        const colorClasses = colors.map(c => `selected-${c.class}`);
        cardDiv.classList.remove(...colorClasses);
    });
}

// Function to start the Practice Round
function startPracticeRound() {
    hideRangeColors();
    const combo = getRandomCombo();
    displayPracticeCards(combo);
    displayPracticeChoices(combo);
}

// Function to get Random Combo
function getRandomCombo() {
    const allCombos = Array.from(document.querySelectorAll('.card-combo')).map(cardDiv => cardDiv.dataset.combo);
    return allCombos[Math.floor(Math.random() * allCombos.length)];
}

// Function to display the Practice Choices
function displayPracticeChoices(combo) {
    const choicesDiv = document.getElementById('practice-choices');
    choicesDiv.innerHTML = '';

    colors.forEach(color => {
        if (currentRange.combos.some(c => c.color === color.class)) {
            const button = createElement('button', ['practice-choice-button'], color.name);
            button.style.backgroundColor = color.hex;
            button.style.color = getContrastColor(color.hex);
            button.innerHTML = `<i class="fas fa-check"></i> ${color.name}`;  // Add icon
            button.addEventListener('click', () => {
                checkPracticeAnswer(combo, color.class, color.name);
            });
            choicesDiv.appendChild(button);
        }
    });

    const foldButton = createElement('button', ['practice-choice-button', 'fold-button'], 'Fold');
    foldButton.innerHTML = '<i class="fas fa-times"></i> Fold';  // Add icon
    foldButton.addEventListener('click', () => {
        checkPracticeAnswer(combo, null, 'Fold');
    });

    choicesDiv.appendChild(foldButton);
}

// Function to display streak information
function displayStreakInformation(correctStreak, incorrectStreak) {
    let streakMessage = "";
    const eloDisplay = document.getElementById('elo-display');

    if (correctStreak > 0) {
        let multiplier = 1;
        let emoji = "👍";
        if (correctStreak >= 100) {
            multiplier = 1000;
            emoji = "🔥";
        } else if (correctStreak >= 50) {
            multiplier = 100;
            emoji = "✨";
        } else if (correctStreak >= 10) {
            multiplier = 10;
            emoji = "💪";
        }
        streakMessage = `Racha Correcta: ${correctStreak} ${emoji} x${multiplier} puntos`;
    } else if (incorrectStreak > 0) {
        let multiplier = 1;
        let emoji = "😥";

        if (incorrectStreak === 2) {
            multiplier = 2;
            emoji = "🙁";
        } else if (incorrectStreak === 3) {
            multiplier = 4;
            emoji = "😟";
        } else if (incorrectStreak === 4) {
            multiplier = 8;
            emoji = "😭";
        } else if (incorrectStreak >= 5) {
            multiplier = 10;
            emoji = "💀";
        }
        streakMessage = `Racha Incorrecta: ${incorrectStreak} ${emoji} x${multiplier} descuento`;
    }

    if (eloDisplay) {
        eloDisplay.innerHTML += `<br>${streakMessage}`;
    }
}

// Function to check the Practice Answer
function checkPracticeAnswer(combo, selectedColor, selectedText) {
    const resultDiv = document.getElementById('practice-result');
    const simplifiedCombo = getSimplifiedCombo(combo);
    const isInRange = currentRange.combos.some(c => getSimplifiedCombo(c.combo) === simplifiedCombo);

    let correctColor = null;
    const comboData = currentRange.combos.find(c => c.combo === combo);
    if (comboData) {
        correctColor = comboData.color;
    }

    let eloChange = 0;

    if (selectedText === 'Fold') {
        if (!isInRange) {
            resultDiv.textContent = `¡Correcto! Fold es la mejor opción para ${combo} en este rango.`;
            eloChange = calculateEloChange(true);
        } else {
            resultDiv.textContent = `¡Incorrecto! ${combo} debería tener otra acción en este rango.`;
            eloChange = calculateEloChange(false);
        }
    } else {
        if (selectedColor === correctColor) {
            resultDiv.textContent = `¡Correcto! La acción correcta para ${combo} es ${selectedText}.`;
            eloChange = calculateEloChange(true);
            const correctColorObj = colors.find(color => color.class === selectedColor);
            if (correctColorObj) {
                createParticles(correctColorObj.hex);  // Pass color to createParticles
            }
        } else {
            resultDiv.textContent = `¡Incorrecto! La acción correcta para ${combo} no es ${selectedText}.`;
            eloChange = calculateEloChange(false);
        }
    }

    updateRangeElo(eloChange);
    showEloChangeAnimation(eloChange);
    triggerScreenShake();
    displayStreakInformation(currentRange.correctStreak, currentRange.incorrectStreak);
    showCorrectAnswerAndPrepareNext(combo);
}

// Function to calculate elo change
function calculateEloChange(isCorrect) {
    let eloChange = 0;

    if (isCorrect) {
        currentRange.incorrectStreak = 0;
        currentRange.correctStreak++;

        if (currentRange.correctStreak >= 100) {
            eloChange = 1 * 1000;
        } else if (currentRange.correctStreak >= 50) {
            eloChange = 1 * 100;
        } else if (currentRange.correctStreak >= 10) {
            eloChange = 1 * 10;
        } else {
            eloChange = 1;
        }
    } else {
        currentRange.correctStreak = 0;
        currentRange.incorrectStreak++;

        if (currentRange.incorrectStreak === 1) {
            eloChange = -10;
        } else if (currentRange.incorrectStreak === 2) {
            eloChange = -20;
        } else if (currentRange.incorrectStreak === 3) {
            eloChange = -40;
        } else if (currentRange.incorrectStreak === 4) {
            eloChange = -80;
        } else {
            eloChange = -100;
        }
    }
    return eloChange;
}

function triggerScreenShake() {
    const container = document.querySelector('.container');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 300);
}

// Function to create particles on correct answer
function createParticles(color) {
    const animationDiv = document.getElementById('elo-change-animation');
    const numParticles = 15;

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.backgroundColor = color || '#fff';  // Use specified color
        animationDiv.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 30;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        particle.style.setProperty('--x', `${x}px`);
        particle.style.setProperty('--y', `${y}px`);

        setTimeout(() => {
            particle.remove();
        }, 500);
    }
}

// Function to Show the ELO Change Animation
function showEloChangeAnimation(eloChange) {
    const animationDiv = document.getElementById('elo-change-animation');
    animationDiv.textContent = (eloChange > 0 ? '+' : '') + eloChange;
    animationDiv.classList.add('show');

    if (eloChange > 0) {
        animationDiv.classList.add('positive');
        animationDiv.classList.remove('negative');
    } else if (eloChange < 0) {
        animationDiv.classList.add('negative');
        animationDiv.classList.remove('positive');
    } else {
        animationDiv.classList.remove('positive', 'negative');
    }

    setTimeout(() => {
        animationDiv.classList.remove('show');
    }, 750);
}

// Function to get Simplified Combo
function getSimplifiedCombo(combo) {

    const rank1 = combo[0];
    const rank2 = combo[1];
    const suitedChar = combo[2];

    const ranksArray = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

    if (combo.length === 2) return combo[0] + combo[1];
    const simplifiedCombo = (ranksArray.indexOf(rank1) < ranksArray.indexOf(rank2) ? rank1 + rank2 : rank2 + rank1)
        + suitedChar;
    return simplifiedCombo
}

// Function to update the Range ELO
function updateRangeElo(eloChange) {
    if (!currentRange) {
        console.warn("updateRangeElo called with no currentRange!");
        return;
    }
    if (typeof currentRange.elo !== 'number') {
        console.error("currentRange.elo is not a number! It is:", currentRange.elo);
        currentRange.elo = 0;
    }

    currentRange.elo += eloChange;
    if (currentRange.elo < 0) currentRange.elo = 0;

    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
    const rangeIndex = savedRanges.findIndex(range =>
        range.position === currentRange.position &&
        range.stackSize === currentRange.stackSize &&
        range.rangeType === currentRange.rangeType &&
        range.name === currentRange.name
    );
    if (rangeIndex !== -1) {
        savedRanges[rangeIndex].elo = currentRange.elo;
        savedRanges[rangeIndex].correctStreak = currentRange.correctStreak;
        savedRanges[rangeIndex].incorrectStreak = currentRange.incorrectStreak;
        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
    }

    updateEloDisplay(currentRange.elo)
    updateEloProgressBar(currentRange.elo);
}

// Function to show the correct answer and Prepare the Next Round
function showCorrectAnswerAndPrepareNext(combo) {
    loadRangeInMatrix(currentRange);

    const comboData = currentRange.combos.find(c => c.combo === combo);
    const resultDiv = document.getElementById('practice-result');
    resultDiv.classList.add('show');  // Add fade-in class

    if (comboData && comboData.color) {
        const correctColorObj = colors.find(color => color.class === comboData.color);
        if (correctColorObj) {
            resultDiv.innerHTML = `La acción correcta para ${combo} es <span style="color: ${correctColorObj.hex}; font-weight: bold;"><i class="fas fa-check-circle"></i> ${correctColorObj.name}</span>.`;
        } else {
            resultDiv.textContent = `La acción correcta para ${combo} no está definida.`;
        }
    } else {
        resultDiv.innerHTML = `La acción correcta para ${combo} es <span style="font-weight: bold;"><i class="fas fa-times-circle"></i> Fold</span>.`;
    }

    setTimeout(() => {
        clearCardSelections();
        resultDiv.classList.remove('show');  // Remove fade-in class
        startPracticeRound();
    }, 2000);
}

// Function to update ELO Display
function updateEloDisplay(elo) {
    const eloDisplay = document.getElementById('elo-display');
    if (eloDisplay) {
        const levelData = getLevel(elo);
        eloDisplay.innerHTML = `ELO: ${elo} ${levelData.emoji} <span class="level-name">(${levelData.level})</span>`;
    }
}

function updateEloProgressBar(elo) {
    const progressBar = document.getElementById('elo-progress-bar');
    const currentLevel = getLevel(elo);
    const nextLevelIndex = levels.indexOf(currentLevel) + 1;
    const nextLevelElo = nextLevelIndex < levels.length ? levels[nextLevelIndex].elo : 100000;

    const progress = Math.min(1, (elo - currentLevel.elo) / (nextLevelElo - currentLevel.elo)) * 100;

    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${Math.round(progress)}%`;
}

// Function to export the ELO
function exportElo() {
    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];

    const eloData = savedRanges.map(range => ({
        name: range.name,
        position: range.position,
        stackSize: range.stackSize,
        elo: range.elo || 0
    }));

    const jsonString = JSON.stringify(eloData, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokerElo.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

// Function to import the ELO from File
function importEloFromFile(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const importedEloData = JSON.parse(e.target.result);

                let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];

                importedEloData.forEach(importedRange => {
                    const rangeIndex = savedRanges.findIndex(range =>
                        range.name === importedRange.name &&
                        range.position === importedRange.position &&
                        range.stackSize === importedRange.stackSize
                    );

                    if (rangeIndex !== -1) {
                        savedRanges[rangeIndex].elo = importedRange.elo;
                    }
                });

                localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));

                alert('ELO importado correctamente.');

                loadRanges();

                if (practiceMode && currentRange) {
                    updateEloDisplay(currentRange.elo);
                    updateEloProgressBar(currentRange.elo);
                }
            } catch (error) {
                alert('Error al importar ELO: ' + error);
                console.error('Error parsing imported ELO:', error);
            }
        };

        reader.readAsText(file);
    }
}

// Function to get contrast color
function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate YIQ value
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Return black or white based on YIQ value
    return (yiq >= 128) ? 'black' : 'white';
}
