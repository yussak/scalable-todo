import { PrismaClient } from "@prisma/client";

if (
  // todo: DATABASE_URLは廃止(動的に作れるため)
  process.env.DATABASE_URL == null &&
  process.env.DB_USERNAME != null &&
  process.env.DB_PASSWORD != null &&
  process.env.DB_HOSTNAME != null &&
  process.env.DB_DBNAME != null
) {
  process.env.DATABASE_URL = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}:5432/${process.env.DB_DBNAME}`;
}

const prisma = new PrismaClient();

export default prisma;
