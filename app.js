fetch("data.json")
  .then(response => response.json())
  .then(data => {
    document.getElementById("decision").textContent =
      data.executive_decision.recommendation;

    document.getElementById("score").textContent =
      data.mission.decision_score + "/100";

    document.getElementById("summary").textContent =
      data.executive_decision.summary;

    document.getElementById("weather").textContent =
      data.weather.calais_marine.wind + " | Mer : " +
      data.weather.calais_marine.sea_state + " | Visibilité : " +
      data.weather.calais_marine.visibility;

    document.getElementById("wildlife").textContent =
      "Niveau global : " + data.wildlife_risk.overall;

    const list = document.getElementById("watchItems");
    data.executive_decision.watch_items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });

    const table = document.getElementById("riskTable");
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
  });
