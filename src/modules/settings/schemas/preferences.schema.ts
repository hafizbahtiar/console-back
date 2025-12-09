import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PreferencesDocument = Preferences & Document;

@Schema({ timestamps: true })
export class Preferences {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Appearance preferences
  @Prop({ enum: ['light', 'dark', 'system'], default: 'system' })
  theme: string;

  @Prop({ default: 'en' })
  language: string;

  // Date & Time preferences
  @Prop({ default: 'MM/DD/YYYY' })
  dateFormat: string;

  @Prop({ enum: ['12h', '24h'], default: '12h' })
  timeFormat: string;

  @Prop({ default: 'UTC' })
  timezone: string;

  // Dashboard preferences
  @Prop({ enum: ['grid', 'list', 'table'], default: 'grid' })
  defaultDashboardView: string;

  @Prop({ default: '20' })
  itemsPerPage: string;

  @Prop({ default: true })
  showWidgets: boolean;

  // Editor preferences
  @Prop({ enum: ['light', 'dark', 'monokai', 'github'], default: 'dark' })
  editorTheme: string;

  @Prop({ default: 14, min: 10, max: 24 })
  editorFontSize: number;

  @Prop({ default: 1.5, min: 1, max: 3 })
  editorLineHeight: number;

  @Prop({ default: 4, min: 2, max: 8 })
  editorTabSize: number;
}

export const PreferencesSchema = SchemaFactory.createForClass(Preferences);

// Indexes
// Note: userId unique index is created by unique: true in @Prop decorator

