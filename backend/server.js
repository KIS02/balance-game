const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://balance-game-frontend.onrender.com",
];

app.use(cors({
  origin: allowedOrigins,
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
  charset: "utf8mb4",
});

const MAX_COMMENT_LENGTH = 50;

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

const MAX_DISPLAY_COMMENTS = 12;

const shuffleArray = (items) => {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

const mapCommentRow = (row, currentUserId) => ({
  id: row.id,
  userId: row.user_id,
  name: row.name || "익명",
  picture: row.picture || null,
  content: row.content,
  createdAt: row.created_at,
  isMine: currentUserId != null && row.user_id === currentUserId,
});

const getCommentsPayload = async (db, questionId, currentUserId = null) => {
  const [rows] = await db.query(
    `
    SELECT
      c.id,
      c.question_id,
      c.user_id,
      c.content,
      c.created_at,
      u.name,
      u.picture
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.question_id = ?
    ORDER BY c.created_at DESC
    `,
    [questionId]
  );

  const allComments = rows.map((row) => mapCommentRow(row, currentUserId));
  const myComment = currentUserId
    ? allComments.find((comment) => comment.isMine)
    : null;
  const otherComments = allComments.filter((comment) => !comment.isMine);
  const sampleSize = Math.max(0, MAX_DISPLAY_COMMENTS - (myComment ? 1 : 0));
  const sampledOthers = shuffleArray(otherComments).slice(0, sampleSize);

  const comments = myComment
    ? [myComment, ...sampledOthers.filter((comment) => comment.id !== myComment.id)]
    : sampledOthers;

  return {
    hasMyComment: Boolean(myComment),
    comments,
  };
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
    ORDER BY o.id ASC
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

const getUserVoteSelection = async (db, userId, questionId) => {
  const [rows] = await db.query(
    `
    SELECT r.selected_option_id AS optionId
    FROM responses r
    WHERE r.user_id = ? AND r.question_id = ?
    LIMIT 1
    `,
    [userId, questionId]
  );

  if (rows.length === 0) {
    return { mySelectedOptionId: null };
  }

  return { mySelectedOptionId: rows[0].optionId };
};

const buildVoteSelectionPayload = (optionId) => ({
  mySelectedOptionId: Number(optionId),
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
      ORDER BY q.id ASC, o.id ASC
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
  let user = null;

  try {
    user = await authenticateGoogleUser(accessToken, connection);

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
      ...buildVoteSelectionPayload(optionId),
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      const result = await getQuestionResult(pool, questionId);

      let voteSelection = { mySelectedOptionId: null };

      if (user) {
        voteSelection = await getUserVoteSelection(pool, user.id, questionId);
      }

      return res.status(409).json({
        success: false,
        message: "이미 투표한 질문입니다.",
        result,
        ...voteSelection,
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

app.get("/api/questions/:questionId/comments", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const accessToken = getBearerToken(req.headers.authorization);

  if (!questionId) {
    return res.status(400).json({
      success: false,
      message: "questionId가 필요합니다.",
    });
  }

  try {
    const [questionRows] = await pool.query(
      "SELECT id FROM questions WHERE id = ?",
      [questionId]
    );

    if (questionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "질문을 찾을 수 없습니다.",
      });
    }

    let currentUserId = null;

    if (accessToken) {
      try {
        const user = await authenticateGoogleUser(accessToken);
        currentUserId = user.id;
      } catch (error) {
        if (error.status === 401) {
          return res.status(401).json({
            success: false,
            message: "Google 인증에 실패했습니다.",
          });
        }

        throw error;
      }
    }

    const result = await getCommentsPayload(pool, questionId, currentUserId);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("GET /api/questions/:questionId/comments failed:", error);

    res.status(500).json({
      success: false,
      message: "댓글 목록 조회 중 오류가 발생했습니다.",
    });
  }
});

app.post("/api/questions/:questionId/comments", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { content } = req.body || {};
  const accessToken = getBearerToken(req.headers.authorization);
  const trimmedContent = typeof content === "string" ? content.trim() : "";

  if (!questionId) {
    return res.status(400).json({
      success: false,
      message: "questionId가 필요합니다.",
    });
  }

  if (!trimmedContent) {
    return res.status(400).json({
      success: false,
      message: "댓글 내용이 필요합니다.",
    });
  }

  if (trimmedContent.length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `댓글은 ${MAX_COMMENT_LENGTH}자 이하로 작성해주세요.`,
    });
  }

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다.",
    });
  }

  try {
    const user = await authenticateGoogleUser(accessToken);

    const [questionRows] = await pool.query(
      "SELECT id FROM questions WHERE id = ?",
      [questionId]
    );

    if (questionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "질문을 찾을 수 없습니다.",
      });
    }

    const [insertResult] = await pool.query(
      `
      INSERT INTO comments (question_id, user_id, content)
      VALUES (?, ?, ?)
      `,
      [questionId, user.id, trimmedContent]
    );

    res.status(201).json({
      success: true,
      result: {
        id: insertResult.insertId,
        userId: user.id,
        name: user.name || "익명",
        picture: user.picture || null,
        content: trimmedContent,
        isMine: true,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "이미 댓글을 작성한 질문입니다.",
      });
    }

    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        message: "Google 인증에 실패했습니다.",
      });
    }

    console.error("POST /api/questions/:questionId/comments failed:", error);

    res.status(500).json({
      success: false,
      message: "댓글 작성 중 오류가 발생했습니다.",
    });
  }
});

app.delete("/api/questions/:questionId/comments/me", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const accessToken = getBearerToken(req.headers.authorization);

  if (!questionId) {
    return res.status(400).json({
      success: false,
      message: "questionId가 필요합니다.",
    });
  }

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "로그인이 필요합니다.",
    });
  }

  try {
    const user = await authenticateGoogleUser(accessToken);

    const [deleteResult] = await pool.query(
      `
      DELETE FROM comments
      WHERE question_id = ? AND user_id = ?
      `,
      [questionId, user.id]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "삭제할 댓글이 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "댓글이 삭제되었습니다.",
    });
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        message: "Google 인증에 실패했습니다.",
      });
    }

    console.error("DELETE /api/questions/:questionId/comments/me failed:", error);

    res.status(500).json({
      success: false,
      message: "댓글 삭제 중 오류가 발생했습니다.",
    });
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