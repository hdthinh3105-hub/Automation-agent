'use client';

import { useEffect, useState, FormEvent } from 'react';
import { UploadCloud, FileText, Trash2 } from 'lucide-react';
import { apiFetch, apiFormFetch, buildQueryString, ApiError } from '@/lib/api-client';
import { KnowledgeDocumentItem, PaginatedResult, DOCUMENT_STATUSES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, PageHeader, Button, Spinner, EmptyState, inputClass, Field } from '@/components/ui';

const DOC_STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  PROCESSING: { label: 'Đang phân tích', cls: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  READY: { label: 'Sẵn sàng', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  FAILED: { label: 'Lỗi', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [result, setResult] = useState<PaginatedResult<KnowledgeDocumentItem> | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const qs = buildQueryString({ status, page, limit: 20 });
      const data = await apiFetch<PaginatedResult<KnowledgeDocumentItem>>(`/kb/documents${qs}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách tài liệu.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function handleUpload(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!file) {
      setUploadError('Vui lòng chọn file để upload.');
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim() || file.name);
      formData.append('tags', tags.trim());
      await apiFormFetch<KnowledgeDocumentItem>('/kb/documents', formData);
      setTitle('');
      setTags('');
      setFile(null);
      setPage(1);
      await load();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload thất bại.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('Xoá tài liệu này khỏi Knowledge Base?')) return;
    try {
      await apiFetch(`/kb/documents/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xoá được tài liệu.');
    }
  }

  const readyCount = result?.items.filter((d) => d.status === 'READY').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Tài liệu nguồn cho RAG — AI tra cứu ở đây để trả lời khách hàng."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <FileText className="h-3.5 w-3.5" /> {readyCount} tài liệu sẵn sàng
          </span>
        }
      />

      <form onSubmit={handleUpload} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <UploadCloud className="h-4 w-4 text-brand-600" />
          </span>
          <h2 className="text-sm font-semibold text-gray-900">Upload tài liệu mới</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tiêu đề">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mặc định = tên file"
              className={inputClass}
            />
          </Field>
          <Field label="Tags">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cách nhau bởi dấu phẩy"
              className={inputClass}
            />
          </Field>
          <Field label="File (PDF / DOCX / TXT / MD)">
            <input
              type="file"
              required
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
            />
          </Field>
        </div>
        {uploadError && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</div>
        )}
        <Button type="submit" disabled={isUploading} className="mt-4">
          {isUploading ? 'Đang upload...' : 'Upload'}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DOC_STATUS_META[s]?.label ?? s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
          <Spinner /> Đang tải...
        </div>
      ) : result?.items.length === 0 ? (
        <EmptyState title="Chưa có tài liệu nào" description="Upload tài liệu đầu tiên để bắt đầu xây dựng Knowledge Base." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Tiêu đề</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Phiên bản</th>
                  <th className="px-5 py-3">Tags</th>
                  <th className="px-5 py-3">Tạo lúc</th>
                  {user?.role === 'ADMIN' && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody>
                {result?.items.map((doc) => {
                  const meta = DOC_STATUS_META[doc.status] ?? { label: doc.status, cls: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
                  return (
                    <tr key={doc.id} className="border-b border-gray-50 last:border-0 hover:bg-surface-50/60">
                      <td className="px-5 py-3 font-medium text-gray-900">{doc.title}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">v{doc.version}</td>
                      <td className="px-5 py-3">
                        {doc.tags.length === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.map((tag) => (
                              <span key={tag} className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(doc.createdAt)}</td>
                      {user?.role === 'ADMIN' && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xoá
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && result.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Trang {result.meta.page} / {result.meta.totalPages} · {result.meta.totalItems} tài liệu
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= result.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}