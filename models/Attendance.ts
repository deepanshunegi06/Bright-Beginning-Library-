import mongoose, { Schema, model, models } from 'mongoose';

export interface IAttendance {
  name: string;
  phone: string;
  date: Date;
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
    type: Date,
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

// Indexes for faster queries
AttendanceSchema.index({ phone: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ phone: 1 });

const Attendance = models.Attendance || model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
