import { Schema, model } from 'mongoose';
const schema = new Schema(
  {
    shareLinkId: { type: Schema.Types.ObjectId, ref: 'ResumeShareLink', required: true },
    visitorHash: { type: String, required: true },
    bucket: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ shareLinkId: 1, visitorHash: 1, bucket: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const ResumeShareView = model('ResumeShareView', schema);
