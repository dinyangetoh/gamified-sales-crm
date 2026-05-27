import { defineConfig } from 'prisma/config'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(__dirname, '.env') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
  migrations: {
    seed: 'npx ts-node -r dotenv/config -r tsconfig-paths/register prisma/seed.ts',
  },
})
