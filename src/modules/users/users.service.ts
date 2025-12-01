import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { SessionsService } from '../sessions/sessions.service';
import { AccountsService } from '../accounts/accounts.service';
import { PortfolioProjectsService } from '../portfolio/services/portfolio-projects.service';
import { PortfolioCompaniesService } from '../portfolio/services/portfolio-companies.service';
import { PortfolioSkillsService } from '../portfolio/services/portfolio-skills.service';
import { PortfolioExperiencesService } from '../portfolio/services/portfolio-experiences.service';
import { PortfolioEducationService } from '../portfolio/services/portfolio-education.service';
import { PortfolioCertificationsService } from '../portfolio/services/portfolio-certifications.service';
import { PortfolioBlogService } from '../portfolio/services/portfolio-blog.service';
import { PortfolioTestimonialsService } from '../portfolio/services/portfolio-testimonials.service';
import { PortfolioContactsService } from '../portfolio/services/portfolio-contacts.service';
import { PortfolioProfileService } from '../portfolio/services/portfolio-profile.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private sessionsService: SessionsService,
        private accountsService: AccountsService,
        private portfolioProjectsService: PortfolioProjectsService,
        private portfolioCompaniesService: PortfolioCompaniesService,
        private portfolioSkillsService: PortfolioSkillsService,
        private portfolioExperiencesService: PortfolioExperiencesService,
        private portfolioEducationService: PortfolioEducationService,
        private portfolioCertificationsService: PortfolioCertificationsService,
        private portfolioBlogService: PortfolioBlogService,
        private portfolioTestimonialsService: PortfolioTestimonialsService,
        private portfolioContactsService: PortfolioContactsService,
        private portfolioProfileService: PortfolioProfileService,
    ) { }

    async create(userData: Partial<User>): Promise<UserDocument> {
        const user = new this.userModel(userData);
        return user.save();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findByUsername(username: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ username: username.toLowerCase() }).exec();
    }

    async update(
        id: string,
        updateData: Partial<User>,
    ): Promise<UserDocument | null> {
        return this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.userModel
            .findByIdAndUpdate(id, { lastLoginAt: new Date() })
            .exec();
    }

    async updateProfile(
        id: string,
        updateData: {
            firstName?: string;
            lastName?: string;
            displayName?: string;
            bio?: string;
            location?: string;
            website?: string;
        },
    ): Promise<UserDocument> {
        // Remove undefined values
        const cleanUpdateData: any = {};
        if (updateData.firstName !== undefined)
            cleanUpdateData.firstName = updateData.firstName;
        if (updateData.lastName !== undefined)
            cleanUpdateData.lastName = updateData.lastName;
        if (updateData.displayName !== undefined)
            cleanUpdateData.displayName = updateData.displayName;
        if (updateData.bio !== undefined) cleanUpdateData.bio = updateData.bio;
        if (updateData.location !== undefined)
            cleanUpdateData.location = updateData.location;
        if (updateData.website !== undefined)
            cleanUpdateData.website = updateData.website;

        const updated = await this.userModel
            .findByIdAndUpdate(id, cleanUpdateData, { new: true })
            .exec();

        if (!updated) {
            throw new Error('User not found');
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.userModel.findByIdAndDelete(id).exec();
    }

    async deactivateAccount(userId: string): Promise<UserDocument> {
        const updated = await this.userModel
            .findByIdAndUpdate(userId, { isActive: false }, { new: true })
            .exec();

        if (!updated) {
            throw new Error('User not found');
        }

        return updated;
    }

    async reactivateAccount(userId: string): Promise<UserDocument> {
        const updated = await this.userModel
            .findByIdAndUpdate(userId, { isActive: true }, { new: true })
            .exec();

        if (!updated) {
            throw new Error('User not found');
        }

        return updated;
    }

    async deleteAccount(userId: string, accountId: string): Promise<void> {
        this.logger.log(`Starting account deletion for user ${userId}`);

        try {
            // 1. Delete all portfolio data
            this.logger.log(`Deleting portfolio data for user ${userId}`);
            await Promise.all([
                this.portfolioProjectsService.deleteAllByUserId(userId),
                this.portfolioCompaniesService.deleteAllByUserId(userId),
                this.portfolioSkillsService.deleteAllByUserId(userId),
                this.portfolioExperiencesService.deleteAllByUserId(userId),
                this.portfolioEducationService.deleteAllByUserId(userId),
                this.portfolioCertificationsService.deleteAllByUserId(userId),
                this.portfolioBlogService.deleteAllByUserId(userId),
                this.portfolioTestimonialsService.deleteAllByUserId(userId),
                this.portfolioContactsService.deleteAllByUserId(userId),
                this.portfolioProfileService.deleteByUserId(userId),
            ]);

            // 2. Delete all sessions (hard delete)
            this.logger.log(`Deleting sessions for user ${userId}`);
            const sessions = await this.sessionsService.findByUserId(userId);
            for (const session of sessions) {
                const sessionId = (session as any)._id?.toString() || (session as any).id;
                if (sessionId) {
                    await this.sessionsService.delete(sessionId);
                }
            }

            // 3. Delete account
            this.logger.log(`Deleting account ${accountId}`);
            await this.accountsService.delete(accountId);

            // 4. Delete user
            this.logger.log(`Deleting user ${userId}`);
            await this.delete(userId);

            this.logger.log(`Account deletion completed for user ${userId}`);
        } catch (error) {
            this.logger.error(`Error during account deletion for user ${userId}`, error);
            throw error;
        }
    }

    /**
     * Export all user data for account export
     * Aggregates all user-related data from different collections
     */
    async exportAccountData(userId: string): Promise<any> {
        this.logger.log(`Exporting account data for user ${userId}`);

        try {
            // Get user data
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const userDoc = user.toObject ? user.toObject() : user;

            // Get account data
            const account = await this.accountsService.findByUserId(userId);
            const accountDoc = account?.toObject ? account.toObject() : account;

            // Get all portfolio data (without pagination - fetch all)
            const [
                projectsResult,
                companiesResult,
                skillsFlat,
                experiencesResult,
                educationResult,
                certificationsResult,
                blogResult,
                testimonialsResult,
                contactsResult,
                portfolioProfile,
            ] = await Promise.all([
                // Projects - fetch all
                this.portfolioProjectsService.findAll(userId, 1, 10000),
                // Companies - fetch all
                this.portfolioCompaniesService.findAll(userId, 1, 10000, true),
                // Skills - get flat list
                this.portfolioSkillsService.findAllFlat(userId),
                // Experiences - fetch all
                this.portfolioExperiencesService.findAll(userId, 1, 10000, true, true),
                // Education - fetch all
                this.portfolioEducationService.findAll(userId, 1, 10000, true),
                // Certifications - fetch all
                this.portfolioCertificationsService.findAll(userId, 1, 10000, true),
                // Blog - fetch all
                this.portfolioBlogService.findAll(userId, 1, 10000),
                // Testimonials - fetch all
                this.portfolioTestimonialsService.findAll(userId, 1, 10000, true),
                // Contacts - fetch all
                this.portfolioContactsService.findAll(userId, 1, 10000, undefined, true),
                // Portfolio Profile
                this.portfolioProfileService.getByUserId(userId),
            ]);

            // Get sessions
            const sessions = await this.sessionsService.findByUserId(userId);

            // Transform data to plain objects
            const transformDoc = (doc: any) => {
                if (!doc) return null;
                const obj = doc.toObject ? doc.toObject() : doc;
                // Convert ObjectId to string
                if (obj._id) {
                    obj.id = obj._id.toString();
                    delete obj._id;
                }
                // Convert other ObjectIds to strings
                Object.keys(obj).forEach((key) => {
                    if (obj[key] && typeof obj[key] === 'object' && obj[key].constructor?.name === 'ObjectID') {
                        obj[key] = obj[key].toString();
                    } else if (obj[key] && typeof obj[key] === 'object' && obj[key]._id) {
                        obj[key].id = obj[key]._id.toString();
                        delete obj[key]._id;
                    }
                });
                return obj;
            };

            // Build export data structure
            const exportData = {
                exportedAt: new Date().toISOString(),
                user: {
                    id: userDoc._id?.toString() || userDoc.id,
                    username: userDoc.username,
                    firstName: userDoc.firstName,
                    lastName: userDoc.lastName,
                    displayName: userDoc.displayName,
                    avatar: userDoc.avatar,
                    role: userDoc.role,
                    bio: userDoc.bio,
                    location: userDoc.location,
                    website: userDoc.website,
                    isActive: userDoc.isActive,
                    lastLoginAt: userDoc.lastLoginAt,
                    createdAt: userDoc.createdAt,
                    updatedAt: userDoc.updatedAt,
                },
                account: accountDoc
                    ? {
                        id: accountDoc._id?.toString() || accountDoc.id,
                        email: accountDoc.email,
                        emailVerified: accountDoc.emailVerified,
                        accountType: accountDoc.accountType,
                        createdAt: accountDoc.createdAt,
                        updatedAt: accountDoc.updatedAt,
                    }
                    : null,
                sessions: sessions.map(transformDoc),
                portfolio: {
                    profile: transformDoc(portfolioProfile),
                    projects: projectsResult.projects.map(transformDoc),
                    companies: companiesResult.companies.map(transformDoc),
                    skills: skillsFlat.map(transformDoc),
                    experiences: experiencesResult.experiences.map(transformDoc),
                    education: educationResult.education.map(transformDoc),
                    certifications: certificationsResult.certifications.map(transformDoc),
                    blog: blogResult.posts.map(transformDoc),
                    testimonials: testimonialsResult.testimonials.map(transformDoc),
                    contacts: contactsResult.contacts.map(transformDoc),
                },
            };

            return exportData;
        } catch (error) {
            this.logger.error(`Error exporting account data for user ${userId}`, error);
            throw error;
        }
    }
}
