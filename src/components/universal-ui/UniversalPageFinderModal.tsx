/**
 * Universal UI智能页面查找模态框
 * 提供设备连接、页面分析、元素选择功能
 */

import React, { useState, useEffect } from 'react';
import './UniversalPageFinder.css';
import { 
  Modal, 
  Button, 
  Select, 
  Card, 
  List, 
  Input, 
  Space, 
  Tag, 
  Typography, 
  Row, 
  Col,
  Tabs,
  Alert,
  Spin,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  MobileOutlined,
  EyeOutlined,
  FilterOutlined,
  BugOutlined,
  BranchesOutlined,
  UnorderedListOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useAdb } from '../../application/hooks/useAdb';
import UniversalUIAPI, { UIElement, ElementBounds } from '../../api/universalUIAPI';
import UIElementTree from './UIElementTree';
import VisualPageAnalyzer from '../VisualPageAnalyzer';

const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

// 从 VisualPageAnalyzer 提取的核心内容组件
interface VisualPageAnalyzerContentProps {
  xmlContent: string;
  onElementSelected?: (element: UIElement) => void;
}

// VisualPageAnalyzer 中使用的元素接口
interface VisualUIElement {
  id: string;
  text: string;
  description: string;
  type: string;
  category: string;
  position: { x: number; y: number; width: number; height: number };
  clickable: boolean;
  importance: 'high' | 'medium' | 'low';
  userFriendlyName: string;
}

// 元素分类定义
interface VisualElementCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  elements: VisualUIElement[];
}

const VisualPageAnalyzerContent: React.FC<VisualPageAnalyzerContentProps> = ({ 
  xmlContent, 
  onElementSelected 
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyClickable, setShowOnlyClickable] = useState(false);
  const [elements, setElements] = useState<VisualUIElement[]>([]);
  const [categories, setCategories] = useState<VisualElementCategory[]>([]);

  // 从 VisualPageAnalyzer 复制的解析函数
  const parseBounds = (bounds: string): { x: number; y: number; width: number; height: number } => {
    const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return { x: 0, y: 0, width: 0, height: 0 };
    
    const [, x1, y1, x2, y2] = match.map(Number);
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1
    };
  };

  // 获取元素的用户友好名称
  const getUserFriendlyName = (node: any): string => {
    if (node['content-desc'] && node['content-desc'].trim()) {
      return node['content-desc'];
    }
    if (node.text && node.text.trim()) {
      return node.text;
    }
    
    const className = node.class || '';
    if (className.includes('Button')) return '按钮';
    if (className.includes('TextView')) return '文本';
    if (className.includes('ImageView')) return '图片';
    if (className.includes('EditText')) return '输入框';
    if (className.includes('RecyclerView')) return '列表';
    if (className.includes('ViewPager')) return '滑动页面';
    if (className.includes('Tab')) return '标签页';
    
    return '未知元素';
  };

  // 判断元素类别
  const categorizeElement = (node: any): string => {
    const contentDesc = node['content-desc'] || '';
    const text = node.text || '';
    const className = node.class || '';
    
    if (contentDesc.includes('首页') || contentDesc.includes('消息') || contentDesc.includes('我') || 
        contentDesc.includes('市集') || contentDesc.includes('发布') || 
        text.includes('首页') || text.includes('消息') || text.includes('我')) {
      return 'navigation';
    }
    
    if (contentDesc.includes('关注') || contentDesc.includes('发现') || contentDesc.includes('视频') || 
        text.includes('关注') || text.includes('发现') || text.includes('视频')) {
      return 'tabs';
    }
    
    if (contentDesc.includes('搜索') || className.includes('search')) {
      return 'search';
    }
    
    if (contentDesc.includes('笔记') || contentDesc.includes('视频') || 
        (node.clickable === 'true' && contentDesc.includes('来自'))) {
      return 'content';
    }
    
    if (className.includes('Button') || node.clickable === 'true') {
      return 'buttons';
    }
    
    if (className.includes('TextView') && text.trim()) {
      return 'text';
    }
    
    if (className.includes('ImageView')) {
      return 'images';
    }
    
    return 'others';
  };

  // 获取元素重要性
  const getElementImportance = (node: any): 'high' | 'medium' | 'low' => {
    const contentDesc = node['content-desc'] || '';
    
    if (contentDesc.includes('首页') || contentDesc.includes('搜索') || 
        contentDesc.includes('笔记') || contentDesc.includes('视频') ||
        contentDesc.includes('发布')) {
      return 'high';
    }
    
    if (contentDesc.includes('关注') || contentDesc.includes('发现') || 
        contentDesc.includes('消息') || node.clickable === 'true') {
      return 'medium';
    }
    
    return 'low';
  };

  // 解析XML并提取元素
  const parseXML = (xmlString: string) => {
    if (!xmlString) return;
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const allNodes = xmlDoc.querySelectorAll('node');
      
      const extractedElements: VisualUIElement[] = [];
      const elementCategories: { [key: string]: VisualElementCategory } = {
        navigation: { name: '底部导航', icon: <AppstoreOutlined />, color: '#1890ff', description: '应用主要导航按钮', elements: [] },
        tabs: { name: '顶部标签', icon: <AppstoreOutlined />, color: '#722ed1', description: '页面切换标签', elements: [] },
        search: { name: '搜索功能', icon: <SearchOutlined />, color: '#13c2c2', description: '搜索相关功能', elements: [] },
        content: { name: '内容卡片', icon: <AppstoreOutlined />, color: '#52c41a', description: '主要内容区域', elements: [] },
        buttons: { name: '按钮控件', icon: <AppstoreOutlined />, color: '#fa8c16', description: '可点击的按钮', elements: [] },
        text: { name: '文本内容', icon: <AppstoreOutlined />, color: '#eb2f96', description: '文本信息显示', elements: [] },
        images: { name: '图片内容', icon: <AppstoreOutlined />, color: '#f5222d', description: '图片和图标', elements: [] },
        others: { name: '其他元素', icon: <AppstoreOutlined />, color: '#8c8c8c', description: '其他UI元素', elements: [] }
      };
      
      allNodes.forEach((node, index) => {
        const bounds = node.getAttribute('bounds') || '';
        const text = node.getAttribute('text') || '';
        const contentDesc = node.getAttribute('content-desc') || '';
        const className = node.getAttribute('class') || '';
        const clickable = node.getAttribute('clickable') === 'true';
        
        if (!bounds || bounds === '[0,0][0,0]') return;
        if (!text && !contentDesc && !clickable) return;
        
        const position = parseBounds(bounds);
        if (position.width <= 0 || position.height <= 0) return;
        
        const category = categorizeElement(node);
        const userFriendlyName = getUserFriendlyName(node);
        const importance = getElementImportance(node);
        
        const element: VisualUIElement = {
          id: `element-${index}`,
          text: text,
          description: contentDesc || `${userFriendlyName}${clickable ? '（可点击）' : ''}`,
          type: className.split('.').pop() || 'Unknown',
          category,
          position,
          clickable,
          importance,
          userFriendlyName
        };
        
        extractedElements.push(element);
        elementCategories[category].elements.push(element);
      });
      
      setElements(extractedElements);
      setCategories(Object.values(elementCategories).filter(cat => cat.elements.length > 0));
    } catch (error) {
      console.error('XML解析失败:', error);
    }
  };

  // 解析XML内容
  React.useEffect(() => {
    if (xmlContent) {
      parseXML(xmlContent);
    }
  }, [xmlContent]);

  // 过滤元素
  const filteredElements = elements.filter(element => {
    const matchesSearch = searchText === '' || 
      element.userFriendlyName.toLowerCase().includes(searchText.toLowerCase()) ||
      element.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || element.category === selectedCategory;
    const matchesClickable = !showOnlyClickable || element.clickable;
    
    return matchesSearch && matchesCategory && matchesClickable;
  });

  // 渲染可视化页面预览
  const renderPagePreview = () => {
    if (elements.length === 0) {
      return (
        <div style={{ 
          width: 400, 
          height: 600, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          backgroundColor: '#f9fafb'
        }}>
          <Text type="secondary">等待页面分析数据...</Text>
        </div>
      );
    }

    const maxX = Math.max(...elements.map(e => e.position.x + e.position.width));
    const maxY = Math.max(...elements.map(e => e.position.y + e.position.height));
    const scale = Math.min(400 / maxX, 600 / maxY, 1);
    
    return (
      <div style={{ 
        width: 400, 
        height: 600, 
        position: 'relative', 
        border: '1px solid #4b5563', 
        borderRadius: 8, 
        overflow: 'hidden', 
        backgroundColor: '#1f2937' 
      }}>
        <Title level={5} style={{ 
          textAlign: 'center', 
          margin: '8px 0', 
          color: '#e5e7eb', 
          fontWeight: 'bold' 
        }}>
          小红书页面布局预览
        </Title>
        {filteredElements.map(element => {
          const category = categories.find(cat => cat.name === element.category);
          return (
            <div
              key={element.id}
              title={`${element.userFriendlyName}: ${element.description}`}
              style={{
                position: 'absolute',
                left: element.position.x * scale,
                top: element.position.y * scale + 30,
                width: Math.max(element.position.width * scale, 2),
                height: Math.max(element.position.height * scale, 2),
                backgroundColor: category?.color || '#ccc',
                opacity: element.clickable ? 0.8 : 0.5,
                border: element.clickable ? '2px solid #fff' : '1px solid rgba(255,255,255,0.5)',
                borderRadius: 2,
                cursor: element.clickable ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (element.clickable && onElementSelected) {
                  // 转换为 UIElement 格式
                  const uiElement: UIElement = {
                    id: element.id,
                    text: element.text,
                    element_type: element.type,
                    xpath: '',
                    bounds: {
                      left: element.position.x,
                      top: element.position.y,
                      right: element.position.x + element.position.width,
                      bottom: element.position.y + element.position.height
                    },
                    is_clickable: element.clickable,
                    is_scrollable: false,
                    is_enabled: true,
                    checkable: false,
                    checked: false,
                    selected: false,
                    password: false,
                    content_desc: element.description
                  };
                  onElementSelected(uiElement);
                }
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 600 }}>
      {/* 左侧控制面板 */}
      <div style={{ width: 300, borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* 搜索框 */}
          <Input
            placeholder="搜索元素..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          
          {/* 过滤选项 */}
          <div>
            <Space>
              <input 
                type="checkbox"
                checked={showOnlyClickable} 
                onChange={(e) => setShowOnlyClickable(e.target.checked)}
              />
              <Text>只显示可点击元素</Text>
            </Space>
          </div>
          
          {/* 分类选择 */}
          <div>
            <Title level={5}>按功能分类</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button 
                type={selectedCategory === 'all' ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedCategory('all')}
                style={{ textAlign: 'left' }}
              >
                <AppstoreOutlined /> 全部 ({elements.length})
              </Button>
              {categories.map(category => (
                <Button
                  key={category.name}
                  type={selectedCategory === category.name ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setSelectedCategory(category.name)}
                  style={{ 
                    textAlign: 'left', 
                    borderColor: category.color,
                    backgroundColor: selectedCategory === category.name ? category.color : undefined
                  }}
                >
                  {category.icon} {category.name} ({category.elements.length})
                </Button>
              ))}
            </div>
          </div>
          
          {/* 统计信息 */}
          <Alert
            message="页面统计"
            description={
              <div>
                <p>总元素: {elements.length} 个</p>
                <p>可点击: {elements.filter(e => e.clickable).length} 个</p>
                <p>高重要性: {elements.filter(e => e.importance === 'high').length} 个</p>
              </div>
            }
            type="info"
          />
        </Space>
      </div>
      
      {/* 中间页面预览 */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {renderPagePreview()}
      </div>
      
      {/* 右侧元素列表 */}
      <div style={{ width: 400, maxHeight: 600, overflowY: 'auto' }}>
        <Title level={5}>元素列表 ({filteredElements.length})</Title>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {filteredElements.map(element => {
            const category = categories.find(cat => cat.name === element.category);
            return (
              <Card
                key={element.id}
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {category?.icon}
                    <span style={{ color: category?.color }}>{element.userFriendlyName}</span>
                    {element.clickable && <Tag color="green">可点击</Tag>}
                  </div>
                }
                extra={
                  <Tag 
                    color={element.importance === 'high' ? 'red' : element.importance === 'medium' ? 'orange' : 'default'}
                  >
                    {element.importance === 'high' ? '重要' : element.importance === 'medium' ? '中等' : '一般'}
                  </Tag>
                }
              >
                <div style={{ fontSize: 12 }}>
                  <p style={{ margin: 0 }}><strong>功能:</strong> {element.description}</p>
                  <p style={{ margin: 0 }}><strong>位置:</strong> ({element.position.x}, {element.position.y})</p>
                  <p style={{ margin: 0 }}><strong>大小:</strong> {element.position.width} × {element.position.height}</p>
                  {element.text && <p style={{ margin: 0 }}><strong>文本:</strong> {element.text}</p>}
                </div>
              </Card>
            );
          })}
        </Space>
      </div>
    </div>
  );
};

interface UniversalPageFinderModalProps {
  visible: boolean;
  onClose: () => void;
  onElementSelected?: (element: UIElement) => void;
}

/**
 * Universal UI智能页面查找模态框
 */
export const UniversalPageFinderModal: React.FC<UniversalPageFinderModalProps> = ({
  visible,
  onClose,
  onElementSelected
}) => {
  // ADB设备管理
  const { devices, refreshDevices } = useAdb();
  
  // 状态管理
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [elements, setElements] = useState<UIElement[]>([]);
  const [filteredElements, setFilteredElements] = useState<UIElement[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'visual'>('list'); // 显示模式（新增visual）
  const [selectedElementId, setSelectedElementId] = useState<string>(''); // 选中的元素

  // 重置状态
  const resetState = () => {
    setElements([]);
    setFilteredElements([]);
    setSearchText('');
    setAnalysisResult('');
    setAnalyzing(false);
  };

  // 页面分析
  const handleAnalyzePage = async () => {
    console.log('🔍 handleAnalyzePage 被调用', { selectedDeviceId });
    
    if (!selectedDeviceId) {
      message.warning('请先选择设备');
      return;
    }

    setAnalyzing(true);
    try {
      message.info('开始分析当前页面...');
      console.log('📡 调用 UniversalUIAPI.analyzeUniversalUIPage', selectedDeviceId);
      
      // 1. 执行页面分析
      const analysis = await UniversalUIAPI.analyzeUniversalUIPage(selectedDeviceId);
      console.log('✅ 获取到分析结果', { 
        analysisLength: analysis?.length, 
        containsXML: analysis?.includes('<?xml') || analysis?.includes('<hierarchy')
      });
      setAnalysisResult(analysis);

      // 2. 如果分析包含XML内容，提取元素
      if (analysis.includes('<?xml') || analysis.includes('<hierarchy')) {
        message.info('正在提取页面元素...');
        const extractedElements = await UniversalUIAPI.extractPageElements(analysis);
        
        // 3. 去重处理 - 如果失败则使用原始元素
        if (extractedElements.length > 0) {
          message.info('正在优化元素列表...');
          try {
            const deduplicatedElements = await UniversalUIAPI.deduplicateElements(extractedElements);
            setElements(deduplicatedElements);
            setFilteredElements(deduplicatedElements);
            message.success(`分析完成！找到 ${deduplicatedElements.length} 个唯一元素`);
          } catch (dedupeError) {
            console.warn('元素去重失败，使用原始元素列表:', dedupeError);
            setElements(extractedElements);
            setFilteredElements(extractedElements);
            message.success(`分析完成！找到 ${extractedElements.length} 个元素（跳过去重）`);
          }
        } else {
          setElements([]);
          setFilteredElements([]);
          message.warning('未找到可用元素');
        }
      } else {
        message.success('页面分析完成');
      }
    } catch (error) {
      console.error('Page analysis failed:', error);
      message.error(`页面分析失败: ${error}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // 搜索过滤
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredElements(elements);
      return;
    }

    const filtered = UniversalUIAPI.searchElementsByText(elements, value);
    setFilteredElements(filtered);
  };

  // 按类型过滤
  const handleTabChange = (key: string) => {
    setSelectedTab(key);
    
    let filtered: UIElement[] = [];
    
    if (key === 'all') {
      filtered = elements;
    } else if (key === 'interactive') {
      filtered = UniversalUIAPI.filterInteractiveElements(elements);
    } else {
      const grouped = UniversalUIAPI.groupElementsByType(elements);
      filtered = grouped[key] || [];
    }
    
    // 如果有搜索条件，继续应用搜索
    if (searchText.trim()) {
      filtered = UniversalUIAPI.searchElementsByText(filtered, searchText);
    }
    
    setFilteredElements(filtered);
  };

  // 元素选择
  const handleElementSelect = (element: UIElement) => {
    setSelectedElementId(element.id);
    if (onElementSelected) {
      onElementSelected(element);
      message.success(`已选择元素: ${element.text || element.element_type}`);
      onClose();
    }
  };

  // 处理层级树中的元素选择
  const handleTreeElementSelect = (element: UIElement) => {
    setSelectedElementId(element.id);
    // 也可以调用 onElementSelected 来通知外部组件
    if (onElementSelected) {
      onElementSelected(element);
      message.info(`选中层级树元素: ${element.text || element.element_type}`);
    }
  };

  // 格式化位置信息
  const formatBounds = (bounds: ElementBounds): string => {
    const center = UniversalUIAPI.getElementCenter(bounds);
    return `(${center.x}, ${center.y})`;
  };

  // 获取元素图标
  const getElementIcon = (element: UIElement) => {
    if (element.text && element.text.trim()) {
      // 有文本的元素
      if (element.is_clickable) return '📱'; // 可点击按钮
      return '📝'; // 文本
    }
    
    if (element.is_clickable) return '🎯'; // 可点击元素
    if (element.is_scrollable) return '📜'; // 可滚动区域
    if (element.class_name?.includes('Image')) return '🖼️'; // 图片
    if (element.class_name?.includes('Layout')) return '📦'; // 容器
    
    return '⚪'; // 默认
  };

  // 获取元素品质颜色（仿游戏装备）
  const getElementQuality = (element: UIElement) => {
    const hasText = element.text && element.text.trim();
    const isClickable = element.is_clickable;
    const isScrollable = element.is_scrollable;
    
    if (hasText && isClickable) return 'legendary'; // 传奇 - 有文本且可点击
    if (isClickable) return 'epic'; // 史诗 - 可点击
    if (hasText) return 'rare'; // 稀有 - 有文本
    if (isScrollable) return 'uncommon'; // 非凡 - 可滚动
    return 'common'; // 普通
  };

  // 渲染现代化元素卡片
  const renderModernElementCard = (element: UIElement, index: number) => {
    const description = UniversalUIAPI.getElementDescription(element);
    const position = formatBounds(element.bounds);
    const quality = getElementQuality(element);
    const icon = getElementIcon(element);
    
    const qualityColors = {
      legendary: { bg: 'linear-gradient(135deg, #ff6b6b, #ff8e53)', border: '#ff4757', glow: '#ff6b6b' },
      epic: { bg: 'linear-gradient(135deg, #a55eea, #26de81)', border: '#8854d0', glow: '#a55eea' },
      rare: { bg: 'linear-gradient(135deg, #3742fa, #2f3542)', border: '#2f3093', glow: '#3742fa' },
      uncommon: { bg: 'linear-gradient(135deg, #2ed573, #1e90ff)', border: '#20bf6b', glow: '#2ed573' },
      common: { bg: 'linear-gradient(135deg, #747d8c, #57606f)', border: '#5f6368', glow: '#747d8c' }
    };

    const qualityStyle = qualityColors[quality];

    return (
      <div
        key={element.id}
        className="element-card"
        style={{
          background: qualityStyle.bg,
          border: `2px solid ${qualityStyle.border}`,
          borderRadius: '12px',
          padding: '12px',
          margin: '8px 0',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: `0 4px 15px ${qualityStyle.glow}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
          overflow: 'hidden',
        }}
        onClick={() => handleElementSelect(element)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = `0 8px 25px ${qualityStyle.glow}50, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = `0 4px 15px ${qualityStyle.glow}30, inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
        }}
      >
        {/* 品质光效 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${qualityStyle.glow}, transparent)`,
            animation: quality === 'legendary' ? 'shimmer 2s infinite' : 'none',
          }}
        />
        
        {/* 主要内容 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
          {/* 图标和索引 */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            minWidth: '40px'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '2px' }}>{icon}</div>
            <div style={{ 
              fontSize: '10px', 
              background: 'rgba(0,0,0,0.3)', 
              padding: '2px 6px', 
              borderRadius: '10px',
              color: '#fff'
            }}>
              #{index + 1}
            </div>
          </div>
          
          {/* 文本信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px', 
              marginBottom: '4px',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {element.text || element.element_type || '未命名元素'}
            </div>
            
            <div style={{ 
              fontSize: '11px', 
              opacity: 0.9,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {description}
            </div>
            
            <div style={{ 
              fontSize: '10px', 
              opacity: 0.7,
              marginTop: '2px'
            }}>
              坐标: {position}
            </div>
          </div>
          
          {/* 状态标签 */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px',
            alignItems: 'flex-end'
          }}>
            {element.is_clickable && (
              <div style={{
                background: 'rgba(46, 213, 115, 0.9)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                可点击
              </div>
            )}
            
            {element.is_scrollable && (
              <div style={{
                background: 'rgba(52, 152, 219, 0.9)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                可滚动
              </div>
            )}
            
            {element.text && element.text.trim() && (
              <div style={{
                background: 'rgba(155, 89, 182, 0.9)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                有文本
              </div>
            )}
          </div>
        </div>
        
        {/* 选择按钮 */}
        <div style={{ 
          position: 'absolute',
          right: '8px',
          top: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)'
        }}>
          →
        </div>
      </div>
    );
  };

  // 获取元素类型统计
  const getElementTypeStats = () => {
    const grouped = UniversalUIAPI.groupElementsByType(elements);
    const interactive = UniversalUIAPI.filterInteractiveElements(elements);
    
    return {
      total: elements.length,
      interactive: interactive.length,
      types: Object.keys(grouped).length,
      grouped
    };
  };

  const stats = getElementTypeStats();

  return (
    <Modal
      title={
        <Space>
          <MobileOutlined />
          Universal UI智能页面查找
        </Space>
      }
      className="universal-page-finder"
      visible={visible}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      bodyStyle={{ padding: '24px', background: 'linear-gradient(135deg, #111827, #1f2937)' }}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      afterClose={resetState}
    >
      <Row gutter={16}>
        {/* 左侧：设备选择和分析 */}
        <Col span={8}>
          <Card 
            title={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                margin: '-16px -24px 16px -24px',
                padding: '20px 24px',
                borderRadius: '8px 8px 0 0',
                color: 'white'
              }}>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  📱
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>设备控制中心</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    选择设备并开始页面分析
                  </div>
                </div>
              </div>
            }
            size="small"
            style={{ 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 设备选择区域 */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: '#495057'
                }}>
                  <div style={{ fontSize: '16px' }}>🔗</div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>连接设备</span>
                </div>
                
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择ADB设备"
                  value={selectedDeviceId}
                  onChange={setSelectedDeviceId}
                  size="large"
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      <div style={{ padding: 8 }}>
                        <Button 
                          type="text" 
                          icon={<ReloadOutlined />}
                          onClick={refreshDevices}
                          style={{ width: '100%' }}
                        >
                          刷新设备列表
                        </Button>
                      </div>
                    </div>
                  )}
                >
                  {devices.map(device => (
                    <Option key={device.id} value={device.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%',
                          background: device.status === 'online'
                            ? 'linear-gradient(135deg, #2ed573, #26de81)' 
                            : 'linear-gradient(135deg, #ff6b6b, #ff8e53)'
                        }} />
                        <span>{device.name}</span>
                        <span style={{ 
                          fontSize: '11px',
                          color: device.status === 'online' ? '#2ed573' : '#ff6b6b',
                          fontWeight: 'bold'
                        }}>
                          ({device.status})
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>

              {/* 分析按钮 */}
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleAnalyzePage}
                loading={analyzing}
                disabled={!selectedDeviceId}
                size="large"
                block
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: analyzing 
                    ? 'linear-gradient(135deg, #ffa726, #ff7043)'
                    : 'linear-gradient(135deg, #26de81, #20bf6b)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 15px rgba(38, 222, 129, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                {analyzing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔄</span>
                    <span>分析中...</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎯</span>
                    <span>分析当前页面</span>
                  </div>
                )}
              </Button>

              {/* 统计信息卡片 */}
              {stats.total > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 背景装饰 */}
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: '100px',
                    height: '100px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    filter: 'blur(20px)'
                  }} />
                  
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '24px' }}>📊</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>分析结果</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        页面元素统计信息
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {stats.total}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        总元素
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(38, 222, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {stats.interactive}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        可交互
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(165, 94, 234, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {stats.types}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        元素类型
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 107, 107, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {Math.round(stats.interactive / stats.total * 100)}%
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        交互率
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* 右侧：元素展示 */}
        <Col span={16}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span>页面元素</span>
                {elements.length > 0 && (
                  <Space>
                    <Button.Group size="small">
                      <Button 
                        type={viewMode === 'list' ? 'primary' : 'default'}
                        icon={<UnorderedListOutlined />}
                        onClick={() => setViewMode('list')}
                      >
                        列表视图
                      </Button>
                      <Button 
                        type={viewMode === 'tree' ? 'primary' : 'default'}
                        icon={<BranchesOutlined />}
                        onClick={() => setViewMode('tree')}
                      >
                        层级树
                      </Button>
                      <Button 
                        type={viewMode === 'visual' ? 'primary' : 'default'}
                        icon={<EyeOutlined />}
                        onClick={() => setViewMode('visual')}
                      >
                        可视化视图
                      </Button>
                    </Button.Group>
                  </Space>
                )}
              </div>
            }
            size="small"
          >
            {analyzing ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>正在分析页面...</div>
              </div>
            ) : elements.length > 0 ? (
              <div>
                {viewMode === 'tree' ? (
                  // 层级树视图
                  <UIElementTree
                    elements={elements}
                    onElementSelect={handleTreeElementSelect}
                    selectedElementId={selectedElementId}
                  />
                ) : viewMode === 'visual' ? (
                  // 可视化视图（嵌入原有的VisualPageAnalyzer功能逻辑）
                  <VisualPageAnalyzerContent 
                    xmlContent={analysisResult} 
                    onElementSelected={onElementSelected}
                  />
                ) : (
                  // 列表视图
                  <div>
                    {/* 现代化搜索栏 */}
                    <div style={{ 
                      marginBottom: '20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '15px',
                      padding: '20px',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)'
                    }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '20px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          🔍
                        </div>
                        <div style={{ color: 'white' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>智能搜索</div>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>
                            搜索元素文本、类型或描述
                          </div>
                        </div>
                      </div>
                      
                      <Search
                        placeholder="输入关键词快速定位元素..."
                        allowClear
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        onSearch={handleSearch}
                        size="large"
                      />
                    </div>

                    {/* 现代化分类标签 */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ 
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        {[
                          { key: 'all', label: '全部', count: stats.total, color: '#667eea', icon: '📱' },
                          { key: 'interactive', label: '可交互', count: stats.interactive, color: '#26de81', icon: '🎯' },
                          ...Object.entries(stats.grouped).map(([type, items]) => ({
                            key: type,
                            label: type,
                            count: Array.isArray(items) ? items.length : 0,
                            color: '#a55eea',
                            icon: '📦'
                          }))
                        ].map(tab => (
                          <div
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            style={{
                              background: selectedTab === tab.key 
                                ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)`
                                : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                              color: selectedTab === tab.key ? 'white' : '#495057',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              border: selectedTab === tab.key 
                                ? `2px solid ${tab.color}` 
                                : '2px solid transparent',
                              transition: 'all 0.3s ease',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: selectedTab === tab.key 
                                ? `0 4px 15px ${tab.color}30`
                                : '0 2px 8px rgba(0,0,0,0.1)',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedTab !== tab.key) {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${tab.color}20, ${tab.color}10)`;
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedTab !== tab.key) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #374151, #4b5563)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <div style={{
                              background: selectedTab === tab.key 
                                ? 'rgba(255, 255, 255, 0.3)' 
                                : tab.color,
                              color: selectedTab === tab.key ? 'white' : 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              minWidth: '20px',
                              textAlign: 'center'
                            }}>
                              {tab.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 元素网格 */}
                    <div 
                      className="element-grid"
                      style={{ 
                        maxHeight: '500px', 
                        overflow: 'auto',
                        padding: '8px'
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '12px',
                        padding: '8px 0'
                      }}>
                        {filteredElements.map((element, index) => renderModernElementCard(element, index))}
                      </div>
                      
                      {filteredElements.length === 0 && (
                        <div className="empty-state" style={{ 
                          textAlign: 'center', 
                          padding: '60px 40px',
                          color: '#666',
                          borderRadius: '16px',
                          border: '2px dashed #dee2e6',
                          position: 'relative'
                        }}>
                          <div style={{ 
                            fontSize: '64px', 
                            marginBottom: '24px',
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                          }}>
                            🎯
                          </div>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            marginBottom: '8px',
                            color: '#495057'
                          }}>
                            没有找到匹配的元素
                          </div>
                          <div style={{ 
                            fontSize: '14px',
                            color: '#868e96',
                            lineHeight: 1.5
                          }}>
                            尝试调整搜索关键词或选择其他分类<br/>
                            或者重新分析当前页面
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                <EyeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>选择设备并点击"分析当前页面"开始</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default UniversalPageFinderModal;