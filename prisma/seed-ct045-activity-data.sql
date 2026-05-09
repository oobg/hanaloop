INSERT INTO "products" ("id", "code", "name", "updatedAt")
VALUES ('product-ct-045', 'CT-045', '컴퓨터 화면', CURRENT_TIMESTAMP)
ON CONFLICT("code") DO UPDATE SET
  "name" = excluded."name",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "activity_data" (
  "id",
  "productId",
  "date",
  "activityType",
  "description",
  "amount",
  "unit",
  "updatedAt"
)
VALUES
  ('ct045-act-001', 'product-ct-045', '2026-01-05', 'RAW_MATERIAL', 'LCD 패널 모듈', 1.85, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-002', 'product-ct-045', '2026-01-06', 'RAW_MATERIAL', '알루미늄 프레임', 0.64, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-003', 'product-ct-045', '2026-01-07', 'RAW_MATERIAL', 'ABS 후면 하우징', 0.92, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-004', 'product-ct-045', '2026-01-08', 'RAW_MATERIAL', '스틸 스탠드 부품', 0.78, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-005', 'product-ct-045', '2026-01-09', 'RAW_MATERIAL', 'PCB 조립품', 0.21, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-006', 'product-ct-045', '2026-01-10', 'RAW_MATERIAL', '구리 배선', 0.12, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-007', 'product-ct-045', '2026-01-11', 'RAW_MATERIAL', '강화 유리 커버', 0.44, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-008', 'product-ct-045', '2026-01-12', 'RAW_MATERIAL', '포장 골판지', 0.38, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-009', 'product-ct-045', '2026-01-13', 'RAW_MATERIAL', '완충재 EPS', 0.16, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-010', 'product-ct-045', '2026-01-14', 'RAW_MATERIAL', '전원 어댑터 부품', 0.33, 'kg', CURRENT_TIMESTAMP),
  ('ct045-act-011', 'product-ct-045', '2026-02-03', 'ELECTRICITY', 'SMT 라인 전력 사용', 2.4, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-012', 'product-ct-045', '2026-02-04', 'ELECTRICITY', 'LCD 조립 라인 전력 사용', 3.1, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-013', 'product-ct-045', '2026-02-05', 'ELECTRICITY', '외관 검사 설비 전력 사용', 0.74, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-014', 'product-ct-045', '2026-02-06', 'ELECTRICITY', '번인 테스트 전력 사용', 1.85, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-015', 'product-ct-045', '2026-02-07', 'ELECTRICITY', '클린룸 공조 배분 전력', 1.2, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-016', 'product-ct-045', '2026-02-08', 'ELECTRICITY', '포장 라인 전력 사용', 0.42, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-017', 'product-ct-045', '2026-02-09', 'ELECTRICITY', '창고 조명 배분 전력', 0.31, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-018', 'product-ct-045', '2026-02-10', 'ELECTRICITY', '품질 시험실 전력 사용', 0.68, 'kWh', CURRENT_TIMESTAMP),
  ('ct045-act-019', 'product-ct-045', '2026-03-02', 'TRANSPORT', 'LCD 패널 공급사 입고 운송', 0.42, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-020', 'product-ct-045', '2026-03-03', 'TRANSPORT', '알루미늄 프레임 입고 운송', 0.18, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-021', 'product-ct-045', '2026-03-04', 'TRANSPORT', 'ABS 하우징 입고 운송', 0.27, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-022', 'product-ct-045', '2026-03-05', 'TRANSPORT', 'PCB 조립품 항공 대체 보정 운송', 0.09, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-023', 'product-ct-045', '2026-03-06', 'TRANSPORT', '포장재 입고 운송', 0.11, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-024', 'product-ct-045', '2026-03-07', 'TRANSPORT', '완제품 물류센터 이동', 0.36, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-025', 'product-ct-045', '2026-03-08', 'TRANSPORT', '국내 고객사 납품 운송', 0.28, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-026', 'product-ct-045', '2026-03-09', 'TRANSPORT', '반품 회수 평균 운송', 0.04, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-027', 'product-ct-045', '2026-03-10', 'TRANSPORT', '서비스 부품 보충 운송', 0.03, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-028', 'product-ct-045', '2026-03-11', 'TRANSPORT', '수출 항만 반입 운송', 0.22, 'ton-km', CURRENT_TIMESTAMP),
  ('ct045-act-029', 'product-ct-045', '2026-03-12', 'TRANSPORT', '수출 해상 간선 운송', 3.65, 'ton-km', CURRENT_TIMESTAMP)
ON CONFLICT("id") DO UPDATE SET
  "productId" = excluded."productId",
  "date" = excluded."date",
  "activityType" = excluded."activityType",
  "description" = excluded."description",
  "amount" = excluded."amount",
  "unit" = excluded."unit",
  "updatedAt" = CURRENT_TIMESTAMP;
