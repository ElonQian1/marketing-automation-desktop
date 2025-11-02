// src/modules/structural-matching/ui/pages/structural-matching-demo.tsx
// module: structural-matching | layer: ui | role: 结构匹配配置入口页面
// summary: 删除演示数据，直接使用真实 XML/缓存 数据驱动结构匹配配置

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Space, Typography, Alert } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { StructuralMatchingModal } from '../components/structural-matching-modal/structural-matching-modal';
import XmlCacheManager from '../../../../services/xml-cache-manager';
import { parseXML } from '../../../../components/universal-ui/xml-parser';

const { Title, Paragraph } = Typography;

export const StructuralMatchingDemo: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedElement, setSelectedElement] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const xmlCacheId = query.get('xmlCacheId') || query.get('cache') || undefined;
  const elementId = query.get('elementId') || query.get('element') || undefined; // 形如 element-43

  // 从 XML 缓存加载真实元素，并构造 selectedElement
  useEffect(() => {
    const bootstrap = async () => {
      if (!xmlCacheId || !elementId) {
        setLoadError('缺少必要参数：请通过 ?xmlCacheId=...&elementId=element-# 打开本页');
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const cache = await XmlCacheManager.getInstance().getCachedXml(xmlCacheId);
        if (!cache?.xmlContent) {
          throw new Error('未找到对应的 XML 缓存内容');
        }
        const parsed = await parseXML(cache.xmlContent);
        const target = parsed.elements.find(e => e.id === elementId);
        if (!target) {
          throw new Error(`在 XML 中未找到元素 ${elementId}`);
        }

        // 组装最小 selectedElement（保持原始值语义：有就有，没有就空）
        const toBoundsString = () => {
          if (target.bounds && typeof target.bounds === 'string') return target.bounds;
          if (target.position) {
            const l = target.position.x, t = target.position.y;
            const r = l + target.position.width, b = t + target.position.height;
            return `[${l},${t}][${r},${b}]`;
          }
          return '';
        };

        const element: Record<string, unknown> = {
          id: target.id,
          xmlCacheId,
          // 原始字段（下划线/连字符风格一并保留，便于不同路径读取）
          text: target.text || '',
          content_desc: target.contentDesc || '',
          'content-desc': target.contentDesc || '',
          resource_id: target.resourceId || '',
          'resource-id': target.resourceId || '',
          class_name: target.className || target.type || '',
          class: target.className || target.type || '',
          bounds: toBoundsString(),
          clickable: !!target.clickable,
        };

        setSelectedElement(element);
        setModalVisible(true); // 自动打开
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [xmlCacheId, elementId]);

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleConfigConfirm = () => {
    // 保留：确认后关闭
    setModalVisible(false);
  };

  return (
    <div className="light-theme-force" style={{ padding: '24px', background: 'var(--bg-light-base)' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>
            <SettingOutlined style={{ marginRight: 8 }} />
            结构匹配配置
          </Title>
          <Paragraph>
            本页面已移除演示数据，改为直接使用真实 XML/缓存 数据。请通过 URL 传入参数：
          </Paragraph>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#1f2937' }}>
              • xmlCacheId: XML 缓存文件名，例如 <code>ui_dump_xxxxx.xml</code>
              <br />
              • elementId: 元素 ID，例如 <code>element-43</code>
              <br />
              示例：<code>?xmlCacheId=ui_dump_abc.xml&elementId=element-43</code>
            </div>
          </Card>
          {loadError && (
            <div style={{ marginTop: 12 }}>
              <Alert type="warning" message={loadError} showIcon />
            </div>
          )}
          {!loadError && loading && (
            <div style={{ marginTop: 12 }}>
              <Alert type="info" message="正在加载 XML 并定位目标元素..." showIcon />
            </div>
          )}
          {!loading && !loadError && !selectedElement && (
            <div style={{ marginTop: 12 }}>
              <Alert type="info" message="请提供 xmlCacheId 与 elementId 参数后刷新本页" showIcon />
            </div>
          )}
        </div>
        <div />
      </Space>

      {/* 结构匹配模态框 */}
      <StructuralMatchingModal
        visible={modalVisible}
        selectedElement={selectedElement || {}}
        onClose={handleModalClose}
        onConfirm={handleConfigConfirm}
      />
    </div>
  );
};