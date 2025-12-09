/**
 * Script to create or update an owner account.
 *
 * Usage (env or args):
 *   OWNER_EMAIL=owner@example.com OWNER_PASSWORD=ChangeMe123 npm run seed:owner
 *   or
 *   npm run seed:owner -- --email=owner@example.com --password=ChangeMe123
 *
 * Optional env/args:
 *   OWNER_USERNAME (default: email prefix)
 *   OWNER_FIRST_NAME (default: "Owner")
 *   OWNER_LAST_NAME  (default: "Account")
 */
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users/users.service';
import { AccountsService } from '../modules/accounts/accounts.service';
import { PasswordUtil } from '../common/utils/password.util';
import { AppModule } from '../app.module';

const logger = new Logger('CreateOwnerScript');

type OwnerInputs = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
};

function getArgValue(flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function readInputs(): OwnerInputs {
  const email =
    process.env.OWNER_EMAIL ||
    getArgValue('email') ||
    getArgValue('e');
  const password =
    process.env.OWNER_PASSWORD ||
    getArgValue('password') ||
    getArgValue('p');
  const username =
    process.env.OWNER_USERNAME ||
    getArgValue('username') ||
    (email ? email.split('@')[0] : undefined);
  const firstName =
    process.env.OWNER_FIRST_NAME ||
    getArgValue('firstName') ||
    'Owner';
  const lastName =
    process.env.OWNER_LAST_NAME ||
    getArgValue('lastName') ||
    'Account';

  if (!email || !password) {
    logger.error('OWNER_EMAIL and OWNER_PASSWORD are required (env or args).');
    process.exit(1);
  }

  return {
    email: email.toLowerCase(),
    password,
    username: (username || 'owner').toLowerCase(),
    firstName,
    lastName,
  };
}

async function bootstrap() {
  // Ensure API process modules load (Users/Accounts/Auth)
  process.env.PROCESS_TYPE = process.env.PROCESS_TYPE || 'api';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const inputs = readInputs();
    const usersService = app.get(UsersService);
    const accountsService = app.get(AccountsService);
    const configService = app.get(ConfigService);

    const existingAccount = await accountsService.findByEmail(inputs.email);

    const hashedPassword = await PasswordUtil.hash(
      inputs.password,
      configService,
    );

    if (existingAccount) {
      logger.log(
        `Account exists for ${inputs.email}. Ensuring role=owner and updating password.`,
      );

      const userId =
        (existingAccount as any)._id?.toString?.() ||
        existingAccount.userId?.toString();

      if (userId) {
        await usersService.update(userId, {
          role: 'owner',
          isActive: true,
        });
      }

      await accountsService.update(existingAccount.id, {
        emailVerified: true,
        isActive: true,
      });

      await accountsService.updatePassword(
        existingAccount.id,
        hashedPassword,
      );

      logger.log('Owner account updated successfully.');
    } else {
      logger.log(`Creating new owner account for ${inputs.email}...`);

      const user = await usersService.create({
        username: inputs.username,
        firstName: inputs.firstName,
        lastName: inputs.lastName,
        displayName: `${inputs.firstName} ${inputs.lastName}`.trim(),
        role: 'owner',
        isActive: true,
      });

      await accountsService.create({
        userId: user._id,
        email: inputs.email,
        password: hashedPassword,
        emailVerified: true,
        accountType: 'email',
        isActive: true,
      });

      logger.log('Owner account created successfully.');
    }
  } catch (error) {
    logger.error('Failed to create/update owner account', error as any);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
