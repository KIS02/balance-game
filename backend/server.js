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

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const getBearerToken = (authorization = "") => {
  const [scheme, token] = authorization.split(" ");
  return scheme === "Bearer" && token ? token : null;
};

const mapUserRow = (row) => ({
  id: row.id,
  googleSub: row.google_sub,
  email: row.email,
  name: row.name,
  picture: row.picture,
});

const fetchGoogleUserInfo = async (accessToken) => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = new Error("Google 사용자 정보를 확인할 수 없습니다.");
    error.status = 401;
    throw error;
  }

  const userInfo = await response.json();

  if (!userInfo.sub) {
    const error = new Error("Google 사용자 식별값이 없습니다.");
    error.status = 401;
    throw error;
  }

  return userInfo;
};

const upsertGoogleUser = async (db, userInfo) => {
  await db.query(
    `
    INSERT INTO users (google_sub, email, name, picture, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      name = VALUES(name),
      picture = VALUES(picture),
      updated_at = CURRENT_TIMESTAMP
    `,
    [
      userInfo.sub,
      userInfo.email || null,
      userInfo.name || null,
      userInfo.picture || null,
    ]
  );

  const [rows] = await db.query(
    `
    SELECT id, google_sub, email, name, picture
    FROM users
    WHERE google_sub = ?
    `,
    [userInfo.sub]
  );

  return mapUserRow(rows[0]);
};

const authenticateGoogleUser = async (accessToken, db = pool) => {
  const userInfo = await fetchGoogleUserInfo(accessToken);
  return upsertGoogleUser(db, userInfo);
};

const getQuestionResult = async (db, questionId) => {
  const [rows] = await db.query(
    `
    SELECT
      q.id AS questionId,
      q.title AS questionTitle,
      o.id AS optionId,
      o.content AS optionText,
      o.image_url AS optionImageUrl,
      COUNT(r.id) AS voteCount
    FROM questions q
    JOIN options o ON q.id = o.question_id
    LEFT JOIN responses r ON o.id = r.selected_option_id
    WHERE q.id = ?
    GROUP BY q.id, q.title, o.id, o.content, o.image_url
    ORDER BY o.option_order ASC
    `,
    [questionId]
  );

  if (rows.length === 0) return null;

  return {
    id: Number(questionId),
    title: rows[0].questionTitle,
    options: rows.map((row) => ({
      id: row.optionId,
      text: row.optionText,
      voteCount: Number(row.voteCount),
      imageUrl: row.optionImageUrl || null,
    })),
  };
};

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

app.post("/api/auth/google", async (req, res) => {
  const { accessToken } = req.body || {};

  if (!accessToken) {
    return res.status(400).json({
      success: false,
      message: "accessToken이 필요합니다.",
    });
  }

  try {
    const user = await authenticateGoogleUser(accessToken);

    res.json({
      success: true,
      result: user,
    });
  } catch (error) {
    console.error("POST /api/auth/google failed:", error.message);

    res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 401
          ? "Google 인증에 실패했습니다."
          : "로그인 처리 중 오류가 발생했습니다.",
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
        o.image_url AS optionImageUrl,
        COUNT(r.id) AS voteCount
      FROM questions q
      JOIN options o ON q.id = o.question_id
      LEFT JOIN responses r ON o.id = r.selected_option_id
      GROUP BY q.id, q.title, o.id, o.content, o.image_url
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
        imageUrl: row.optionImageUrl || null,
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
  const { optionId } = req.body || {};
  const accessToken = getBearerToken(req.headers.authorization);

  if (!questionId || !optionId) {
    return res.status(400).json({
      success: false,
      message: "questionId와 optionId가 필요합니다.",
    });
  }

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다.",
    });
  }

  const connection = await pool.getConnection();

  try {
    const user = await authenticateGoogleUser(accessToken, connection);

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
      INSERT INTO responses (user_id, question_id, selected_option_id)
      VALUES (?, ?, ?)
      `,
      [user.id, questionId, optionId]
    );

    const result = await getQuestionResult(connection, questionId);

    await connection.commit();

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      const result = await getQuestionResult(pool, questionId);

      return res.status(409).json({
        success: false,
        message: "이미 투표한 질문입니다.",
        result,
      });
    }

    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        message: "Google 인증에 실패했습니다.",
      });
    }

    console.error("POST /api/questions/:questionId/vote failed:", error);

    res.status(500).json({
      success: false,
      message: "투표 처리 중 오류가 발생했습니다.",
    });
  } finally {
    connection.release();
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Balance Game Backend API is running",
    swagger: "/api-docs",
    questions: "/api/questions",
  });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Balance Game backend server running on http://localhost:${port}`);
});