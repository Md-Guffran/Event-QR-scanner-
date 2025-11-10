export interface ScanLog {
  type: 'entrance' | 'lunch';
  timestamp: number;
}

export interface Attendee {
  id: string;
  name?: string;
  createdAt: number;
  scans: ScanLog[];
}

export type View = 'dashboard' | 'attendees' | 'scanner';