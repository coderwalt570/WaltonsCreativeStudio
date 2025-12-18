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
// Fetch Dashboard Data
// ==============================
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
    populateTable("projectsTable", projects);
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

  try {
    const res = await fetch("/api/data/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectID,
        description: `${category} - ${notes}`,
        amount
      })
    });

    const result = await res.json();
    document.getElementById("expenseMessage").innerText =
      result.message || "Expense saved.";

    await loadExpenses(); // refresh table
    document.getElementById("expenseForm").reset();
  } catch (err) {
    console.error("Save expense error:", err);
    alert("Error saving expense.");
  }
}

// ==============================
// Load Expenses (FROM AUDIT LOG)
// ==============================
async function loadExpenses() {
  try {
    const res = await fetch("/api/data/expenses");
    const result = await res.json();

    const expenses = Array.isArray(result.data) ? result.data : [];
    populateTable("expensesTable", expenses);
  } catch (err) {
    console.error("Expense load error:", err);
    alert("Error loading expenses.");
  }
}

// ==============================
// Populate Table
// ==============================
function populateTable(tableId, data) {
  const tbody = document.getElementById(tableId).querySelector("tbody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = document.getElementById(tableId).querySelectorAll("th").length;
    td.innerText = "No data available";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");

    // ✅ SPECIAL HANDLING FOR EXPENSES (AuditLog parsing)
    if (tableId === "expensesTable" && row.Details) {
      const parts = row.Details.split("|").map(p => p.trim());

      const projectID = parts[0]?.replace("ProjectID:", "") || "";
      const description = parts[1] || "";
      const amount = parts[2]?.replace("$", "") || "";

      tr.innerHTML = `
        <td>${row.expenseID}</td>
        <td>${projectID}</td>
        <td>${amount}</td>
        <td>${description}</td>
        <td>${row.dateRecorded}</td>
      `;
    } else {
      Object.values(row).forEach(val => {
        const td = document.createElement("td");
        td.innerText = val ?? "";
        tr.appendChild(td);
      });
    }

    tbody.appendChild(tr);
  });
}

// ==============================
// Table Filter
// ==============================
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

// ==============================
// Initial Load
// ==============================
fetchDashboardData();
