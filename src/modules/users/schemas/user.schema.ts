import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  displayName?: string;

  @Prop({ trim: true })
  avatar?: string;

  @Prop({ trim: true, maxlength: 500 })
  bio?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ default: 'user' })
  role: 'owner' | 'user';

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;

  // Currency preferences
  @Prop({ type: String, default: 'MYR', uppercase: true, maxlength: 3 })
  baseCurrency?: string; // User's base currency (default: 'MYR')

  @Prop({ type: [String], default: ['MYR'] })
  supportedCurrencies?: string[]; // List of currencies user wants to work with (default: ['MYR'])
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes (username already indexed via unique: true in @Prop)
UserSchema.index({ role: 1 });
