document.addEventListener('DOMContentLoaded', function () {
    const percentageInput = document.getElementById('percentage');
    const handTable = document.getElementById('hand-table');
    const handTableContainer = document.getElementById('hand-table-container');
    const selectedHandsList = document.getElementById('selected-hands-list');
    const selectedHandsContainer = document.getElementById('selected-hands-container');
    const toggleTableButton = document.getElementById('toggle-table');
    const toggleSelectedButton = document.getElementById('toggle-selected');
    const handCells = Array.from(handTable.querySelectorAll('.hand'));
    const positionSelect = document.getElementById('position-select');
    const actionSelect = document.getElementById('action-select');
    const savedRangesButtons = document.getElementById('saved-ranges-buttons');
    const cardSelector = document.getElementById('card-buttons-container');
    const checkHandButton = document.getElementById('checkHand');
    const handResult = document.getElementById('handResult');
    const rangeNameInput = document.getElementById('range-name');
    const saveRangeButton = document.getElementById('save-range');

    // Mesa Interactiva
    const interactiveTable = document.getElementById('poker-table');
    const interactivePositions = Array.from(interactiveTable.querySelectorAll('.position'));
    const interactiveActionSelect = document.getElementById('action-select-interactive');
    const savedRangesInteractive = document.getElementById('saved-ranges-interactive');
    let isDraggingEnabled = true; // Controla si se pueden arrastrar o no

    let allHandsOrdered = [
        // Premium
        "AA", "KK", "QQ", "JJ", "AKs", "AQs", "AJs", "KQs", "AKo",

        // Very strong
        "TT", "ATs", "KJs", "QTs", "JTs", "AQo", "AJo", "KQo", "KTo",

        // Strong
        "99", "88", "A9s", "ATo", "QJs", "J9s", "T9s", "A8s", "A5s", "A4s", "A3s", "A2s", "KJo", "QTo",

        // Marginal/Speculative
        "77", "66", "55", "44", "33", "22", "A7s", "A6s", "A5o", "A4o", "A3o", "A2o", "K9s", "K8s", "K7s", "Q9s", "J8s", "T8s", "98s", "87s", "76s", "65s", "54s",

        // Weak/Bluffing
        "K6o", "K5o", "K4o", "K3o", "K2o", "Q8o", "Q7o", "Q6o", "Q5o", "Q4o", "Q3o", "Q2o", "J7o", "J6o", "J5o", "J4o", "J3o", "J2o", "T7o", "T6o", "T5o", "T4o", "T3o", "T2o", "96o", "95o", "94o", "93o", "92o", "86o", "85o", "84o", "83o", "82o", "75o", "74o", "73o", "72o", "64o", "63o", "62o", "53o", "52o", "43o", "42o", "32o"
    ];

    let manuallySelectedHands = []; // Array to store manually selected hands
    let isDragging = false; // Variable to track if the mouse is being dragged
    let dragSelect = false; // Variable to track whether to select or deselect while dragging
    let selectedCards = []; // Array to store selected cards in the checker

    // --- Helper Functions ---
    // Function to order a hand (ensures the higher card is first)
    function orderHand(hand) {
        const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
        const rank1 = hand[0];
        const rank2 = hand[1];
        const index1 = ranks.indexOf(rank1);
        const index2 = ranks.indexOf(rank2);

        if (index1 < index2) {
            return hand;
        } else {
            return rank2 + rank1;
        }
    }

    // Function to generate all possible hands
    function generateAllHands() {
        const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
        const allHands = [];

        // Pairs
        for (let i = 0; i < ranks.length; i++) {
            allHands.push(ranks[i] + ranks[i]);
        }

        // Suited
        for (let i = 0; i < ranks.length; i++) {
            for (let j = i + 1; j < ranks.length; j++) {
                allHands.push(orderHand(ranks[i] + ranks[j]) + 's');
            }
        }

        // Offsuit
        for (let i = 0; i < ranks.length; i++) {
            for (let j = i + 1; j < ranks.length; j++) {
                allHands.push(orderHand(ranks[i] + ranks[j]) + 'o');
            }
        }

        return allHands;
    }

    // Function to sort the priority list
    function sortPriorityList(priorityList) {
        return priorityList.map(hand => {
            if (hand.length === 3) { // Only sort suited and offsuit
                return orderHand(hand.slice(0, 2)) + hand.slice(2);
            } else {
                return hand; // Don't sort pairs
            }
        });
    }

    // Function to sort all hands according to the priority list
    function sortHands(allHands, priorityList) {
        const sortedHands = [];
        const remainingHands = [...allHands]; // Copy to avoid modifying the original

        // Add hands from the priority list first
        for (const hand of priorityList) {
            if (allHands.includes(hand)) {
                sortedHands.push(hand);
                remainingHands.splice(remainingHands.indexOf(hand), 1); // Remove from remaining
            }
        }

        // Add remaining hands at the end (in alphabetical order)
        remainingHands.sort();
        return sortedHands.concat(remainingHands);
    }

    // Function to get the number of combinations for a hand
    function getNumCombos(hand) {
        if (hand.length === 2) { // Pair
            return 6;
        } else if (hand.endsWith('s')) { // Suited
            return 4;
        } else if (hand.endsWith('o')) {
            return 12;
        } else {
            return 12;
        }
    }

    // --- UI Update Functions ---
    // Function to update the table highlighting
    function updateTableHighlighting(selectedHands) {
        handCells.forEach(cell => {
            const hand = cell.dataset.hand;
            cell.className = 'hand'; // Reset classes

            if (hand.length === 2) {
                cell.classList.add('pair');
            } else if (hand.endsWith('s')) {
                cell.classList.add('suited');
            } else {
                cell.classList.add('offsuit');
            }

            if (selectedHands.includes(hand)) {
                cell.classList.add('selected');
            }
        });
    }

    // Function to update the selected hands list
    function updateSelectedHandsList() {
        selectedHandsList.innerHTML = ''; // Clear the list
        manuallySelectedHands.forEach(hand => {
            const listItem = document.createElement('li');
            listItem.textContent = hand;
            selectedHandsList.appendChild(listItem);
        });
    }

    // Function to update the percentage display
    function updatePercentageDisplay() {
        const totalHands = 1326; // Total number of possible combinations in Hold'em
        let selectedCombos = 0;

        for (const hand of manuallySelectedHands) {
            selectedCombos += getNumCombos(hand);
        }

        // Calculate the percentage based on the manually selected combinations
        const percentage = (selectedCombos / totalHands) * 100;

        // Update the value in the input
        percentageInput.value = percentage.toFixed(2); // Show two decimal places
    }

    // --- Hand Selection Functions ---
    // Function to handle hand selection
    function handleHandSelection(cell) {
        const hand = cell.dataset.hand;
        const index = manuallySelectedHands.indexOf(hand);

        if (index === -1) {
            // If not selected, add it
            manuallySelectedHands.push(hand);
        } else {
            // If selected, remove it
            manuallySelectedHands.splice(index, 1);
        }
    }

    // --- Event Listeners for Table Interaction ---
    // Event listener for mousedown to activate drag select
    handTable.addEventListener('mousedown', function (e) {
        isDragging = true;
        const cell = e.target.closest('.hand');
        if (!cell) return; // If not clicked on a .hand cell, exit

        const hand = cell.dataset.hand;
        dragSelect = !manuallySelectedHands.includes(hand); // Determine whether to select or deselect
        handleHandSelection(cell);
        updatePercentageDisplay();
        updateSelectedHandsList();
        updateTableHighlighting(manuallySelectedHands);

        e.preventDefault(); // Prevent text selection while dragging
    });

    // Event listener for mouseup to deactivate drag select
    handTable.addEventListener('mouseup', function () {
        isDragging = false;
    });

    // Event listener for mouseleave to deactivate drag select if the mouse leaves the table
    handTable.addEventListener('mouseleave', function () {
        isDragging = false;
    });

    // Event listener for mouseover to handle selection while dragging over cells
    handTable.addEventListener('mouseover', function (e) {
        if (!isDragging) return; // If not dragging, exit

        const cell = e.target.closest('.hand');
        if (!cell) return; // If not over a .hand cell, exit

        const hand = cell.dataset.hand;
        const isSelected = manuallySelectedHands.includes(hand);

        if ((dragSelect && !isSelected) || (!dragSelect && isSelected)) {
            handleHandSelection(cell);
            updatePercentageDisplay();
            updateSelectedHandsList();
        }

        updateTableHighlighting(manuallySelectedHands);
    });

    // Event listener to update the table when the percentage value changes
    percentageInput.addEventListener('change', function () {
        const percentage = parseFloat(percentageInput.value);

        // Validation to avoid errors when entering invalid values
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            percentageInput.value = 0;
            return;
        }
        updateTableHighlighting(manuallySelectedHands);
    });

    // --- Card Checker Functionality ---
    // Generate the card buttons dynamically
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    for (let suitIndex = 0; suitIndex < suits.length; suitIndex++) {
        const suit = suits[suitIndex];
        for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
            const rank = ranks[rankIndex];
            const cardValue = rank + suit;

            const button = document.createElement('button');
            button.className = 'card-button';
            if (suit === '♦' || suit === '♥') {
                button.classList.add('red-suit');
            }
            button.textContent = cardValue;
            button.dataset.rank = rank;
            button.dataset.suit = (suit === '♥') ? 'h' : (suit === '♦') ? 'd' : (suit === '♣') ? 'c' : 's'; // Store suit as char
            button.dataset.cardIdentifier = rank + ((suit === '♥') ? 'h' : (suit === '♦') ? 'd' : (suit === '♣') ? 'c' : 's'); // Store complete

            button.style.gridArea = `${suitIndex + 1} / ${rankIndex + 1}`; // Position the button
            cardSelector.appendChild(button);
        }
    }

    // Add the click event listener to the container
    cardSelector.addEventListener('click', function (event) {
        if (event.target.classList.contains('card-button')) {
            const card = event.target;
            const cardIdentifier = card.dataset.cardIdentifier;

            const isSelected = selectedCards.includes(cardIdentifier);

            if (isSelected) {
                // Unselect the card
                card.classList.remove('selected');
                selectedCards = selectedCards.filter(c => c !== cardIdentifier);
            } else {
                if (selectedCards.length < 2) {
                    // Select the card if less than 2 are selected
                    card.classList.add('selected');
                    selectedCards.push(cardIdentifier);
                }
            }
        }
    });

    // Function to sort the hand check
    function sortHandCheck(hand) {
        const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
        const rank1 = hand[0];
        const rank2 = hand[1];
        const index1 = ranks.indexOf(rank1);
        const index2 = ranks.indexOf(rank2);

        if (index1 < index2) { // If rank1 is higher than rank2
            return hand; // Leave the hand as is
        } else {
            return rank2 + rank1; // Invert the hand
        }
    }

    // Modify the checkHand event to get cards from the new selector
    checkHandButton.addEventListener('click', function () {

        if (selectedCards.length !== 2) {
            handResult.textContent = "Por favor, selecciona exactamente dos cartas.";
            handResult.className = '';
            return;
        }

        // Get the card data.
        const card1Identifier = selectedCards[0]; // eg., "Ah"
        const card2Identifier = selectedCards[1]; // eg., "Kd"
        const card1 = card1Identifier[0]; // rank of the first card, rank and suit are together
        const card2 = card2Identifier[0]; // rank of the second card
        const suit1 = card1Identifier[1]; // suit of the first card
        const suit2 = card2Identifier[1]; // suit of the second card

        // Determine the hand type (suited, offsuit, pair).
        let handType = '';
        if (card1 === card2) {
            handType = ''; // Pair, no needs suited/offsuit
        } else if (suit1 === suit2) {
            handType = 's'; // Suited
        } else {
            handType = 'o'; // Offsuit
        }

        let selectedHand = sortHandCheck(card1 + card2); // order hand
        if (handType) {
            selectedHand += handType;
        }

        // Check if hand is in the manually selected ranges.
        let isHandInRange = manuallySelectedHands.includes(selectedHand);
        if (!isHandInRange && handType == 'o') { // Check reversed order if offsuit
            selectedHand = card2 + card1 + handType;
            isHandInRange = manuallySelectedHands.includes(selectedHand);
        }

        let resultClass = isHandInRange ? 'true' : 'false';
        let resultText = isHandInRange ? 'True' : 'False';
        handResult.textContent = 'Resultado: ' + resultText;
        handResult.className = resultClass;

        selectedCards = []; // reset card seletion
        let cardButtons = Array.from(cardSelector.querySelectorAll('.card-button.selected'));
        cardButtons.forEach(card => {
            card.classList.remove('selected')
        });
    });

    // --- Range Management ---
    // Object to store ranges by position and action
    let savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || {};

    // Function to save a range
    function saveRange() {
        const rangeName = rangeNameInput.value.trim();
        const position = positionSelect.value;
        const action = actionSelect.value;

        if (!rangeName) {
            alert("Por favor, ingresa un nombre para el rango.");
            return;
        }

        // Create the structure if it doesn't exist for the position and action
        if (!savedRanges[position]) {
            savedRanges[position] = {};
        }

        if (!savedRanges[position][action]) {
            savedRanges[position][action] = {};
        }

        if (savedRanges[position][action][rangeName]) {
            if (!confirm("¿Deseas sobrescribir el rango existente?")) {
                return;
            }
        }

        savedRanges[position][action][rangeName] = [...manuallySelectedHands];
        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
        rangeNameInput.value = '';
        displaySavedRanges();
    }

    // Function to delete a range
    function deleteRange(rangeName, position, action) {
        if (confirm(`¿Estás seguro de que quieres borrar el rango "${rangeName}" de la posición "${position}" y acción "${action}"?`)) {
            delete savedRanges[position][action][rangeName]; // Delete the range
            if (Object.keys(savedRanges[position][action]).length === 0) {
                delete savedRanges[position][action]; // Delete the action if it's empty
                if (Object.keys(savedRanges[position]).length === 0) {
                    delete savedRanges[position]; // Delete the position if it's empty
                }
            }
            localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
            displaySavedRanges(); // Refresh the buttons
        }
    }

    // Function to load a range
    function loadRange(rangeName, position, action) {
        if (savedRanges[position] && savedRanges[position][action] && savedRanges[position][action][rangeName]) {
            manuallySelectedHands = [...savedRanges[position][action][rangeName]];
            updateTableHighlighting(manuallySelectedHands);
            updateSelectedHandsList();
            updatePercentageDisplay();
        }
    }

    // Function to display saved ranges as buttons
    function displaySavedRanges() {
        const position = positionSelect.value;
        const action = actionSelect.value;
        savedRangesButtons.innerHTML = ''; // Clear existing buttons

        if (savedRanges[position] && savedRanges[position][action]) {
            for (const rangeName in savedRanges[position][action]) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'saved-range-button-container'; // Apply class for positioning

                const button = document.createElement('button');
                button.textContent = rangeName;
                button.addEventListener('click', () => loadRange(rangeName, position, action));

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-range-button';
                deleteButton.innerHTML = '×'; // Use the multiplication symbol as "X"
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent the click from propagating to the range button
                    deleteRange(rangeName, position, action);
                });

                buttonContainer.appendChild(button);
                buttonContainer.appendChild(deleteButton);
                savedRangesButtons.appendChild(buttonContainer);
            }
        }
    }

    // --- Toggle Visibility of Sections ---
    toggleTableButton.addEventListener('click', function () {
        handTableContainer.classList.toggle('hidden');
    });

    toggleSelectedButton.addEventListener('click', function () {
        selectedHandsContainer.classList.toggle('hidden');
    });

    // --- Event Listeners ---
    // Event listener for the "Save Range" button
    saveRangeButton.addEventListener('click', saveRange);

    // Event listener for the position select
    positionSelect.addEventListener('change', displaySavedRanges);

    // Event listener for the action select
    actionSelect.addEventListener('change', displaySavedRanges);

    // Function to display saved ranges as buttons for interactive table
    function displaySavedRangesInteractive() {
        const position = positionSelect.value;
        const action = interactiveActionSelect.value;
        savedRangesInteractive.innerHTML = ''; // Clear existing buttons

        if (savedRanges[position] && savedRanges[position][action]) {
            for (const rangeName in savedRanges[position][action]) {
                const button = document.createElement('button');
                button.textContent = rangeName;
                button.addEventListener('click', () => loadRange(rangeName, position, action));
                savedRangesInteractive.appendChild(button);
            }
        }
    }

    // Sync position selects
    function syncPositionSelects(position) {
        positionSelect.value = position;
        displaySavedRanges();
        displaySavedRangesInteractive();
    }

    // Event listeners for interactive table positions
    interactivePositions.forEach(pos => {
        pos.addEventListener('click', () => {
            const position = pos.dataset.position;
            syncPositionSelects(position);
        });
    });

    // Event listener for the interactive action select
    interactiveActionSelect.addEventListener('change', displaySavedRangesInteractive);

    // Function to activate/desactivar la función de arrastrar
    function toggleDragging() {
        isDraggingEnabled = !isDraggingEnabled;
        alert(`Arrastrar está ahora ${isDraggingEnabled ? 'activado' : 'desactivado'}.`);
    }

    // Botón para activar/desactivar la función de arrastrar
    const toggleDragButton = document.createElement('button');
    toggleDragButton.textContent = 'Activar/Desactivar Arrastrar';
    toggleDragButton.addEventListener('click', toggleDragging);
    document.getElementById('interactive-table-container').appendChild(toggleDragButton);

    // Variables para controlar el arrastre
    let currentDragging = null;
    let offsetX, offsetY;

    // Función para comenzar el arrastre
    function startDrag(e) {
        if (!isDraggingEnabled) return;

        currentDragging = this;
        currentDragging.classList.add('dragging');

        offsetX = e.clientX - currentDragging.getBoundingClientRect().left;
        offsetY = e.clientY - currentDragging.getBoundingClientRect().top;

        interactiveTable.addEventListener('mousemove', drag);
        interactiveTable.addEventListener('mouseup', endDrag);
        interactiveTable.addEventListener('mouseleave', endDrag); // Terminar si el ratón sale de la mesa
    }

    // Función para arrastrar
    function drag(e) {
        if (!currentDragging) return;

        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;

        // Limita el movimiento dentro de la mesa
        const tableRect = interactiveTable.getBoundingClientRect();
        const elementWidth = currentDragging.offsetWidth;
        const elementHeight = currentDragging.offsetHeight;

        let newX = x - tableRect.left;
        let newY = y - tableRect.top;

        // Limita el movimiento
        newX = Math.max(0, Math.min(newX, tableRect.width - elementWidth));
        newY = Math.max(0, Math.min(newY, tableRect.height - elementHeight));

        currentDragging.style.left = newX + 'px';
        currentDragging.style.top = newY + 'px';
    }

    // Función para terminar el arrastre
    function endDrag() {
        if (!currentDragging) return;

        currentDragging.classList.remove('dragging');
        interactiveTable.removeEventListener('mousemove', drag);
        interactiveTable.removeEventListener('mouseup', endDrag);
        interactiveTable.removeEventListener('mouseleave', endDrag);
        currentDragging = null;
    }

    // Evento de inicio de arrastre
    interactivePositions.forEach(pos => {
        pos.addEventListener('mousedown', startDrag);
    });

    // Función para cambiar el color al seleccionar y sincronizar selects
    function handlePositionClick(e) {
        // Desmarca cualquier posición previamente seleccionada
        interactivePositions.forEach(pos => pos.classList.remove('selected'));

        // Marca la posición actual como seleccionada
        this.classList.add('selected');

        const position = this.dataset.position; // Obtén el valor del atributo data-position
        syncPositionSelects(position); // Llama a la función para sincronizar los selects
    }

    // Evento click para seleccionar la posición
    interactivePositions.forEach(pos => {
        pos.addEventListener('click', handlePositionClick);
    });

    // Initial display for interactive table
    displaySavedRangesInteractive();

    // --- Initialization ---
    // Call to generate all hands
    const allHands = generateAllHands();

    // Sort the hands using the initial priority list
    allHandsOrdered = sortHands(allHands, allHandsOrdered);

    // Initialize the percentage based on the selected hands
    updatePercentageDisplay();
    updateTableHighlighting(manuallySelectedHands);

    // Update the cell text to include suited/offsuit indicator
    handCells.forEach(cell => {
        const hand = cell.dataset.hand;
        const orderedHand = orderHand(hand.slice(0, 2)) + hand.slice(2);
        cell.dataset.hand = orderedHand;
        cell.textContent = orderedHand; // Update the cell text
    });

    // Display saved ranges on page load
    displaySavedRanges();

    // Sort initial Priority List.
    allHandsOrdered = sortPriorityList(allHandsOrdered);

    // Initialize the percentage based on the selected hands
    updatePercentageDisplay();
    updateTableHighlighting(manuallySelectedHands);
    // Export/Import functions
        document.getElementById('export-ranges').addEventListener('click', () => {
            const savedRanges = JSON.parse(localStorage.getItem('pokerRanges')) || {};
            const json = JSON.stringify(savedRanges);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pokerRanges.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        document.getElementById('import-ranges').addEventListener('click', () => {
            document.getElementById('import-ranges-file').click();
        });

        document.getElementById('import-ranges-file').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const savedRanges = JSON.parse(e.target.result);
                        localStorage.setItem('pokerRanges', JSON.stringify(savedRanges));
                        alert('Rangos importados exitosamente!');
                        location.reload(); // Refresh the page to load the imported ranges.
                    } catch (error) {
                        alert('Error al importar el archivo JSON: ' + error);
                    }
                };
                reader.readAsText(file);
            }
        });
});
