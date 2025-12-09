import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PortfolioProfileDocument = PortfolioProfile & Document;

@Schema({ timestamps: true })
export class PortfolioProfile {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ trim: true })
    bio?: string;

    @Prop()
    avatar?: string;

    @Prop()
    resumeUrl?: string;

    @Prop({ trim: true })
    location?: string;

    @Prop({ default: false })
    availableForHire: boolean;

    @Prop()
    portfolioUrl?: string;

    @Prop({ default: 'default' })
    theme: string;

    @Prop({ default: true })
    isPublic: boolean; // Whether the portfolio is publicly accessible

    @Prop({ default: true })
    showProjects: boolean;

    @Prop({ default: true })
    showCompanies: boolean;

    @Prop({ default: true })
    showSkills: boolean;

    @Prop({ default: true })
    showExperiences: boolean;

    @Prop({ default: true })
    showEducation: boolean;

    @Prop({ default: true })
    showCertifications: boolean;

    @Prop({ default: true })
    showBlog: boolean;

    @Prop({ default: true })
    showTestimonials: boolean;

    @Prop({ default: true })
    showContacts: boolean;
}

export const PortfolioProfileSchema = SchemaFactory.createForClass(PortfolioProfile);

// Indexes
// Note: userId unique index is created by unique: true in @Prop decorator
PortfolioProfileSchema.index({ userId: 1, deletedAt: 1 }); // Compound index for common query pattern
PortfolioProfileSchema.index({ isPublic: 1 }); // For public portfolio queries
// Note: deletedAt index is created by softDeletePlugin (if plugin is applied)

