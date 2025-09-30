import React, { useMemo, useState } from 'react';
import { Table, Tag, Space, Typography, Button } from 'antd';
import type { ContactNumberList } from '../types';
import { getDistinctIndustries as fetchDistinctIndustries, ContactNumberDto } from '../../services/contactNumberService';
import { useColumnSettings } from '../../components/columns/useColumnSettings';
import ColumnSettingsModal from '../../components/columns/ColumnSettingsModal';
import { ResizableHeaderCell, useResizableColumns } from '../../../../../components/universal-ui/table/resizable';

interface Props {
  data?: ContactNumberList | null;
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRefresh?: () => void | Promise<void>;
  // 受控筛选（可选）：若传入则受控；提供重置按钮
  controlledFilters?: {
    status?: string | null;
    industry?: string | null;
    onChange?: (next: { status?: string | null; industry?: string | null }) => void;
  };
  // 行业下拉依赖：历史行业缓存（可选）。若不传则组件内部拉取一次并缓存于内存。
  industriesCache?: string[];
  // 多选功能（新增）
  selection?: {
    selectedRows: ContactNumberDto[];
    onChange: (selectedRows: ContactNumberDto[], selectedRowKeys: React.Key[]) => void;
    getCheckboxProps?: (record: ContactNumberDto) => { disabled?: boolean };
  };
}

const NumbersTable: React.FC<Props> = ({ 
  data, 
  loading, 
  pagination, 
  controlledFilters, 
  industriesCache,
  selection 
}) => {
  const items = data?.items || [];

  // 内部筛选状态：行业/状态（仅对当前页数据做客户端过滤）
  const [statusFilterInner, setStatusFilterInner] = useState<string | null>(null);
  const [industryFilterInner, setIndustryFilterInner] = useState<string | null>(null);
  const statusFilter = controlledFilters?.status ?? statusFilterInner;
  const industryFilter = controlledFilters?.industry ?? industryFilterInner;

  const INDUSTRY_UNCLASSIFIED = '__UNCLASSIFIED__';

  const [distinctIndustries, setDistinctIndustries] = useState<string[]>(() => {
    const fromCache = industriesCache && industriesCache.length > 0 ? industriesCache : [];
    if (fromCache.length > 0) return fromCache.includes(INDUSTRY_UNCLASSIFIED) ? fromCache : [INDUSTRY_UNCLASSIFIED, ...fromCache];
    // 初始至少包含“未分类”
    return [INDUSTRY_UNCLASSIFIED];
  });

  // 初始化/更新行业列表缓存（合并当前页可见项，避免丢失历史）
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const globalList = await fetchDistinctIndustries().catch(() => [] as string[]);
        if (!mounted) return;
        const fromPage = Array.from(new Set(items.map(it => {
          const raw = (it as any).industry as string | null | undefined;
          return raw && raw.trim() ? raw.trim() : INDUSTRY_UNCLASSIFIED;
        })));
        const merged = Array.from(new Set([INDUSTRY_UNCLASSIFIED, ...globalList, ...fromPage]));
        // 未分类优先，其余按字母排序
        const sorted = merged.sort((a, b) => {
          if (a === INDUSTRY_UNCLASSIFIED) return -1;
          if (b === INDUSTRY_UNCLASSIFIED) return 1;
          return a.localeCompare(b);
        });
        setDistinctIndustries(sorted);
      } catch {
        // 忽略
      }
    })();
    return () => { mounted = false; };
  }, [items, industriesCache]);

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const s = (it as any).status as string | null | undefined;
      const rawInd = (it as any).industry as string | null | undefined;
      const ind = rawInd && rawInd.trim() ? rawInd.trim() : INDUSTRY_UNCLASSIFIED;
      if (statusFilter && s !== statusFilter) return false;
      if (industryFilter && ind !== industryFilter) return false;
      return true;
    });
  }, [items, statusFilter, industryFilter]);

  // 汇总（基于当前筛选 + 当前页数据）
  const { importedCount, notImportedCount, vcfGeneratedCount } = useMemo(() => {
    let imported = 0, notImported = 0, vcf = 0;
    for (const it of filteredItems) {
      const s = (it as any).status as string | null | undefined;
      if (s === 'imported') imported++;
      else if (s === 'not_imported') notImported++;
      else if (s === 'vcf_generated') vcf++;
    }
    return { importedCount: imported, notImportedCount: notImported, vcfGeneratedCount: vcf };
  }, [filteredItems]);

  const { Text } = Typography;

  // 列配置（与工作台一致，但按抽屉场景裁剪：不含“是否已用”列）
  const columnDefaults = useMemo(() => ([
    { key: 'seq', title: '序号', defaultVisible: true, defaultWidth: 70 },
    { key: 'id', title: 'ID', defaultVisible: true, defaultWidth: 80 },
    { key: 'phone', title: '号码', defaultVisible: true },
    { key: 'name', title: '姓名', defaultVisible: true, defaultWidth: 160 },
    { key: 'industry', title: '行业', defaultVisible: true, defaultWidth: 120 },
    { key: 'status', title: '状态', defaultVisible: true, defaultWidth: 140 },
    { key: 'used_batch', title: 'VCF 批次', defaultVisible: true, defaultWidth: 160 },
    { key: 'imported_device_id', title: '导入设备', defaultVisible: true, defaultWidth: 140 },
    { key: 'source_file', title: '来源', defaultVisible: true },
    { key: 'created_at', title: '时间', defaultVisible: true, defaultWidth: 180 },
  ]), []);
  const columnSettings = useColumnSettings('contactImport.drawer.numberPool.columns', columnDefaults);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const columns = useMemo(() => {
    const baseIndexOffset = pagination ? ((pagination.current - 1) * pagination.pageSize) : 0;
    return columnSettings.configs.filter(c => c.visible).map(c => {
      const common = { title: c.title, width: c.width } as const;
      switch (c.key) {
        case 'seq':
          return {
            ...common,
            dataIndex: 'seq',
            key: 'seq',
            render: (_: any, __: any, index: number) => baseIndexOffset + index + 1,
          };
        case 'id':
          return { ...common, dataIndex: 'id', key: 'id' };
        case 'phone':
          return { ...common, dataIndex: 'phone', key: 'phone' };
        case 'name':
          return { ...common, dataIndex: 'name', key: 'name' };
        case 'industry':
          return {
            ...common,
            dataIndex: 'industry',
            key: 'industry',
            filters: distinctIndustries.map(ind => ({
              text: ind === INDUSTRY_UNCLASSIFIED ? '未分类' : ind,
              value: ind,
            })),
            onFilter: (value: any, record: any) => {
              const indRaw = record.industry as string | null | undefined;
              const ind = indRaw && indRaw.trim() ? indRaw.trim() : INDUSTRY_UNCLASSIFIED;
              return ind === value;
            },
            render: (v: string | null | undefined) => {
              const label = v && v.trim() ? v : '未分类';
              const key = v && v.trim() ? v.trim() : INDUSTRY_UNCLASSIFIED;
              const active = industryFilter === key;
              return (
                <Tag
                  color={active ? 'processing' : 'default'}
                  onClick={() => {
                    if (controlledFilters?.onChange) {
                      controlledFilters.onChange({ status: statusFilter ?? null, industry: industryFilter === key ? null : key });
                    } else {
                      setIndustryFilterInner(prev => (prev === key ? null : key));
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {label}
                </Tag>
              );
            },
          };
        case 'status':
          return {
            ...common,
            dataIndex: 'status',
            key: 'status',
            filters: [
              { text: '已导入', value: 'imported' },
              { text: '待导入', value: 'not_imported' },
              { text: '已生成VCF', value: 'vcf_generated' },
            ],
            onFilter: (value: any, record: any) => record.status === value,
            render: (s: string | null | undefined) => {
              if (s === 'imported') return (
                <Tag color={statusFilter === 'imported' ? 'green' : 'success'} style={{ cursor: 'pointer' }} onClick={() => {
                  if (controlledFilters?.onChange) {
                    controlledFilters.onChange({ status: statusFilter === 'imported' ? null : 'imported', industry: industryFilter ?? null });
                  } else {
                    setStatusFilterInner(prev => (prev === 'imported' ? null : 'imported'));
                  }
                }}>已导入</Tag>
              );
              if (s === 'not_imported') return (
                <Tag color={statusFilter === 'not_imported' ? 'orange' : 'warning'} style={{ cursor: 'pointer' }} onClick={() => {
                  if (controlledFilters?.onChange) {
                    controlledFilters.onChange({ status: statusFilter === 'not_imported' ? null : 'not_imported', industry: industryFilter ?? null });
                  } else {
                    setStatusFilterInner(prev => (prev === 'not_imported' ? null : 'not_imported'));
                  }
                }}>待导入</Tag>
              );
              if (s === 'vcf_generated') return (
                <Tag color={statusFilter === 'vcf_generated' ? 'blue' : 'processing'} style={{ cursor: 'pointer' }} onClick={() => {
                  if (controlledFilters?.onChange) {
                    controlledFilters.onChange({ status: statusFilter === 'vcf_generated' ? null : 'vcf_generated', industry: industryFilter ?? null });
                  } else {
                    setStatusFilterInner(prev => (prev === 'vcf_generated' ? null : 'vcf_generated'));
                  }
                }}>已生成VCF</Tag>
              );
              return <Tag>—</Tag>;
            }
          };
        case 'used_batch':
          return { ...common, dataIndex: 'used_batch', key: 'used_batch' };
        case 'imported_device_id':
          return { ...common, dataIndex: 'imported_device_id', key: 'imported_device_id' };
        case 'source_file':
          return { ...common, dataIndex: 'source_file', key: 'source_file' };
        case 'created_at':
          return { ...common, dataIndex: 'created_at', key: 'created_at' };
        default:
          return { ...common, dataIndex: c.key, key: c.key } as any;
      }
    });
  }, [columnSettings.configs, pagination, distinctIndustries, industryFilter, statusFilter, controlledFilters]);

  // 可调整列宽（拖拽表头分隔线）
  const visibleCols = columnSettings.configs.filter(c => c.visible);
  const resizable = useResizableColumns(
    visibleCols.map(c => ({ key: c.key, width: (columns as any[]).find(col => (col.dataIndex ?? col.key) === c.key)?.width })),
    { onWidthChange: (key, width) => columnSettings.setWidth(key, width) }
  );
  const components = useMemo(() => ({
    header: {
      cell: (props: any) => {
        const key = props['data-key'] || props['data-col-key'] || props?.column?.dataIndex || props?.column?.key;
        const runtime = resizable.columns.find((c: any) => c.key === key);
        if (!runtime) return <th {...props} />;
        return (
          <ResizableHeaderCell
            {...props}
            width={runtime.width}
            minWidth={runtime.minWidth}
            maxWidth={runtime.maxWidth}
            onResizeStart={runtime.onResizeStart}
          />
        );
      }
    }
  }), [resizable.columns]);

  return (
    <div>
      {/* 顶部汇总与筛选提示（本页统计） + 列设置入口 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space size={[8, 8]} wrap>
          <Text type="secondary">本页统计：</Text>
          <Tag
            color={statusFilter === 'imported' ? 'green' : 'default'}
            onClick={() => {
              if (controlledFilters?.onChange) {
                controlledFilters.onChange({ status: statusFilter === 'imported' ? null : 'imported', industry: industryFilter ?? null });
              } else {
                setStatusFilterInner(prev => (prev === 'imported' ? null : 'imported'));
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            已导入 {importedCount}
          </Tag>
          <Tag
            color={statusFilter === 'not_imported' ? 'orange' : 'default'}
            onClick={() => {
              if (controlledFilters?.onChange) {
                controlledFilters.onChange({ status: statusFilter === 'not_imported' ? null : 'not_imported', industry: industryFilter ?? null });
              } else {
                setStatusFilterInner(prev => (prev === 'not_imported' ? null : 'not_imported'));
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            待导入 {notImportedCount}
          </Tag>
          <Tag
            color={statusFilter === 'vcf_generated' ? 'blue' : 'default'}
            onClick={() => {
              if (controlledFilters?.onChange) {
                controlledFilters.onChange({ status: statusFilter === 'vcf_generated' ? null : 'vcf_generated', industry: industryFilter ?? null });
              } else {
                setStatusFilterInner(prev => (prev === 'vcf_generated' ? null : 'vcf_generated'));
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            已生成VCF {vcfGeneratedCount}
          </Tag>
          {(statusFilter || industryFilter) && (
            <Tag
              color="magenta"
              onClick={() => {
                if (controlledFilters?.onChange) {
                  controlledFilters.onChange({ status: null, industry: null });
                } else {
                  setStatusFilterInner(null);
                  setIndustryFilterInner(null);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              重置筛选
            </Tag>
          )}
        </Space>
        <Button size="small" onClick={() => setSettingsOpen(true)} disabled={loading}>
          列设置{columnSettings.visibleCount > 0 ? `（${columnSettings.visibleCount}）` : ''}
        </Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={filteredItems}
        components={components as any}
        rowSelection={selection ? {
          type: 'checkbox',
          selectedRowKeys: selection.selectedRows.map(row => row.id),
          onChange: (selectedRowKeys, selectedRows) => {
            selection.onChange(selectedRows as ContactNumberDto[], selectedRowKeys);
          },
          getCheckboxProps: selection.getCheckboxProps,
          preserveSelectedRowKeys: true,
        } : undefined}
        pagination={pagination ? {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: pagination.onChange,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        } : false}
        columns={(columns as any[]).map(c => ({
          ...c,
          key: c.key ?? c.dataIndex,
          onHeaderCell: () => ({ 'data-col-key': c.key ?? c.dataIndex }),
        })) as any}
      />

      <ColumnSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        configs={columnSettings.configs}
        onToggle={columnSettings.setVisible}
        onWidthChange={columnSettings.setWidth}
        onReset={columnSettings.reset}
        onReorder={columnSettings.reorder}
      />
    </div>
  );
};

export default NumbersTable;
