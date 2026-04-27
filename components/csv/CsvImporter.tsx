'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import { createRecord } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';

interface CsvImporterProps {
  resource: string;
  onImportComplete: () => void;
}

export function CsvImporter({ resource, onImportComplete }: CsvImporterProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setStatus('parsing');
    setErrorMessage('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, unknown>[];
        if (rows.length === 0) {
          setStatus('error');
          setErrorMessage('CSV file is empty');
          return;
        }

        setStatus('importing');
        setProgress({ current: 0, total: rows.length });

        let imported = 0;
        let failed = 0;

        for (let i = 0; i < rows.length; i++) {
          try {
            const record: Record<string, unknown> = {
              id: crypto.randomUUID(),
            };
            Object.entries(rows[i]).forEach(([key, value]) => {
              if (value !== '' && value !== null && value !== undefined) {
                const numVal = Number(value);
                if (value === 'true') {
                  record[key] = true;
                } else if (value === 'false') {
                  record[key] = false;
                } else if (!isNaN(numVal) && value !== '') {
                  record[key] = numVal;
                } else {
                  record[key] = value;
                }
              }
            });

            await createRecord(resource, record);
            imported++;
          } catch {
            failed++;
          }
          setProgress({ current: i + 1, total: rows.length });
        }

        if (failed === 0) {
          setStatus('success');
          setTimeout(() => onImportComplete(), 1500);
        } else {
          setStatus('error');
          setErrorMessage(`Imported ${imported} rows, ${failed} failed`);
        }
      },
      error: (err) => {
        setStatus('error');
        setErrorMessage(err.message);
      },
    });
  }, [resource, onImportComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
          dragOver
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-white/[0.08] bg-white/[0.02]'
        }`}
      >
        <Upload className={`mb-3 h-8 w-8 ${dragOver ? 'text-cyan-400' : 'text-zinc-600'}`} />
        <p className="text-sm text-zinc-400">{t('csv.drag_drop')}</p>
        <p className="mt-1 text-xs text-zinc-600">or</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
        >
          <FileText className="mr-1 h-3.5 w-3.5" />
          {t('csv.browse')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {status === 'importing' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{t('csv.importing')}</span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">{t('csv.success')}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{t('csv.error')}: {errorMessage}</span>
        </div>
      )}
    </div>
  );
}
