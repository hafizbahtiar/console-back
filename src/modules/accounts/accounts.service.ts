import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import * as crypto from 'crypto';

@Injectable()
export class AccountsService {
    constructor(
        @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    ) { }

    async create(accountData: Partial<Account>): Promise<AccountDocument> {
        const account = new this.accountModel(accountData);
        return account.save();
    }

    async findById(id: string): Promise<AccountDocument | null> {
        return this.accountModel.findById(id).exec();
    }

    async findByEmail(email: string): Promise<AccountDocument | null> {
        return this.accountModel.findOne({ email: email.toLowerCase() }).exec();
    }

    async findByUserId(userId: string): Promise<AccountDocument | null> {
        return this.accountModel.findOne({ userId }).exec();
    }

    async update(
        id: string,
        updateData: Partial<Account>,
    ): Promise<AccountDocument | null> {
        return this.accountModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
    }

    async updateEmailVerification(
        token: string,
    ): Promise<AccountDocument | null> {
        const account = await this.accountModel
            .findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: new Date() },
            })
            .exec();

        if (!account) {
            throw new NotFoundException('Invalid or expired verification token');
        }

        account.emailVerified = true;
        account.emailVerificationToken = undefined;
        account.emailVerificationExpires = undefined;
        return account.save();
    }

    async generatePasswordResetToken(email: string): Promise<string> {
        const account = await this.findByEmail(email);
        if (!account) {
            // Don't reveal if email exists
            return '';
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 hour expiration

        account.passwordResetToken = token;
        account.passwordResetExpires = expires;
        await account.save();

        return token;
    }

    async resetPassword(
        token: string,
        newPassword: string,
    ): Promise<AccountDocument | null> {
        const account = await this.accountModel
            .findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: new Date() },
            })
            .exec();

        if (!account) {
            throw new NotFoundException('Invalid or expired reset token');
        }

        account.password = newPassword;
        account.passwordResetToken = undefined;
        account.passwordResetExpires = undefined;
        return account.save();
    }

    async updatePassword(
        accountId: string,
        newPassword: string,
    ): Promise<AccountDocument | null> {
        return this.accountModel
            .findByIdAndUpdate(
                accountId,
                { password: newPassword },
                { new: true },
            )
            .exec();
    }

    async generateEmailVerificationToken(accountId: string): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setDate(expires.getDate() + 1); // 1 day expiration

        await this.accountModel
            .findByIdAndUpdate(accountId, {
                emailVerificationToken: token,
                emailVerificationExpires: expires,
            })
            .exec();

        return token;
    }

    async generateAccountDeletionToken(accountId: string): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 24); // 24 hours expiration

        await this.accountModel
            .findByIdAndUpdate(accountId, {
                accountDeletionToken: token,
                accountDeletionExpires: expires,
            })
            .exec();

        return token;
    }

    async verifyAccountDeletionToken(token: string): Promise<AccountDocument | null> {
        const account = await this.accountModel
            .findOne({
                accountDeletionToken: token,
                accountDeletionExpires: { $gt: new Date() },
            })
            .exec();

        if (!account) {
            throw new NotFoundException('Invalid or expired account deletion token');
        }

        return account;
    }

    async delete(id: string): Promise<void> {
        await this.accountModel.findByIdAndDelete(id).exec();
    }

    /**
     * Cleanup expired account deletion tokens
     * Removes accountDeletionToken and accountDeletionExpires fields for expired tokens
     */
    async cleanupExpiredDeletionTokens(): Promise<number> {
        const result = await this.accountModel
            .updateMany(
                {
                    accountDeletionExpires: { $lt: new Date() },
                    accountDeletionToken: { $exists: true },
                },
                {
                    $unset: {
                        accountDeletionToken: '',
                        accountDeletionExpires: '',
                    },
                },
            )
            .exec();
        return result.modifiedCount || 0;
    }
}
