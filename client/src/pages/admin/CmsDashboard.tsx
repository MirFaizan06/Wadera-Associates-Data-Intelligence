import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DOMPurify from 'dompurify';

interface StaticPage { slug: string; title: string; content: string; metaTitle?: string; metaDesc?: string; }
interface EmailTemplate { type: string; subject: string; htmlBody: string; isActive: boolean; }
interface ContactMessage { id: string; name: string; email: string; message: string; status: string; createdAt: string; }
interface FreeResource {
  id: string; slug: string; title: string; summary: string | null;
  type: string; content: string | null; pdfUrl: string | null;
  category: string | null; tags: string[] | null; author: string | null;
  isPublished: boolean; createdAt: string;
}
const EMPTY_FREE: Omit<FreeResource, 'id' | 'slug' | 'createdAt'> = {
  title: '', summary: '', type: 'ARTICLE', content: '', pdfUrl: '',
  category: '', tags: [], author: '', isPublished: false,
};

type Tab = 'pages' | 'templates' | 'messages' | 'free';

export default function CmsDashboard() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [freeResources, setFreeResources] = useState<FreeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pages');
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editingFree, setEditingFree] = useState<(Omit<FreeResource, 'id' | 'slug' | 'createdAt'> & { id?: string }) | null>(null);
  const [mdPreview, setMdPreview] = useState('');
  const [freeError, setFreeError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; data: StaticPage[] }>('/admin/cms/pages').then(r => setPages(r.data.data)),
      api.get<{ success: boolean; data: EmailTemplate[] }>('/admin/cms/email-templates').then(r => setTemplates(r.data.data)),
      api.get<{ success: boolean; data: { messages: ContactMessage[] } }>('/admin/cms/contact-messages').then(r => setMessages(r.data.data.messages)),
      api.get<{ success: boolean; data: { items: FreeResource[] } }>('/admin/cms/free-resources').then(r => setFreeResources(r.data.data.items)),
    ]).finally(() => setLoading(false));
  }, []);

  const savePage = async () => {
    if (!editingPage) return;
    await api.put(`/admin/cms/pages/${editingPage.slug}`, editingPage);
    setEditingPage(null);
    const res = await api.get<{ success: boolean; data: StaticPage[] }>('/admin/cms/pages');
    setPages(res.data.data);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    await api.put(`/admin/cms/email-templates/${editingTemplate.type}`, editingTemplate);
    setEditingTemplate(null);
    const res = await api.get<{ success: boolean; data: EmailTemplate[] }>('/admin/cms/email-templates');
    setTemplates(res.data.data);
  };

  const previewTemplate = async () => {
    if (!editingTemplate) return;
    const res = await api.post<{ success: boolean; data: { preview: string } }>('/admin/cms/email-templates/preview', {
      htmlBody: editingTemplate.htmlBody,
      variables: { name: 'Test User', otp: '123456', datasetName: 'Oil Prices', amount: 999, orderId: 'ord_test123', downloadUrl: '#' },
    });
    setPreviewHtml(DOMPurify.sanitize(res.data.data.preview));
  };

  const updateMessageStatus = async (id: string, status: string) => {
    await api.patch(`/admin/cms/contact-messages/${id}`, { status });
    setMessages(m => m.map(msg => msg.id === id ? { ...msg, status } : msg));
  };

  const saveFree = async () => {
    if (!editingFree) return;
    setFreeError('');
    try {
      const payload = {
        ...editingFree,
        tags: editingFree.tags?.filter(Boolean),
        pdfUrl: editingFree.pdfUrl || undefined,
      };
      if (editingFree.id) {
        await api.put(`/admin/cms/free-resources/${editingFree.id}`, payload);
      } else {
        await api.post('/admin/cms/free-resources', payload);
      }
      const res = await api.get<{ success: boolean; data: { items: FreeResource[] } }>('/admin/cms/free-resources');
      setFreeResources(res.data.data.items);
      setEditingFree(null);
      setMdPreview('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Save failed';
      setFreeError(msg);
    }
  };

  const deleteFree = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    await api.delete(`/admin/cms/free-resources/${id}`);
    setFreeResources(r => r.filter(x => x.id !== id));
  };

  const generateMdPreview = () => {
    if (!editingFree?.content) return;
    setMdPreview(DOMPurify.sanitize(marked(editingFree.content) as string));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Helmet><title>CMS Manager - Admin</title></Helmet>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">CMS Manager</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['pages', 'templates', 'messages', 'free'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${activeTab === tab ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-blue hover:text-brand-blue'}`}>
              {tab === 'pages' ? 'Static Pages' : tab === 'templates' ? 'Email Templates' : tab === 'messages' ? 'Contact Messages' : 'Free Resources'}
            </button>
          ))}
        </div>

        {/* Static Pages */}
        {activeTab === 'pages' && (
          <div className="space-y-4">
            {editingPage ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Edit: {editingPage.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={savePage}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm" value={editingPage.title}
                    onChange={e => setEditingPage({ ...editingPage, title: e.target.value })} placeholder="Title" aria-label="Page title" />
                  <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm" value={editingPage.metaTitle || ''}
                    onChange={e => setEditingPage({ ...editingPage, metaTitle: e.target.value })} placeholder="Meta Title (SEO)" aria-label="Meta title" />
                  <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm" value={editingPage.metaDesc || ''}
                    onChange={e => setEditingPage({ ...editingPage, metaDesc: e.target.value })} placeholder="Meta Description (SEO)" aria-label="Meta description" />
                  <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono" rows={12}
                    value={editingPage.content}
                    onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                    aria-label="Page HTML content" />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {pages.map(p => (
                  <Card key={p.slug} className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-medium text-gray-900">{p.title}</span>
                      <span className="ml-2 text-xs text-gray-400">/{p.slug}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditingPage(p)}>Edit</Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Email Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {editingTemplate ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Edit: {editingTemplate.type}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={previewTemplate}>Preview</Button>
                    <Button size="sm" onClick={saveTemplate}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(null); setPreviewHtml(''); }}>Cancel</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    value={editingTemplate.subject}
                    onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    placeholder="Email Subject" aria-label="Email subject" />
                  <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono" rows={14}
                    value={editingTemplate.htmlBody}
                    onChange={e => setEditingTemplate({ ...editingTemplate, htmlBody: e.target.value })}
                    aria-label="Email HTML body" />
                  {previewHtml && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {templates.map(t => (
                  <Card key={t.type} className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-medium text-gray-900">{t.type}</span>
                      <span className="ml-2 text-xs text-gray-400">{t.subject}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditingTemplate(t)}>Edit</Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Messages */}
        {activeTab === 'messages' && (
          <Card>
            <CardHeader><CardTitle>Contact Messages ({messages.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{m.name}</span>
                        <span className="text-sm text-gray-400 ml-2">{m.email}</span>
                      </div>
                      <select value={m.status}
                        onChange={e => updateMessageStatus(m.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                        aria-label="Update message status">
                        <option value="NEW">New</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-600">{m.message}</p>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center text-gray-400 py-4">No messages</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free Resources */}
        {activeTab === 'free' && (
          <div className="space-y-4">
            {editingFree ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{editingFree.id ? 'Edit Resource' : 'New Free Resource'}</CardTitle>
                  <div className="flex gap-2">
                    {editingFree.type === 'ARTICLE' && (
                      <Button size="sm" variant="outline" onClick={generateMdPreview}>Preview MD</Button>
                    )}
                    <Button size="sm" onClick={saveFree}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingFree(null); setMdPreview(''); setFreeError(''); }}>Cancel</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {freeError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{freeError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                      <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        value={editingFree.title}
                        onChange={e => setEditingFree({ ...editingFree, title: e.target.value })}
                        placeholder="Resource title" aria-label="Title" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                      <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        value={editingFree.type}
                        onChange={e => setEditingFree({ ...editingFree, type: e.target.value })}
                        aria-label="Type">
                        <option value="ARTICLE">Article</option>
                        <option value="PDF">PDF Download</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                      <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        value={editingFree.category || ''}
                        onChange={e => setEditingFree({ ...editingFree, category: e.target.value })}
                        placeholder="e.g. Energy, Commodities" aria-label="Category" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
                      <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        value={editingFree.author || ''}
                        onChange={e => setEditingFree({ ...editingFree, author: e.target.value })}
                        placeholder="Author name" aria-label="Author" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
                      <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                        value={(editingFree.tags || []).join(', ')}
                        onChange={e => setEditingFree({ ...editingFree, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                        placeholder="energy, oil, india" aria-label="Tags" />
                    </div>
                    {editingFree.type === 'PDF' && (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">PDF URL *</label>
                        <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                          value={editingFree.pdfUrl || ''}
                          onChange={e => setEditingFree({ ...editingFree, pdfUrl: e.target.value })}
                          placeholder="https://..." aria-label="PDF URL" />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Summary (shown in cards)</label>
                      <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm" rows={2}
                        value={editingFree.summary || ''}
                        onChange={e => setEditingFree({ ...editingFree, summary: e.target.value })}
                        placeholder="Brief description shown in listing cards..." aria-label="Summary" />
                    </div>
                    {editingFree.type === 'ARTICLE' && (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Content (Markdown)</label>
                        <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono" rows={18}
                          value={editingFree.content || ''}
                          onChange={e => setEditingFree({ ...editingFree, content: e.target.value })}
                          placeholder="Write content in Markdown format..." aria-label="Markdown content" />
                        {mdPreview && (
                          <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-white">
                            <p className="text-xs font-medium text-gray-400 mb-3">Markdown Preview:</p>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mdPreview }} />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="isPublished" checked={editingFree.isPublished}
                        onChange={e => setEditingFree({ ...editingFree, isPublished: e.target.checked })}
                        className="rounded" />
                      <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Published (visible on public site)</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{freeResources.length} resource{freeResources.length !== 1 ? 's' : ''}</span>
                  <Button size="sm" onClick={() => setEditingFree({ ...EMPTY_FREE })}>+ New Resource</Button>
                </div>
                <div className="grid gap-3">
                  {freeResources.map(r => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">{r.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              r.type === 'PDF' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>{r.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              r.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>{r.isPublished ? 'Published' : 'Draft'}</span>
                          </div>
                          <p className="text-xs text-gray-400">/free-data/{r.slug}{r.category ? ` · ${r.category}` : ''}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline"
                            onClick={() => setEditingFree({ ...r, tags: r.tags || [] })}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline"
                            className="text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => deleteFree(r.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {freeResources.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No free resources yet. Create one above.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
