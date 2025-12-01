/**
 * Email Job Data Interfaces
 * 
 * Defines the data structure for different types of email jobs
 */

export enum EmailJobType {
    WELCOME = 'welcome',
    FORGOT_PASSWORD = 'forgot-password',
    PASSWORD_CHANGED = 'password-changed',
    VERIFY_EMAIL = 'verify-email',
    ACCOUNT_DELETION = 'account-deletion',
}

/**
 * Base email job data
 */
export interface BaseEmailJobData {
    type: EmailJobType;
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Welcome email job data
 */
export interface WelcomeEmailJobData extends BaseEmailJobData {
    type: EmailJobType.WELCOME;
    name: string;
    email: string;
    verificationToken?: string;
}

/**
 * Forgot password email job data
 */
export interface ForgotPasswordEmailJobData extends BaseEmailJobData {
    type: EmailJobType.FORGOT_PASSWORD;
    name: string;
    email: string;
    resetToken: string;
    resetUrl: string;
}

/**
 * Password changed email job data
 */
export interface PasswordChangedEmailJobData extends BaseEmailJobData {
    type: EmailJobType.PASSWORD_CHANGED;
    name: string;
    email: string;
}

/**
 * Verify email job data
 */
export interface VerifyEmailJobData extends BaseEmailJobData {
    type: EmailJobType.VERIFY_EMAIL;
    name: string;
    email: string;
    verificationToken: string;
    verificationUrl: string;
}

/**
 * Account deletion email job data
 */
export interface AccountDeletionEmailJobData extends BaseEmailJobData {
    type: EmailJobType.ACCOUNT_DELETION;
    name: string;
    email: string;
    confirmationToken: string;
    deletionUrl: string;
}

/**
 * Union type for all email job data types
 */
export type EmailJobData =
    | WelcomeEmailJobData
    | ForgotPasswordEmailJobData
    | PasswordChangedEmailJobData
    | VerifyEmailJobData
    | AccountDeletionEmailJobData;

