'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAll, createRecord, updateRecord, deleteRecord } from '@/lib/database';
import type { ComponentNodeType } from '@/config/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, FileUp, CircleAlert as AlertCircle } from 'lucide-react';
import { CsvImporter } from '@/components/csv/CsvImporter';
import appConfig from '@/config/appConfig.json';

interface DataTableProps {
  node: ComponentNodeType;
}

export function DataTable({ node }: DataTableProps) {
  const { t } = useTranslation();
  const props = node.props || {};
  const resource = props.resource as string;
  const columns = (props.columns as string[]) || [];
  const searchable = props.searchable !== false;
  const creatable = props.creatable !== false;
  const editable = props.editable !== false;
  const deletable = props.deletable !== false;

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCsv, setShowCsv] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const tableFields = (appConfig.schema as Record<string, { fields: Record<string, { type: string; required?: boolean; default?: unknown }> }>)[resource]?.fields || {};

  const loadData = useCallback(async () => {
    setFetchError(null);
    try {
      const result = await fetchAll(resource);
      setData(result || []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = data.filter((item) => {
    if (!search) return true;
    return columns.some((col) =>
      String(item[col] || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const openCreate = () => {
    const defaults: Record<string, unknown> = {};
    Object.entries(tableFields).forEach(([key, field]) => {
      if (field.default !== undefined && field.default !== 'now()') {
        defaults[key] = field.default;
      }
    });
    setFormData(defaults);
    setEditItem(null);
    setIsNew(true);
    setSaveError(null);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setFormData({ ...item });
    setEditItem(item);
    setIsNew(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (isNew) {
        const record = { ...formData, id: crypto.randomUUID() };
        await createRecord(resource, record);
      } else if (editItem) {
        const { id, ...updates } = formData;
        await updateRecord(resource, id as string, updates);
      }
      setEditItem(null);
      setFormData({});
      loadData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRecord(resource, deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatCellValue = (value: unknown, col: string): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (tableFields[col]?.type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-10 w-full animate-pulse rounded bg-white/5" />
        <div className="h-64 w-full animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <div>
            <p className="text-sm font-medium text-rose-300">Failed to load data</p>
            <p className="mt-1 text-xs text-rose-400/70">{fetchError}</p>
          </div>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          className="mt-4 border-rose-500/20 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
        {searchable && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder={t('common.search') + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-white/[0.08] bg-white/[0.04] pl-9 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-cyan-500/30"
            />
          </div>
        )}
        <div className="flex gap-2">
          {creatable && (
            <Button
              onClick={openCreate}
              size="sm"
              className="bg-cyan-600 text-white hover:bg-cyan-500"
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('common.create')}
            </Button>
          )}
          <Button
            onClick={() => setShowCsv(true)}
            variant="outline"
            size="sm"
            className="border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
          >
            <FileUp className="mr-1 h-4 w-4" />
            {t('csv.import')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
                >
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              {(editable || deletable) && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-zinc-600"
                >
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={String(item.id)}
                  className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                >
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-zinc-300">
                      {formatCellValue(item[col], col)}
                    </td>
                  ))}
                  {(editable || deletable) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {editable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-cyan-400"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {deletable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-rose-400"
                            onClick={() => setDeleteId(String(item.id))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3 text-xs text-zinc-600">
        {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={!!editItem || isNew} onOpenChange={(open) => { if (!open) { setEditItem(null); setIsNew(false); setFormData({}); setSaveError(null); } }}>
        <DialogContent className="border-white/[0.08] bg-zinc-950 text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {isNew ? t('common.create') : t('common.edit')} {resource.replace(/_/g, ' ')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {saveError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {saveError}
              </div>
            )}
            {Object.entries(tableFields)
              .filter(([key]) => key !== 'id' && key !== 'created_at' && key !== 'joined_at')
              .map(([key, field]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {key.replace(/_/g, ' ')}
                    {field.required && <span className="ml-1 text-rose-400">*</span>}
                  </label>
                  {field.type === 'boolean' ? (
                    <select
                      value={String(formData[key] ?? false)}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value === 'true' })}
                      className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : field.type === 'date' ? (
                    <Input
                      type="date"
                      value={formData[key] ? new Date(formData[key] as string).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="border-white/[0.08] bg-white/[0.04] text-zinc-200 focus-visible:ring-cyan-500/30"
                    />
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={String(formData[key] ?? '')}
                      onChange={(e) => setFormData({
                        ...formData,
                        [key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                      })}
                      className="border-white/[0.08] bg-white/[0.04] text-zinc-200 focus-visible:ring-cyan-500/30"
                    />
                  )}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setEditItem(null); setIsNew(false); setFormData({}); setSaveError(null); }}
              className="text-zinc-400 hover:text-zinc-200"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} className="bg-cyan-600 text-white hover:bg-cyan-500">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="border-white/[0.08] bg-zinc-950 text-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t('common.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-transparent text-zinc-400 hover:bg-white/[0.06]">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Importer */}
      {showCsv && (
        <Dialog open={showCsv} onOpenChange={setShowCsv}>
          <DialogContent className="border-white/[0.08] bg-zinc-950 text-zinc-200 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                {t('csv.import')} -- {resource.replace(/_/g, ' ')}
              </DialogTitle>
            </DialogHeader>
            <CsvImporter resource={resource} onImportComplete={() => { setShowCsv(false); loadData(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

