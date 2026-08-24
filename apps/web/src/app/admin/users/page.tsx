'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Search, Plus, UserX, UserCheck, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toast';

type UserRow = {
  id: string;
  login: string;
  email: string | null;
  role: string;
  active: boolean;
  created_at: string;
};

const ROLES = ['TRADER', 'MERCHANT', 'ADMIN', 'SUPPORT', 'PAYOUT_TRADER', 'OWNER'];

export default function AdminUsersPage() {
  const t = useTranslations('Admin.Users');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('TRADER');
  const [newEmail, setNewEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      return api.get<{ items: UserRow[]; total: number }>(`/api/users?${params}`);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: () =>
      api.post('/api/users', {
        login: newLogin,
        password: newPassword,
        role: newRole,
        email: newEmail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
      setNewLogin('');
      setNewPassword('');
      setNewRole('TRADER');
      setNewEmail('');
      toast.success('Пользователь создан успешно');
    },
    onError: () => {
      toast.error('Не удалось создать пользователя');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: string) => {
      // Simulate toggle
      return Promise.resolve({ id: userId, toggled: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  const ROLE_LABEL: Record<string, string> = {
    TRADER: 'Трейдер',
    MERCHANT: 'Мерчант',
    ADMIN: 'Админ',
    SUPPORT: 'Поддержка',
    PAYOUT_TRADER: 'Payout Trader',
    OWNER: 'Владелец',
    REFERRAL: 'Реферал',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="text-sm text-text-muted mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Поиск по логину..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-bg-primary pl-10 pr-3 py-2 text-sm"
        />
      </div>

      {/* Users table */}
      <DataTable
        columns={[
          {
            key: 'login',
            header: 'Логин',
            render: (user: UserRow) => (
              <span className="font-medium text-text-primary">{user.login}</span>
            ),
          },
          {
            key: 'role',
            header: 'Роль',
            render: (user: UserRow) => (
              <span className="inline-flex rounded-md bg-accent-blue/10 px-2 py-0.5 text-xs font-medium text-accent-blue">
                {ROLE_LABEL[user.role] || user.role}
              </span>
            ),
          },
          {
            key: 'email',
            header: 'Email',
            render: (user: UserRow) => (
              <span className="text-sm text-text-secondary">{user.email || '—'}</span>
            ),
          },
          {
            key: 'active',
            header: 'Статус',
            render: (user: UserRow) => (
              <span className={`inline-flex items-center gap-1 text-xs ${user.active ? 'text-green-400' : 'text-red-400'}`}>
                {user.active ? (
                  <UserCheck className="h-3 w-3" />
                ) : (
                  <UserX className="h-3 w-3" />
                )}
                {user.active ? 'Активен' : 'Неактивен'}
              </span>
            ),
          },
          {
            key: 'created_at',
            header: 'Создан',
            render: (user: UserRow) => (
              <span className="text-xs text-text-muted">{user.created_at.split('T')[0]}</span>
            ),
          },
          {
            key: 'actions',
            header: 'Действия',
            className: 'text-end',
            render: (user: UserRow) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => toggleActiveMutation.mutate(user.id)}
                  disabled={toggleActiveMutation.isPending}
                  className="rounded-md bg-bg-secondary px-2 py-1 text-xs font-medium text-text-primary hover:bg-bg-hover disabled:opacity-50"
                >
                  {user.active ? 'Деактивировать' : 'Активировать'}
                </button>
              </div>
            ),
          },
        ]}
        data={users}
        isLoading={isLoading}
        emptyMessage="Пользователей пока нет"
      />

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={total}
        variant="minimal"
      />

      {/* Create user modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать пользователя"
      >
        <div className="space-y-4">
          <Input
            label="Логин"
            value={newLogin}
            onChange={setNewLogin}
            placeholder="Логин пользователя"
          />
          <Input
            label="Пароль"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Пароль пользователя"
          />
          <Input
            label="Email (необязательно)"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="user@example.com"
          />
          <Select
            label="Роль"
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] || r }))}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={createUserMutation.isPending || !newLogin || !newPassword}
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
