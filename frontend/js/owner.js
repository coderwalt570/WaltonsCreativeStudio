function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

document.getElementById("welcome").innerText = `Welcome, Owner`;

async function fetchOwnerData() {
  try {
    const res = await fetch("/api/data");
    const { data } = await res.json();
    populateTable("projectsTable", data.projects || []);
    populateTable("invoicesTable", data.invoices || []);
  } catch (err) {
    console.error("Owner dashboard load error:", err);
    alert("Error loading dashboard data.");
  }

  // Load audit log
  loadAuditLog();
}

async function loadAuditLog() {
  try {
    const res = await fetch("/api/data/audit-log");
    const { data } = await res.json();
    populateTable("auditLogTable", data || []);
  } catch (err) {
    console.error("Audit log load error:", err);
    alert("Error loading audit log.");
  }
}

function populateTable(tableId, data) {
  const tbody = document.getElementById(tableId).querySelector("tbody");
  tbody.innerHTML = "";
  if (!data || data.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = document.getElementById(tableId).querySelectorAll("th").length;
    td.style.textAlign = "center";
    td.innerText = "No data available";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");
    Object.values(row).forEach(val => {
      const td = document.createElement("td");
      td.innerText = val ?? "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function filterTable(tableId, query) {
  const rows = document.getElementById(tableId).getElementsByTagName("tr");
  query = query.toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let match = false;
    for (let j = 0; j < cells.length; j++) {
      if (cells[j].innerText.toLowerCase().includes(query)) {
        match = true;
        break;
      }
    }
    rows[i].style.display = match ? "" : "none";
  }
}

// Initial load
fetchOwnerData();


