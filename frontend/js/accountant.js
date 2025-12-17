// Logout function
function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Welcome message
document.getElementById("welcome").innerText = "Welcome, Accountant";

// Fetch Invoices and Payments
async function fetchAccountantData() {
  try {
    const res = await fetch("/api/data/accountant");
    const { data } = await res.json();

    populateTable("invoicesTable", data.invoices);
    populateTable("paymentsTable", data.payments);
  } catch (err) {
    console.error("Accountant dashboard error:", err);
    alert("Error loading dashboard data.");
  }
}

// Fetch Expense Summary
async function loadExpenseSummary() {
  try {
    const res = await fetch("/api/data/expenses-summary");
    const { data } = await res.json();
    populateTable("expenseSummaryTable", data || []);
  } catch (err) {
    console.error("Expense summary load error:", err);
    alert("Error loading expense summary.");
  }
}

// Populate table helper
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

// Table filter
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
fetchAccountantData();
loadExpenseSummary();


