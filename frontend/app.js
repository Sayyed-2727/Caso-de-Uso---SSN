const BACKEND_URL = "http://localhost:8000";

const searchForm = document.getElementById("searchForm");
const resultsGrid = document.getElementById("resultsGrid");
const loader = document.getElementById("loader");
const subscribeForm = document.getElementById("subscribeForm");
const modal = document.getElementById("alertModal");
const helpModal = document.getElementById("helpModal");
const modalFlightSummary = document.getElementById("modalFlightSummary");

let currentSelectedFlight = null;

const originInput = document.getElementById("origin");
const destInput = document.getElementById("destination");
const dateInput = document.getElementById("date");
const btnSearch = document.getElementById("btnSearch");

const checkInputs = () => {
    if (originInput.value && destInput.value && dateInput.value) {
        btnSearch.disabled = false;
    } else {
        btnSearch.disabled = true;
    }
};

[originInput, destInput, dateInput].forEach(input => {
    input.addEventListener("input", checkInputs);
});
checkInputs();

let allFlights = [];
let filteredFlights = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 6;
let currentSearchParams = {};

const filtersContainer = null;
const resultsHeader = document.getElementById("resultsHeader");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");
const airlineFiltersObj = document.getElementById("airlineFilters");

const extractIata = (value) => {
    const match = value.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : value.toUpperCase();
};

searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const originRaw = document.getElementById("origin").value;
    const destRaw = document.getElementById("destination").value;
    const origin = extractIata(originRaw);
    const destination = extractIata(destRaw);
    const date = document.getElementById("date").value;
    const btnSearch = document.getElementById("btnSearch");
    const flightLoader = document.getElementById("flightLoader");

    flightLoader.classList.remove("hidden");
    resultsHeader.classList.add("hidden");
    btnSearch.disabled = true;
    resultsGrid.innerHTML = "";
    document.getElementById("paginationContainer").innerHTML = "";

    await new Promise(r => setTimeout(r, 1500));

    try {
        const response = await fetch(`${BACKEND_URL}/search?origin=${origin}&dest=${destination}&date=${date}`);
        const data = await response.json();

        if (data.flights && data.flights.length > 0) {
            showToast(`✅ Se encontraron ${data.flights.length} vuelos`);

            allFlights = data.flights;
            filteredFlights = [...allFlights];
            currentPage = 1;
            currentSearchParams = { origin, destination, date };

            initFilters(allFlights);
            resultsHeader.classList.remove("hidden");

            renderPage(1);

        } else {
            showToast(`ℹ️ No se encontraron vuelos.`);
            renderNoResults();
        }
    } catch (error) {
        showToast("❌ Error al conectar con el servidor.", "error");
        console.error(error);
    } finally {
        flightLoader.classList.add("hidden");
        btnSearch.disabled = false;
    }
});

function initFilters(flights) {
    const prices = flights.map(f => parseFloat(f.price.total));
    const maxPrice = Math.ceil(Math.max(...prices));
    const minPrice = Math.floor(Math.min(...prices));

    priceRange.max = maxPrice;
    priceRange.min = minPrice;
    priceRange.value = maxPrice;
    priceValue.innerText = `${maxPrice} EUR`;

    priceRange.oninput = () => {
        priceValue.innerText = `${priceRange.value} EUR`;
    };

    const airlines = new Set();
    flights.forEach(f => {
        const code = f.validatingAirlineCodes ? f.validatingAirlineCodes[0] : "AIR";
        airlines.add(code);
    });

    airlineFiltersObj.innerHTML = "";
    airlines.forEach(code => {
        const label = document.createElement("label");
        label.className = "airline-checkbox";
        label.innerHTML = `
            <input type="checkbox" value="${code}" checked>
            ${code}
        `;
        airlineFiltersObj.appendChild(label);
    });
}

function applyFiltersAndClose() {
    const maxPrice = parseFloat(priceRange.value);
    const checkedAirlines = Array.from(document.querySelectorAll("#airlineFilters input:checked")).map(cb => cb.value);

    filteredFlights = allFlights.filter(f => {
        const price = parseFloat(f.price.total);
        const carrier = f.validatingAirlineCodes ? f.validatingAirlineCodes[0] : "AIR";
        return price <= maxPrice && checkedAirlines.includes(carrier);
    });

    currentPage = 1;
    renderPage(1);
    closeModal('filterModal');
    showToast("✅ Filtros aplicados");
}

function renderNoResults() {
    resultsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 2rem;">
            <i class="ri-search-2-line" style="font-size: 3rem; opacity: 0.5;"></i>
            <h3>No se encontraron vuelos</h3>
            <p>Prueba buscando con fechas diferentes.</p>
        </div>`;
}

function renderPage(page) {
    currentPage = page;
    resultsGrid.innerHTML = "";

    if (filteredFlights.length === 0) {
        resultsGrid.innerHTML = `<div style="text-align:center; grid-column:1/-1; padding:2rem;">
            <p>No hay vuelos que coincidan con los filtros.</p>
        </div>`;
        document.getElementById("paginationContainer").innerHTML = "";
        return;
    }

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const flightsToShow = filteredFlights.slice(start, end);

    flightsToShow.forEach(flight => {
        const price = flight.price.total;
        const currency = flight.price.currency;
        const carrier = flight.validatingAirlineCodes ? flight.validatingAirlineCodes[0] : "AIR";

        const card = document.createElement("div");
        card.className = "flight-card";
        card.innerHTML = `
            <div class="flight-header">
                <div class="flight-route-pill">
                    <span class="city-code">${currentSearchParams.origin}</span>
                    <i class="ri-plane-fill plane-icon"></i>
                    <span class="city-code">${currentSearchParams.destination}</span>
                </div>
                <div class="flight-meta">
                    <span class="meta-tag"><i class="ri-calendar-line"></i> ${currentSearchParams.date}</span>
                </div>
            </div>

            <div class="flight-airline">
                <i class="ri-flight-takeoff-line"></i>
                <small>Aerolínea: <strong>${carrier}</strong></small>
            </div>

            <div class="flight-price-container">
                <span class="price-label">Precio total por pasajero</span>
                <span class="flight-price">${price} <small>${currency}</small></span>
            </div>

            <button class="btn-primary full-width btn-alert-trigger" onclick="showAlertForm('${price}', '${currency}', '${currentSearchParams.origin}', '${currentSearchParams.destination}', '${currentSearchParams.date}')">
                <i class="ri-notification-3-line"></i> Crear alerta
            </button>
        `;
        resultsGrid.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredFlights.length / ITEMS_PER_PAGE);
    const container = document.getElementById("paginationContainer");
    container.innerHTML = "";

    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "page-btn";
    prevBtn.innerHTML = `<i class="ri-arrow-left-s-line"></i>`;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => renderPage(currentPage - 1);
    container.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement("button");
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => renderPage(i);
        container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "page-btn";
    nextBtn.innerHTML = `<i class="ri-arrow-right-s-line"></i>`;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => renderPage(currentPage + 1);
    container.appendChild(nextBtn);
}

window.showAlertForm = (price, currency, origin, destination, date) => {
    currentSelectedFlight = { origin, destination, date, price, currency };

    modalFlightSummary.innerHTML = `
        <div class="flight-summary-route">
            ${origin} <i class="ri-arrow-right-line" style="font-size: 0.8em; opacity: 0.5; margin: 0 5px;"></i> ${destination}
        </div>
        <span class="flight-summary-date">${date}</span>
        <div class="flight-summary-price">
            ${price} ${currency}
        </div>
    `;

    _open(modal);
};

window.openModal = (modalId) => {
    const el = document.getElementById(modalId);
    if (el) _open(el);
};

window.openHelpModal = () => {
    _open(helpModal);
};

function _open(modalElement) {
    modalElement.classList.remove("hidden");
    setTimeout(() => modalElement.classList.add("active"), 10);
}

window.closeModal = (modalId) => {
    const el = document.getElementById(modalId) || modal;
    if (!el) return;

    el.classList.remove("active");
    setTimeout(() => el.classList.add("hidden"), 300);
};

window.onclick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        closeModal(e.target.id);
    }
};

subscribeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("modalEmail").value;
    if (!currentSelectedFlight) return;

    const payload = {
        email: email,
        origin: currentSelectedFlight.origin,
        destination: currentSelectedFlight.destination,
        date: currentSelectedFlight.date,
        current_price: parseFloat(currentSelectedFlight.price)
    };

    const btn = subscribeForm.querySelector("button");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div> Guardando...`;
    btn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeModal('alertModal');
            showToast("✅ ¡Alerta guardada! Revisa tu email.");
            document.getElementById("modalEmail").value = "";
        } else {
            showToast("⚠️ Hubo un problema al guardar la alerta.", "error");
        }
    } catch (error) {
        showToast("❌ Error de conexión", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

function showToast(msg, type = "success") {
    const toast = document.getElementById("notification-toast");

    let icon = type === "error" ? '<i class="ri-error-warning-line"></i>' : '<i class="ri-checkbox-circle-line"></i>';
    toast.innerHTML = `${icon} <span>${msg}</span>`;

    toast.classList.remove("hidden");

    if (type === "error") toast.classList.add("error");
    else toast.classList.remove("error");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 4500);
}