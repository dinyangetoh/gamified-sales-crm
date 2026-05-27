import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl =
      configService.get<string>('DATABASE.URL') ?? configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Copy env.example to .env and configure DATABASE_URL (or DATABASE.URL).',
      );
    }

    const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl:
        databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true')
          ? { rejectUnauthorized }
          : false,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        configService.get<string>('APP.NODE_ENV') === 'development'
          ? ['info', 'warn', 'error']
          : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect: ${message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
