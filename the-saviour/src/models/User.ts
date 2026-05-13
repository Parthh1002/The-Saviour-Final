import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'main_officer' | 'sub_officer';
  assignedZones: string[];
  permissions: string[];
  lastLogin: Date;
  activityLogs: Array<{ action: string; timestamp: Date }>;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['main_officer', 'sub_officer'], default: 'sub_officer' },
  assignedZones: [{ type: String }],
  permissions: [{ type: String }],
  lastLogin: { type: Date, default: Date.now },
  activityLogs: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
