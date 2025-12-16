import { normalizeToUtcDate } from "./dateUtils";

// 日付計算で繰り返し使う定数（1日あたりのミリ秒）
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type GraphPeriod = "1y" | "3y" | "all";

// X軸のラベル情報をまとめた型定義
export type AxisLabelInfo = {
  actualLabel: string;
  correctedLabel: string | null;
  showActualLabel: boolean;
  showCorrectedLabel: boolean;
  showCorrectedZeroLine: boolean;
};

// グラフ描画用のバケット情報
export type GraphBucket = {
  key: string;
  tried: number;
  did: number;
  cumulative: number;
  actualLabel: string;
  correctedLabel: string | null;
  showActualLabel: boolean;
  showCorrectedLabel: boolean;
  showCorrectedZeroLine: boolean;
};

// 実月齢（出生日起点の月齢）を30日単位で算出する
export const calculateActualMonth = (target: Date, birthDate: Date): number => {
  return Math.floor((target.getTime() - birthDate.getTime()) / MS_PER_DAY / 30);
};

// 修正月齢（予定日起点の月齢）を30日単位で算出する
export const calculateCorrectedMonth = (
  target: Date,
  dueDate: Date
): number => {
  return Math.floor((target.getTime() - dueDate.getTime()) / MS_PER_DAY / 30);
};

// 実年齢（誕生日基準の年単位）を算出する
export const calculateActualYear = (target: Date, birthDate: Date): number => {
  const years = target.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    target.getUTCMonth() < birthDate.getUTCMonth() ||
    (target.getUTCMonth() === birthDate.getUTCMonth() &&
      target.getUTCDate() < birthDate.getUTCDate());
  return beforeBirthday ? years - 1 : years;
};

// 早産とみなせるかの判定（予定日と出生日の差が 21 日超かつ、早産表示が有効）
export const shouldShowCorrected = (
  params: {
    enablePrematureDisplay: boolean;
    birthDate: string;
    dueDate: string | null;
    period: GraphPeriod;
  }
): { enabled: boolean; birth: Date; due: Date | null } => {
  const birth = normalizeToUtcDate(params.birthDate);
  const due = params.dueDate ? normalizeToUtcDate(params.dueDate) : null;
  if (!params.enablePrematureDisplay || !due) {
    return { enabled: false, birth, due: null };
  }
  const diffDays = (due.getTime() - birth.getTime()) / MS_PER_DAY;
  const meetsEarlyCondition = diffDays > 21;
  const periodAllows = params.period !== "all";
  return { enabled: meetsEarlyCondition && periodAllows, birth, due };
};

// 週数表記を作るため、予定日を 40 週とみなし、その手前を 4 週刻みで返す
const buildGestationalWeekLabel = (
  target: Date,
  dueDate: Date
): string | null => {
  const diffWeeks = Math.floor((target.getTime() - dueDate.getTime()) / MS_PER_DAY / 7);
  const gestationalWeek = 40 + diffWeeks;
  if (gestationalWeek < 22) return null;
  if ((gestationalWeek - 22) % 4 !== 0) return null;
  return `${gestationalWeek}w`;
};

// X軸用のラベル配列を生成する。最大 12 件になるよう間引きを行う。
export const buildAxisLabels = (params: {
  period: GraphPeriod;
  birthDate: string;
  dueDate: string | null;
  enablePrematureDisplay: boolean;
}): Array<AxisLabelInfo> => {
  const { period } = params;
  const { enabled: showCorrected, birth, due } = shouldShowCorrected({
    enablePrematureDisplay: params.enablePrematureDisplay,
    birthDate: params.birthDate,
    dueDate: params.dueDate,
    period,
  });

  const labels: AxisLabelInfo[] = [];
  const maxMonth = period === "1y" ? 12 : period === "3y" ? 36 : 0;
  const totalSlots = period === "all" ? 0 : maxMonth + 1;

  // ラベル数が最大 12 件を超える場合、等間隔で間引くステップを算出する
  const step = period === "all" ? 1 : Math.max(1, Math.ceil(totalSlots / 12));

  if (period === "all") {
    // 全期間は実年齢のみ表示する
    labels.push({
      actualLabel: "0Y",
      correctedLabel: null,
      showActualLabel: true,
      showCorrectedLabel: false,
      showCorrectedZeroLine: false,
    });
    return labels;
  }

  for (let month = 0; month <= maxMonth; month += 1) {
    const targetDate = new Date(birth.getTime() + month * 30 * MS_PER_DAY);
    const correctedMonth = due ? calculateCorrectedMonth(targetDate, due) : null;
    const showActualLabel = month % step === 0;

    let correctedLabel: string | null = null;
    let showCorrectedLabel = false;
    let showCorrectedZeroLine = false;

    if (showCorrected && correctedMonth !== null) {
      if (correctedMonth < 0) {
        correctedLabel = buildGestationalWeekLabel(targetDate, due);
        showCorrectedLabel = Boolean(correctedLabel && showActualLabel);
      } else if (correctedMonth === 0) {
        correctedLabel = "修0M（予定日）";
        showCorrectedLabel = showActualLabel;
        showCorrectedZeroLine = true;
      } else {
        correctedLabel = `修${correctedMonth}M`;
        showCorrectedLabel = showActualLabel;
      }
    }

    labels.push({
      actualLabel: `${month}M`,
      correctedLabel,
      showActualLabel,
      showCorrectedLabel,
      showCorrectedZeroLine,
    });
  }

  return labels;
};

// 全期間表示用の年齢ラベルを生成する（0Y から最大年齢まで）
export const buildYearAxisLabels = (maxYear: number): AxisLabelInfo[] => {
  const total = maxYear + 1;
  const step = Math.max(1, Math.ceil(total / 12));
  const result: AxisLabelInfo[] = [];
  for (let year = 0; year <= maxYear; year += 1) {
    const showActualLabel = year % step === 0;
    result.push({
      actualLabel: `${year}Y`,
      correctedLabel: null,
      showActualLabel,
      showCorrectedLabel: false,
      showCorrectedZeroLine: false,
    });
  }
  return result;
};

// グラフに渡す積み上げデータとラベル情報をまとめて生成する
export const buildBuckets = (params: {
  period: GraphPeriod;
  birthDate: string;
  dueDate: string | null;
  enablePrematureDisplay: boolean;
  records: Array<{ date: string; tried: number; did: number }>;
}): { buckets: GraphBucket[]; labels: AxisLabelInfo[] } => {
  const { period, birthDate, dueDate, records, enablePrematureDisplay } = params;
  const { enabled: showCorrected, birth, due } = shouldShowCorrected({
    enablePrematureDisplay,
    birthDate,
    dueDate,
    period,
  });

  if (period === "all") {
    // 年齢ごとにバケット化
    const yearBuckets: Record<number, { tried: number; did: number }> = {};
    records.forEach((item) => {
      const date = normalizeToUtcDate(item.date);
      if (Number.isNaN(date.getTime())) return;
      const year = calculateActualYear(date, birth);
      if (year < 0) return;
      if (!yearBuckets[year]) {
        yearBuckets[year] = { tried: 0, did: 0 };
      }
      yearBuckets[year].tried += item.tried;
      yearBuckets[year].did += item.did;
    });

    const maxYear = Math.max(0, ...Object.keys(yearBuckets).map((k) => Number(k)));
    const labels = buildYearAxisLabels(maxYear);

    const buckets: GraphBucket[] = labels.map((labelInfo, index) => {
      const counts = yearBuckets[index] ?? { tried: 0, did: 0 };
      const cumulative = index === 0 ? counts.tried + counts.did : 0;
      return {
        key: `${index}Y`,
        tried: counts.tried,
        did: counts.did,
        cumulative,
        actualLabel: labelInfo.actualLabel,
        correctedLabel: null,
        showActualLabel: labelInfo.showActualLabel,
        showCorrectedLabel: false,
        showCorrectedZeroLine: false,
      };
    });

    // 累計は左から順に加算
    buckets.reduce((prev, current) => {
      const sum = prev + current.tried + current.did;
      current.cumulative = sum;
      return sum;
    }, 0);

    return { buckets, labels };
  }

  const maxMonth = period === "1y" ? 12 : 36;
  const monthBuckets: Record<number, { tried: number; did: number }> = {};
  records.forEach((item) => {
    const date = normalizeToUtcDate(item.date);
    if (Number.isNaN(date.getTime())) return;
    const month = calculateActualMonth(date, birth);
    if (month < 0 || month > maxMonth) return;
    if (!monthBuckets[month]) {
      monthBuckets[month] = { tried: 0, did: 0 };
    }
    monthBuckets[month].tried += item.tried;
    monthBuckets[month].did += item.did;
  });

  const labels = buildAxisLabels({
    period,
    birthDate,
    dueDate,
    enablePrematureDisplay,
  });

  const buckets: GraphBucket[] = labels.map((labelInfo, index) => {
    const counts = monthBuckets[index] ?? { tried: 0, did: 0 };
    return {
      key: `${index}M`,
      tried: counts.tried,
      did: counts.did,
      cumulative: 0,
      actualLabel: labelInfo.actualLabel,
      correctedLabel: showCorrected ? labelInfo.correctedLabel : null,
      showActualLabel: labelInfo.showActualLabel,
      showCorrectedLabel: showCorrected && labelInfo.showCorrectedLabel,
      showCorrectedZeroLine: showCorrected && labelInfo.showCorrectedZeroLine,
    };
  });

  buckets.reduce((prev, current) => {
    const sum = prev + current.tried + current.did;
    current.cumulative = sum;
    return sum;
  }, 0);

  return { buckets, labels };
};
