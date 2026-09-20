import { z } from 'zod';

export const foreignKeySchema = z.object({
  targetTable: z.string(),
  targetColumn: z.string(),
  onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).default('CASCADE'),
});

export const databaseColumnSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(), // e.g. 'uuid', 'text', 'integer', 'boolean', 'timestamptz', 'jsonb', 'numeric'
  isPrimaryKey: z.boolean().optional().default(false),
  isNullable: z.boolean().optional().default(true),
  isUnique: z.boolean().optional().default(false),
  defaultValue: z.string().optional(),
  foreignKey: foreignKeySchema.optional(),
});

export const databaseIndexSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  isUnique: z.boolean().optional().default(false),
});

export const databaseTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  columns: z.array(databaseColumnSchema),
  indexes: z.array(databaseIndexSchema).optional().default([]),
  position: z.object({ x: z.number(), y: z.number() }).optional().default({ x: 0, y: 0 }),
});

export const fullDatabaseDesignSchema = z.object({
  id: z.string().optional(),
  project_id: z.string(),
  title: z.string().optional().default('PostgreSQL Database Design'),
  engine: z.string().optional().default('postgresql'),
  tables: z.array(databaseTableSchema),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DatabaseColumn = z.infer<typeof databaseColumnSchema>;
export type DatabaseIndex = z.infer<typeof databaseIndexSchema>;
export type DatabaseTable = z.infer<typeof databaseTableSchema>;
export type FullDatabaseDesign = z.infer<typeof fullDatabaseDesignSchema>;

export interface DesignWarning {
  type: 'MISSING_PRIMARY_KEY' | 'INVALID_RELATIONSHIP' | 'DUPLICATE_COLUMN' | 'MISSING_INDEX' | 'UNSAFE_DESIGN';
  severity: 'warning' | 'error';
  tableName: string;
  columnName?: string;
  message: string;
}
