fetch("data.json")
  .then(r => r.json())
  .then(data => {
    const k = data.kpis;

    document.getElementById("reportDate").textContent =
      `Données pour le ${data.mission.report_for_date} à ${data.mission.report_for_time} — mise à jour : ${data.mission.last_updated}`;

    document.getElementById("decision").textContent = k.decision;
    document.getElementById("score").textContent = `${k.score}/100`;

    document.getElementById("windKpi").textContent = `${k.wind_knots} kn / ${k.gusts_knots} kn`;
    document.getElementById("tideKpi").textContent = `${k.tide_phase} · BM ${k.next_low_tide}`;
    document.getElementById("wildlifeKpi").textContent = `${k.wildlife_risk}/100`;

    document.getElementById("summary").innerHTML = `
      <div class="bigDecision">${data.executive_decision.recommendation}</div>
      <p>${data.executive_decision.summary}</p>
    `;

    document.getElementById("weather").innerHTML = `
      <div class="numbers">
        <div><strong>${k.air_temp_c}°C</strong><span>Air</span></div>
        <div><strong>${k.water_temp_c}°C</strong><span>Eau</span></div>
        <div><strong>${k.wind_knots} kn</strong><span>Vent</span></div>
        <div><strong>${k.gusts_knots} kn</strong><span>Rafales</span></div>
        <div><strong>${k.sea_state_m} m</strong><span>Mer</span></div>
        <div><strong>${k.visibility_nm} NM</strong><span>Visibilité</span></div>
      </div>
    `;

    document.getElementById("tides").innerHTML = `
      <div class="numbers">
        <div><strong>${k.tide_phase}</strong><span>Phase</span></div>
        <div><strong>${k.next_low_tide}</strong><span>Basse mer</span></div>
        <div><strong>${k.current_risk}/100</strong><span>Risque courant</span></div>
      </div>
    `;

    document.getElementById("wildlife").innerHTML = `
      <div class="numbers">
        <div><strong>${k.wildlife_risk}/100</strong><span>Faune</span></div>
        <div><strong>${k.hypothermia_risk}/100</strong><span>Hypothermie</span></div>
        <div><strong>${k.traffic_risk}/100</strong><span>Trafic</span></div>
      </div>
    `;

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
  });
