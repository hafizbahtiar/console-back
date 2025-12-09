import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({
        required: true,
        unique: true, // unique: true automatically creates an index
        lowercase: true,
        trim: true,
    })
    email: string;

    @Prop({ required: true })
    password: string; // Hashed with Argon2

    @Prop({ default: false })
    emailVerified: boolean;

    @Prop()
    emailVerificationToken?: string;

    @Prop()
    emailVerificationExpires?: Date;

    @Prop()
    passwordResetToken?: string;

    @Prop()
    passwordResetExpires?: Date;

    @Prop()
    accountDeletionToken?: string;

    @Prop()
    accountDeletionExpires?: Date;

    @Prop({ default: 'email' })
    accountType: 'email' | 'oauth'; // For future OAuth support

    @Prop()
    oauthProvider?: string; // 'github', 'google', etc.

    @Prop()
    oauthProviderId?: string; // OAuth provider user ID

    @Prop({ default: true })
    isActive: boolean;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Indexes
// Note: email unique index is created by unique: true in @Prop decorator
// Note: userId index is created by index: true in @Prop decorator
AccountSchema.index({ emailVerificationToken: 1 });
AccountSchema.index({ passwordResetToken: 1 });
AccountSchema.index({ accountDeletionToken: 1 });
AccountSchema.index({ oauthProvider: 1, oauthProviderId: 1 });
