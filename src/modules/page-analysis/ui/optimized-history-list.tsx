// src/modules/page-analysis/ui/optimized-history-list.tsx
// module: page-analysis | layer: ui | role: history-list
// summary: 优化的历史页面列表组件，支持虚拟滚动和懒加载

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { List, Card, Image, Tag, Progress, Button, Input, Select, Space, Tooltip, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, AppstoreOutlined } from '@ant-design/icons';
import { optimizedDebugXmlLoader, DebugXmlEntry, LoadProgress } from '../services/optimized-debug-xml-loader';
import './optimized-history-list.css';

const { Search } = Input;
const { Option } = Select;

interface OptimizedHistoryListProps {
  onFileSelect?: (fileEntry: DebugXmlEntry, xmlContent: string) => void;
  onThumbnailLoad?: (fileId: string, thumbnail: string) => void;
}

/**
 * 优化的历史页面列表组件
 * 
 * 🚀 性能特性：
 * 1. 虚拟滚动：只渲染可见项目
 * 2. 懒加载：按需加载XML内容和缩略图
 * 3. 智能预加载：根据用户行为预测需求
 * 4. 搜索和过滤：快速定位目标文件
 * 5. 进度指示：用户友好的加载反馈
 */
export const OptimizedHistoryList: React.FC<OptimizedHistoryListProps> = ({
  onFileSelect,
  onThumbnailLoad
}) => {
  const [files, setFiles] = useState<DebugXmlEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  
  // 初始化加载
  useEffect(() => {
    initializeLoader();
  }, []);

  const initializeLoader = async () => {
    setLoading(true);
    setLoadProgress({ current: 0, total: 0, currentFile: '初始化中...', percentage: 0 });
    
    try {
      const fileList = await optimizedDebugXmlLoader.quickInit((progress) => {
        setLoadProgress(progress);
      });
      
      setFiles(fileList);
      console.log(`✅ 快速加载完成，共 ${fileList.length} 个文件`);
      
      // 开始智能预加载
      if (fileList.length > 0) {
        const topFiles = fileList
          .sort((a, b) => b.loadPriority - a.loadPriority)
          .slice(0, 5)
          .map(f => f.id);
        
        optimizedDebugXmlLoader.preloadBatch(topFiles);
      }
    } catch (error) {
      console.error('❌ 初始化失败:', error);
    } finally {
      setLoading(false);
      setLoadProgress(null);
    }
  };

  // 过滤和搜索
  const filteredFiles = useMemo(() => {
    let filtered = files;
    
    // 应用过滤
    if (selectedApp !== 'all') {
      filtered = filtered.filter(f => f.appPackage === selectedApp);
    }
    
    // 搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(f => 
        f.fileName.toLowerCase().includes(keyword) ||
        f.appPackage?.toLowerCase().includes(keyword)
      );
    }
    
    return filtered;
  }, [files, selectedApp, searchKeyword]);

  // 获取应用列表
  const appPackages = useMemo(() => {
    const packages = [...new Set(files.map(f => f.appPackage).filter(Boolean))];
    return packages.sort();
  }, [files]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (fileEntry: DebugXmlEntry) => {
    console.log(`👆 用户选择文件: ${fileEntry.fileName}`);
    
    try {
      // 显示加载状态
      const loadingKey = `loading-${fileEntry.id}`;
      
      // 加载XML内容
      const xmlContent = await optimizedDebugXmlLoader.loadXmlContent(fileEntry.id);
      
      if (xmlContent) {
        onFileSelect?.(fileEntry, xmlContent);
        
        // 触发智能预加载
        optimizedDebugXmlLoader.smartPreload(fileEntry.id);
      }
    } catch (error) {
      console.error('❌ 加载文件失败:', error);
    }
  }, [onFileSelect]);

  // 懒加载缩略图
  const loadThumbnail = useCallback(async (fileId: string) => {
    if (thumbnails.has(fileId)) {
      return; // 已加载
    }
    
    try {
      const thumbnail = await optimizedDebugXmlLoader.loadThumbnail(fileId);
      if (thumbnail) {
        setThumbnails(prev => new Map(prev).set(fileId, thumbnail));
        onThumbnailLoad?.(fileId, thumbnail);
      }
    } catch (error) {
      console.warn('⚠️ 缩略图加载失败:', error);
    }
  }, [thumbnails, onThumbnailLoad]);

  // 刷新列表
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await optimizedDebugXmlLoader.refresh();
      const updatedFiles = optimizedDebugXmlLoader.getFileList();
      setFiles(updatedFiles);
      console.log('✅ 列表已刷新');
    } catch (error) {
      console.error('❌ 刷新失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取优先级标签
  const getPriorityTag = (priority: number) => {
    switch (priority) {
      case 5: return <Tag color="red">今天</Tag>;
      case 4: return <Tag color="orange">本周</Tag>;
      case 3: return <Tag color="blue">本月</Tag>;
      default: return <Tag color="default">更早</Tag>;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染列表项
  const renderFileItem = (fileEntry: DebugXmlEntry) => {
    const thumbnail = thumbnails.get(fileEntry.id);
    
    return (
      <List.Item key={fileEntry.id}>
        <Card
          hoverable
          className="history-file-card light-theme-force"
          onClick={() => handleFileSelect(fileEntry)}
          cover={
            <div className="thumbnail-container">
              {thumbnail ? (
                <Image
                  src={`data:image/png;base64,${thumbnail}`}
                  alt={fileEntry.fileName}
                  width="100%"
                  height={120}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="thumbnail-placeholder"
                  onMouseEnter={() => loadThumbnail(fileEntry.id)}
                >
                  <EyeOutlined style={{ fontSize: 24, color: '#999' }} />
                  <div>预览</div>
                </div>
              )}
            </div>
          }
          actions={[
            <Tooltip title="查看详情">
              <EyeOutlined onClick={(e) => {
                e.stopPropagation();
                handleFileSelect(fileEntry);
              }} />
            </Tooltip>
          ]}
        >
          <Card.Meta
            title={
              <div className="file-title">
                <span>{fileEntry.appPackage || 'Unknown'}</span>
                {getPriorityTag(fileEntry.loadPriority)}
              </div>
            }
            description={
              <div className="file-description">
                <div className="file-time">{formatTime(fileEntry.timestamp)}</div>
                <div className="file-name">{fileEntry.fileName}</div>
                {fileEntry.isLoaded && (
                  <Tag color="green" size="small">已加载</Tag>
                )}
              </div>
            }
          />
        </Card>
      </List.Item>
    );
  };

  return (
    <div className="optimized-history-list">
      {/* 工具栏 */}
      <div className="toolbar light-theme-force" style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Space size="middle">
          <Search
            placeholder="搜索文件名或应用..."
            allowClear
            style={{ width: 250 }}
            onSearch={setSearchKeyword}
            onChange={(e) => !e.target.value && setSearchKeyword('')}
          />
          
          <Select
            value={selectedApp}
            style={{ width: 200 }}
            onChange={setSelectedApp}
            placeholder="选择应用"
          >
            <Option value="all">所有应用</Option>
            {appPackages.map(pkg => (
              <Option key={pkg} value={pkg}>
                <AppstoreOutlined /> {pkg}
              </Option>
            ))}
          </Select>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          
          <span style={{ color: '#666' }}>
            共 {filteredFiles.length} 个文件
          </span>
        </Space>
      </div>

      {/* 加载进度 */}
      {loadProgress && (
        <div className="load-progress light-theme-force" style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            正在加载: {loadProgress.currentFile}
          </div>
          <Progress 
            percent={loadProgress.percentage} 
            size="small"
            status={loadProgress.percentage === 100 ? 'success' : 'active'}
          />
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {loadProgress.current} / {loadProgress.total} 文件
          </div>
        </div>
      )}

      {/* 文件列表 */}
      {filteredFiles.length === 0 ? (
        <Empty 
          description="没有找到历史页面文件"
          style={{ margin: '40px 0' }}
        />
      ) : (
        <List
          grid={{ 
            gutter: 16, 
            xs: 1, 
            sm: 2, 
            md: 3, 
            lg: 4, 
            xl: 5, 
            xxl: 6 
          }}
          dataSource={filteredFiles}
          loading={loading}
          renderItem={renderFileItem}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `显示 ${range[0]}-${range[1]} 项，共 ${total} 项`
          }}
        />
      )}
    </div>
  );
};

export default OptimizedHistoryList;