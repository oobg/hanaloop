import type { OpenAPIV3 } from "openapi-types";

const activityTypeEnum = ["ELECTRICITY", "RAW_MATERIAL", "TRANSPORT"];
const scopeEnum = ["SCOPE_2", "SCOPE_3"];

const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  Product: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxxx..." },
      code: { type: "string", example: "CT-045" },
      name: { type: "string", example: "컴퓨터 화면" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "code", "name"],
  },

  EmissionFactor: {
    type: "object",
    properties: {
      id: { type: "string" },
      factorKey: { type: "string", example: "EF_ELECTRICITY_한국전력_기본값" },
      version: { type: "integer", example: 1 },
      activityType: { type: "string", enum: activityTypeEnum },
      description: { type: "string", example: "한국전력 기본값" },
      value: { type: "string", example: "0.456" },
      unit: { type: "string", example: "kgCO2e/kWh" },
      scope: { type: "string", enum: scopeEnum },
      validFrom: { type: "string", format: "date-time" },
      validTo: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "factorKey", "version", "activityType", "value", "unit", "scope", "validFrom"],
  },

  ActivityData: {
    type: "object",
    properties: {
      id: { type: "string" },
      productId: { type: "string" },
      emissionFactorId: { type: "string", nullable: true },
      date: { type: "string", format: "date-time" },
      activityType: { type: "string", enum: activityTypeEnum },
      description: { type: "string", example: "한국전력" },
      amount: { type: "string", example: "1028" },
      unit: { type: "string", example: "kWh" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      product: { $ref: "#/components/schemas/Product" },
      emissionFactor: {
        oneOf: [
          { $ref: "#/components/schemas/EmissionFactor" },
          { type: "object", nullable: true },
        ],
      },
    },
    required: ["id", "productId", "date", "activityType", "description", "amount", "unit"],
  },

  PcfBreakdownRow: {
    type: "object",
    properties: {
      date: { type: "string", format: "date", example: "2025-01-15" },
      activityType: { type: "string", enum: activityTypeEnum },
      description: { type: "string" },
      amount: { type: "number" },
      unit: { type: "string" },
      emissionFactorValue: { type: "number", nullable: true },
      emission: { type: "number", example: 468.77 },
    },
    required: ["date", "activityType", "description", "amount", "unit", "emission"],
  },

  PcfResult: {
    type: "object",
    properties: {
      id: { type: "string" },
      productId: { type: "string" },
      periodStart: { type: "string", format: "date-time" },
      periodEnd: { type: "string", format: "date-time" },
      totalEmission: { type: "string", example: "11072.72" },
      byScope: {
        type: "object",
        additionalProperties: { type: "number" },
        example: { SCOPE_2: 469.22, SCOPE_3: 10603.5 },
      },
      byCategory: {
        type: "object",
        additionalProperties: { type: "number" },
        example: { ELECTRICITY: 469.22, RAW_MATERIAL: 10315.0, TRANSPORT: 288.5 },
      },
      calculatedAt: { type: "string", format: "date-time" },
      activityCount: { type: "integer", example: 30 },
      product: { $ref: "#/components/schemas/Product" },
      breakdown: {
        type: "array",
        items: { $ref: "#/components/schemas/PcfBreakdownRow" },
      },
    },
    required: ["id", "productId", "periodStart", "periodEnd", "totalEmission", "byScope", "byCategory"],
  },

  ErrorResponse: {
    type: "object",
    properties: {
      ok: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          message: { type: "string" },
          fieldErrors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
          formErrors: { type: "array", items: { type: "string" } },
        },
        required: ["message"],
      },
    },
    required: ["ok", "error"],
  },
};

export const openapiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Hanaloop PCF API",
    version: "1.0.0",
    description:
      "제품별 탄소 발자국(PCF) 계산 및 GHG 배출량 데이터 관리 API.\n\n" +
      "**배출계수 적용 규칙**: 활동 데이터 등록 시 `activityType + description`으로 가장 적합한 배출계수를 자동 매핑합니다.\n\n" +
      "**PCF 공식**: `emission = activity_amount × emission_factor_value` (단위: kgCO₂e)",
  },
  servers: [{ url: "/api", description: "Next.js Route Handlers" }],
  tags: [
    { name: "products", description: "제품 관리" },
    { name: "emission-factors", description: "배출계수 관리" },
    { name: "activity-data", description: "활동 데이터 관리" },
    { name: "pcf", description: "PCF 계산 및 결과 조회" },
  ],
  components: { schemas },
  paths: {
    "/products": {
      get: {
        tags: ["products"],
        summary: "제품 목록 조회",
        operationId: "listProducts",
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/emission-factors": {
      get: {
        tags: ["emission-factors"],
        summary: "배출계수 목록 조회",
        operationId: "listEmissionFactors",
        parameters: [
          {
            name: "activeOnly",
            in: "query",
            description: "true이면 현재 유효한 계수만 반환 (validTo가 null이거나 미래인 것)",
            schema: { type: "string", enum: ["true", "false"] },
          },
        ],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/EmissionFactor" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["emission-factors"],
        summary: "배출계수 신규 등록",
        operationId: "createEmissionFactor",
        description: "같은 factorKey로 등록하면 version이 자동으로 1씩 증가합니다.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  factorKey: { type: "string", example: "EF_ELECTRICITY_한국전력_기본값" },
                  activityType: { type: "string", enum: activityTypeEnum },
                  description: { type: "string", example: "한국전력 기본값" },
                  value: { type: "number", example: 0.456 },
                  unit: { type: "string", example: "kgCO2e/kWh" },
                  scope: { type: "string", enum: scopeEnum },
                  validFrom: { type: "string", format: "date", example: "2025-01-01" },
                  validTo: { type: "string", format: "date", nullable: true },
                },
                required: ["factorKey", "activityType", "description", "value", "unit", "scope", "validFrom"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "생성됨",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/EmissionFactor" },
                  },
                },
              },
            },
          },
          "422": {
            description: "입력값 오류",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/emission-factors/{id}": {
      put: {
        tags: ["emission-factors"],
        summary: "배출계수 수정",
        operationId: "updateEmissionFactor",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  value: { type: "number" },
                  validTo: { type: "string", format: "date", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "수정됨",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/EmissionFactor" },
                  },
                },
              },
            },
          },
          "404": { description: "배출계수 없음" },
        },
      },
      delete: {
        tags: ["emission-factors"],
        summary: "배출계수 삭제",
        operationId: "deleteEmissionFactor",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "삭제됨",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
          "404": { description: "배출계수 없음" },
        },
      },
    },

    "/activity-data": {
      get: {
        tags: ["activity-data"],
        summary: "활동 데이터 목록 조회",
        operationId: "listActivityData",
        parameters: [
          {
            name: "productId",
            in: "query",
            description: "제품 ID로 필터",
            schema: { type: "string" },
          },
          {
            name: "month",
            in: "query",
            description: "월 필터 (예: 2025-01)",
            schema: { type: "string", example: "2025-01" },
          },
        ],
        responses: {
          "200": {
            description: "성공 (최대 200건, 날짜 내림차순)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/ActivityData" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["activity-data"],
        summary: "활동 데이터 수동 등록",
        operationId: "createActivityData",
        description:
          "`productId`는 제품 ID(cuid) 또는 제품 코드(예: CT-045) 모두 허용됩니다. " +
          "등록 시 `activityType + description`으로 배출계수를 자동 매핑합니다.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  productId: { type: "string", example: "CT-045" },
                  date: { type: "string", format: "date", example: "2025-03-15" },
                  activityType: { type: "string", enum: activityTypeEnum },
                  description: { type: "string", example: "한국전력" },
                  amount: { type: "number", example: 1028 },
                  unit: { type: "string", example: "kWh" },
                },
                required: ["productId", "date", "activityType", "description", "amount", "unit"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "생성됨",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/ActivityData" },
                  },
                },
              },
            },
          },
          "404": { description: "제품 없음" },
          "422": {
            description: "입력값 오류",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/activity-data/import": {
      post: {
        tags: ["activity-data"],
        summary: "Excel 파일로 활동 데이터 일괄 임포트",
        operationId: "importActivityDataFromExcel",
        description:
          "FormData로 `.xlsx` 파일을 업로드합니다. '과제용 데이터' 시트에서 읽으며 " +
          "컬럼 순서: 일자(원본) | 활동 유형 | 설명 | 량 | 단위. " +
          "제품 코드는 쿼리 파라미터 `productId`로 전달합니다.",
        parameters: [
          {
            name: "productId",
            in: "query",
            required: true,
            description: "제품 ID 또는 제품 코드",
            schema: { type: "string", example: "CT-045" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary", description: ".xlsx 파일" },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "임포트 결과",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    imported: { type: "integer", example: 30 },
                    skipped: { type: "integer", example: 0 },
                  },
                },
              },
            },
          },
          "400": { description: "파일 형식 오류 또는 시트 없음" },
          "404": { description: "제품 없음" },
        },
      },
    },

    "/pcf/calculate": {
      post: {
        tags: ["pcf"],
        summary: "PCF 계산 실행",
        operationId: "calculatePcf",
        description:
          "지정 제품과 기간의 활동 데이터를 집계하여 PCF를 계산합니다.\n\n" +
          "공식: `emission = amount × emissionFactorValue` (단위: kgCO₂e)\n\n" +
          "결과는 `pcf_results` 테이블에 upsert됩니다 (같은 productId + 기간이면 덮어씁니다).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  productId: { type: "string", example: "CT-045" },
                  periodStart: { type: "string", format: "date", example: "2025-01-01" },
                  periodEnd: { type: "string", format: "date", example: "2025-08-31" },
                },
                required: ["productId", "periodStart", "periodEnd"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "계산 결과",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PcfResult" },
                  },
                },
              },
            },
          },
          "400": { description: "활동 데이터 없음" },
          "404": { description: "제품 없음" },
          "422": { description: "입력값 오류" },
        },
      },
    },

    "/pcf/results": {
      get: {
        tags: ["pcf"],
        summary: "PCF 결과 목록 조회",
        operationId: "listPcfResults",
        parameters: [
          {
            name: "productId",
            in: "query",
            description: "제품 ID로 필터",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PcfResult" },
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
};
