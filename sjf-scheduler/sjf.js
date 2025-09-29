// ===== GLOBAL =====
let processList = [];

// ===== HANDLE INPUT MANUAL =====
function addProcess() {
  const name = document.getElementById("pname").value;
  const burst = parseInt(document.getElementById("burst").value);
  const arrival = parseInt(document.getElementById("arrival").value);

  if (!name || isNaN(burst) || isNaN(arrival)) {
    alert("Isi semua data proses!");
    return;
  }

  processList.push({ name, burst, arrival });
  renderTable();
  clearInputs();
}

function clearInputs() {
  document.getElementById("pname").value = "";
  document.getElementById("burst").value = "";
  document.getElementById("arrival").value = "";
}

function resetProcesses() {
  processList = [];
  renderTable();
  document.getElementById("result").innerHTML = "";
  destroyCharts();
}

// ===== HANDLE INPUT DARI EXCEL =====
function handleExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    // Format Excel harus ada kolom: Process, Burst, Arrival
    processList = json.map(row => ({
      name: row.Process || `P${Math.floor(Math.random() * 100)}`,
      burst: parseInt(row.Burst),
      arrival: parseInt(row.Arrival)
    }));

    renderTable();
  };
  reader.readAsArrayBuffer(file);
}

// ===== RENDER TABEL =====
function renderTable() {
  const tbody = document.getElementById("processTableBody");
  tbody.innerHTML = "";
  processList.forEach((p, i) => {
    const row = `<tr>
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.burst}</td>
      <td>${p.arrival}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// ===== SIMULASI SJF =====
function runSJF() {
  if (processList.length === 0) {
    alert("Tambahkan proses dulu!");
    return;
  }

  let time = 0;
  let completed = [];
  let waiting = [];
  let tat = [];
  let gantt = [];

  let processes = [...processList].map(p => ({ ...p, remaining: p.burst }));

  while (completed.length < processes.length) {
    let available = processes.filter(p => p.arrival <= time && !completed.includes(p));

    if (available.length === 0) {
      time++;
      continue;
    }

    available.sort((a, b) => a.remaining - b.remaining);
    let current = available[0];

    gantt.push({ name: current.name, start: time, end: time + current.remaining });
    time += current.remaining;

    let turnaround = time - current.arrival;
    let wait = turnaround - current.burst;

    tat.push(turnaround);
    waiting.push(wait);
    completed.push(current);
  }

  const avgTAT = (tat.reduce((a, b) => a + b, 0) / tat.length).toFixed(2);
  const avgWT = (waiting.reduce((a, b) => a + b, 0) / waiting.length).toFixed(2);

  renderResultTable(completed, waiting, tat, avgWT, avgTAT);
  renderCharts(gantt, waiting, tat);
}

// ===== RENDER HASIL =====
function renderResultTable(completed, waiting, tat, avgWT, avgTAT) {
  let html = `
    <h2>Hasil Simulasi</h2>
    <table border="1">
      <tr>
        <th>Proses</th>
        <th>Burst Time</th>
        <th>Arrival Time</th>
        <th>Waiting Time</th>
        <th>Turnaround Time</th>
      </tr>
  `;

  completed.forEach((p, i) => {
    html += `
      <tr>
        <td>${p.name}</td>
        <td>${p.burst}</td>
        <td>${p.arrival}</td>
        <td>${waiting[i]}</td>
        <td>${tat[i]}</td>
      </tr>
    `;
  });

  html += `</table>
    <p><b>Rata-rata Waiting Time:</b> ${avgWT}</p>
    <p><b>Rata-rata Turnaround Time:</b> ${avgTAT}</p>
  `;

  document.getElementById("result").innerHTML = html;
}

// ===== CHART =====
let chart1, chart2;

function renderCharts(gantt, waiting, tat) {
  destroyCharts();

  const ctx1 = document.getElementById("ganttChart").getContext("2d");
  chart1 = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: gantt.map(g => g.name),
      datasets: [{
        label: "Durasi Proses (Gantt)",
        data: gantt.map(g => g.end - g.start),
        backgroundColor: "#00c6ff"
      }]
    }
  });

  const ctx2 = document.getElementById("waitingChart").getContext("2d");
  chart2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: processList.map(p => p.name),
      datasets: [
        {
          label: "Waiting Time",
          data: waiting,
          backgroundColor: "#ff512f"
        },
        {
          label: "Turnaround Time",
          data: tat,
          backgroundColor: "#43e97b"
        }
      ]
    }
  });
}

function destroyCharts() {
  if (chart1) chart1.destroy();
  if (chart2) chart2.destroy();
}
