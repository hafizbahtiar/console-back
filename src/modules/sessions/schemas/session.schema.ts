import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  userAgent: string;

  @Prop()
  fcmToken?: string; // Firebase Cloud Messaging token for push notifications

  @Prop()
  ipAddress?: string;

  @Prop()
  deviceType?: string; // 'mobile', 'tablet', 'desktop'

  @Prop()
  deviceName?: string; // Device identifier/name

  @Prop()
  browser?: string;

  @Prop()
  os?: string;

  // Location fields (from IP geolocation)
  @Prop()
  country?: string;

  @Prop()
  region?: string; // State/Province

  @Prop()
  city?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  timezone?: string;

  @Prop()
  isp?: string; // Internet Service Provider

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastActivityAt?: Date;

  @Prop()
  expiresAt?: Date; // Optional expiration for session cleanup
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Indexes (userId and accountId already indexed via index: true in @Prop)
SessionSchema.index({ userId: 1, isActive: 1 }); // Compound index
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
SessionSchema.index({ fcmToken: 1 });
