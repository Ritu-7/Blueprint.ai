'use client';

interface ErrorCardProps {
  componentType: string;
  componentId?: string;
  errors: string[];
  missingProps: string[];
}

export function ErrorCard({ componentType, componentId, errors, missingProps }: ErrorCardProps) {
  const isUnknownType = errors.length === 1 && errors[0].includes('not registered');

  return (
    <div
      className={`rounded-xl border p-5 backdrop-blur-md ${
        isUnknownType
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-rose-500/30 bg-rose-500/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isUnknownType ? 'bg-amber-500/10' : 'bg-rose-500/10'
          }`}
        >
          {isUnknownType ? (
            <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-semibold ${
                isUnknownType ? 'text-amber-300' : 'text-rose-300'
              }`}
            >
              {isUnknownType ? 'Unknown Component' : 'Invalid Component'}
            </h3>
            {componentId && (
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-500">
                #{componentId}
              </code>
            )}
          </div>

          <p
            className={`mt-1 text-xs ${
              isUnknownType ? 'text-amber-400/70' : 'text-rose-400/70'
            }`}
          >
            Type: <code className="font-mono text-zinc-300">{componentType}</code>
          </p>

          {missingProps.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-rose-400">Missing required props:</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {missingProps.map((prop) => (
                  <span
                    key={prop}
                    className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-mono text-rose-300"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {errors.map((err, i) => (
                <li key={i} className="text-[11px] text-zinc-500">
                  {err}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[10px] text-zinc-600">
            This component was replaced with an ErrorCard to prevent the app from crashing.
            Fix the JSON blueprint to resolve this issue.
          </p>
        </div>
      </div>
    </div>
  );
}

