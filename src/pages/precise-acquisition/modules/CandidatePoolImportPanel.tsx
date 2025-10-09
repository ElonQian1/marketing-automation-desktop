import React, { useMemo, useState } from 'react';
import { Card, Typography, Upload, Button, Table, Tag, message } from 'antd';
import { InboxOutlined, ImportOutlined } from '@ant-design/icons';
import ServiceFactory from '../../../application/services/ServiceFactory';

interface ImportRowPreview {
  row: number;
  type: string;
  platform: string;
  id_or_url: string;
  title?: string;
  source: string;
  industry_tags?: string;
  region?: string;
  notes?: string;
}

const { Title, Text } = Typography;

export const CandidatePoolImportPanel: React.FC = () => {
  const marketing = useMemo(() => ServiceFactory.getMarketingApplicationService(), []);
  const [csvText, setCsvText] = useState<string>('type,platform,id_or_url,title,source,industry_tags,region,notes\nvideo,douyin,https://www.douyin.com/video/xxxx,示例视频,csv,口腔;健康,华东,——');
  const [rows, setRows] = useState<ImportRowPreview[]>([]);
  const [errors, setErrors] = useState<{row:number; code:string; field:string; message:string;}[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  const columns = [
    { title: '行', dataIndex: 'row', width: 60 },
    { title: 'type', dataIndex: 'type' },
    { title: 'platform', dataIndex: 'platform' },
    { title: 'id_or_url', dataIndex: 'id_or_url' },
    { title: 'title', dataIndex: 'title' },
    { title: 'source', dataIndex: 'source' },
    { title: 'industry_tags', dataIndex: 'industry_tags' },
    { title: 'region', dataIndex: 'region' },
  ];

  const errorColumns = [
    { title: '行', dataIndex: 'row', width: 60 },
    { title: '字段', dataIndex: 'field' },
    { title: '错误码', dataIndex: 'code', render: (v:string) => <Tag color={v === 'E_NOT_ALLOWED' ? 'red' : v === 'E_ENUM' ? 'orange' : v === 'E_URL' ? 'magenta' : 'gold'}>{v}</Tag> },
    { title: '说明', dataIndex: 'message' },
  ];

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    message.success(`已读取文件：${file.name}`);
    return false;
  };

  const handleValidate = () => {
    try {
      const parsed = marketing.parseCsv(csvText);
      const preview: ImportRowPreview[] = parsed.map((r, i) => ({ row: i+2, ...r } as any));
      setRows(preview);
      setErrors([]);
      setSavedCount(0);
      message.success(`解析成功：${preview.length} 行`);
    } catch (e:any) {
      message.error(`解析失败：${e?.message || e}`);
    }
  };

  const handleImport = async () => {
    try {
      setSaving(true);
      const res = await marketing.importCandidates(csvText);
      setErrors(res.errors);
      setSavedCount(res.saved);
      message.success(`导入完成：保存 ${res.saved} 条，失败 ${res.summary.failed} 条`);
    } catch (e:any) {
      message.error(`导入失败：${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="light-theme-force" style={{ background: 'var(--bg-light-base, #ffffff)' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <Title level={4} style={{ margin: 0 }}>候选池导入（CSV 模板）</Title>
          <Text type="secondary">强约束模板：type, platform, id_or_url, title, source, industry_tags, region, notes</Text>
        </div>
        <div className="flex gap-2">
          <Upload beforeUpload={handleFile} showUploadList={false} accept=".csv,text/csv">
            <Button icon={<InboxOutlined />}>选择 CSV</Button>
          </Upload>
          <Button onClick={handleValidate}>解析预览</Button>
          <Button type="primary" icon={<ImportOutlined />} loading={saving} onClick={handleImport}>校验并导入</Button>
        </div>
      </div>

      <textarea
        className="w-full p-3 rounded border mb-4"
        rows={6}
        value={csvText}
        onChange={e => setCsvText(e.target.value)}
      />

      <div className="mb-2">
        <Text>解析结果：<b>{rows.length}</b> 行，已保存：<b>{savedCount}</b> 条</Text>
      </div>
      <Table rowKey="row" size="small" columns={columns as any} dataSource={rows} pagination={{ pageSize: 5 }} />

      <div className="mt-6">
        <Title level={5} style={{ marginBottom: 8 }}>错误清单</Title>
        <Table rowKey={(r:any)=>`${r.row}-${r.field}`} size="small" columns={errorColumns as any} dataSource={errors} pagination={{ pageSize: 5 }} />
      </div>
    </Card>
  );
};

export default CandidatePoolImportPanel;
