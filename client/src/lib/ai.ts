import { generateProjectFromPrompt, type GeneratedProject } from '@/lib/templates';

export type { GeneratedProject, ProjectFile, TemplateKind } from '@/lib/templates';

export async function generateApp(prompt: string): Promise<GeneratedProject> {
  return generateProjectFromPrompt(prompt);
}
