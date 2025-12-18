import express from "express";
import { executeQuery, sql } from "../utils/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------- PROJECTS ---------------------- */
router.get("/projects", requireAuth, async (req, res) => {
  try {
    const projects = await executeQuery(`
      SELECT projectID, clientID, description, dueDate, status
      FROM Project
    `);
    res.json({ data: projects });
  } catch (err) {
    console.error("Projects Error:", err);
    res.status(500).json({ message: "Server error loading projects" });
  }
});

/* ---------------------- OWNER DASHBOARD ---------------------- */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { role } = req.session.user;
    if (role.toLowerCase() !== "owner") {
      return res.status(403).json({ message: "Owners only" });
    }

    const projects = await executeQuery(`
      SELECT projectID, clientID, description, dueDate, status
      FROM Project
    `);

    const invoices = await executeQuery(`
      SELECT invoiceID, projectID, amount, dateIssued, paymentStatus
      FROM Invoice
    `);

    res.json({ data: { projects, invoices } });
  } catch (err) {
    console.error("Owner Dashboard Error:", err);
    res.status(500).json({ message: "Server error loading owner dashboard" });
  }
});

/* ---------------------- EXPENSES (OWNER + MANAGER) ---------------------- */
router.get("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  const userRole = role.toLowerCase();

  try {
    let query = `
      SELECT LogID AS expenseID, UserID, Details, Timestamp AS dateRecorded
      FROM AuditLog
      WHERE Action = 'CREATE_EXPENSE'
    `;
    const params = [];

    if (userRole === "manager") {
      query += " AND UserID = @id";
      params.push({ name: "id", type: sql.Int, value: id });
    }

    if (userRole !== "owner" && userRole !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    query += " ORDER BY Timestamp DESC";

    const rawExpenses = await executeQuery(query, params);

    // Parse Details into structured fields
    const expenses = rawExpenses.map(exp => {
      let projectID = "";
      let category = "";
      let notes = "";
      let amount = "";

      if (exp.Details) {
        const projMatch = exp.Details.match(/ProjectID:(\d+)/);
        projectID = projMatch ? projMatch[1] : "";

        const parts = exp.Details.split("|");
        if (parts.length >= 2) category = parts[1].trim();
        if (parts.length >= 3) notes = parts[2].replace(/\$/g, "").trim();

        const amtMatch = exp.Details.match(/\$([\d.]+)/);
        amount = amtMatch ? parseFloat(amtMatch[1]).toFixed(2) : "";
      }

      return {
        expenseID: exp.expenseID,
        userID: exp.UserID,
        projectID,
        description: category,
        notes,
        amount,
        dateRecorded: exp.dateRecorded
      };
    });

    res.json({ data: expenses });
  } catch (err) {
    console.error("Expense Fetch Error:", err);
    res.status(500).json({ message: "Server error loading expenses" });
  }
});

/* ---------------------- MANAGER: ADD EXPENSE ---------------------- */
router.post("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  if (role.toLowerCase() !== "manager") {
    return res.status(403).json({ message: "Managers only" });
  }

  const { description, amount, projectID } = req.body;

  try {
    const details = `ProjectID:${projectID} | ${description} | $${amount}`;

    await executeQuery(
      `INSERT INTO AuditLog (UserID, Action, Details, Timestamp)
       VALUES (@id, 'CREATE_EXPENSE', @details, GETDATE())`,
      [
        { name: "id", type: sql.Int, value: id },
        { name: "details", type: sql.NVarChar, value: details }
      ]
    );

    res.json({ success: true, message: "Expense recorded successfully" });
  } catch (err) {
    console.error("Expense Audit Error:", err);
    res.status(500).json({ message: "Server error recording expense" });
  }
});

/* ---------------------- ACCOUNTANT DASHBOARD ---------------------- */
router.get("/accountant", requireAuth, async (req, res) => {
  const { role } = req.session.user;
  if (role.toLowerCase() !== "accountant") {
    return res.status(403).json({ message: "Accountants only" });
  }

  try {
    const invoices = await executeQuery(`
      SELECT invoiceID, projectID, amount, dateIssued, paymentStatus
      FROM Invoice
    `);

    const payments = await executeQuery(`
      SELECT paymentID, invoiceID, method, totalAmount, transactionDate
      FROM Payment
    `);

    res.json({ data: { invoices, payments } });
  } catch (err) {
    console.error("Accountant Dashboard Error:", err);
    res.status(500).json({ message: "Server error loading accountant dashboard" });
  }
});

export default router;
