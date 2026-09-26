import fs from 'fs';
import path from 'path';

const target = process.argv[2]; // 'sqlite' | 'supabase' | 'postgresql'

if (!target || !['sqlite', 'supabase', 'postgresql'].includes(target)) {
  console.log('Uso: node scripts/switch-db.mjs [sqlite|supabase]');
  process.exit(1);
}

const schemaPath = path.resolve('prisma', 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (target === 'sqlite') {
  schemaContent = schemaContent.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider = "sqlite"\n  url      = "file:./dev.db"\n}`
  );
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('✓ prisma/schema.prisma configurado para SQLite (desarrollo local).');
} else {
  schemaContent = schemaContent.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
  );
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('✓ prisma/schema.prisma configurado para PostgreSQL / Supabase (producción).');
}
