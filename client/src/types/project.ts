export type TemplateKind = 'todo' | 'ecommerce' | 'dashboard' | 'portfolio' | 'chat' | 'crm';

export type ProjectFileLanguage = 'tsx' | 'ts' | 'css' | 'sql' | 'json' | 'md' | 'js';

export interface ProjectFile {
  path: string;
  name: string;
  language: ProjectFileLanguage;
  content: string;
}

export interface GeneratedProject {
  id?: string;
  name: string;
  description: string;
  kind: TemplateKind;
  preview: string;
  uiCode: string;
  schema: string;
  api: string;
  files: ProjectFile[];
}

export interface BuilderProject extends GeneratedProject {
  readme: string;
  prompt: string;
}
