import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    slot: { type: Number, required: true, unique: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'ResumeExport' },
    leaseUntil: Date,
  },
  { timestamps: true },
);
export const ExportSlot = model('ExportSlot', schema);
