// Logout
function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Welcome
const userRole = sessionStorage.getItem("role") || "Manager";
document.getElementById("welcome").innerText = `Welcome, ${userRole}!`;

/* ---------------- FETCH PROJECTS ---------------- */
async function fetchDashboardData() {
  try {
    const res = await fetch("/api/data/projects");
    const { data } = await res.json();

    populateTable("projectsTable", Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Dashboard fetch error:", err);
  }
}

/* ---------------- FETCH EXPENSES ---------------- */
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/expenses");
    const { data } = await res.json();

    populateTable("expensesTable", Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Expense load error:", err);
  }
}

/* ---------------- ADD EXPENSE ---------------- */
async function addExpense() {
  const description = document.getElementById("expDesc").value;
  const amount = document.getElementById("expAmount").value;

  if (!description || !amount) {
    return alert("Please enter all expense details.");
  }

  const res = await fetch("/api/data/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, amount })
  });

  const data = await res.json();
  alert(data.message);

  loadExpenses();
}

/* ---------------- POPULATE TABLE ---------------- */
function populateTable(tableId, data) {
  const tbody = document.getElementById(tableId).querySelector("tbody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
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

/* ---------------- INITIAL LOAD ---------------- */
fetchDashboardData();
loadExpenses();



