import express from "express";
import { executeQuery, sql } from "../utils/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------- PROJECTS (Owner + Manager) ---------------------- */
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
      return res.status(403).json({ message: "Access denied: Owners only" });
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

/* ---------------------- ACCOUNTANT DASHBOARD ---------------------- */
router.get("/accountant", requireAuth, async (req, res) => {
  try {
    const { role } = req.session.user;

    if (role.toLowerCase() !== "accountant") {
      return res.status(403).json({ message: "Access denied: Accountants only" });
    }

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

/* ---------------------- MANAGER: ADD EXPENSE + AUDIT ---------------------- */
router.post("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;

  if (role.toLowerCase() !== "manager") {
    return res.status(403).json({ message: "Access denied: Managers only" });
  }

  const { description, amount } = req.body;

  try {
    // Insert expense
    const result = await executeQuery(
      `
      INSERT INTO Expense (managerID, description, amount, dateRecorded)
      OUTPUT INSERTED.expenseID
      VALUES (@id, @description, @amount, GETDATE())
      `,
      [
        { name: "id", type: sql.Int, value: id },
        { name: "description", type: sql.VarChar, value: description },
        { name: "amount", type: sql.Decimal(10, 2), value: amount }
      ]
    );

    const expenseID = result[0].expenseID;

    // Audit log
    await executeQuery(
      `
      INSERT INTO AuditLog (userID, action, entity, entityID)
      VALUES (@id, 'CREATE', 'Expense', @expenseID)
      `,
      [
        { name: "id", type: sql.Int, value: id },
        { name: "expenseID", type: sql.Int, value: expenseID }
      ]
    );

    res.json({ success: true, message: "Expense added successfully" });
  } catch (err) {
    console.error("Expense Insert Error:", err);
    res.status(500).json({ message: "Server error adding expense" });
  }
});

/* ---------------------- MANAGER: GET EXPENSES ---------------------- */
router.get("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;

  if (role.toLowerCase() !== "manager") {
    return res.status(403).json({ message: "Access denied: Managers only" });
  }

  try {
    const expenses = await executeQuery(
      `
      SELECT expenseID, description, amount, dateRecorded
      FROM Expense
      WHERE managerID = @id
      `,
      [{ name: "id", type: sql.Int, value: id }]
    );

    res.json({ data: expenses });
  } catch (err) {
    console.error("Expense Fetch Error:", err);
    res.status(500).json({ message: "Server error loading expenses" });
  }
});

export default router;


