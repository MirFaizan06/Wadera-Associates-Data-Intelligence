import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Upload, Eye, EyeOff, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface Dataset {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  priceINR: number;
  isVisible: boolean;
  defaultUnit: string;
  coverImage: string | null;
  _count: { dataPoints: number; purchases: number };
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  defaultUnit: z.string().min(1),
  priceINR: z.coerce.number().positive(),
  category: z.string().optional(),
  source: z.string().optional(),
  region: z.string().optional(),
});

export default function DataDashboard() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState<string | null>(null);
  const [showAddData, setShowAddData] = useState<string | null>(null);
  const [showCoverUpload, setShowCoverUpload] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof createSchema>>({ resolver: zodResolver(createSchema) });

  const fetchDatasets = async () => {
    const res = await api.get<{ success: boolean; data: { datasets: Dataset[] } }>('/admin/data/datasets');
    setDatasets(res.data.data.datasets);
  };

  useEffect(() => { fetchDatasets().finally(() => setLoading(false)); }, []);

  const onCreate = async (data: z.infer<typeof createSchema>) => {
    await api.post('/admin/data/datasets', data);
    await fetchDatasets();
    setShowCreate(false);
    reset();
  };

  const onToggleVisibility = async (id: string, isVisible: boolean) => {
    if (isVisible) {
      await api.delete(`/admin/data/datasets/${id}`);
    } else {
      await api.put(`/admin/data/datasets/${id}`, { isVisible: true });
    }
    await fetchDatasets();
  };

  const onImportXLSX = async (id: string) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post<{ success: boolean; data: { imported: number; errors: string[] } }>(
        `/admin/data/datasets/${id}/import-xlsx`, form, { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      alert(`Imported ${res.data.data.imported} rows${res.data.data.errors.length ? `. Errors: ${res.data.data.errors.slice(0, 3).join(', ')}` : ''}`);
      setShowImport(null);
    } catch { alert('Import failed'); }
    finally { setUploading(false); }
  };

  const onUploadCover = async (id: string) => {
    const file = coverFileRef.current?.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const form = new FormData();
    form.append('image', file);
    try {
      await api.post(`/admin/data/datasets/${id}/cover-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchDatasets();
      setShowCoverUpload(null);
    } catch { alert('Cover image upload failed'); }
    finally { setCoverUploading(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Helmet><title>Data Manager - Admin</title></Helmet>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dataset Manager</h1>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" aria-hidden />New Dataset
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Create New Dataset</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-2 gap-4">
                <Input id="ds-name" label="Name *" error={errors.name?.message} {...register('name')} />
                <Input id="ds-unit" label="Default Unit *" placeholder="barrel, kWh..." error={errors.defaultUnit?.message} {...register('defaultUnit')} />
                <Input id="ds-price" label="Price (INR) *" type="number" step="0.01" error={errors.priceINR?.message} {...register('priceINR')} />
                <Input id="ds-cat" label="Category" placeholder="Energy, Commodities..." {...register('category')} />
                <Input id="ds-source" label="Source" placeholder="IEA, EIA..." {...register('source')} />
                <Input id="ds-region" label="Region" placeholder="Global, Asia..." {...register('region')} />
                <div className="col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} {...register('description')} />
                </div>
                <div className="col-span-2 flex gap-2">
                  <Button type="submit" loading={isSubmitting}>Create</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Datasets table */}
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 font-medium text-gray-600 w-8"></th>
                    <th className="pb-3 font-medium text-gray-600">Name</th>
                    <th className="pb-3 font-medium text-gray-600">Unit</th>
                    <th className="pb-3 font-medium text-gray-600">Price</th>
                    <th className="pb-3 font-medium text-gray-600">Data Points</th>
                    <th className="pb-3 font-medium text-gray-600">Sales</th>
                    <th className="pb-3 font-medium text-gray-600">Visible</th>
                    <th className="pb-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {datasets.map(d => (
                    <tr key={d.id}>
                      <td className="py-3">
                        {d.coverImage ? (
                          <img src={d.coverImage} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <Image className="h-4 w-4 text-gray-300" aria-hidden />
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{d.name}</div>
                        {d.category && <div className="text-xs text-gray-400">{d.category}</div>}
                      </td>
                      <td className="py-3 text-gray-600">{d.defaultUnit}</td>
                      <td className="py-3 font-medium">₹{d.priceINR.toLocaleString()}</td>
                      <td className="py-3 text-gray-600">{d._count.dataPoints}</td>
                      <td className="py-3 text-gray-600">{d._count.purchases}</td>
                      <td className="py-3">
                        <button onClick={() => onToggleVisibility(d.id, d.isVisible)}
                          className={`p-1 rounded ${d.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                          aria-label={d.isVisible ? 'Hide dataset' : 'Show dataset'}>
                          {d.isVisible ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => setShowAddData(showAddData === d.id ? null : d.id)}>
                            + Data
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowImport(showImport === d.id ? null : d.id)}>
                            <Upload className="h-3 w-3 mr-1" aria-hidden />XLSX
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowCoverUpload(showCoverUpload === d.id ? null : d.id)}>
                            <Image className="h-3 w-3 mr-1" aria-hidden />Cover
                          </Button>
                        </div>

                        {showImport === d.id && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-2">Upload XLSX (cols: Date(YYYY-MM), LocalCurrency/Unit, USD/Unit, Notes)</p>
                            <input type="file" accept=".xlsx,.xls" ref={fileRef} className="text-xs mb-2" />
                            <Button size="sm" loading={uploading} onClick={() => onImportXLSX(d.id)}>Import</Button>
                          </div>
                        )}

                        {showCoverUpload === d.id && (
                          <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <p className="text-xs text-gray-600 mb-2">Upload cover image (JPG/PNG/WebP, max 5MB)</p>
                            <input type="file" accept="image/jpeg,image/png,image/webp" ref={coverFileRef} className="text-xs mb-2" />
                            <Button size="sm" loading={coverUploading} onClick={() => onUploadCover(d.id)}>Upload</Button>
                          </div>
                        )}

                        {showAddData === d.id && (
                          <AddDataPointForm datasetId={d.id} onSaved={() => { setShowAddData(null); fetchDatasets(); }} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AddDataPointForm({ datasetId, onSaved }: { datasetId: string; onSaved: () => void }) {
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [usdValue, setUsdValue] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await api.post(`/admin/data/datasets/${datasetId}/data-points`, {
      points: [{
        date,
        value: parseFloat(value),
        usdValue: usdValue ? parseFloat(usdValue) : undefined,
        note: note || undefined,
      }],
    });
    onSaved();
    setSaving(false);
  };

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <input type="month" value={date} onChange={e => setDate(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1" placeholder="YYYY-MM" aria-label="Month" />
        <input type="number" value={value} onChange={e => setValue(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1" placeholder="LocalCurrency/Unit" aria-label="LocalCurrency/Unit" />
        <input type="number" value={usdValue} onChange={e => setUsdValue(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1" placeholder="USD/Unit (opt)" aria-label="USD/Unit" />
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1" placeholder="Note (opt)" aria-label="Note" />
      </div>
      <Button size="sm" loading={saving} onClick={handleSave} disabled={!date || !value}>Save Point</Button>
    </div>
  );
}
