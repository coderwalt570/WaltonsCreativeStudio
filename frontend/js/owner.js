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
    const res = await fetch("/api/data/");
    const result = await res.json();
    populateGenericTable("projectsTable", result.data.projects || []);
  } catch (err) {
    console.error("Project load error:", err);
  }
}

// ==============================
// Load Invoices
// ==============================
async function loadInvoices() {
  try {
    const res = await fetch("/api/data/");
    const result = await res.json();
    populateGenericTable("invoicesTable", result.data.invoices || []);
  } catch (err) {
    console.error("Invoice load error:", err);
  }
}

// ==============================
// Load Expenses (✔ FIXED)
// ==============================
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/expenses");
    const result = await res.json();
    populateExpensesTable(result.data || []);
  } catch (err) {
    console.error("Expense load error:", err);
    alert("Error loading expenses.");
  }
}

// ==============================
// Populate Expenses Table (OWNER SAFE)
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

  data.forEach(exp => {
    let projectID = "";
    let category = "";
    let notes = "";
    let amount = "";

    if (exp.Details) {
      const projMatch = exp.Details.match(/ProjectID:(\d+)/);
      projectID = projMatch ? projMatch[1] : "";

      const parts = exp.Details.split("|").map(p => p.trim());
      category = parts[1] || "";
      notes = parts[2]?.replace(/\$/g, "") || "";

      const amtMatch = exp.Details.match(/\$([\d.]+)/);
      amount = amtMatch ? parseFloat(amtMatch[1]).toFixed(2) : "";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.expenseID}</td>
      <td>${projectID}</td>
      <td>${category}</td>
      <td>${notes}</td>
      <td>$${amount}</td>
      <td>${new Date(exp.dateRecorded).toLocaleDateString()}</td>
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
// Initial Load
// ==============================
fetchDashboardData();

