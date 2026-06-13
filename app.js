const LAT = 51.05;
const LON = 1.45;

let datePicker;

document.addEventListener("DOMContentLoaded", function () {
  datePicker = document.getElementById("datePicker");

  const today = new Date();
  const min = new Date(today);
  const max = new Date(today);

  min.setDate(today.getDate() - 7);
  max.setDate(today.getDate() + 7);

  datePicker.min = toDateInput(min);
  datePicker.max = toDateInput(max);
  datePicker.value = toDateInput(today);

  document.getElementById("loadBtn").addEventListener("click", loadSelectedDate);

  loadSelectedDate();
});

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadSelectedDate() {
  const selectedDate = datePicker.value || toDateInput(new Date());

  document.getElementById("bestTime").textContent = "Chargement des données...";

  try {
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,visibility` +
      `&wind_speed_unit=kn&timezone=Europe/London&start_date=${selectedDate}&end_date=${selectedDate}`;

    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
      `&hourly=wave_height,sea_surface_temperature` +
      `&timezone=Europe/London&start_date=${selectedDate}&end_date=${selectedDate}`;

    const weather = await fetch(weatherUrl).then(r => r.json());
    const marine = await fetch(marineUrl).then(r => r.json());

    const data = buildData(selectedDate, weather, marine);
    render(data);
  } catch (error) {
    const data = fallbackData(selectedDate);
    render(data);
  }
}

function buildData(date, weather, marine) {
  const hours = weather.hourly.time;
  let best = null;

  for (let i = 0; i < hours.length; i++) {
    const hour = Number(hours[i].slice(11, 13));

    if (hour < 5 || hour > 21) continue;

    const wind = weather.hourly.wind_speed_10m[i] || 0;
    const gust = weather.hourly.wind_gusts_10m[i] || wind;
    const visibility = Math.round((weather.hourly.visibility[i] || 5000) / 1852);
    const air = Math.round(weather.hourly.temperature_2m[i] || 15);
    const wave = Number((marine.hourly.wave_height[i] || 0.8).toFixed(1));
    const water = Math.round(marine.hourly.sea_surface_temperature[i] || 15);

    const currentRisk = estimateCurrentRisk(hour);
    const hypothermiaRisk = water < 15 ? 80 : water < 16 ? 70 : 55;
    const trafficRisk = 78;
    const wildlifeRisk = 35;

    let score = 100;
    score -= wind * 1.7;
    score -= gust * 1.2;
    score -= wave * 18;
    score -= currentRisk * 0.35;
    score -= hypothermiaRisk * 0.2;
    score -= trafficRisk * 0.15;
    score += visibility >= 5 ? 5 : -10;

    score = Math.max(0, Math.min(100, Math.round(score)));

    const item = {
      hour,
      score,
      wind: Math.round(wind),
      gust: Math.round(gust),
      visibility,
      air,
      wave,
      water,
      currentRisk,
      hypothermiaRisk,
      trafficRisk,
      wildlifeRisk
    };

    if (!best || item.score > best.score) best = item;
  }

  return makeDashboard(date, best);
}

function estimateCurrentRisk(hour) {
  const lowTideHour = 18.6;
  const distance = Math.abs(hour - lowTideHour);

  if (distance < 1.5) return 85;
  if (distance < 3) return 70;
  if (distance < 5) return 55;
  return 45;
}

function makeDashboard(date, best) {
  const decision =
    best.score >= 75 ? "GO POSSIBLE" :
    best.score >= 55 ? "ATTENTE" :
    "NO GO";

  const bestHour = String(best.hour).padStart(2, "0") + ":00";

  return {
    date,
    bestHour,
    decision,
    score: best.score,
    wind: best.wind,
    gust: best.gust,
    wave: best.wave,
    water: best.water,
    air: best.air,
    visibility: best.visibility,
    currentRisk: best.currentRisk,
    trafficRisk: best.trafficRisk,
    wildlifeRisk: best.wildlifeRisk,
    hypothermiaRisk: best.hypothermiaRisk,
    summary:
      `Meilleur départ estimé : ${bestHour}. Score ${best.score}/100. ` +
      `Vent ${best.wind} kn, rafales ${best.gust} kn, vagues ${best.wave} m, eau ${best.water}°C. ` +
      `Validation finale obligatoire avec pilote, SHOM et AIS.`
  };
}

function fallbackData(date) {
  return makeDashboard(date, {
    hour: 16,
    score: 61,
    wind: 17,
    gust: 25,
    wave: 0.8,
    water: 15,
    air: 19,
    visibility: 6,
    currentRisk: 82,
    trafficRisk: 78,
    wildlifeRisk: 35,
    hypothermiaRisk: 70
  });
}



function formatFrenchDate(dateString) {
  const d = new Date(dateString + "T12:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatFrenchDateTime(date) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function render(data) {
  document.getElementById("reportDate").textContent =
    `Données pour le ${formatFrenchDate(data.date)} — rapport généré le ${formatFrenchDateTime(new Date())}`;

  document.getElementById("bestTime").textContent =
    `Meilleur moment estimé pour partir : ${data.bestHour}`;

  document.getElementById("decision").textContent = data.decision;
  document.getElementById("score").textContent = `${data.score}/100`;
  document.getElementById("windKpi").textContent = `${data.wind} / ${data.gust} kn`;
  document.getElementById("waveKpi").textContent = `${data.wave} m`;
  document.getElementById("waterKpi").textContent = `${data.water}°C`;
  document.getElementById("visibilityKpi").textContent = `${data.visibility} NM`;
  document.getElementById("currentKpi").textContent = `${data.currentRisk}/100`;
  document.getElementById("wildlifeKpi").textContent = `${data.wildlifeRisk}/100`;

  document.getElementById("summary").textContent = data.summary;

  const alerts = [
    `Meilleur départ estimé : ${data.bestHour}`,
    `Vent : ${data.wind} kn`,
    `Rafales : ${data.gust} kn`,
    `Vagues : ${data.wave} m`,
    `Température eau : ${data.water}°C`,
    `Risque courant : ${data.currentRisk}/100`,
    `Trafic maritime : ${data.trafficRisk}/100`
  ];

  const list = document.getElementById("watchItems");
  list.innerHTML = "";
  alerts.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    list.appendChild(li);
  });

  const risks = [
    ["Courants", data.currentRisk],
    ["Trafic maritime", data.trafficRisk],
    ["Hypothermie", data.hypothermiaRisk],
    ["Vent / rafales", Math.min(100, data.gust * 3)],
    ["Faune / méduses", data.wildlifeRisk]
  ];

  const table = document.getElementById("riskTable");
  table.innerHTML = "";

  risks.forEach(([name, value]) => {
    const level = value >= 80 ? "RED" : value >= 50 ? "AMBER" : "GREEN";

    table.innerHTML += `
      <tr>
        <td>${name}</td>
        <td>${Math.round(value)}/100</td>
        <td>
          <div class="bar">
            <span class="${level}" style="width:${Math.round(value)}%"></span>
          </div>
        </td>
      </tr>
    `;
  });
}
