import { z } from 'zod';

// --- Field-level schema ---
const FieldType = z.enum(['string', 'number', 'boolean', 'date']);

const FieldDefinition = z.object({
  type: FieldType,
  primary: z.boolean().optional(),
  required: z.boolean().optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  references: z.string().optional(),
});

const TableDefinition = z.object({
  fields: z.record(FieldDefinition),
});

// --- Top-level schemas ---
const MetadataSchema = z.object({
  appName: z.string().min(1),
  theme: z.enum(['dark', 'light']),
  defaultLanguage: z.string().min(2),
  supportedLanguages: z.array(z.string()).min(1),
});

const AuthSchema = z.object({
  enabled: z.boolean(),
  methods: z.array(z.enum(['email'])),
  protectedRoutes: z.array(z.string()),
});

const SchemaDefinition = z.record(TableDefinition);

// --- Recursive component node type ---
export interface ComponentNodeType {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: ComponentNodeType[];
}

// Base component schema — every component MUST have id and type
const BaseComponentSchema = z.object({
  id: z.string().min(1, { message: 'Component "id" is required and must be non-empty' }),
  type: z.string().min(1, { message: 'Component "type" is required and must be non-empty' }),
  props: z.record(z.unknown()).optional(),
  children: z.lazy(() => z.array(ComponentNodeSchema).optional()),
});

// StatCard-specific prop validation
const StatCardPropsSchema = z.object({
  label: z.string().min(1, { message: 'StatCard requires a "label" prop' }),
  resource: z.string().min(1, { message: 'StatCard requires a "resource" prop' }),
  icon: z.string().optional().default('FolderKanban'),
  color: z.enum(['cyan', 'green', 'amber', 'rose']).optional().default('cyan'),
  filter: z.record(z.unknown()).optional(),
});

// DataTable-specific prop validation
const DataTablePropsSchema = z.object({
  resource: z.string().min(1, { message: 'DataTable requires a "resource" prop' }),
  columns: z.array(z.string().min(1)).min(1, { message: 'DataTable requires at least one column' }),
  searchable: z.boolean().optional().default(true),
  creatable: z.boolean().optional().default(true),
  editable: z.boolean().optional().default(true),
  deletable: z.boolean().optional().default(true),
});

// Map component type strings to their prop schemas
const ComponentPropSchemas: Record<string, z.ZodType> = {
  StatCard: StatCardPropsSchema,
  DataTable: DataTablePropsSchema,
};

// The recursive component node schema
const ComponentNodeSchema: z.ZodType<ComponentNodeType> = z.lazy(() => BaseComponentSchema);

// --- Section and Page schemas ---
const SectionNode = z.object({
  id: z.string().min(1),
  type: z.literal('Section'),
  props: z.object({
    title: z.string(),
    columns: z.number().min(1).max(12),
  }).optional(),
  children: z.array(ComponentNodeSchema),
});

const PageNode = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().optional(),
  sections: z.array(SectionNode),
});

const LayoutSchema = z.object({
  pages: z.array(PageNode),
});

const LocalizationSchema = z.record(z.record(z.string()));

// --- Full app config schema ---
export const AppConfigSchema = z.object({
  metadata: MetadataSchema,
  auth: AuthSchema,
  schema: SchemaDefinition,
  layout: LayoutSchema,
  localization: LocalizationSchema.optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type SectionNodeType = z.infer<typeof SectionNode>;
export type PageNodeType = z.infer<typeof PageNode>;
export type FieldTypeEnum = z.infer<typeof FieldType>;
export type FieldDefinitionType = z.infer<typeof FieldDefinition>;

// --- Validation result types ---
export interface ComponentValidationResult {
  valid: boolean;
  errors: string[];
  missingProps: string[];
}

// Validate the full config
export function validateConfig(json: unknown): { success: boolean; data?: AppConfig; errors?: z.ZodError } {
  const result = AppConfigSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Validate a single component's props against its registered schema
export function validateComponentProps(
  type: string,
  props: Record<string, unknown> | undefined
): ComponentValidationResult {
  const propSchema = ComponentPropSchemas[type];

  if (!propSchema) {
    // Unknown component type — not a prop error, but type is unregistered
    return { valid: false, errors: [`Component type "${type}" is not registered`], missingProps: [] };
  }

  const result = propSchema.safeParse(props || {});
  if (result.success) {
    return { valid: true, errors: [], missingProps: [] };
  }

  const errors = result.error.errors.map((e) => e.message);
  const missingProps = result.error.errors
    .filter((e) => e.code === 'invalid_type' || e.code === 'too_small')
    .map((e) => String(e.path[0]));

  return { valid: false, errors, missingProps };
}

// Get the list of registered component types
export function getRegisteredComponentTypes(): string[] {
  return Object.keys(ComponentPropSchemas);
}
