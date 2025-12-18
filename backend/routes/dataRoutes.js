import express from "express";
import { executeQuery, sql } from "../utils/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------- PROJECTS ---------------- */
router.get("/projects", requireAuth, async (req, res) => {
  try {
    const projects = await executeQuery(`
      SELECT projectID, clientID, description, dueDate, status
      FROM Project
    `);
    res.json({ data: projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading projects" });
  }
});

/* ---------------- OWNER DASHBOARD ---------------- */
router.get("/", requireAuth, async (req, res) => {
  if (req.session.user.role.toLowerCase() !== "owner") {
    return res.status(403).json({ message: "Owners only" });
  }

  try {
    const projects = await executeQuery(`SELECT * FROM Project`);
    const invoices = await executeQuery(`SELECT * FROM Invoice`);
    res.json({ data: { projects, invoices } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Owner dashboard error" });
  }
});

/* ---------------- EXPENSES (OWNER + MANAGER) ---------------- */
router.get("/expenses", requireAuth, async (req, res) => {
  const { role, id } = req.session.user;
  const isManager = role.toLowerCase() === "manager";

  try {
    const expenses = await executeQuery(
      `
      SELECT
        LogID AS expenseID,
        UserID,
        CAST(
          SUBSTRING(
            Details,
            CHARINDEX('ProjectID:', Details) + 10,
            CHARINDEX('|', Details) - CHARINDEX('ProjectID:', Details) - 10
          ) AS INT
        ) AS projectID,
        LTRIM(RTRIM(
          SUBSTRING(
            Details,
            CHARINDEX('|', Details) + 1,
            CHARINDEX('|', Details, CHARINDEX('|', Details) + 1)
            - CHARINDEX('|', Details) - 1
          )
        )) AS description,
        CAST(
          SUBSTRING(Details, CHARINDEX('$', Details) + 1, 20)
          AS DECIMAL(10,2)
        ) AS amount,
        Timestamp AS dateRecorded
      FROM AuditLog
      WHERE Action = 'CREATE_EXPENSE'
      ${isManager ? "AND UserID = @id" : ""}
      ORDER BY Timestamp DESC
      `,
      isManager ? [{ name: "id", type: sql.Int, value: id }] : []
    );

    res.json({ data: expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading expenses" });
  }
});

/* ---------------- MANAGER: ADD EXPENSE ---------------- */
router.post("/expenses", requireAuth, async (req, res) => {
  if (req.session.user.role.toLowerCase() !== "manager") {
    return res.status(403).json({ message: "Managers only" });
  }

  const { projectID, description, amount } = req.body;

  try {
    await executeQuery(
      `
      INSERT INTO AuditLog (UserID, Action, Details, Timestamp)
      VALUES (@id, 'CREATE_EXPENSE', @details, GETDATE())
      `,
      [
        { name: "id", type: sql.Int, value: req.session.user.id },
        {
          name: "details",
          type: sql.NVarChar,
          value: `ProjectID:${projectID} | ${description} | $${amount}`
        }
      ]
    );

    res.json({ success: true, message: "Expense recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving expense" });
  }
});

/* ---------------- ACCOUNTANT DASHBOARD ---------------- */
router.get("/accountant", requireAuth, async (req, res) => {
  if (req.session.user.role.toLowerCase() !== "accountant") {
    return res.status(403).json({ message: "Accountants only" });
  }

  try {
    const invoices = await executeQuery(`SELECT * FROM Invoice`);
    const payments = await executeQuery(`SELECT * FROM Payment`);

    const expensesSummary = await executeQuery(`
      SELECT
        CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, 
          CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT) AS projectID,
        COUNT(*) AS numberOfExpenses,
        SUM(CAST(SUBSTRING(Details, CHARINDEX('$', Details)+1, 20) AS DECIMAL(10,2))) AS totalAmount
      FROM AuditLog
      WHERE Action='CREATE_EXPENSE'
      GROUP BY CAST(SUBSTRING(Details, CHARINDEX('ProjectID:', Details)+10, 
          CHARINDEX('|', Details)-CHARINDEX('ProjectID:', Details)-10) AS INT)
      ORDER BY projectID
    `);

    res.json({ data: { invoices, payments, expensesSummary } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading accountant dashboard" });
  }
});

export default router;


