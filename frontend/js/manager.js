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
const userRole = sessionStorage.getItem("role") || "Manager";
document.getElementById("welcome").innerText = `Welcome, ${userRole}`;

// ==============================
// Initial Load
// ==============================
fetchDashboardData();

async function fetchDashboardData() {
  await loadProjects();
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
// Save Expense
// ==============================
async function saveExpense(event) {
  event.preventDefault();

  const projectID = document.getElementById("projectID").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value;

  const description = `${category} | ${notes}`;

  try {
    const res = await fetch("/api/data/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectID, description, amount })
    });

    const result = await res.json();
    document.getElementById("expenseMessage").innerText = result.message || "Expense saved successfully.";

    document.getElementById("expenseForm").reset();
    await loadExpenses();
  } catch (err) {
    console.error("Save expense error:", err);
    alert("Error saving expense.");
  }
}

// ==============================
// Load Expenses
// ==============================
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/expenses");
    const result = await res.json();
    const expenses = Array.isArray(result.data) ? result.data : [];
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
  const tbody = document.querySelector("#expensesTable tbody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No expenses recorded</td></tr>`;
    return;
  }

  data.forEach(exp => {
    let category = "";
    let notes = "";

    if (exp.description?.includes("|")) {
      [category, notes] = exp.description.split("|").map(v => v.trim());
    } else {
      notes = exp.description || "";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.expenseID}</td>
      <td>${exp.projectID ?? ""}</td>
      <td>$${Number(exp.amount).toFixed(2)}</td>
      <td>${category}</td>
      <td>${notes}</td>
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
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">No data available</td></tr>`;
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
    rows[i].style.display = rows[i].innerText.toLowerCase().includes(query) ? "" : "none";
  }
}
