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
    if (role.toLowerCase() !== "owner") return res.status(403).json({ message: "Access denied: Owners only" });

    const projects = await executeQuery(`SELECT projectID, clientID, description, dueDate, status FROM Project`);
    const invoices = await executeQuery(`SELECT invoiceID, projectID, amount, dateIssued, paymentStatus FROM Invoice`);

    res.json({ data: { projects, invoices } });
  } catch (err) {
    console.error("Owner Dashboard Error:", err);
    res.status(500).json({ message: "Server error loading owner dashboard" });
  }
});

/* ---------------------- OWNER: VIEW AUDIT LOG ---------------------- */
router.get("/audit-log", requireAuth, async (req, res) => {
  const { role } = req.session.user;
  if (role.toLowerCase() !== "owner") return res.status(403).json({ message: "Access denied: Owners only" });

  try {
    const logs = await executeQuery(`
      SELECT LogID, UserID, Action, Details, Timestamp
      FROM AuditLog
      ORDER BY Timestamp DESC
    `);
    res.json({ data: logs });
  } catch (err) {
    console.error("Audit Log Fetch Error:", err);
    res.status(500).json({ message: "Server error loading audit log" });
  }
});

/* ---------------------- ACCOUNTANT DASHBOARD ---------------------- */
router.get("/accountant", requireAuth, async (req, res) => {
  const { role } = req.session.user;
  if (role.toLowerCase() !== "accountant") return res.status(403).json({ message: "Access denied: Accountants only" });

  try {
    const invoices = await executeQuery(`SELECT invoiceID, projectID, amount, dateIssued, paymentStatus FROM Invoice`);
    const payments = await executeQuery(`SELECT paymentID, invoiceID, method, totalAmount, transactionDate FROM Payment`);
    res.json({ data: { invoices, payments } });
  } catch (err) {
    console.error("Accountant Dashboard Error:", err);
    res.status(500).json({ message: "Server error loading accountant dashboard" });
  }
});

/* ---------------------- ACCOUNTANT: EXPENSE SUMMARY ---------------------- */
router.get("/expenses-summary", requireAuth, async (req, res) => {
  const { role } = req.session.user;
  if (role.toLowerCase() !== "accountant") return res.status(403).json({ message: "Access denied: Accountants only" });

  try {
    const summary = await executeQuery(`
      SELECT 
        CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT) AS ProjectID,
        COUNT(*) AS NumberOfExpenses,
        SUM(CAST(REPLACE(SUBSTRING(Details, CHARINDEX('$', Details)+1, 20),')','') AS DECIMAL(10,2))) AS TotalAmount
      FROM AuditLog
      WHERE Action='CREATE_EXPENSE'
      GROUP BY CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT)
      ORDER BY ProjectID
    `);
    res.json({ data: summary });
  } catch (err) {
    console.error("Expense Summary Fetch Error:", err);
    res.status(500).json({ message: "Server error loading expense summary" });
  }
});

/* ---------------------- MANAGER: ADD EXPENSE (AUDIT LOG) ---------------------- */
router.post("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  if (role.toLowerCase() !== "manager") return res.status(403).json({ message: "Access denied: Managers only" });

  const { description, amount, projectID } = req.body;

  try {
    // Standardize Details format for easier parsing
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
    console.error("Expense Audit Error:", err);
    res.status(500).json({ message: "Server error recording expense" });
  }
});

/* ---------------------- MANAGER: GET EXPENSES (SAFE) ---------------------- */
router.get("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  if (role.toLowerCase() !== "manager") {
    return res.status(403).json({ message: "Access denied: Managers only" });
  }

  try {
    const expenses = await executeQuery(
      `
      SELECT 
        LogID AS expenseID,
        Details,
        Timestamp AS dateRecorded
      FROM AuditLog
      WHERE UserID = @id
        AND Action = 'CREATE_EXPENSE'
      ORDER BY Timestamp DESC
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
