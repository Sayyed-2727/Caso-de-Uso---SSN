const form = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");

const BACKEND_URL = "http://localhost:8000";


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultsDiv.innerHTML = "⏳ Buscando vuelos...";

  const origin = document.getElementById("origin").value.toUpperCase();
  const destination = document.getElementById("destination").value.toUpperCase();
  const date = document.getElementById("date").value;

  try {
    console.log(`Fetching: ${BACKEND_URL}/search-flights?origin=${origin}&destination=${destination}&date=${date}`);
    const response = await fetch(
      `${BACKEND_URL}/search-flights?origin=${origin}&destination=${destination}&date=${date}`
    );
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Data:', data);
    renderResults(data);

  } catch (error) {
    console.error('Error:', error);
    resultsDiv.innerHTML = "❌ Error al conectar con el servidor";
  }
});

function renderResults(flights) {
  resultsDiv.innerHTML = "";

  if (!flights || flights.length === 0) {
    resultsDiv.innerHTML = "No se encontraron vuelos.";
    return;
  }

  flights.slice(0, 5).forEach(flight => {
    const price = flight.price.total;
    const currency = flight.price.currency;
    const airline = flight.validatingAirlineCodes[0];

    const div = document.createElement("div");
    div.className = "flight-card";
    div.innerHTML = `
      <strong>${price} ${currency}</strong><br/>
      Aerolínea: ${airline}
    `;

    resultsDiv.appendChild(div);
  });
}
