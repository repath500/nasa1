export interface WilsonInterval {
  lower: number;
  upper: number;
}

export function wilson95(successes: number, total: number): WilsonInterval | null {
  if (!Number.isInteger(total) || !Number.isInteger(successes) || total <= 0 || successes < 0 || successes > total) {
    return null;
  }
  const z = 1.959963984540054;
  const proportion = successes / total;
  const denominator = 1 + z * z / total;
  const centre = (proportion + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt(proportion * (1 - proportion) / total + z * z / (4 * total * total)) / denominator;
  return { lower: Math.max(0, centre - margin), upper: Math.min(1, centre + margin) };
}

function ranks(values: number[]): number[] {
  const sorted = values.map((value, index) => ({ value, index })).sort((left, right) => left.value - right.value);
  const result = new Array<number>(values.length);
  let start = 0;
  while (start < sorted.length) {
    let end = start + 1;
    while (end < sorted.length && sorted[end]!.value === sorted[start]!.value) end++;
    const averageRank = (start + 1 + end) / 2;
    for (let index = start; index < end; index++) result[sorted[index]!.index] = averageRank;
    start = end;
  }
  return result;
}

export function spearman(left: number[], right: number[]): number | null {
  if (left.length !== right.length || left.length < 2 || !left.every(Number.isFinite) || !right.every(Number.isFinite)) return null;
  const leftRanks = ranks(left);
  const rightRanks = ranks(right);
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const leftMean = average(leftRanks);
  const rightMean = average(rightRanks);
  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let index = 0; index < leftRanks.length; index++) {
    const leftDelta = leftRanks[index]! - leftMean;
    const rightDelta = rightRanks[index]! - rightMean;
    covariance += leftDelta * rightDelta;
    leftVariance += leftDelta * leftDelta;
    rightVariance += rightDelta * rightDelta;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return denominator === 0 ? null : covariance / denominator;
}

export function keepJevColumn(input: {
  adjudicatedPairs: number;
  independentLabellers: number;
  baselineTop3HitRate: number | null;
  jevTop3HitRate: number | null;
  informativeDisagreement: boolean;
  reviewersPreferJev: boolean;
}): boolean {
  return input.adjudicatedPairs >= 16 && input.independentLabellers >= 2 &&
    input.baselineTop3HitRate !== null && input.jevTop3HitRate !== null &&
    Number.isFinite(input.baselineTop3HitRate) && Number.isFinite(input.jevTop3HitRate) &&
    input.baselineTop3HitRate >= 0 && input.jevTop3HitRate <= 1 &&
    input.jevTop3HitRate >= input.baselineTop3HitRate &&
    (input.informativeDisagreement || input.reviewersPreferJev);
}
