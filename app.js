let dashboardData = null;

async function loadData() {
  const saved = localStorage.getItem("dashboardData");

  if (saved) {
    dashboardData = JSON.parse(saved);
  } else {
    const response = await fetch("data.json");
    dashboardData = await response.json();
  }

  renderDashboard();
}

function renderDashboard() {
  const data = dashboardData;

  document.getElementById("decision").textContent =
    data.executive_decision.recommendation;

  document.getElementById("score").textContent =
    data.mission.decision_score + "/100";

  document.getElementById("route").textContent =
    data.mission.route;

  document.getElementById("date").textContent =
    "Départ prévu : " + data.mission.planned_departure_local +
    " | Mise à jour : " + data.mission.last_updated;

  document.getElementById("summary").textContent =
    data.executive_decision.summary;

  document.getElementById("weather").textContent =
    data.weather.calais_marine.wind +
    " | Rafales : " + data.weather.calais_marine.gusts_knots + " kn" +
    " | Mer : " + data.weather.calais_marine.sea_state +
    " | Visibilité : " + data.weather.calais_marine.visibility;

  document.getElementById("wildlife").textContent =
    "Niveau global : " + data.wildlife_risk.overall +
    " | Méduses : " + data.wildlife_risk.jellyfish.risk_level +
    " | Physalie : " + data.wildlife_risk.portuguese_man_o_war.risk_level;

  const list = document.getElementById("watchItems");
  list.innerHTML = "";
  data.executive_decision.watch_items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  const table = document.getElementById("riskTable");
  table.innerHTML = "";
  data.risk_matrix.forEach(risk => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${risk.risk}</td>
      <td>${risk.probability}</td>
      <td>${risk.impact}</td>
      <td class="${risk.level}">${risk.level}</td>
    `;
    table.appendChild(row);
  });

  document.getElementById("jsonEditor").value =
    JSON.stringify(data, null, 2);
}

function updateFromForm() {
  try {
    const newData = JSON.parse(document.getElementById("jsonEditor").value);
    dashboardData = newData;
    localStorage.setItem("dashboardData", JSON.stringify(newData));
    renderDashboard();
    alert("Dashboard mis à jour.");
  } catch (e) {
    alert("Erreur : JSON invalide.");
  }
}

function resetData() {
  localStorage.removeItem("dashboardData");
  location.reload();
}

function downloadJSON() {
  const blob = new Blob(
    [JSON.stringify(dashboardData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "marc-planche-manche-indikator.json";
  a.click();
  URL.revokeObjectURL(url);
}

loadData();
