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
    if (role.toLowerCase() !== "owner") return res.status(403).json({ message: "Owners only" });

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
  const { role } = req.session.user;
  if (role.toLowerCase() !== "accountant") return res.status(403).json({ message: "Accountants only" });

  try {
    const invoices = await executeQuery(`
      SELECT invoiceID, projectID, amount, dateIssued, paymentStatus FROM Invoice
    `);
    const payments = await executeQuery(`
      SELECT paymentID, invoiceID, method, totalAmount, transactionDate FROM Payment
    `);
    res.json({ data: { invoices, payments } });
  } catch (err) {
    console.error("Accountant Dashboard Error:", err);
    res.status(500).json({ message: "Server error loading accountant dashboard" });
  }
});

/* ---------------------- ACCOUNTANT: EXPENSE SUMMARY ---------------------- */
router.get("/expenses-summary", requireAuth, async (req, res) => {
  const { role } = req.session.user;
  if (role.toLowerCase() !== "accountant") return res.status(403).json({ message: "Accountants only" });

  try {
    const summary = await executeQuery(`
      SELECT
        CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT) AS ProjectID,
        COUNT(*) AS NumberOfExpenses,
        SUM(CAST(SUBSTRING(Details, CHARINDEX('$', Details)+1, 20) AS DECIMAL(10,2))) AS TotalAmount
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

/* ---------------------- MANAGER: ADD EXPENSE ---------------------- */
router.post("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  if (role.toLowerCase() !== "manager") return res.status(403).json({ message: "Managers only" });

  const { description, amount, projectID } = req.body;

  try {
    const details = `ProjectID:${projectID} | ${description} | $${amount}`;
    await executeQuery(`
      INSERT INTO AuditLog (UserID, Action, Details, Timestamp)
      VALUES (@id, 'CREATE_EXPENSE', @details, GETDATE())
    `, [
      { name: "id", type: sql.Int, value: id },
      { name: "details", type: sql.NVarChar, value: details }
    ]);

    res.json({ success: true, message: "Expense recorded successfully" });
  } catch (err) {
    console.error("Expense Audit Error:", err);
    res.status(500).json({ message: "Server error recording expense" });
  }
});

/* ---------------------- MANAGER: GET EXPENSES ---------------------- */
router.get("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  if (role.toLowerCase() !== "manager") return res.status(403).json({ message: "Managers only" });

  try {
    const expenses = await executeQuery(`
      SELECT 
        LogID AS expenseID,
        CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT) AS projectID,
        LTRIM(RTRIM(SUBSTRING(
          Details,
          CHARINDEX('|', Details)+1,
          CHARINDEX('|', Details, CHARINDEX('|', Details)+1) - CHARINDEX('|', Details)-1
        ))) AS description,
        CAST(SUBSTRING(Details, CHARINDEX('$', Details)+1, 20) AS DECIMAL(10,2)) AS amount,
        Timestamp AS dateRecorded
      FROM AuditLog
      WHERE UserID=@id AND Action='CREATE_EXPENSE'
      ORDER BY Timestamp DESC
    `, [
      { name: "id", type: sql.Int, value: id }
    ]);

    res.json({ data: expenses });
  } catch (err) {
    console.error("Expense Fetch Error:", err);
    res.status(500).json({ message: "Server error loading expenses" });
  }
});

/* ---------------------- OWNER: GET ALL EXPENSES ---------------------- */
router.get("/expenses-owner", requireAuth, async (req, res) => {
  const { role } = req.session.user;
  if (role.toLowerCase() !== "owner") return res.status(403).json({ message: "Owners only" });

  try {
    const expenses = await executeQuery(`
      SELECT
        LogID AS expenseID,
        CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT) AS projectID,
        LTRIM(RTRIM(SUBSTRING(
          Details,
          CHARINDEX('|', Details)+1,
          CHARINDEX('|', Details, CHARINDEX('|', Details)+1) - CHARINDEX('|', Details)-1
        ))) AS description,
        CAST(SUBSTRING(Details, CHARINDEX('$', Details)+1, 20) AS DECIMAL(10,2)) AS amount,
        Timestamp AS dateRecorded,
        UserID AS managerID
      FROM AuditLog
      WHERE Action='CREATE_EXPENSE'
      ORDER BY Timestamp DESC
    `);

    res.json({ data: expenses });
  } catch (err) {
    console.error("Owner Expense Fetch Error:", err);
    res.status(500).json({ message: "Server error loading expenses" });
  }
});

export default router;
