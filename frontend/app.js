const form = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");

const BACKEND_URL = "http://localhost:8000";


const alertForm = document.getElementById("alertForm");
const alertResult = document.getElementById("alertResult");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultsDiv.innerHTML = "⏳ Buscando vuelos...";

  const origin = document.getElementById("origin").value.trim().toUpperCase();
  const destination = document.getElementById("destination").value.trim().toUpperCase();
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

    if (data.error) {
      resultsDiv.innerHTML = `⚠️ Error de la API: ${data.error}`;
      return;
    }

    if (!Array.isArray(data)) {
      resultsDiv.innerHTML = "❌ Respuesta inesperada del servidor.";
      return;
    }

    renderResults(data);

  } catch (error) {
    console.error('Error:', error);
    resultsDiv.innerHTML = "❌ Error al conectar con el servidor";
  }
});

alertForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertResult.innerHTML = "⏳ Creando alerta...";

  const origin = document.getElementById("origin").value.trim().toUpperCase();
  const destination = document.getElementById("destination").value.trim().toUpperCase();
  const date = document.getElementById("date").value;
  const targetPrice = document.getElementById("targetPrice").value;
  const email = document.getElementById("email").value.trim();

  if (!origin || !destination || !date) {
    alertResult.innerHTML = "⚠️ Rellena primero los datos de búsqueda arriba (Origen, Destino, Fecha).";
    return;
  }

  const payload = {
    origin: origin,
    destination: destination,
    date: date,
    target_price: parseFloat(targetPrice),
    email: email
  };

  try {
    const response = await fetch(`${BACKEND_URL}/create-alert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Error creando alerta");

    const data = await response.json();
    alertResult.innerHTML = `✅ Alerta creada. ID: ${data.alert_id} (Guardada en S3)`;
    alertResult.style.color = "green";
  } catch (error) {
    console.error(error);
    alertResult.innerHTML = "❌ Fallo al crear la alerta.";
    alertResult.style.color = "red";
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
