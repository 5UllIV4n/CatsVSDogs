const element = document.querySelector(".box-text");
const text = element.textContent;

element.textContent = "";

for (let letter of text) {
    if (letter === " ") {
        element.appendChild(document.createTextNode(" "));
    } else {
        const span = document.createElement("span");
        span.classList.add("letter");
        span.textContent = letter;
        element.appendChild(span);
    }
}

function betterRead() {
    const oldElement = document.querySelector('.box-text');

    if (oldElement) {
        oldElement.classList.add('fade-out');

        oldElement.addEventListener('transitionend', () => {
            const newElement = document.createElement("p");
            newElement.classList.add("comic-neue-regular", "box-text");
            newElement.id = "intoll";
            newElement.textContent = "Hello! and wellcome to the website where you can see a list of students from LA Job Corps who like cats and dogs!";

            newElement.style.opacity = 0;
            oldElement.replaceWith(newElement);

            newElement.style.transition = "opacity 0.5s ease";
            newElement.style.opacity = 1;
        }, { once: true });
    }
}



// Pre-loaded students
// resource credit: https://www.sliderrevolution.com/resources/css-tables/
let sampleData = [
    { name: "Poop", preference: "🐱🐶 Both", flagged: true },
    { name: "Hellen Chan", preference: "🐶 Dogs", },
    { name: "Mr. Wily", preference: "🐶 Dogs", },
    { name: "Brandun Tehnson", preference: "🐶 Dogs", },
    { name: "Brandon Mcmulien", preference: "🐱 Cats", },
    { name: "Jose Valle", preference: "🐶 Dogs", },
    { name: "Alex Cathunau", preference: "🐶 Dogs", },
    { name: "keylah benford", preference: "🐶 Dogs", },
    { name: "Cudela C", preference: "🐶 Dogs", },
    { name: "Julie Madison", preference: "🐶 Dogs", },
    { name: "Janay Landry", preference: "🐶 Dogs", },
    { name: "Kayla W.", preference: "🐶 Dogs", },
    { name: "Dock G.", preference: "🐶 Dogs", },
    { name: "Mekigh F", preference: "🐶 Dogs", },
    { name: "Ms. Player", preference: "🐶 Dogs", },
    { name: "Melendez", preference: "🐶 Dogs", },
    { name: "Ms. Sandaval", preference: "🐶 Dogs", },
    { name: "Dezy Wezy", preference: "🐶 Dogs", },
    { name: "Taylor Canauarla", preference: "🐶 Dogs", },
    { name: "David Gonzalez", preference: "🐶 Dogs", },
    { name: "Johnathon G", preference: "🐱 Cats", },
    { name: "Mr.S", preference: "🐱 Cats", },
    { name: "Kevin V.", preference: "🐱 Cats", },
    { name: "Big R", preference: "🐱 Cats", },
    { name: "randonname", preference: "🐱 Cats", },
    { name: "Matthew Cordero", preference: "🐱 Cats", },
    { name: "DB", preference: "🐱 Cats", },
    { name: "Alex Rizo", preference: "🐱 Cats", },
    { name: "Richard Corona", preference: "🐱 Cats", },
    { name: "Amanuael - TerFaze", preference: "🐶 Dogs", },
    { name: "EP", preference: "🐱 Cats", },
    { name: "Ceige", preference: "🐶 Dogs", },
    { name: "Rosie Adero", preference: "🐶 Dogs", },
    { name: "Benjamin H.", preference: "🐱 Cats", },
];

/* ──────────────────────────────────────────
   CLOUDFLARE WORKER API
─────────────────────────────────────────── */
const WORKER_URL = "https://jcla-students-api.formundah.workers.dev";

async function loadStudents() {
    try {
        const res = await fetch(`${WORKER_URL}/students`);
        sampleData = await res.json();
    } catch (err) {
        console.error("Failed to load students:", err);
        sampleData = [];
    }
    updateTable();
}

async function saveStudent(name, preference) {
    try {
        const res = await fetch(`${WORKER_URL}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, preference }),
        });
        const result = await res.json();
        return result.success;
    } catch (err) {
        console.error("Failed to save student:", err);
        return false;
    }
}


let currentPage = 1;
let pageSize = 10;
let sortColumn = null;
let sortDirection = 'ascending';
let filters = { name: '', preference: '' };
let showFlagged = false;

const table = document.querySelector('table');
const tbody = table.querySelector('tbody');
const prevButton = document.querySelector('.prev-page');
const nextButton = document.querySelector('.next-page');
const pageSizeSelect = document.querySelector('.page-size-select');
const currentRange = document.querySelector('.current-range');
const totalItems = document.querySelector('.total-items');
const filterInputs = document.querySelectorAll('.column-filter');

function isFlagged(name) {
    if (typeof profanityCleaner === 'undefined' || typeof profanityCleaner.clean !== 'function') {
        throw new Error('FILTER_UNAVAILABLE');
    }
    const cleaned = profanityCleaner.clean(name);
    return cleaned !== name;
}

const paginationInfo = document.querySelector('.pagination-info');
const toggleBtn = document.createElement('button');
toggleBtn.id = 'toggle-flagged';
toggleBtn.className = 'btn comic-neue-regular toggle-flagged-btn';
toggleBtn.textContent = '🔒 Show Flagged Names?';
paginationInfo.appendChild(toggleBtn);

toggleBtn.addEventListener('click', () => {
    showFlagged = !showFlagged;
    toggleBtn.textContent = showFlagged ? '🔓 Hide Flagged' : '🔒 Show Flagged';
    toggleBtn.classList.toggle('toggle-flagged-btn--active', showFlagged);
    currentPage = 1;
    updateTable();
});

function filterData(data) {
    return data.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(filters.name.toLowerCase());
        const prefMatch = filters.preference === '' || item.preference === filters.preference;
        const flaggedMatch = showFlagged ? true : !item.flagged;
        return nameMatch && prefMatch && flaggedMatch;
    });
}

function sortData(data) {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
        const aValue = a[sortColumn].toLowerCase();
        const bValue = b[sortColumn].toLowerCase();
        const direction = sortDirection === 'ascending' ? 1 : -1;
        return aValue.localeCompare(bValue) * direction;
    });
}

function paginateData(data) {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
}

function updateTable() {
    let filteredData = filterData(sampleData);
    const totalFilteredItems = filteredData.length;

    filteredData = sortData(filteredData);
    const paginatedData = paginateData(filteredData);

    totalItems.textContent = totalFilteredItems;
    const start = Math.min((currentPage - 1) * pageSize + 1, totalFilteredItems);
    const end = Math.min(currentPage * pageSize, totalFilteredItems);
    currentRange.textContent = totalFilteredItems === 0 ? '0-0' : `${start}-${end}`;

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = end >= totalFilteredItems;

    tbody.innerHTML = '';

    paginatedData.forEach(item => {
        const row = document.createElement('tr');
        if (item.flagged) row.classList.add('flagged-row');

        const nameCell = document.createElement('td');
        const MAX_DISPLAY = 24;
        nameCell.textContent = item.name.length > MAX_DISPLAY
            ? item.name.slice(0, MAX_DISPLAY) + '...'
            : item.name;
        if (item.name.length > MAX_DISPLAY) {
            nameCell.title = item.name;
        }
        nameCell.setAttribute('tabindex', '0');

        const prefCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('pref-badge');
        badge.textContent = item.preference;
        prefCell.appendChild(badge);

        row.append(nameCell, prefCell);
        tbody.appendChild(row);
    });

    announceToScreenReader(`Showing ${start} to ${end} of ${totalFilteredItems} items`);
}

prevButton.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; updateTable(); }
});

nextButton.addEventListener('click', () => {
    currentPage++;
    updateTable();
});

pageSizeSelect.addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    updateTable();
});

Array.from(filterInputs).forEach((input, index) => {
    const column = ['name'][index];
    if (!column) return;
    input.addEventListener('input', (e) => {
        filters[column] = e.target.value;
        currentPage = 1;
        updateTable();
    });
});

const prefFilter = document.querySelector('.pref-filter');
prefFilter.addEventListener('change', (e) => {
    filters.preference = e.target.value;
    currentPage = 1;
    updateTable();
});

const sortButtons = document.querySelectorAll('.sort-button');
Array.from(sortButtons).forEach((button, index) => {
    const column = ['name'][index];
    if (!column) return;
    button.addEventListener('click', () => {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
        } else {
            sortColumn = column;
            sortDirection = 'ascending';
        }
        Array.from(sortButtons).forEach(btn => btn.removeAttribute('aria-sort'));
        button.setAttribute('aria-sort', sortDirection);
        updateTable();
    });
});

table.addEventListener('keydown', (e) => {
    const currentCell = e.target;
    if (!currentCell || !currentCell.parentElement) return;

    const currentRow = currentCell.parentElement;
    const rows = Array.from(table.rows);
    const currentRowIndex = rows.indexOf(currentRow);
    const currentCellIndex = Array.from(currentRow.cells).indexOf(currentCell);

    switch (e.key) {
        case 'ArrowRight': currentRow.cells[currentCellIndex + 1]?.focus(); break;
        case 'ArrowLeft': currentRow.cells[currentCellIndex - 1]?.focus(); break;
        case 'ArrowDown': rows[currentRowIndex + 1]?.cells[currentCellIndex]?.focus(); break;
        case 'ArrowUp': rows[currentRowIndex - 1]?.cells[currentCellIndex]?.focus(); break;
    }
});

let timeout;
const images = document.getElementById("popupImg");

document.getElementById("fName").addEventListener("input", function typing() {
    images.style.opacity = 1;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
        images.style.opacity = 0;
    }, 200);
});

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

function logAction(message) {
    const existing = document.getElementById('log-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'log-toast';
    toast.className = 'log-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('log-toast--visible');
        });
    });

    setTimeout(() => {
        toast.classList.remove('log-toast--visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
}

const addForm = document.getElementById('addForm');

addForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const firstName = addForm.fName.value.trim();
    const petPref = addForm.petPref.value;

    if (!firstName || !petPref) {
        logAction("Please fill in your name and pick a preference!");
        return;
    }

    const submitBtn = addForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const countdownDiv = document.createElement('div');
    countdownDiv.id = 'countdown-confirm';
    countdownDiv.style.cssText = `
        text-align: center;
        margin-top: 1rem;
        padding: 1rem;
        background: #fff8e1;
        border: 2px solid #ffb30e;
        border-radius: 8px;
        font-family: "Comic Neue", cursive;
        font-weight: 800;
    `;

    let timeLeft = 12;

    const msg1 = document.createElement('p');
    msg1.style.cssText = 'margin:0 0 0.5rem 0; font-size:1rem;';
    msg1.textContent = 'Adding ';
    const strong1 = document.createElement('strong');
    strong1.textContent = firstName;
    msg1.append(strong1, ` (${petPref}) are you sure?`);

    const timerSpan = document.createElement('span');
    timerSpan.id = 'cd-timer';
    timerSpan.textContent = timeLeft;

    const msg2 = document.createElement('p');
    msg2.style.cssText = 'margin:0 0 0.8rem 0; font-size:0.95rem; color:#888;';
    msg2.textContent = 'Click ';
    const strong2 = document.createElement('strong');
    strong2.textContent = 'Save';
    msg2.append(strong2, ' within ');
    msg2.appendChild(timerSpan);
    msg2.append(' seconds or it will be cancelled.');

    const saveBtn = document.createElement('button');
    saveBtn.id = 'cd-save';
    saveBtn.className = 'btn comic-neue-regular';
    saveBtn.style.cssText = 'background:#d4edda; border-color:#6ab04c; margin-right:0.5rem;';
    saveBtn.textContent = '✅ Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cd-cancel';
    cancelBtn.className = 'btn comic-neue-regular';
    cancelBtn.style.cssText = 'background:#ffe0e0; border-color:#f5a0a0;';
    cancelBtn.textContent = '❌ Cancel';

    countdownDiv.append(msg1, msg2, saveBtn, cancelBtn);

    addForm.appendChild(countdownDiv);

    const timerDisplay = timerSpan;
    const interval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 3) timerDisplay.style.color = 'red';
        if (timeLeft <= 0) {
            clearInterval(interval);
            cancelAdd();
        }
    }, 1000);

    countdownDiv.querySelector('#cd-save').addEventListener('click', () => {  
        clearInterval(interval);
        let flagged;
        try {
            flagged = isFlagged(firstName);
        } catch (e) {
            if (e.message === 'FILTER_UNAVAILABLE') {
                logAction("⚠️ Safety filter failed to load. Submission blocked.");
                cleanup();
                return;
            }
            flagged = true;
        }
        sampleData.push({ name: firstName, preference: petPref, flagged });
        const filtered = filterData(sampleData);
        currentPage = Math.ceil(filtered.length / pageSize) || 1;
        updateTable();
        cleanup();
        addForm.reset();
        if (flagged) {
            logAction("⚠️ That name was flagged and hidden from the main list.");
        } else {
            logAction(`✅ ${firstName} has been added!`);
        }
    });

    countdownDiv.querySelector('#cd-cancel').addEventListener('click', () => {
        clearInterval(interval);
        cancelAdd();
    });

    function cancelAdd() {
        logAction("❌ Add cancelled.");
        cleanup();
    }

    function cleanup() {
        countdownDiv.remove();
        submitBtn.disabled = false;
    }
});

updateTable();

/* ── Load students from KV on page load ── */
loadStudents();