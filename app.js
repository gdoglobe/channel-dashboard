const LAT = 51.05;
const LON = 1.45;

const datePicker = document.getElementById("datePicker");

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function setupDateLimit() {
  const today = new Date();
  const min = new Date(today);
  const max = new Date(today);

  min.setDate(today.getDate() - 7);
  max.setDate(today.getDate() + 7);

  datePicker.min = formatDate(min);
  datePicker.max = formatDate(max);
  datePicker.value = formatDate(today);
}

async function loadSelectedDate() {
  const date = datePicker.value;

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&longitude=${LON}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,visibility` +
    `&wind_speed_unit=kn&timezone=Europe/London&start_date=${date}&end_date=${date}`;

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
    `&hourly=wave_height,wave_period,sea_surface_temperature` +
    `&timezone=Europe/London&start_date=${date}&end_date=${date}`;

  const weather = await fetch(weatherUrl).then(r => r.json());
  const marine = await fetch(marineUrl).then(r => r.json());

  const data = buildDashboardData(date, weather, marine);
  render(data);
}

function buildDashboardData(date, weather, marine) {
  const hours = weather.hourly.time;
  const scores = [];

  for (let i = 0; i < hours.length; i++) {
    const hour = Number(hours[i].split("T")[1].split(":")[0]);

    if (hour < 5 || hour > 20) continue;

    const wind = weather.hourly.wind_speed_10m[i] || 0;
    const gust = weather.hourly.wind_gusts_10m[i] || 0;
    const visibility = (weather.hourly.visibility[i] || 0) / 1852;
    const wave = marine.hourly.wave_height[i] || 0;
    const water = marine.hourly.sea_surface_temperature[i] || 15;

    let score = 100;
    score -= wind * 2;
    score -= gust * 1.5;
    score -= wave * 25;
    score -= water < 15 ? 15 : 0;
    score += visibility > 4 ? 8 : -10;

    const tideRisk = estimateTideRisk(date, hour);
    score -= tideRisk;

    scores.push({
      hour,
      score: Math.round(score),
      wind,
      gust,
      wave,
      visibility,
      water,
      tideRisk
    });
  }

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  const decision =
    best.score >= 75 ? "GO POSSIBLE" :
    best.score >= 55 ? "ATTENTE" :
    "NO GO";

  return {
    mission: {
      name: "Marc PLACES Manche Indicator",
      report_for_date: date,
      report_for_time: "journée complète",
      last_updated: new Date().toISOString(),
      decision_score: best.score,
      status: decision
    },
    kpis: {
      decision,
      score: best.score,
      wind_knots: Math.round(best.wind),
      gusts_knots: Math.round(best.gust),
      sea_state_m: Number(best.wave.toFixed(1)),
      visibility_nm: Math.round(best.visibility),
      water_temp_c: Math.round(best.water),
      air_temp_c: Math.round(weather.hourly.temperature_2m[best.hour]),
      tide_phase: "estimée",
      next_low_tide: "à confirmer SHOM",
      current_risk: best.tideRisk,
      traffic_risk: 78,
      wildlife_risk: 35,
      hypothermia_risk: best.water < 15 ? 75 : 60
    },
    executive_decision: {
      recommendation: decision,
      summary: `Meilleur créneau estimé : ${String(best.hour).padStart(2, "0")}:00. Score ${best.score}/100. Validation obligatoire par le pilote avec SHOM, trafic AIS et bulletin marine officiel.`
    },
    alerts: [
      `Meilleur départ estimé : ${String(best.hour).padStart(2, "0")}:00`,
      `Vent : ${Math.round(best.wind)} kn`,
      `Rafales : ${Math.round(best.gust)} kn`,
      `Vagues : ${best.wave.toFixed(1)} m`,
      `Température eau : ${Math.round(best.water)}°C`,
      "Courants et marées à confirmer avec SHOM/pilote"
    ],
    risk_matrix: [
      { risk: "Courants", value: best.tideRisk, level: best.tideRisk > 70 ? "RED" : "AMBER" },
      { risk: "Trafic maritime", value: 78, level: "AMBER" },
      { risk: "Hypothermie", value: best.water < 15 ? 75 : 60, level: "AMBER" },
      { risk: "Vent / rafales", value: Math.min(100, Math.round(best.gust * 3)), level: best.gust > 25 ? "RED" : "AMBER" },
      { risk: "Faune / méduses", value: 35, level: "GREEN" }
    ]
  };
}

function estimateTideRisk(date, hour) {
  const referenceLow = 18.6;
  const selected = new Date(date);
  const ref = new Date("2026-06-13");
  const diffDays = Math.round((selected - ref) / 86400000);
  const estimatedLow = (referenceLow + diffDays * 0.83) % 24;

  const distance = Math.abs(hour - estimatedLow);

  if (distance < 1.5) return 85;
  if (distance < 3) return 65;
  return 45;
}

function render(data) {
  const k = data.kpis;

  document.getElementById("reportDate").textContent =
    `Données pour le ${data.mission.report_for_date} — mise à jour : ${data.mission.last_updated}`;

  document.getElementById("bestTime").textContent =
    data.executive_decision.summary;

  document.getElementById("decision").textContent = k.decision;
  document.getElementById("score").textContent = `${k.score}/100`;
  document.getElementById("windKpi").textContent = `${k.wind_knots} kn / ${k.gusts_knots} kn`;
  document.getElementById("tideKpi").textContent = `${k.tide_phase}`;
  document.getElementById("wildlifeKpi").textContent = `${k.wildlife_risk}/100`;

  document.getElementById("summary").innerHTML =
    `<div class="bigDecision">${data.executive_decision.recommendation}</div><p>${data.executive_decision.summary}</p>`;

  document.getElementById("weather").innerHTML =
    `<div class="numbers">
      <div><strong>${k.air_temp_c}°C</strong><span>Air</span></div>
      <div><strong>${k.water_temp_c}°C</strong><span>Eau</span></div>
      <div><strong>${k.wind_knots} kn</strong><span>Vent</span></div>
      <div><strong>${k.gusts_knots} kn</strong><span>Rafales</span></div>
      <div><strong>${k.sea_state_m} m</strong><span>Vagues</span></div>
      <div><strong>${k.visibility_nm} NM</strong><span>Visibilité</span></div>
    </div>`;

  document.getElementById("tides").innerHTML =
    `<div class="numbers">
      <div><strong>${k.tide_phase}</strong><span>Marée</span></div>
      <div><strong>${k.current_risk}/100</strong><span>Risque courant</span></div>
      <div><strong>${k.next_low_tide}</strong><span>Basse mer</span></div>
    </div>`;

  document.getElementById("wildlife").innerHTML =
    `<div class="numbers">
      <div><strong>${k.wildlife_risk}/100</strong><span>Faune</span></div>
      <div><strong>${k.hypothermia_risk}/100</strong><span>Hypothermie</span></div>
      <div><strong>${k.traffic_risk}/100</strong><span>Trafic</span></div>
    </div>`;

  const watch = document.getElementById("watchItems");
  watch.innerHTML = "";
  data.alerts.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a;
    watch.appendChild(li);
  });

  const table = document.getElementById("riskTable");
  table.innerHTML = "";
  data.risk_matrix.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.risk}</td>
        <td>${r.value}/100</td>
        <td><div class="bar"><span class="${r.level}" style="width:${r.value}%"></span></div></td>
        <td class="${r.level}">${r.level}</td>
      </tr>
    `;
  });
}

setupDateLimit();
loadSelectedDate();
