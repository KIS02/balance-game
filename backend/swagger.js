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
      securitySchemes: {
        googleAccessToken: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Google access token",
          description: "@react-oauth/google 로그인으로 받은 Google access_token",
        },
      },
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
        GoogleAuthRequest: {
          type: "object",
          required: ["accessToken"],
          properties: {
            accessToken: {
              type: "string",
              example: "google_access_token",
            },
          },
        },
        AppUser: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            googleSub: { type: "string", example: "1234567890" },
            email: { type: "string", example: "user@example.com" },
            name: { type: "string", example: "홍길동" },
            picture: { type: "string", example: "https://example.com/profile.jpg" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            result: { $ref: "#/components/schemas/AppUser" },
          },
        },
        Option: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            text: { type: "string", example: "네이버" },
            voteCount: { type: "number", example: 2 },
            imageUrl: {
              type: "string",
              nullable: true,
              example: "/images/naver.png",
              description: "선택지 이미지 URL입니다. 값이 없으면 null일 수 있습니다.",
            },
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
        DuplicateVoteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: {
              type: "string",
              example: "이미 투표한 질문입니다.",
            },
            result: { $ref: "#/components/schemas/Question" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "로그인이 필요합니다." },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            userId: { type: "number", example: 2 },
            name: { type: "string", example: "홍길동" },
            picture: { type: "string", nullable: true, example: "https://example.com/profile.jpg" },
            content: {
              type: "string",
              maxLength: 50,
              example: "나는 이거 고름",
            },
            createdAt: { type: "string", format: "date-time" },
            isMine: { type: "boolean", example: false },
          },
        },
        CommentsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            result: {
              type: "object",
              properties: {
                hasMyComment: { type: "boolean", example: false },
                comments: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
          },
        },
        CommentCreateRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: {
              type: "string",
              maxLength: 50,
              example: "나는 이거 고름",
            },
          },
        },
        CommentCreateResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            result: { $ref: "#/components/schemas/Comment" },
          },
        },
        DuplicateCommentResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: {
              type: "string",
              example: "이미 댓글을 작성한 질문입니다.",
            },
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
      "/api/auth/google": {
        post: {
          summary: "Google access token으로 사용자 로그인 및 DB upsert",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoogleAuthRequest" },
                example: { accessToken: "google_access_token" },
              },
            },
          },
          responses: {
            200: {
              description: "Google 사용자 DB upsert 성공",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                  example: {
                    success: true,
                    result: {
                      id: 1,
                      googleSub: "1234567890",
                      email: "user@example.com",
                      name: "홍길동",
                      picture: "https://example.com/profile.jpg",
                    },
                  },
                },
              },
            },
            400: {
              description: "accessToken 누락",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    success: false,
                    message: "accessToken이 필요합니다.",
                  },
                },
              },
            },
            401: {
              description: "Google 인증 실패",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    success: false,
                    message: "Google 인증에 실패했습니다.",
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
                          {
                            id: 1,
                            text: "네이버",
                            voteCount: 2,
                            imageUrl: "/images/naver.png",
                          },
                          {
                            id: 2,
                            text: "카카오",
                            voteCount: 3,
                            imageUrl: "/images/kakao.png",
                          },
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
          description: "Authorization 헤더에 Google access token을 Bearer 토큰으로 전달해야 합니다.",
          tags: ["Questions"],
          security: [{ googleAccessToken: [] }],
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
                        {
                          id: 1,
                          text: "네이버",
                          voteCount: 2,
                          imageUrl: "/images/naver.png",
                        },
                        {
                          id: 2,
                          text: "카카오",
                          voteCount: 3,
                          imageUrl: "/images/kakao.png",
                        },
                      ],
                    },
                  },
                },
              },
            },
            401: {
              description: "Authorization 헤더 누락 또는 Google 인증 실패",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    missingToken: {
                      summary: "로그인 필요",
                      value: {
                        success: false,
                        message: "로그인이 필요합니다.",
                      },
                    },
                    invalidToken: {
                      summary: "Google 인증 실패",
                      value: {
                        success: false,
                        message: "Google 인증에 실패했습니다.",
                      },
                    },
                  },
                },
              },
            },
            409: {
              description: "이미 투표한 질문이며 기존 결과 반환",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DuplicateVoteResponse" },
                  example: {
                    success: false,
                    message: "이미 투표한 질문입니다.",
                    result: {
                      id: 1,
                      title: "네이버 vs 카카오",
                      options: [
                        {
                          id: 1,
                          text: "네이버",
                          voteCount: 2,
                          imageUrl: "/images/naver.png",
                        },
                        {
                          id: 2,
                          text: "카카오",
                          voteCount: 3,
                          imageUrl: "/images/kakao.png",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/questions/{questionId}/comments": {
        get: {
          summary: "질문별 댓글 목록 조회",
          description:
            "최대 12개의 댓글만 반환하며, 로그인 사용자의 본인 댓글은 반드시 포함됩니다. Authorization은 선택입니다.",
          tags: ["Comments"],
          parameters: [
            {
              name: "questionId",
              in: "path",
              required: true,
              schema: { type: "number", example: 1 },
            },
          ],
          responses: {
            200: {
              description: "댓글 목록 조회 성공",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CommentsResponse" },
                },
              },
            },
            404: {
              description: "질문 없음",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "질문에 댓글 작성",
          tags: ["Comments"],
          security: [{ googleAccessToken: [] }],
          parameters: [
            {
              name: "questionId",
              in: "path",
              required: true,
              schema: { type: "number", example: 1 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommentCreateRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "댓글 작성 성공",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CommentCreateResponse" },
                },
              },
            },
            400: {
              description: "댓글 내용 누락 또는 50자 초과",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    success: false,
                    message: "댓글은 50자 이하로 작성해주세요.",
                  },
                },
              },
            },
            401: {
              description: "로그인 필요 또는 인증 실패",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "이미 댓글 작성함",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DuplicateCommentResponse" },
                },
              },
            },
          },
        },
      },
      "/api/questions/{questionId}/comments/me": {
        delete: {
          summary: "본인 댓글 삭제",
          tags: ["Comments"],
          security: [{ googleAccessToken: [] }],
          parameters: [
            {
              name: "questionId",
              in: "path",
              required: true,
              schema: { type: "number", example: 1 },
            },
          ],
          responses: {
            200: {
              description: "댓글 삭제 성공",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "댓글이 삭제되었습니다." },
                    },
                  },
                },
              },
            },
            401: {
              description: "로그인 필요",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "삭제할 댓글 없음",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
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
