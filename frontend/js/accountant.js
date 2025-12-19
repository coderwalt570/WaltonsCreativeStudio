// Logout
function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

document.getElementById("welcome").innerText = "Welcome, Accountant";

// Load dashboard
async function fetchAccountantData() {
  try {
    const res = await fetch("/api/data/accountant");
    if (!res.ok) throw new Error("Failed to load accountant data");

    const { data } = await res.json();

    loadInvoices(data.invoices);
    loadPayments(data.payments);
    buildExpenseSummary(data.expensesSummary);

  } catch (err) {
    console.error("Accountant dashboard error:", err);
    alert("Error loading accountant dashboard.");
  }
}

/* ---------------- INVOICES ---------------- */
function loadInvoices(invoices) {
  const tbody = document.querySelector("#invoicesTable tbody");
  tbody.innerHTML = "";

  if (!invoices.length) {
    tbody.innerHTML = `<tr><td colspan="5" align="center">No invoices found</td></tr>`;
    return;
  }

  invoices.forEach(i => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i.invoiceID}</td>
      <td>${i.projectID}</td>
      <td>$${i.amount}</td>
      <td>${new Date(i.dateIssued).toLocaleDateString()}</td>
      <td>${i.paymentStatus}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------------- PAYMENTS ---------------- */
function loadPayments(payments) {
  const tbody = document.querySelector("#paymentsTable tbody");
  tbody.innerHTML = "";

  if (!payments.length) {
    tbody.innerHTML = `<tr><td colspan="5" align="center">No payments found</td></tr>`;
    return;
  }

  payments.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.paymentID}</td>
      <td>${p.invoiceID}</td>
      <td>${p.method}</td>
      <td>$${p.totalAmount}</td>
      <td>${new Date(p.transactionDate).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------------- EXPENSE SUMMARY ---------------- */
function buildExpenseSummary(expenses) {
  const summary = {};

  expenses.forEach(e => {
    // Extract ProjectID + Amount from Details string
    const projectMatch = e.Details.match(/ProjectID:(\d+)/);
    const amountMatch = e.Details.match(/\$(\d+(\.\d+)?)/);

    if (!projectMatch || !amountMatch) return;

    const projectID = projectMatch[1];
    const amount = parseFloat(amountMatch[1]);

    if (!summary[projectID]) {
      summary[projectID] = { total: 0, count: 0 };
    }

    summary[projectID].total += amount;
    summary[projectID].count++;
  });

  const tbody = document.querySelector("#expenseSummaryTable tbody");
  tbody.innerHTML = "";

  if (!Object.keys(summary).length) {
    tbody.innerHTML = `<tr><td colspan="3" align="center">No expenses found</td></tr>`;
    return;
  }

  Object.entries(summary).forEach(([projectID, data]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${projectID}</td>
      <td>$${data.total.toFixed(2)}</td>
      <td>${data.count}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------------- FILTER ---------------- */
function filterTable(tableId, query) {
  const rows = document.getElementById(tableId).getElementsByTagName("tr");
  query = query.toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let match = false;

    for (let cell of cells) {
      if (cell.innerText.toLowerCase().includes(query)) {
        match = true;
        break;
      }
    }
    rows[i].style.display = match ? "" : "none";
  }
}

// Init
fetchAccountantData();


