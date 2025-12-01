import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.interface';

export class PasswordUtil {
  private static getArgon2Options(configService: ConfigService<Config>) {
    const config = configService.get('argon2', { infer: true });
    if (!config) {
      throw new Error('Argon2 configuration not found');
    }
    return {
      type: argon2.argon2id,
      memoryCost: config.memoryCost,
      timeCost: config.timeCost,
      parallelism: config.parallelism,
    };
  }

  static async hash(
    password: string,
    configService: ConfigService<Config>,
  ): Promise<string> {
    const options = this.getArgon2Options(configService);
    return argon2.hash(password, options);
  }

  static async verify(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      return false;
    }
  }
}
