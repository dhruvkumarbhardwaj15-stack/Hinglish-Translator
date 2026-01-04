
export interface HindiResult {
  hindi: string;
  context: string;
}

export interface HistoryItem {
  id: string;
  input: string;
  results: HindiResult[];
  timestamp: number;
}
