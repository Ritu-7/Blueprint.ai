import { supabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger/logger';
import { AppError, NotFoundError } from '@/lib/errors/AppError';
import type { FullBlueprint } from '@/validators/blueprintSchema';

export class BlueprintService {
  static async saveBlueprint(projectId: string, prompt: string, structuredData: FullBlueprint) {
    logger.info(`Saving blueprint for project ${projectId}`, 'blueprintService');

    // 1. Fetch or Create Blueprint Record
    let blueprintId: string;
    const { data: existing } = await supabaseClient
      .from('blueprints')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      blueprintId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabaseClient
        .from('blueprints')
        .insert({
          project_id: projectId,
          name: structuredData.name,
          description: structuredData.description,
        })
        .select()
        .single();

      if (createErr || !created) {
        logger.error('Failed to create blueprint record', 'blueprintService', createErr);
        throw new AppError('Failed to initialize blueprint', 500, 'DB_BLUEPRINT_CREATE_ERROR');
      }
      blueprintId = created.id;
    }

    // 2. Count existing versions to increment version number
    const { count } = await supabaseClient
      .from('blueprint_versions')
      .select('*', { count: 'exact', head: true })
      .eq('blueprint_id', blueprintId);

    const versionNumber = (count || 0) + 1;

    // 3. Create Blueprint Version Snapshot
    const { data: version, error: versionErr } = await supabaseClient
      .from('blueprint_versions')
      .insert({
        blueprint_id: blueprintId,
        version_number: versionNumber,
        prompt,
        ui_code: structuredData.uiCode,
        schema_code: structuredData.schema,
        api_code: structuredData.api,
        readme_code: JSON.stringify(structuredData.overview),
        files: structuredData.files as any,
      })
      .select()
      .single();

    if (versionErr || !version) {
      logger.error(`Failed to save version ${versionNumber}`, 'blueprintService', versionErr);
      throw new AppError('Failed to snapshot blueprint version', 500, 'DB_VERSION_CREATE_ERROR');
    }

    // 4. Update Current Version Link
    await supabaseClient
      .from('blueprints')
      .update({ current_version_id: version.id })
      .eq('id', blueprintId);

    logger.info(`Blueprint version ${versionNumber} saved successfully`, 'blueprintService');
    return { blueprintId, versionId: version.id, versionNumber };
  }

  static async fetchVersions(projectId: string) {
    logger.info(`Fetching blueprint version history for project ${projectId}`, 'blueprintService');
    const { data: blueprint } = await supabaseClient
      .from('blueprints')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!blueprint) return [];

    const { data: versions, error } = await supabaseClient
      .from('blueprint_versions')
      .select('id, version_number, prompt, created_at')
      .eq('blueprint_id', blueprint.id)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return versions || [];
  }
}
