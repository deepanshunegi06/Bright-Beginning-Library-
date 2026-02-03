export interface User {
  name: string;
  phone: string;
  registeredAt: Date;
}

export interface Attendance {
  _id: string;
  name: string;
  phone: string;
  date: string;
  inTime: string;
  outTime: string | null;
}

export interface AttendanceStats {
  totalToday: number;
  currentlyInside: number;
  crowdLevel: 'low' | 'medium' | 'high';
}
