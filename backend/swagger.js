const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Balance Game API",
      version: "1.0.0",
      description: "Balance Game Express backend API documentation",
    },
    servers: [
      {
        url: process.env.SERVER_URL || "http://localhost:3001",
        description: "Balance Game backend server",
      },
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Backend and DB connected",
            },
            result: {
              type: "object",
              properties: {
                ok: { type: "number", example: 1 },
              },
            },
          },
        },
        Option: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            text: { type: "string", example: "네이버" },
            voteCount: { type: "number", example: 2 },
          },
        },
        Question: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            title: { type: "string", example: "네이버 vs 카카오" },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/Option" },
            },
          },
        },
        QuestionsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            result: {
              type: "array",
              items: { $ref: "#/components/schemas/Question" },
            },
          },
        },
        VoteRequest: {
          type: "object",
          required: ["optionId"],
          properties: {
            optionId: { type: "number", example: 2 },
          },
        },
        VoteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            result: { $ref: "#/components/schemas/Question" },
          },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          summary: "백엔드 서버와 DB 연결 상태 확인",
          tags: ["Health"],
          responses: {
            200: {
              description: "백엔드 서버와 DB 연결 상태 확인 성공",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                  example: {
                    success: true,
                    message: "Backend and DB connected",
                    result: { ok: 1 },
                  },
                },
              },
            },
          },
        },
      },
      "/api/questions": {
        get: {
          summary: "밸런스 게임 질문 목록, 선택지, 현재 투표 수 조회",
          tags: ["Questions"],
          responses: {
            200: {
              description: "질문 목록 조회 성공",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/QuestionsResponse" },
                  example: {
                    success: true,
                    result: [
                      {
                        id: 1,
                        title: "네이버 vs 카카오",
                        options: [
                          { id: 1, text: "네이버", voteCount: 2 },
                          { id: 2, text: "카카오", voteCount: 3 },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/questions/{questionId}/vote": {
        post: {
          summary: "특정 질문의 선택지에 투표",
          tags: ["Questions"],
          parameters: [
            {
              name: "questionId",
              in: "path",
              required: true,
              description: "투표할 질문 ID",
              schema: {
                type: "number",
                example: 1,
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VoteRequest" },
                example: { optionId: 2 },
              },
            },
          },
          responses: {
            200: {
              description: "투표 성공",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/VoteResponse" },
                  example: {
                    success: true,
                    result: {
                      id: 1,
                      title: "네이버 vs 카카오",
                      options: [
                        { id: 1, text: "네이버", voteCount: 2 },
                        { id: 2, text: "카카오", voteCount: 3 },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
