import { Schema, model, Types } from 'mongoose';
interface ActionTokenDocument {
  userId: Types.ObjectId;
  tokenHash: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  usedAt?: Date;
}
const schema = new Schema<ActionTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    type: { type: String, enum: ['email_verification', 'password_reset'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: Date,
  },
  { timestamps: true },
);
export const ActionToken = model<ActionTokenDocument>('ActionToken', schema);
