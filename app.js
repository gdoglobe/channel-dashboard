fetch("data.json")
  .then(r => r.json())
  .then(data => {
    document.getElementById("decision").textContent = data.executive_decision.recommendation;
    document.getElementById("score").textContent = data.mission.decision_score + "/100";

    document.getElementById("reportDate").textContent =
      "Données pour le " + data.mission.report_for_date +
      " à " + data.mission.report_for_time +
      " — mise à jour : " + data.mission.last_updated;

    document.getElementById("windKpi").textContent =
      data.weather.calais_marine.wind_short;

    document.getElementById("tideKpi").textContent =
      data.tides.calais.current_phase;

    document.getElementById("wildlifeKpi").textContent =
      data.wildlife_risk.overall;

    document.getElementById("summary").textContent =
      data.executive_decision.summary;

    document.getElementById("weather").textContent =
      data.weather.calais_marine.details;

    document.getElementById("tides").textContent =
      data.tides.calais.comment;

    document.getElementById("wildlife").textContent =
      data.wildlife_risk.comment;

    const watchList = document.getElementById("watchItems");
    data.executive_decision.watch_items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      watchList.appendChild(li);
    });

    const table = document.getElementById("riskTable");
    data.risk_matrix.forEach(risk => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${risk.risk}</td>
        <td>${risk.probability}</td>
        <td>${risk.impact}</td>
        <td class="${risk.level}">${risk.level}</td>
      `;
      table.appendChild(tr);
    });

    const sources = document.getElementById("sources");
    data.sources.forEach(source => {
      const li = document.createElement("li");
      li.textContent = source.name + " — " + source.note;
      sources.appendChild(li);
    });
  });
