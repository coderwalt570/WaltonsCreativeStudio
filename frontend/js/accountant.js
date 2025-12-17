function logout() {
  sessionStorage.clear();
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

document.getElementById("welcome").innerText = "Welcome, Accountant";

async function fetchAccountantData() {
  try {
    const res = await fetch("/api/data/accountant");
    const { data } = await res.json();

    populateTable("invoicesTable", data.invoices);
    populateTable("paymentsTable", data.payments);
  } catch (err) {
    console.error("Accountant dashboard error:", err);
  }
}

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

fetchAccountantData();

