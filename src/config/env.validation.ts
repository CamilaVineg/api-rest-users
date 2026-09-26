import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class EnvConfig {
  @IsString()
  @IsNotEmpty()
  PORT: string;

  @IsString()
  @IsNotEmpty()
  STRIPE_SECRET: string;

  @IsString()
  @IsNotEmpty()
  STRIPE_ENDPOINT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  STRIPE_SUCCESS_URL: string;

  @IsString()
  @IsNotEmpty()
  STRIPE_CANCEL_URL: string;
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const validatedConfig = plainToInstance(EnvConfig, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => {
        const constraints = Object.values(error.constraints ?? {}).join(', ');
        return `${error.property}: ${constraints}`;
      })
      .join('; ');

    throw new Error(`Invalid environment config: ${details}`);
  }

  return validatedConfig;
}
