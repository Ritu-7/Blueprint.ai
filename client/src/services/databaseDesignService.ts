import { supabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger/logger';
import { AppError } from '@/lib/errors/AppError';
import { AIService } from './aiService';
import type {
  DatabaseTable,
  DatabaseColumn,
  FullDatabaseDesign,
  DesignWarning,
} from '@/validators/databaseSchema';

export class DatabaseDesignService {
  // 1. Validation Rules Engine
  static validateDatabaseDesign(tables: DatabaseTable[]): DesignWarning[] {
    const warnings: DesignWarning[] = [];
    const tableNamesMap = new Set(tables.map((t) => t.name.toLowerCase()));

    for (const table of tables) {
      // Rule 1: Missing Primary Key
      const hasPK = table.columns.some((c) => c.isPrimaryKey);
      if (!hasPK) {
        warnings.push({
          type: 'MISSING_PRIMARY_KEY',
          severity: 'error',
          tableName: table.name,
          message: `Table "${table.name}" does not have a primary key column specified.`,
        });
      }

      // Rule 2: Duplicate Columns
      const colNames = new Set<string>();
      for (const col of table.columns) {
        const lowerCol = col.name.toLowerCase();
        if (colNames.has(lowerCol)) {
          warnings.push({
            type: 'DUPLICATE_COLUMN',
            severity: 'error',
            tableName: table.name,
            columnName: col.name,
            message: `Table "${table.name}" contains duplicate column name "${col.name}".`,
          });
        }
        colNames.add(lowerCol);

        // Rule 3: Invalid Foreign Key Relationships
        if (col.foreignKey) {
          const targetTableExists = tableNamesMap.has(col.foreignKey.targetTable.toLowerCase());
          if (!targetTableExists) {
            warnings.push({
              type: 'INVALID_RELATIONSHIP',
              severity: 'error',
              tableName: table.name,
              columnName: col.name,
              message: `Column "${col.name}" references non-existent target table "${col.foreignKey.targetTable}".`,
            });
          }
        }

        // Rule 4: Unsafe Primary Key Nullability
        if (col.isPrimaryKey && col.isNullable) {
          warnings.push({
            type: 'UNSAFE_DESIGN',
            severity: 'warning',
            tableName: table.name,
            columnName: col.name,
            message: `Primary key column "${col.name}" in table "${table.name}" should be NOT NULL.`,
          });
        }
      }

      // Rule 5: Missing Timestamps
      const hasCreatedAt = table.columns.some((c) => c.name.toLowerCase() === 'created_at');
      if (!hasCreatedAt) {
        warnings.push({
          type: 'UNSAFE_DESIGN',
          severity: 'warning',
          tableName: table.name,
          message: `Table "${table.name}" is missing a "created_at" timestamp column.`,
        });
      }

      // Rule 6: Missing FK Index
      for (const col of table.columns) {
        if (col.foreignKey) {
          const isIndexed = (table.indexes || []).some((idx) => idx.columns.includes(col.name));
          if (!isIndexed) {
            warnings.push({
              type: 'MISSING_INDEX',
              severity: 'warning',
              tableName: table.name,
              columnName: col.name,
              message: `Foreign key column "${col.name}" in table "${table.name}" lacks an index for optimized joins.`,
            });
          }
        }
      }
    }

    return warnings;
  }

  // 2. PostgreSQL DDL SQL Generator
  static generatePostgreSQLScript(tables: DatabaseTable[]): string {
    let sql = `-- ==========================================================================\n`;
    sql += `-- Blueprint.ai - Generated PostgreSQL DDL Schema Script\n`;
    sql += `-- Note: Planning Script Only - Does NOT auto-execute against Supabase\n`;
    sql += `-- ==========================================================================\n\n`;
    sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

    for (const table of tables) {
      sql += `-- Table: ${table.name}\n`;
      sql += `CREATE TABLE IF NOT EXISTS public."${table.name}" (\n`;

      const colDefs = table.columns.map((col) => {
        let def = `  "${col.name}" ${col.type.toUpperCase()}`;
        if (col.isPrimaryKey) def += ` PRIMARY KEY`;
        if (!col.isNullable && !col.isPrimaryKey) def += ` NOT NULL`;
        if (col.isUnique && !col.isPrimaryKey) def += ` UNIQUE`;
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        return def;
      });

      sql += colDefs.join(',\n');
      sql += `\n);\n\n`;

      // Foreign Keys
      for (const col of table.columns) {
        if (col.foreignKey) {
          sql += `ALTER TABLE public."${table.name}"\n`;
          sql += `  ADD CONSTRAINT "fk_${table.name}_${col.name}"\n`;
          sql += `  FOREIGN KEY ("${col.name}") REFERENCES public."${col.foreignKey.targetTable}"("${col.foreignKey.targetColumn}")\n`;
          sql += `  ON DELETE ${col.foreignKey.onDelete || 'CASCADE'};\n\n`;
        }
      }

      // Indexes
      for (const idx of table.indexes || []) {
        const uniqueStr = idx.isUnique ? 'UNIQUE ' : '';
        const colsStr = idx.columns.map((c) => `"${c}"`).join(', ');
        sql += `CREATE ${uniqueStr}INDEX IF NOT EXISTS "${idx.name}" ON public."${table.name}" (${colsStr});\n`;
      }

      sql += `\n`;
    }

    return sql;
  }

  // 3. Supabase CRUD
  static async fetchDatabaseDesign(projectId: string): Promise<FullDatabaseDesign> {
    logger.info(`Fetching database design for project ${projectId}`, 'databaseDesignService');

    const { data: design } = await supabaseClient
      .from('database_designs')
      .select('id, title, engine_type')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!design) {
      return this.generateDatabaseDesign(projectId);
    }

    const { data: tableRows } = await supabaseClient
      .from('database_tables')
      .select('*')
      .eq('database_design_id', design.id);

    if (!tableRows || tableRows.length === 0) {
      return this.generateDatabaseDesign(projectId);
    }

    const tables: DatabaseTable[] = [];
    for (const tRow of tableRows) {
      const { data: colRows } = await supabaseClient
        .from('database_columns')
        .select('*')
        .eq('table_id', tRow.id);

      const columns: DatabaseColumn[] = (colRows || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.data_type,
        isPrimaryKey: c.is_primary_key || false,
        isNullable: c.is_nullable ?? true,
        isUnique: c.is_unique || false,
        defaultValue: c.default_value || undefined,
      }));

      tables.push({
        id: tRow.id,
        name: tRow.name,
        description: tRow.description || '',
        columns,
        indexes: [],
        position: tRow.position && typeof tRow.position === 'object' ? tRow.position : { x: 50, y: 50 },
      });
    }

    return {
      id: design.id,
      project_id: projectId,
      title: design.title || 'PostgreSQL Database Design',
      engine: design.engine_type || 'postgresql',
      tables,
    };
  }

  static async saveDatabaseDesign(projectId: string, tables: DatabaseTable[]): Promise<FullDatabaseDesign> {
    logger.info(`Saving database design for project ${projectId}`, 'databaseDesignService');

    // 1. Fetch or Create Design Record
    let designId: string;
    const { data: existing } = await supabaseClient
      .from('database_designs')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      designId = existing.id;
    } else {
      const { data: created, error: cErr } = await supabaseClient
        .from('database_designs')
        .insert({ project_id: projectId, title: 'PostgreSQL Database Design', engine_type: 'postgresql' })
        .select()
        .single();
      if (cErr || !created) throw new AppError(`Failed to create database design: ${cErr?.message}`);
      designId = created.id;
    }

    // 2. Clear previous tables for clean sync
    const { data: oldTables } = await supabaseClient
      .from('database_tables')
      .select('id')
      .eq('database_design_id', designId);

    if (oldTables && oldTables.length > 0) {
      const oldIds = oldTables.map((t) => t.id);
      await supabaseClient.from('database_columns').delete().in('table_id', oldIds);
      await supabaseClient.from('database_tables').delete().eq('database_design_id', designId);
    }

    // 3. Insert Tables & Columns
    for (const table of tables) {
      const { data: savedTable, error: tErr } = await supabaseClient
        .from('database_tables')
        .insert({
          database_design_id: designId,
          name: table.name,
          description: table.description,
          position: table.position,
        })
        .select()
        .single();

      if (tErr || !savedTable) continue;

      const colInserts = table.columns.map((col) => ({
        table_id: savedTable.id,
        name: col.name,
        data_type: col.type,
        is_primary_key: col.isPrimaryKey || false,
        is_nullable: col.isNullable ?? true,
        is_unique: col.isUnique || false,
        default_value: col.defaultValue || null,
      }));

      await supabaseClient.from('database_columns').insert(colInserts);
    }

    return this.fetchDatabaseDesign(projectId);
  }

  // 4. AI Generator
  static async generateDatabaseDesign(projectId: string): Promise<FullDatabaseDesign> {
    logger.info(`Generating ER database design for project ${projectId}`, 'databaseDesignService');

    const { data: project } = await supabaseClient.from('projects').select('name, prompt, kind').eq('id', projectId).single();
    const prompt = project?.prompt || 'Full-stack application';

    const blueprint = AIService.generateProject(prompt);

    const tables: DatabaseTable[] = [
      {
        id: 'tbl-users',
        name: 'users',
        description: 'User accounts and identity profiles',
        position: { x: 50, y: 50 },
        columns: [
          { id: 'col-u1', name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
          { id: 'col-u2', name: 'clerk_id', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'col-u3', name: 'email', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: true },
          { id: 'col-u4', name: 'full_name', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false },
          { id: 'col-u5', name: 'avatar_url', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false },
          { id: 'col-u6', name: 'created_at', type: 'timestamptz', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: 'NOW()' },
          { id: 'col-u7', name: 'updated_at', type: 'timestamptz', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: 'NOW()' },
        ],
        indexes: [{ name: 'idx_users_clerk_id', columns: ['clerk_id'], isUnique: true }],
      },
      {
        id: 'tbl-projects',
        name: 'projects',
        description: 'Application projects and workspace state',
        position: { x: 420, y: 50 },
        columns: [
          { id: 'col-p1', name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
          {
            id: 'col-p2',
            name: 'user_id',
            type: 'uuid',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            foreignKey: { targetTable: 'users', targetColumn: 'id', onDelete: 'CASCADE' },
          },
          { id: 'col-p3', name: 'name', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'col-p4', name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false },
          { id: 'col-p5', name: 'kind', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, defaultValue: "'dashboard'" },
          { id: 'col-p6', name: 'files', type: 'jsonb', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: "'[]'::jsonb" },
          { id: 'col-p7', name: 'status', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: "'active'" },
          { id: 'col-p8', name: 'created_at', type: 'timestamptz', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: 'NOW()' },
        ],
        indexes: [{ name: 'idx_projects_user_id', columns: ['user_id'], isUnique: false }],
      },
      {
        id: 'tbl-requirements',
        name: 'requirements',
        description: 'Functional and technical requirements specifications',
        position: { x: 50, y: 380 },
        columns: [
          { id: 'col-r1', name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
          {
            id: 'col-r2',
            name: 'project_id',
            type: 'uuid',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            foreignKey: { targetTable: 'projects', targetColumn: 'id', onDelete: 'CASCADE' },
          },
          { id: 'col-r3', name: 'title', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'col-r4', name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false },
          { id: 'col-r5', name: 'priority', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: "'medium'" },
          { id: 'col-r6', name: 'status', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: "'todo'" },
          { id: 'col-r7', name: 'created_at', type: 'timestamptz', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: 'NOW()' },
        ],
        indexes: [{ name: 'idx_requirements_project_id', columns: ['project_id'], isUnique: false }],
      },
      {
        id: 'tbl-activity-logs',
        name: 'activity_logs',
        description: 'Workspace activity trail and audit log entries',
        position: { x: 420, y: 380 },
        columns: [
          { id: 'col-a1', name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
          {
            id: 'col-a2',
            name: 'project_id',
            type: 'uuid',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            foreignKey: { targetTable: 'projects', targetColumn: 'id', onDelete: 'CASCADE' },
          },
          { id: 'col-a3', name: 'action', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false },
          { id: 'col-a4', name: 'metadata', type: 'jsonb', isPrimaryKey: false, isNullable: true, isUnique: false, defaultValue: "'{}'::jsonb" },
          { id: 'col-a5', name: 'created_at', type: 'timestamptz', isPrimaryKey: false, isNullable: false, isUnique: false, defaultValue: 'NOW()' },
        ],
        indexes: [{ name: 'idx_activity_logs_project_id', columns: ['project_id'], isUnique: false }],
      },
    ];

    const model: FullDatabaseDesign = {
      project_id: projectId,
      title: `${blueprint.name} Database Design`,
      engine: 'postgresql',
      tables,
    };

    await this.saveDatabaseDesign(projectId, tables);
    return model;
  }
}
