import { type ActivityDataInput, type ActivityType } from "../../activity-data";
import { validatedCt045EmissionFactorSeedRows } from "./ct045-emission-factor-seed";

export type EmissionFactorMappingInput = Pick<
  ActivityDataInput,
  "activityType" | "description" | "date"
>;

export type EmissionFactorCandidate = {
  id: string;
  factorKey: string;
  version: number;
  activityType: ActivityType;
  description: string;
  unit: string;
  scope: string;
  validFrom: string | Date;
  validTo: string | Date | null;
};

export type EmissionFactorMappingResult<
  TFactor extends EmissionFactorCandidate = EmissionFactorCandidate,
> = {
  factor: TFactor;
  confidence: "HIGH" | "MEDIUM";
  matchedBy: "ACTIVITY_TYPE_DESCRIPTION";
  validity: "VALID_ON_ACTIVITY_DATE" | "OUT_OF_RANGE_ON_ACTIVITY_DATE";
};

type Ct045EmissionFactorCandidate =
  (typeof validatedCt045EmissionFactorSeedRows)[number];

const seaFreightKeywords = ["해상", "선박", "간선"];
const roadFreightKeywords = [
  "도로",
  "트럭",
  "입고",
  "납품",
  "이동",
  "물류센터",
  "반품",
  "회수",
  "보충",
  "항만 반입",
  "운송",
];
const electricityKeywords = [
  "전력",
  "전기",
  "kwh",
  "라인",
  "설비",
  "공조",
  "조명",
  "시험실",
];
const rawMaterialKeywords = [
  "원소재",
  "원재료",
  "소재",
  "부품",
  "패널",
  "알루미늄",
  "abs",
  "스틸",
  "pcb",
  "구리",
  "유리",
  "포장",
  "골판지",
  "완충재",
  "eps",
  "어댑터",
  "하우징",
];

export function mapActivityDataToEmissionFactor(
  input: EmissionFactorMappingInput,
): EmissionFactorMappingResult<Ct045EmissionFactorCandidate> | null;
export function mapActivityDataToEmissionFactor<
  TFactor extends EmissionFactorCandidate,
>(
  input: EmissionFactorMappingInput,
  emissionFactors: readonly TFactor[],
): EmissionFactorMappingResult<TFactor> | null;
export function mapActivityDataToEmissionFactor(
  input: EmissionFactorMappingInput,
  emissionFactors: readonly EmissionFactorCandidate[] = validatedCt045EmissionFactorSeedRows,
): EmissionFactorMappingResult<EmissionFactorCandidate> | null {
  const candidates = emissionFactors.filter(
    (factor) => factor.activityType === input.activityType,
  );

  if (candidates.length === 0) {
    return null;
  }

  const scoredCandidates = candidates
    .map((factor) => ({
      factor,
      semanticScore: scoreEmissionFactor(input, factor),
      validOnActivityDate: isEmissionFactorValidOnDate(factor, input.date),
    }))
    .sort((left, right) => {
      if (right.semanticScore !== left.semanticScore) {
        return right.semanticScore - left.semanticScore;
      }

      if (right.validOnActivityDate !== left.validOnActivityDate) {
        return Number(right.validOnActivityDate) - Number(left.validOnActivityDate);
      }

      return right.factor.version - left.factor.version;
    });

  const bestMatch = scoredCandidates[0];

  if (!bestMatch) {
    return null;
  }

  return {
    factor: bestMatch.factor,
    confidence: bestMatch.semanticScore >= 120 ? "HIGH" : "MEDIUM",
    matchedBy: "ACTIVITY_TYPE_DESCRIPTION",
    validity: bestMatch.validOnActivityDate
      ? "VALID_ON_ACTIVITY_DATE"
      : "OUT_OF_RANGE_ON_ACTIVITY_DATE",
  };
}

function scoreEmissionFactor(
  input: EmissionFactorMappingInput,
  factor: EmissionFactorCandidate,
) {
  const activityDescription = normalizeText(input.description);
  const factorDescription = normalizeText(factor.description);
  let score = 100;

  if (input.activityType === "ELECTRICITY") {
    score += countKeywordMatches(activityDescription, electricityKeywords) * 8;
    score += countKeywordMatches(factorDescription, ["전력", "전기"]) * 8;
  }

  if (input.activityType === "RAW_MATERIAL") {
    score += countKeywordMatches(activityDescription, rawMaterialKeywords) * 8;
    score += countKeywordMatches(factorDescription, ["원소재", "소재"]) * 8;
  }

  if (input.activityType === "TRANSPORT") {
    const isSeaActivity = includesAny(activityDescription, seaFreightKeywords);
    const isSeaFactor = includesAny(factorDescription, seaFreightKeywords);
    const isRoadFactor =
      !isSeaFactor && includesAny(factorDescription, roadFreightKeywords);

    if (isSeaActivity && isSeaFactor) {
      score += 80;
    }

    if (!isSeaActivity && isRoadFactor) {
      score += 50;
    }

    score += countKeywordMatches(activityDescription, roadFreightKeywords) * 3;
  }

  score += countSharedWords(activityDescription, factorDescription) * 2;

  return score;
}

function isEmissionFactorValidOnDate(
  factor: Pick<EmissionFactorCandidate, "validFrom" | "validTo">,
  activityDate: string,
) {
  const date = toComparableDate(activityDate);
  const validFrom = toComparableDate(factor.validFrom);
  const validTo = factor.validTo ? toComparableDate(factor.validTo) : null;

  return date >= validFrom && (!validTo || date <= validTo);
}

function countKeywordMatches(text: string, keywords: readonly string[]) {
  return keywords.reduce(
    (count, keyword) => count + Number(text.includes(normalizeText(keyword))),
    0,
  );
}

function includesAny(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function countSharedWords(left: string, right: string) {
  const rightWords = new Set(toWords(right));

  return toWords(left).filter((word) => rightWords.has(word)).length;
}

function toWords(text: string) {
  return text.split(" ").filter((word) => word.length >= 2);
}

function normalizeText(text: string) {
  return text.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

function toComparableDate(date: string | Date) {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }

  return date.slice(0, 10);
}
