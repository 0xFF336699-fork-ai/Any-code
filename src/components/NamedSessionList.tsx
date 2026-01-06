import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAllNamedSessions,
  deleteNamedSession,
  updateSessionName,
  type NamedSession,
} from '@/lib/namedSessionDb';
import { formatUnixTimestamp } from '@/lib/date-utils';
import { useTranslation } from '@/hooks/useTranslation';

interface NamedSessionListProps {
  onBack: () => void;
  onSessionClick?: (session: NamedSession) => void;
  className?: string;
}

export const NamedSessionList: React.FC<NamedSessionListProps> = ({
  onBack,
  onSessionClick,
  className,
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<NamedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 加载会话列表
  const loadSessions = async () => {
    console.log('[NamedSessionList] 开始加载会话列表');
    try {
      const data = await getAllNamedSessions();
      console.log('[NamedSessionList] 加载到的会话数量:', data.length);
      setSessions(data);
    } catch (error) {
      console.error('[NamedSessionList] 加载会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 开始编辑
  const startEdit = (session: NamedSession) => {
    console.log('[NamedSessionList] 开始编辑会话:', session.id);
    setEditingId(session.id);
    setEditingName(session.name);
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingId) {
      return;
    }

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      alert(t('namedSessions.emptyNameError') || '会话名称不能为空');
      return;
    }

    console.log('[NamedSessionList] 保存编辑:', JSON.stringify({ id: editingId, name: trimmedName }));
    try {
      await updateSessionName(editingId, trimmedName);
      console.log('[NamedSessionList] 编辑保存成功');
      setEditingId(null);
      setEditingName('');
      await loadSessions();
    } catch (error) {
      console.error('[NamedSessionList] 保存编辑失败:', error);
      alert(t('namedSessions.saveError') || '保存失败');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    console.log('[NamedSessionList] 取消编辑');
    setEditingId(null);
    setEditingName('');
  };

  // 删除会话
  const handleDelete = async (id: string) => {
    if (!confirm(t('namedSessions.deleteConfirm') || '确定要删除这个命名会话吗？')) {
      return;
    }

    console.log('[NamedSessionList] 删除会话:', id);
    try {
      await deleteNamedSession(id);
      console.log('[NamedSessionList] 会话删除成功');
      await loadSessions();
    } catch (error) {
      console.error('[NamedSessionList] 删除会话失败:', error);
      alert(t('namedSessions.deleteError') || '删除失败');
    }
  };

  // 点击会话
  const handleSessionClick = (session: NamedSession) => {
    if (editingId === session.id) {
      return;
    }
    console.log('[NamedSessionList] 点击会话:', session.id);
    if (onSessionClick) {
      onSessionClick(session);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-semibold">
              {t('namedSessions.title') || '已命名会话'}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">
            {t('namedSessions.title') || '已命名会话'}
          </h2>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('namedSessions.empty') || '暂无命名会话'}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-500 mb-4">
            {t('namedSessions.count', { count: sessions.length }) || `共 ${sessions.length} 个命名会话`}
            {' · '}
            {t('namedSessions.doubleClickHint') || '双击会话名称可编辑'}
          </div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit();
                          } else if (e.key === 'Escape') {
                            cancelEdit();
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 text-lg font-semibold border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        {t('common.save') || '保存'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                      >
                        {t('common.cancel') || '取消'}
                      </Button>
                    </div>
                  ) : (
                    <h3
                      onDoubleClick={() => startEdit(session)}
                      onClick={() => handleSessionClick(session)}
                      className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none"
                      title={t('namedSessions.doubleClickToEdit') || '双击编辑'}
                    >
                      {session.name}
                    </h3>
                  )}
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      {t('namedSessions.projectPath') || '项目路径'}: {session.projectPath}
                    </div>
                    <div>
                      {t('namedSessions.engine') || '引擎'}: {session.engine}
                    </div>
                    {session.firstMessage && (
                      <div className="truncate">
                        {t('namedSessions.firstMessage') || '第一条消息'}: {session.firstMessage}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {t('namedSessions.namedAt') || '命名时间'}: {formatUnixTimestamp(session.namedAt)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(session.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
