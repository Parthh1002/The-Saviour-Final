import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  activityType: string;
  location: string;
  coordinates: string;
  source: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

const ActivityLogSchema: Schema = new Schema({
  activityType: { type: String, required: true },
  location: { type: String, required: true },
  coordinates: { type: String, required: true },
  source: { type: String, default: 'Camera Feed' },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  timestamp: { type: Date, default: Date.now },
});

// Indexing for faster queries (Enterprise requirement)
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ location: 1 });
ActivityLogSchema.index({ activityType: 1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
