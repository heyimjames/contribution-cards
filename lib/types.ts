export type Day = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  /** column = week index (0 = first week of the range) */
  col: number;
  /** row = weekday index (0 = Sunday) */
  row: number;
};

export type YearData = {
  /** "2025" or "last" */
  key: string;
  /** "2025" or "the last year" */
  label: string;
  total: number;
  cols: number;
  days: Day[];
};

export type Profile = {
  login: string;
  name: string | null;
  years: string[];
};

export type CardData = {
  profile: Profile;
  years: YearData[];
};
