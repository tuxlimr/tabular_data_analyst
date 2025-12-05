export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface Dataset {
  name: string;
  columns: string[];
  data: DataRow[];
}

export interface AnalysisResult {
  summary: string;
  outlierExplanation: string;
  recommendations: string[];
}

export interface OutlierDataPoint extends DataRow {
  isOutlier: boolean;
  zScoreX?: number;
  zScoreY?: number;
}

export enum DataSourceType {
  CSV = 'CSV',
  DATABASE = 'DATABASE'
}