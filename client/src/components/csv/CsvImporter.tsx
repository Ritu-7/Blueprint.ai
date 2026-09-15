'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import { createRecord } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import appConfig from '@/config/appConfig.json';

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

  const validateSchema = useCallback((headers: string[]) => {
    const schema = (appConfig.schema as any)[resource];
    if (!schema) return { valid: false, error: `Resource ${resource} not found in schema` };

    const requiredFields = Object.entries(schema.fields)
      .filter(([_, field]: [string, any]) => field.required)
      .map(([name]) => name);

    const missingFields = requiredFields.filter(f => !headers.includes(f));
    if (missingFields.length > 0) {
      return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    return { valid: true };
  }, [resource]);

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

        const headers = results.meta.fields || [];
        const validation = validateSchema(headers);
        if (!validation.valid) {
          setStatus('error');
          setErrorMessage(validation.error || 'Invalid schema');
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
          } catch (err) {
            console.error('Import failed for row', i, err);
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
  }, [resource, onImportComplete, validateSchema]);

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
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all backdrop-blur-md ${
          dragOver
            ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
            : 'border-cyan-500/20 bg-zinc-900/40 shadow-[0_0_15px_rgba(0,0,0,0.2)]'
        }`}
      >
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-950/50 border border-cyan-500/30 ${dragOver ? 'animate-pulse border-cyan-400' : ''}`}>
          <Upload className={`h-8 w-8 ${dragOver ? 'text-cyan-400' : 'text-cyan-500/70'}`} />
        </div>
        <p className="text-sm font-medium text-zinc-300">{t('csv.drag_drop')}</p>
        <p className="mt-1 text-xs text-zinc-500 uppercase tracking-widest">or</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
        >
          <FileText className="mr-2 h-4 w-4" />
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
        <div className="space-y-3 p-4 rounded-lg bg-zinc-900/50 border border-cyan-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-cyan-500/80">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
              {t('csv.importing')}
            </span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-500 text-right uppercase tracking-tighter">
            PROCESSED: {progress.current} / {progress.total}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-emerald-400">{t('csv.success')}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-500/5 border border-rose-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-rose-400">{t('csv.error')}</span>
            <span className="text-xs text-rose-400/70">{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

