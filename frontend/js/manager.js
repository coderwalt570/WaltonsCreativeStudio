// Logout function
function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Welcome message
const userRole = sessionStorage.getItem("role") || "Manager";
document.getElementById("welcome").innerText = `Welcome, ${userRole}!`;

// Fetch Projects
async function fetchDashboardData() {
  try {
    const res = await fetch("/api/data/projects");
    const { data } = await res.json();
    populateTable("projectsTable", data || []);
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    alert("Error loading dashboard data.");
  }
}

// Fetch Expenses (from AuditLog)
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/expenses");
    const { data } = await res.json();
    populateTable("expensesTable", data || []);
  } catch (err) {
    console.error("Expense load error:", err);
    alert("Error loading expenses.");
  }
}

// Save Expense (POST to /expenses)
async function saveExpense(event) {
  event.preventDefault();

  const projectID = document.getElementById("projectID").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const notes = document.getElementById("notes").value;

  try {
    const res = await fetch("/api/data/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectID, amount, category, notes })
    });

    const data = await res.json();
    document.getElementById("expenseMessage").innerText = data.message;

    // Clear form
    document.getElementById("expenseForm").reset();

    // Refresh table
    loadExpenses();
  } catch (err) {
    console.error("Save expense error:", err);
    alert("Error saving expense.");
  }
}

// Populate Table
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

// Table Filter
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

// Initial Load
fetchDashboardData();
loadExpenses();



