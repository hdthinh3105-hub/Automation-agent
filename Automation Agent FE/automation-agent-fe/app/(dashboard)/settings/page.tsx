'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, buildQueryString } from '@/lib/api-client';
import { SystemSettingItem, CategoryItem, RoutingRuleItem } from '@/lib/types';
import { Card, PageHeader, Button, Field, inputClass, Spinner, EmptyState } from '@/components/ui';

type Tab = 'settings' | 'categories' | 'routing-rules';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('settings');

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt hệ thống" description="Quản lý cấu hình, danh mục và quy tắc định tuyến" />

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {([
          ['settings', 'Hệ thống'],
          ['categories', 'Danh mục'],
          ['routing-rules', 'Quy tắc định tuyến'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'settings' && <SettingsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'routing-rules' && <RoutingRulesTab />}
    </div>
  );
}

/* ───── Settings Tab ───── */

function SettingsTab() {
  const [items, setItems] = useState<SystemSettingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const qs = buildQueryString({ category: categoryFilter || undefined });
      const data = await apiFetch<SystemSettingItem[]>(`/admin/settings${qs}`);
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(key: string) {
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(editValue);
      } catch {
        parsed = editValue;
      }
      await apiFetch<SystemSettingItem>('/admin/settings', {
        method: 'PUT',
        body: { key, value: parsed },
      });
      setEditingKey(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi lưu');
    }
  }

  async function handleCreate() {
    if (!newKey.trim()) return;
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(newValue);
      } catch {
        parsed = newValue;
      }
      await apiFetch<SystemSettingItem>('/admin/settings', {
        method: 'PUT',
        body: { key: newKey.trim(), value: parsed, category: newCategory, label: newLabel || undefined },
      });
      setShowCreate(false);
      setNewKey('');
      setNewValue('');
      setNewCategory('general');
      setNewLabel('');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tạo');
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`Xóa cài đặt "${key}"?`)) return;
    try {
      await apiFetch(`/admin/settings/${key}`, { method: 'DELETE' });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi xóa');
    }
  }

  return (
    <Card title="Cài đặt hệ thống" subtitle={`${items.length} mục`}>
      <div className="mb-4 flex items-center gap-3">
        <Field label="Lọc theo danh mục">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Tất cả</option>
            <option value="general">general</option>
            <option value="rag">rag</option>
            <option value="ai">ai</option>
            <option value="notification">notification</option>
          </select>
        </Field>
        <div className="pt-6">
          <Button onClick={() => setShowCreate(!showCreate)}>+ Thêm cài đặt</Button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Key">
              <input value={newKey} onChange={(e) => setNewKey(e.target.value)} className={inputClass} placeholder="e.g. confidence_threshold" />
            </Field>
            <Field label="Giá trị (JSON hoặc text)">
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} className={inputClass} placeholder='0.6 hoặc "value"' />
            </Field>
            <Field label="Danh mục">
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Mô tả">
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className={inputClass} placeholder="Mô tả ngắn" />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleCreate} size="sm">Lưu</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} size="sm">Hủy</Button>
          </div>
        </div>
      )}

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có cài đặt" description="Thêm cài đặt mới để cấu hình hệ thống" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Giá trị</th>
                <th className="px-4 py-2.5">Danh mục</th>
                <th className="px-4 py-2.5">Mô tả</th>
                <th className="px-4 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key} className="border-b border-gray-100 hover:bg-surface-50/60">
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-700">{item.key}</td>
                  <td className="px-4 py-2.5">
                    {editingKey === item.key ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-mono text-xs">{typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{item.category}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{item.label ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {editingKey === item.key ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => handleSave(item.key)}>Lưu</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingKey(null)}>Hủy</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingKey(item.key); setEditValue(typeof item.value === 'string' ? item.value : JSON.stringify(item.value)); }}
                        >
                          Sửa
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.key)}>Xóa</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ───── Categories Tab ───── */

function CategoriesTab() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiFetch<CategoryItem[]>('/admin/categories');
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await apiFetch('/admin/categories', { method: 'POST', body: { name: newName.trim() } });
      setNewName('');
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tạo danh mục');
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await apiFetch(`/admin/categories/${id}/deactivate`, { method: 'PATCH' });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi vô hiệu hóa');
    }
  }

  return (
    <Card title="Danh mục ticket" subtitle={`${items.length} danh mục`}>
      <div className="mb-4 flex items-center gap-3">
        <Field label="Tên danh mục mới">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} placeholder="e.g. Billing, Technical..." />
        </Field>
        <div className="pt-6">
          <Button onClick={handleCreate}>+ Thêm</Button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có danh mục" description="Thêm danh mục để phân loại ticket" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Tên</th>
                <th className="px-4 py-2.5">Trạng thái</th>
                <th className="px-4 py-2.5">Ngày tạo</th>
                <th className="px-4 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-surface-50/60">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {item.isActive ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-2.5 text-right">
                    {item.isActive && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivate(item.id)}>Tắt</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ───── Routing Rules Tab ───── */

function RoutingRulesTab() {
  const [items, setItems] = useState<RoutingRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', action: 'AUTO_ANSWER', priority: 0, conditions: '{}' });

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiFetch<RoutingRuleItem[]>('/admin/routing-rules');
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      let conditions: unknown;
      try { conditions = JSON.parse(form.conditions); } catch { conditions = {}; }
      await apiFetch('/admin/routing-rules', {
        method: 'POST',
        body: { name: form.name, description: form.description || undefined, action: form.action, priority: form.priority, conditions },
      });
      setShowCreate(false);
      setForm({ name: '', description: '', action: 'AUTO_ANSWER', priority: 0, conditions: '{}' });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tạo quy tắc');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa quy tắc này?')) return;
    try {
      await apiFetch(`/admin/routing-rules/${id}`, { method: 'DELETE' });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi xóa');
    }
  }

  return (
    <Card title="Quy tắc định tuyến" subtitle={`${items.length} quy tắc`}>
      <div className="mb-4">
        <Button onClick={() => setShowCreate(!showCreate)}>+ Thêm quy tắc</Button>
      </div>

      {showCreate && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên quy tắc">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Hành động">
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className={inputClass}>
                <option value="AUTO_ANSWER">Tự trả lời</option>
                <option value="ASK_MORE_INFO">Yêu cầu thêm thông tin</option>
                <option value="ESCALATE">Chuyển Agent</option>
              </select>
            </Field>
            <Field label="Mô tả">
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Ưu tiên (số càng lớn càng trước)">
              <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={inputClass} />
            </Field>
            <div className="col-span-2">
              <Field label="Điều kiện (JSON)">
                <textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} className={inputClass} rows={3} placeholder='{"category": "billing", "priority": "HIGH"}' />
              </Field>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleCreate} size="sm">Tạo</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} size="sm">Hủy</Button>
          </div>
        </div>
      )}

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có quy tắc" description="Thêm quy tắc định tuyến để tự động xử lý ticket" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-surface-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Tên</th>
                <th className="px-4 py-2.5">Hành động</th>
                <th className="px-4 py-2.5">Ưu tiên</th>
                <th className="px-4 py-2.5">Trạng thái</th>
                <th className="px-4 py-2.5">Điều kiện</th>
                <th className="px-4 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-surface-50/60">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.action === 'ESCALATE' ? 'bg-amber-50 text-amber-700' :
                      item.action === 'ASK_MORE_INFO' ? 'bg-blue-50 text-blue-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.action === 'AUTO_ANSWER' ? 'Tự trả lời' : item.action === 'ASK_MORE_INFO' ? 'Yêu cầu thêm info' : 'Chuyển Agent'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{item.priority}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.isActive ? 'Bật' : 'Tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500 max-w-[200px] truncate">{JSON.stringify(item.conditions)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>Xóa</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
