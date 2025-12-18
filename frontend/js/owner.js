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
// Load Expenses (FROM AUDIT LOG)
// ==============================
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/audit-log");
    const result = await res.json();
    const expensesData = Array.isArray(result.data) ? result.data : [];

    // Filter only CREATE_EXPENSE actions
    const expenses = expensesData
      .filter(e => e.Action === "CREATE_EXPENSE")
      .map(e => {
        let projectID = null;
        let category = "";
        let notes = "";
        let amount = 0;

        try {
          // Extract ProjectID
          const pidMatch = e.Details.match(/ProjectID:(\d+)/);
          if (pidMatch) projectID = Number(pidMatch[1]);

          // Extract amount
          const amountMatch = e.Details.match(/\$(\d+(\.\d+)?)/);
          if (amountMatch) amount = Number(amountMatch[1]);

          // Extract category and notes
          const descMatch = e.Details.split("|");
          if (descMatch.length >= 2) {
            category = descMatch[0].replace(/^ProjectID:\d+\s*/,"").trim();
            notes = descMatch[1].trim();
          }
        } catch (err) {
          console.error("Expense parse error:", err, e.Details);
        }

        return {
          expenseID: e.LogID,
          projectID,
          amount,
          category,
          notes,
          dateRecorded: e.Timestamp
        };
      });

    populateExpensesTable(expenses);
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
    tbody.innerHTML = `<tr>
      <td colspan="6" style="text-align:center;">No expenses recorded</td>
    </tr>`;
    return;
  }

  data.forEach(exp => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.expenseID}</td>
      <td>${exp.projectID ?? ""}</td>
      <td>$${Number(exp.amount).toFixed(2)}</td>
      <td>${exp.category}</td>
      <td>${exp.notes}</td>
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
    tbody.innerHTML = `<tr>
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

