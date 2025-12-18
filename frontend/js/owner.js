// ==============================
// Logout
// ==============================
function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// ==============================
// Welcome Message
// ==============================
const userRole = sessionStorage.getItem("role") || "Owner";
document.getElementById("welcome").innerText = `Welcome, ${userRole}`;

// ==============================
// Fetch Dashboard Data
// ==============================
async function fetchDashboardData() {
  await loadProjects();
  await loadInvoices();
  await loadExpenses();
}

// ==============================
// Load Projects
// ==============================
async function loadProjects() {
  try {
    const res = await fetch("/api/data/projects");
    const result = await res.json();
    const projects = Array.isArray(result.data) ? result.data : [];
    populateGenericTable("projectsTable", projects);
  } catch (err) {
    console.error("Project load error:", err);
    alert("Error loading projects.");
  }
}

// ==============================
// Load Invoices
// ==============================
async function loadInvoices() {
  try {
    const res = await fetch("/api/data/");
    const result = await res.json();
    const invoices = Array.isArray(result.data.invoices) ? result.data.invoices : [];
    populateGenericTable("invoicesTable", invoices);
  } catch (err) {
    console.error("Invoice load error:", err);
    alert("Error loading invoices.");
  }
}

// ==============================
// Load Expenses (from Audit Log)
// ==============================
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/audit-log");
    const result = await res.json();
    const logs = Array.isArray(result.data) ? result.data : [];
    populateExpensesTable(logs);
  } catch (err) {
    console.error("Expense load error:", err);
    alert("Error loading expenses.");
  }
}

// ==============================
// Populate Expenses Table
// ==============================
function populateExpensesTable(data) {
  const tbody = document.getElementById("expensesTable").querySelector("tbody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">No expenses recorded</td>
      </tr>`;
    return;
  }

  data.forEach(e => {
    let expenseID = e.LogID;
    let projectID = null;
    let category = "";
    let notes = "";
    let amount = 0;
    let dateRecorded = new Date(e.Timestamp).toLocaleDateString();

    try {
      // Extract ProjectID
      const pidMatch = e.Details.match(/ProjectID:(\d+)/);
      if (pidMatch) projectID = Number(pidMatch[1]);

      // Extract Amount
      const amountMatch = e.Details.match(/\$(\d+(\.\d+)?)/);
      if (amountMatch) amount = Number(amountMatch[1]);

      // Get description portion
      let descPart = e.Details.replace(/ProjectID:\d+\s*\|\s*/, "").replace(/\s*\$\d+(\.\d+)?/, "").trim();

      // Split category and notes
      if (descPart.includes("|")) {
        [category, notes] = descPart.split("|").map(v => v.trim());
      } else {
        notes = descPart;
      }
    } catch (err) {
      console.error("Expense parse error:", err, e.Details);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${expenseID}</td>
      <td>${projectID ?? ""}</td>
      <td>$${amount.toFixed(2)}</td>
      <td>${category}</td>
      <td>${notes}</td>
      <td>${dateRecorded}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================
// Generic Table Renderer
// ==============================
function populateGenericTable(tableId, data) {
  const tbody = document.getElementById(tableId).querySelector("tbody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;">No data available</td>
      </tr>`;
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

// ==============================
// Table Filter
// ==============================
function filterTable(tableId, query) {
  const rows = document.getElementById(tableId).rows;
  query = query.toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    rows[i].style.display =
      rows[i].innerText.toLowerCase().includes(query) ? "" : "none";
  }
}

// ==============================
// Initial Load
// ==============================
fetchDashboardData();


