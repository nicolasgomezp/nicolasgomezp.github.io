const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
let selectedColor = '';
let currentPosition = '';
let currentStackSize = 100;
let activeRangeButton = null;
let lastSelectedRangeIndex = 0;
let isDragging = false;
let currentRange = null;
let colorOptionsVisible = false;

// Long press variables
let longPressTimer;
const longPressDuration = 500; // Adjust as needed (milliseconds)
let longPressTarget; // The element that triggered the long press

const colors = [
    { name: 'Rojo', class: 'red', hex: '#ff0000' },
    { name: 'Azul', class: 'blue', hex: '#0000ff' },
    { name: 'Verde', class: 'green', hex: '#00ff00' },
    { name: 'Amarillo', class: 'yellow', hex: '#ffff00' },
    { name: 'Naranja', class: 'orange', hex: '#ffa500' },
    { name: 'Morado', class: 'purple', hex: '#800080' }
];

function createElement(type, classes = [], text = '', attributes = {}) {
    const element = document.createElement(type);
    classes.forEach(cls => element.classList.add(cls));
    element.textContent = text;
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

function attachEventListeners() {
    try {
        const container = document.querySelector('.container');

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

        cardMatrix.addEventListener('mouseleave', () => isDragging = false);

        cardMatrix.addEventListener('mouseover', (e) => {
            if (isDragging && e.target.classList.contains('card-combo')) {
                toggleCombo({ target: e.target });
            }
        });

        const clearRangeButton = createElement('button', [], 'Vaciar Rango');
        clearRangeButton.addEventListener('click', clearCardSelections);
        container.insertBefore(clearRangeButton, document.getElementById('save-range-form'));

    } catch (error) {
        console.error('Error attaching event listeners:', error);
    }
}

function toggleCombo(event) {
    const cardDiv = event.target;
    const combo = cardDiv.dataset.combo;

    if (!selectedColor) {
        const colorClasses = colors.map(c => `selected-${c.class}`);
        cardDiv.classList.remove(...colorClasses);
    } else {
        // Set the color regardless of the current state
        const colorClasses = colors.map(c => `selected-${c.class}`);
        cardDiv.classList.remove(...colorClasses);
        cardDiv.classList.add(`selected-${selectedColor}`);
    }
}

function setColor(color) {
    if (selectedColor === color) {
        selectedColor = '';
    } else {
        selectedColor = color;
    }
    updateColorSelectionIndicator();
    updateMatrixColors();
}

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

function saveRange() {
    try {
        if (!currentPosition) {
            alert('Por favor, selecciona una posición primero.');
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

        // Get the legend from the current range if it exists. This preserves it!
        let legendToSave = currentRange ? currentRange.legend : [];

        const rangeData = {
            name: rangeName,
            position: currentPosition,
            stackSize: currentStackSize,
            combos: selectedCombos,
            legend: legendToSave
        };

        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        const existingRangeIndex = savedRanges.findIndex(range => range.position === currentPosition && range.stackSize == currentStackSize && range.name === rangeName);

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

function loadRanges() {
    try {
        const rangeList = document.getElementById('range-list');
        if (!rangeList) {
            console.error('Range list element not found!');
            return;
        }
        rangeList.innerHTML = '';

        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        const filteredRanges = savedRanges.filter(range => range.position === currentPosition && range.stackSize == currentStackSize);

        if (filteredRanges.length > 0) {
            filteredRanges.forEach((range, index) => {
                const rangeButtonContainer = document.createElement('div');
                rangeButtonContainer.classList.add('range-button-container');

                const rangeButton = createElement('button', ['range-button'], `${range.name}`);
                rangeButton.addEventListener('click', () => selectRange(range, rangeButton, index));
                rangeButtonContainer.appendChild(rangeButton);

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
            rangeList.textContent = 'No hay rangos guardados para esta posición y cantidad de ciegas.';
            activeRangeButton = null;
            clearCardSelections();
        }
    } catch (error) {
        console.error('Error loading ranges:', error);
    }
}

function deleteRange(rangeToDelete) {
    if (confirm(`¿Estás seguro de que quieres eliminar el rango "${rangeToDelete.name}"?`)) {
        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        savedRanges = savedRanges.filter(range =>
            !(range.position === rangeToDelete.position && range.stackSize == rangeToDelete.stackSize && range.name === rangeToDelete.name)
        );
        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
        loadRanges();
    }
}

function selectRange(range, button, index) {
    currentRange = range;
    loadRangeInMatrix(range);
    setActiveRangeButton(button);
    lastSelectedRangeIndex = index;
    displayLegend(range);
    displayLegendEditor(range);
}

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
        itemContainer.appendChild(textInput);

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

function saveRangesToLocalStorage() {
    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
    const rangeIndex = savedRanges.findIndex(range =>
        range.position === currentPosition && range.stackSize === currentStackSize && range.name === document.getElementById('range-name').value);

    if (rangeIndex !== -1) {
        savedRanges[rangeIndex] = currentRange;
        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
    }

    localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
}

function loadRangeInMatrix(range) {
    try {
        clearCardSelections()

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

function setActiveRangeButton(button) {
    if (activeRangeButton) activeRangeButton.classList.remove('active');
    activeRangeButton = button;
    activeRangeButton.classList.add('active');
}

function generateCardMatrix() {
    try {
        const matrix = document.getElementById('card-matrix');
        if (!matrix) {
            console.error('Card matrix element not found!');
            return;
        }
        matrix.innerHTML = '';

        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 13; j++) {
                const rank1 = ranks[i];
                const rank2 = ranks[j];
                let combo = '';

                if (i === j) {
                    combo = rank1 + rank2;
                } else if (i < j) { // Only generate combos where rank1 > rank2
                    combo = rank1 + rank2 + 's';
                } else { // Only generate combos where rank1 > rank2
                    combo = rank2 + rank1 + 'o'; // Swap ranks for offsuit combos
                }

                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card-combo');
                cardDiv.textContent = combo;
                cardDiv.dataset.combo = combo;
                cardDiv.addEventListener('click', toggleCombo);

                // Add long press listeners
                cardDiv.addEventListener('mousedown', (e) => {
                    longPressTarget = e.target;
                    longPressTimer = setTimeout(() => {
                        handleLongPress(longPressTarget);
                    }, longPressDuration);
                });

                cardDiv.addEventListener('mouseup', () => {
                    clearTimeout(longPressTimer);
                });

                cardDiv.addEventListener('mouseleave', () => {
                    clearTimeout(longPressTimer);
                });

                matrix.appendChild(cardDiv);
            }
        }

        restoreCardSelections();
    } catch (error) {
        console.error('Error generating card matrix:', error);
    }
}

function restoreCardSelections() {
    try {
        clearCardSelections();

        let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || [];
        let currentRanges = savedRanges.filter(range => range.position === currentPosition && range.stackSize == currentStackSize);

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

function initializeRangeButtons() {
    loadRanges();
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        attachEventListeners();
        generateCardMatrix();
        updateMatrixColors();

        document.querySelector('.stack-size-button[data-stack-size="100"]').classList.add('active');
        document.querySelector('.position-button[data-position="utg"]').classList.add('active');
        currentPosition = 'utg';

        initializeRangeButtons();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Helper Functions for Selection Logic

function isComboSelected(combo) {
    const cardDiv = document.querySelector(`.card-combo[data-combo="${combo}"]`);
    if (!cardDiv) return false;
    return colors.some(color => cardDiv.classList.contains(`selected-${color.class}`));
}

function selectHigherPairs(combo) {
    const rank = combo[0]; // e.g., "A" from "AA"
    const rankIndex = ranks.indexOf(rank);
    if (rankIndex === -1) return;

    for (let i = 0; i < rankIndex; i++) {
        const higherRank = ranks[i];
        const higherPairCombo = higherRank + higherRank;
        if (!isComboSelected(higherPairCombo)) {  // Only select if not already selected
            const cardDiv = document.querySelector(`.card-combo[data-combo="${higherPairCombo}"]`);
            if (cardDiv) {
                toggleCombo({ target: cardDiv });
            }
        }
    }
}

function selectSuitedLeft(combo) {
    const rank = combo[0];
    const suitRank = combo[1];

    if (combo.length !== 3 || combo[2] !== 's') return;

    const rankIndex = ranks.indexOf(suitRank);

    if (rankIndex === -1) return;

    for (let i = 0; i <= rankIndex; i++) {
        const leftRank = ranks[i];
        const leftSuitedCombo = rank + leftRank + 's';
        if (!isComboSelected(leftSuitedCombo)) { // Only select if not already selected
            const cardDiv = document.querySelector(`.card-combo[data-combo="${leftSuitedCombo}"]`);

            if (cardDiv) {
                toggleCombo({ target: cardDiv });
            }
        }
    }
}

function selectOffsuitAbove(combo) {
    if (combo.length !== 3 || combo[2] !== 'o') return;

    const firstRank = combo[0];  //First rank of the combo
    const secondRank = combo[1]; //Second rank of the combo
    const firstRankIndex = ranks.indexOf(firstRank); //Index of the first rank
    const secondRankIndex = ranks.indexOf(secondRank); //Index of the second rank

    if (firstRankIndex === -1 || secondRankIndex === -1) return;

    for (let i = secondRankIndex - 1; i >= 0; i--) {
        const aboveRank = ranks[i];

        const aboveOffsuitCombo = firstRank + aboveRank + 'o';

        if (!isComboSelected(aboveOffsuitCombo)) { // Only select if not already selected
            const cardDiv = document.querySelector(`.card-combo[data-combo="${aboveOffsuitCombo}"]`);

            if (cardDiv) {
                toggleCombo({ target: cardDiv });
            }
        }
    }
}

function handleLongPress(target) {
    const combo = target.dataset.combo;

    if (combo.length === 2) {
        selectHigherPairs(combo);
    } else if (combo.endsWith('s')) {
        selectSuitedLeft(combo);
    } else if (combo.endsWith('o')) {
        selectOffsuitAbove(combo);
    }
}
