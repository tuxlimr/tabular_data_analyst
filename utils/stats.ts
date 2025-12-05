import { DataRow, OutlierDataPoint } from "../types";

export const calculateStats = (data: DataRow[], key: string) => {
  const values = data
    .map(row => Number(row[key]))
    .filter(val => !isNaN(val));

  if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };

  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
};

export const detectOutliers = (
  data: DataRow[],
  xKey: string,
  yKey: string,
  threshold: number = 2.5
): { processedData: OutlierDataPoint[], outlierIndices: number[] } => {
  
  const xStats = calculateStats(data, xKey);
  const yStats = calculateStats(data, yKey);

  const processedData: OutlierDataPoint[] = [];
  const outlierIndices: number[] = [];

  data.forEach((row, index) => {
    const xVal = Number(row[xKey]);
    const yVal = Number(row[yKey]);

    let isOutlier = false;
    let zScoreX = 0;
    let zScoreY = 0;

    if (!isNaN(xVal) && xStats.stdDev !== 0) {
      zScoreX = (xVal - xStats.mean) / xStats.stdDev;
    }
    if (!isNaN(yVal) && yStats.stdDev !== 0) {
      zScoreY = (yVal - yStats.mean) / yStats.stdDev;
    }

    // A point is an outlier if it deviates significantly in either dimension
    // OR if the combination is unusual (simple Euclidean distance from centroid in Z-space)
    const zDistance = Math.sqrt(Math.pow(zScoreX, 2) + Math.pow(zScoreY, 2));

    if (Math.abs(zScoreX) > threshold || Math.abs(zScoreY) > threshold || zDistance > threshold * 1.4) {
      isOutlier = true;
      outlierIndices.push(index);
    }

    processedData.push({
      ...row,
      isOutlier,
      zScoreX,
      zScoreY,
      // Ensure specific keys are numbers for Recharts
      [xKey]: xVal,
      [yKey]: yVal,
    });
  });

  return { processedData, outlierIndices };
};
