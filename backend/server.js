const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8",
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({
      success: true,
      message: "Backend and DB connected",
      result: rows[0],
    });
  } catch (error) {
    console.error("DB health check failed:", error);
    res.status(500).json({
      success: false,
      message: "DB connection failed",
    });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        q.id AS questionId,
        q.title AS questionTitle,
        o.id AS optionId,
        o.content AS optionText,
        COUNT(r.id) AS voteCount
      FROM questions q
      JOIN options o ON q.id = o.question_id
      LEFT JOIN responses r ON o.id = r.selected_option_id
      GROUP BY q.id, q.title, o.id, o.content
      ORDER BY q.id ASC, o.option_order ASC
    `);

    const questionMap = new Map();

    rows.forEach((row) => {
      if (!questionMap.has(row.questionId)) {
        questionMap.set(row.questionId, {
          id: row.questionId,
          title: row.questionTitle,
          options: [],
        });
      }

      questionMap.get(row.questionId).options.push({
        id: row.optionId,
        text: row.optionText,
        voteCount: Number(row.voteCount),
      });
    });

    res.json({
      success: true,
      result: Array.from(questionMap.values()),
    });
  } catch (error) {
    console.error("GET /api/questions failed:", error);
    res.status(500).json({
      success: false,
      message: "질문 목록 조회 중 오류가 발생했습니다.",
    });
  }
});

app.post("/api/questions/:questionId/vote", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { optionId } = req.body;

  if (!questionId || !optionId) {
    return res.status(400).json({
      success: false,
      message: "questionId와 optionId가 필요합니다.",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [optionRows] = await connection.query(
      `
      SELECT id
      FROM options
      WHERE id = ? AND question_id = ?
      `,
      [optionId, questionId]
    );

    if (optionRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "해당 질문에 존재하지 않는 선택지입니다.",
      });
    }

    await connection.query(
      `
      INSERT INTO responses (question_id, selected_option_id)
      VALUES (?, ?)
      `,
      [questionId, optionId]
    );

    const [resultRows] = await connection.query(
      `
      SELECT
        q.id AS questionId,
        q.title AS questionTitle,
        o.id AS optionId,
        o.content AS optionText,
        COUNT(r.id) AS voteCount
      FROM questions q
      JOIN options o ON q.id = o.question_id
      LEFT JOIN responses r ON o.id = r.selected_option_id
      WHERE q.id = ?
      GROUP BY q.id, q.title, o.id, o.content
      ORDER BY o.option_order ASC
      `,
      [questionId]
    );

    await connection.commit();

    res.json({
      success: true,
      result: {
        id: questionId,
        title: resultRows[0]?.questionTitle,
        options: resultRows.map((row) => ({
          id: row.optionId,
          text: row.optionText,
          voteCount: Number(row.voteCount),
        })),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("POST /api/questions/:questionId/vote failed:", error);

    res.status(500).json({
      success: false,
      message: "투표 처리 중 오류가 발생했습니다.",
    });
  } finally {
    connection.release();
  }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Balance Game backend server running on http://localhost:${port}`);
});