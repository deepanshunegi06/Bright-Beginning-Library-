import mongoose, { Schema, model, models } from 'mongoose';

export interface IAttendance {
  name: string;
  phone: string;
  date: string; // Format: "YYYY-MM-DD"
  inTime: string;
  outTime: string | null;
}

const AttendanceSchema = new Schema<IAttendance>({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  inTime: {
    type: String,
    required: true,
  },
  outTime: {
    type: String,
    default: null,
  },
});

// Compound index to ensure one record per phone per day
AttendanceSchema.index({ phone: 1, date: 1 }, { unique: true });

const Attendance = models.Attendance || model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
