import React, { useMemo, useState } from 'react';
import { Button, Space, Typography, message, Tag, Dropdown } from 'antd';
import ConfirmPopover from '@/components/universal-ui/common-popover/ConfirmPopover';
import { InboxOutlined, CheckSquareOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { markContactNumbersAsNotImportedBatch, deleteContactNumbersBatch } from '../services/contactNumberService';
import { listAllContactNumberIds } from '../services/numberIdsService';

interface Props {
  selectedRowKeys: number[];
  pageItemIds: number[];
  onChangeSelected: (keys: number[]) => void;
  onArchived: () => void | Promise<void>;
  disabled?: boolean;
  // 可选：全局筛选条件，用于"选择所有"时与当前视图保持一致
  globalFilter?: { search?: string | null; industry?: string | null; status?: string | null };
}

/**
 * 工作台-号码池 批量操作栏（常显）
 * 放置于号码池表格上方，始终显示；当未选择任何行时禁用"归档"和"删除"按钮。
 */
const WorkbenchNumbersActionsBar: React.FC<Props> = ({
  selectedRowKeys,
  pageItemIds,
  onChangeSelected,
  onArchived,
  disabled = false,
  globalFilter,
}) => {
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { Text } = Typography;

  const pageAllSelected = useMemo(() => {
    if (pageItemIds.length === 0) return false;
    const set = new Set(selectedRowKeys);
    return pageItemIds.every(id => set.has(id));
  }, [selectedRowKeys, pageItemIds]);

  const totalSelected = selectedRowKeys.length;

  const handleToggleSelectPage = () => {
    if (pageAllSelected) {
      // 取消本页全选：从已选集合中去掉当前页ID
      const current = new Set(selectedRowKeys);
      pageItemIds.forEach(id => current.delete(id));
      onChangeSelected(Array.from(current));
    } else {
      // 全选本页：并集
      const current = new Set(selectedRowKeys);
      pageItemIds.forEach(id => current.add(id));
      onChangeSelected(Array.from(current));
    }
  };

  const handleClear = () => onChangeSelected([]);

  const handleSelectAllAcrossPages = async () => {
    try {
      const ids = await listAllContactNumberIds({
        search: globalFilter?.search ?? undefined,
        industry: globalFilter?.industry ?? undefined,
        status: globalFilter?.status ?? undefined,
      });
      onChangeSelected(ids);
      message.success(`已选择所有号码（${ids.length} 条）`);
    } catch (e) {
      const msg = (e as any)?.message || String(e);
      message.error(`选择所有失败：${msg}`);
    }
  };

  const handleArchive = async () => {
    if (totalSelected === 0) return;
    try {
      setArchiving(true);
      const affected = await markContactNumbersAsNotImportedBatch(selectedRowKeys);
      message.success(`已归档 ${affected} 条为"未导入"`);
      await onArchived();
      onChangeSelected([]);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || String(e);
      message.error(`归档失败：${msg}`);
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (totalSelected === 0) return;
    try {
      setDeleting(true);
      const affected = await deleteContactNumbersBatch(selectedRowKeys);
      message.success(`已永久删除 ${affected} 条号码记录`);
      await onArchived();
      onChangeSelected([]);
    } catch (e) {
      console.error(e);
      const msg = (e as any)?.message || String(e);
      message.error(`删除失败：${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      padding: 'var(--space-2) var(--space-3)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-sm)',
      marginBottom: 'var(--space-2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
    }}>
      <Space size={8} wrap>
        <Text type="secondary">批量操作：</Text>
        <Tag color={totalSelected > 0 ? 'blue' : 'default'}>已选 {totalSelected} 条</Tag>
      </Space>
      <Space>
        <Dropdown
          menu={{
            items: [
              { key: 'select-page', label: pageAllSelected ? '取消全选本页' : '全选本页', onClick: handleToggleSelectPage },
              { key: 'select-all', label: '选择所有号码（跨页）', onClick: handleSelectAllAcrossPages },
            ],
          }}
        >
          <Button size="small" icon={<CheckSquareOutlined />} disabled={disabled}>
            选择
          </Button>
        </Dropdown>
        <Button
          size="small"
          icon={<CloseOutlined />}
          onClick={handleClear}
          disabled={disabled || totalSelected === 0}
        >
          清空选择
        </Button>
        <ConfirmPopover
          mode="default"
          title="确认归档"
          description={`将 ${totalSelected} 条号码重置为未导入状态？`}
          okText="确认"
          cancelText="取消"
          onConfirm={handleArchive}
          disabled={totalSelected === 0}
        >
          <Button
            type="primary"
            size="small"
            icon={<InboxOutlined />}
            loading={archiving}
            disabled={disabled || totalSelected === 0}
          >
            批量归档为未导入
          </Button>
        </ConfirmPopover>
        <ConfirmPopover
          mode="default"
          title="⚠️ 永久删除警告"
          description={
            <div>
              <p style={{ marginBottom: '8px' }}>
                确认要<strong style={{ color: 'var(--error)' }}>永久删除</strong> {totalSelected} 条号码记录吗？
              </p>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--error)', 
                background: 'var(--error-bg)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                ⚠️ 此操作不可恢复！记录将从数据库中彻底删除。
              </p>
            </div>
          }
          okText="确认删除"
          cancelText="取消"
          onConfirm={handleDelete}
          disabled={totalSelected === 0}
        >
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={deleting}
            disabled={disabled || totalSelected === 0}
          >
            永久删除
          </Button>
        </ConfirmPopover>
      </Space>
    </div>
  );
};

export default WorkbenchNumbersActionsBar;
