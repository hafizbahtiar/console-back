import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationPreferencesDocument = NotificationPreferences & Document;

@Schema({ timestamps: true })
export class NotificationPreferences {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    // Email notification preferences
    @Prop({ default: true })
    emailAccountActivity: boolean; // Login notifications, password changes, email changes

    @Prop({ default: true })
    emailSecurityAlerts: boolean; // Security alerts, suspicious activity

    @Prop({ default: false })
    emailMarketing: boolean; // Marketing emails, promotional content

    @Prop({ default: false })
    emailWeeklyDigest: boolean; // Weekly summary emails

    // In-app notification preferences
    @Prop({ default: true })
    inAppSystem: boolean; // System updates and important announcements

    @Prop({ default: true })
    inAppProjects: boolean; // Project updates and notifications

    @Prop({ default: true })
    inAppMentions: boolean; // Team mentions and activity feed

    // Push notification preferences (for future implementation)
    @Prop({ default: false })
    pushEnabled: boolean; // Enable push notifications

    @Prop({ default: true })
    pushBrowser: boolean; // Browser push notifications

    @Prop({ default: false })
    pushMobile: boolean; // Mobile push notifications (if mobile app is implemented)
}

export const NotificationPreferencesSchema = SchemaFactory.createForClass(NotificationPreferences);

// Indexes
// Note: userId unique index is created by unique: true in @Prop decorator

