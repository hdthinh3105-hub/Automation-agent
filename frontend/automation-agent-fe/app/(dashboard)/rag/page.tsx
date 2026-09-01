'use client';

import { useState, FormEvent } from 'react';
import { Search, Gauge, BookMarked, AlertTriangle } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { RagAnswer } from '@/lib/types';
import { Card, PageHeader, Button, Spinner, inputClass, Field } from '@/components/ui';

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const pct = value * 100;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RagQueryPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setAnswer(null);
    setIsLoading(true);
    try {
      const data = await apiFetch<RagAnswer>('/rag/query', {
        method: 'POST',
        body: { query: query.trim() },
      });
      setAnswer(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không chạy được pipeline RAG.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test RAG pipeline"
        description="Chạy thử retrieval + generation với câu hỏi bất kỳ, xem câu trả lời và trích dẫn nguồn."
      />

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
        <Field label="Câu hỏi">
          <textarea
            required
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="VD: Chính sách đổi trả hàng của shop như thế nào?"
            className={inputClass}
          />
        </Field>
        <Button type="submit" disabled={isLoading || !query.trim()} className="mt-3">
          {isLoading ? (
            <>
              <Spinner className="border-white border-t-brand-600" /> Đang tra cứu...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Tra cứu
            </>
          )}
        </Button>
      </form>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {answer && (
        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-xs text-gray-600">
                {answer.provider} / {answer.model}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-xs text-gray-600">
                {answer.latencyMs}ms
              </span>
              {answer.needsEscalation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" /> Cần chuyển Agent
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{answer.answer}</p>
          </Card>

          <Card title="Confidence breakdown">
            <div className="space-y-4">
              <ConfidenceBar label="Top similarity" value={answer.confidenceBreakdown.avgTopSimilarity} />
              <ConfidenceBar label="Retrieval coverage" value={answer.confidenceBreakdown.retrievalCoverage} />
              <ConfidenceBar label="LLM self-score" value={answer.confidenceBreakdown.llmSelfScore} />
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                <Gauge className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold text-gray-900">Tổng confidence</span>
                <span className="ml-auto text-sm font-bold text-gray-900">
                  {(answer.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          <Card title={`Trích dẫn nguồn (${answer.citations.length})`}>
            {answer.citations.length === 0 ? (
              <p className="text-sm text-gray-500">Không có trích dẫn — có thể cần bổ sung Knowledge Base.</p>
            ) : (
              <div className="space-y-2">
                {answer.citations.map((c) => (
                  <div key={c.chunkId} className="flex items-start gap-3 rounded-xl bg-surface-50 px-3 py-2.5 text-sm">
                    <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900">{c.documentTitle}</span>
                      {c.section && <span className="ml-1 text-gray-500">— {c.section}</span>}
                      <span className="ml-1 font-mono text-xs text-gray-400">#{c.chunkId.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}