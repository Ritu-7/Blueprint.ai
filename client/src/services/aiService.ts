import { generateProjectFromPrompt, detectTemplateKind } from '@/lib/templates';
import type { GeneratedProject, TemplateKind } from '@/types/project';
import { logger } from '@/lib/logger/logger';

export class AIService {
  static generateProject(prompt: string): GeneratedProject {
    logger.info(`Generating project for prompt: "${prompt.slice(0, 50)}..."`, 'aiService');
    const generated = generateProjectFromPrompt(prompt);
    logger.info(`Generated project "${generated.name}" of kind [${generated.kind}]`, 'aiService');
    return generated;
  }

  static detectKind(prompt: string): TemplateKind {
    return detectTemplateKind(prompt);
  }
}
