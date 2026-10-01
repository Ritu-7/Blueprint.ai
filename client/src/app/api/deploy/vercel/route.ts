import { NextRequest } from 'next/server';
import { vercelDeploySchema } from '@/validators/deploy';
import { validateRequestBody } from '@/lib/validation/validate';
import { apiSuccess, apiError } from '@/lib/api/response';
import { handleApiError } from '@/lib/errors/handler';
import { env } from '@/config/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { projectName, files, vercelToken } = await validateRequestBody(
      vercelDeploySchema,
      request
    );

    const token = (vercelToken || env.VERCEL_TOKEN || process.env.VERCEL_TOKEN || '').trim();

    if (!token) {
      return apiError(
        'Vercel API token is missing. Please provide a token in the deployment dialog or set VERCEL_TOKEN in environment.',
        400,
        'MISSING_VERCEL_TOKEN'
      );
    }

    const safeName =
      projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50) || 'blueprint-app';

    // Format files array for Vercel Create Deployment API (/v13/deployments)
    const vercelFiles = files.map((f) => {
      const cleanPath = f.path.startsWith('/') ? f.path.slice(1) : f.path;
      return {
        file: cleanPath,
        data: f.content || '',
      };
    });

    // Ensure package.json exists for Vercel Next.js builder
    if (!vercelFiles.some((f) => f.file === 'package.json')) {
      vercelFiles.push({
        file: 'package.json',
        data: JSON.stringify(
          {
            name: safeName,
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
            },
            dependencies: {
              next: '^14.2.0',
              react: '^18.3.0',
              'react-dom': '^18.3.0',
              'lucide-react': '^0.400.0',
            },
          },
          null,
          2
        ),
      });
    }

    // Call Vercel Create Deployment API
    const vercelRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        files: vercelFiles,
        projectSettings: {
          framework: 'nextjs',
        },
      }),
    });

    const responseData = await vercelRes.json();

    if (!vercelRes.ok) {
      const errorMsg =
        responseData?.error?.message || responseData?.message || 'Vercel API request failed';
      return apiError(
        `Vercel deployment failed: ${errorMsg}`,
        vercelRes.status,
        'VERCEL_DEPLOY_FAILED',
        responseData
      );
    }

    const rawUrl = responseData.url;
    const deployUrl = rawUrl ? `https://${rawUrl}` : null;

    return apiSuccess({
      deploymentId: responseData.id,
      url: deployUrl,
      rawUrl: rawUrl,
      inspectorUrl: responseData.inspectorUrl,
      name: responseData.name,
      readyState: responseData.readyState,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'api/deploy/vercel');
  }
}
