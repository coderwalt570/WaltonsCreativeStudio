import express from "express";
import { executeQuery, sql } from "../utils/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= PROJECTS ================= */
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

/* ================= OWNER DASHBOARD ================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.session.user.role.toLowerCase() !== "owner") {
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

/* ================= OWNER: GET ALL EXPENSES ================= */
router.get("/owner/expenses", requireAuth, async (req, res) => {
  try {
    if (req.session.user.role.toLowerCase() !== "owner") {
      return res.status(403).json({ message: "Owners only" });
    }

    const expenses = await executeQuery(`
      SELECT 
        LogID AS expenseID,
        Details,
        Timestamp AS dateRecorded
      FROM AuditLog
      WHERE Action = 'CREATE_EXPENSE'
      ORDER BY Timestamp DESC
    `);

    res.json({ data: expenses });
  } catch (err) {
    console.error("Owner Expense Error:", err);
    res.status(500).json({ message: "Server error loading expenses" });
  }
});

/* ================= MANAGER: GET OWN EXPENSES ================= */
router.get("/expenses", requireAuth, async (req, res) => {
  try {
    const { id, role } = req.session.user;
    if (role.toLowerCase() !== "manager") {
      return res.status(403).json({ message: "Managers only" });
    }

    const expenses = await executeQuery(
      `
      SELECT 
        LogID AS expenseID,
        Details,
        Timestamp AS dateRecorded
      FROM AuditLog
      WHERE Action='CREATE_EXPENSE'
        AND UserID=@id
      ORDER BY Timestamp DESC
      `,
      [{ name: "id", type: sql.Int, value: id }]
    );

    res.json({ data: expenses });
  } catch (err) {
    console.error("Manager Expense Error:", err);
    res.status(500).json({ message: "Server error loading expenses" });
  }
});

/* ================= MANAGER: ADD EXPENSE ================= */
router.post("/expenses", requireAuth, async (req, res) => {
  try {
    const { id, role } = req.session.user;
    if (role.toLowerCase() !== "manager") {
      return res.status(403).json({ message: "Managers only" });
    }

    const { description, amount, projectID } = req.body;
    const details = `ProjectID:${projectID} | ${description} | $${amount}`;

    await executeQuery(
      `
      INSERT INTO AuditLog (UserID, Action, Details, Timestamp)
      VALUES (@id, 'CREATE_EXPENSE', @details, GETDATE())
      `,
      [
        { name: "id", type: sql.Int, value: id },
        { name: "details", type: sql.NVarChar, value: details }
      ]
    );

    res.json({ success: true, message: "Expense recorded successfully" });
  } catch (err) {
    console.error("Expense Insert Error:", err);
    res.status(500).json({ message: "Server error recording expense" });
  }
});

export default router;

