export type ComponentNodeType = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
};

export type SectionNodeType = {
  id: string;
  props?: {
    title?: string;
    columns?: number;
  };
  children: ComponentNodeType[];
};

type ComponentSchema = {
  required: string[];
};

const componentSchemas: Record<string, ComponentSchema> = {
  StatCard: { required: ['resource'] },
  DataTable: { required: ['resource'] },
};

export function validateComponentProps(type: string, props: Record<string, unknown> = {}) {
  const schema = componentSchemas[type];
  if (!schema) {
    return {
      valid: false,
      errors: [`Component type "${type}" is not registered`],
      missingProps: [],
    };
  }

  const missingProps = schema.required.filter((name) => props[name] === undefined || props[name] === '');
  return {
    valid: missingProps.length === 0,
    errors: missingProps.map((name) => `Required prop "${name}" is missing`),
    missingProps,
  };
}
