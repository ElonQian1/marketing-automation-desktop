
/**
 * 品牌化组件展示页面
 * 
 * 这个页面展示了如何使用新的品牌化组件系统：
 * 1. 统一的设计令牌系统
 * 2. 轻量级 UI 组件 (Button, Card, Dialog)
 * 3. 适配器组件 (TableAdapter, FormAdapter)
 * 4. 高曝光模式组件 (HeaderBar, FilterBar, MarketplaceCard, EmptyState)
 * 5. 动画系统集成
 * 
 * 这个页面可以作为团队成员学习新组件用法的参考。
 */

import React, { useMemo, useState } from "react";
import { ConfigProvider, Switch, theme } from "antd";
import { Plus, Users, Smartphone, TrendingUp, Settings } from "lucide-react";

// 导入品牌化组件
import { Button } from "../../components/ui/button/Button";
import { Card } from "../../components/ui/card/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog/Dialog";
import { Input } from "../../components/ui/forms/Input";
import { Select } from "../../components/ui/forms/Select";
import { TagPill } from "../../components/ui/TagPill";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip/Tooltip";
import { TableAdapter } from "../../components/adapters/table/TableAdapter";
import { FormAdapter, FormItemAdapter } from "../../components/adapters/form/FormAdapter";
import { 
  HeaderBar, 
  FilterBar, 
  MarketplaceCard,
  MetricCard,
  DeviceCard,
  NoDataState 
} from "../../components/patterns";
// 懒加载 PatternDemos，按需展示
const PatternDemos = React.lazy(() => import("../../examples/PatternDemos"));
// 懒加载 AdapterDemos，按需展示
const AdapterDemos = React.lazy(() => import("../../examples/AdapterDemos"));

/**
 * 模拟数据
 */
const mockEmployees = [
  { key: '1', name: '张三', department: '营销部', status: 'active', followers: 1250, engagement: '12.5%' },
  { key: '2', name: '李四', department: '运营部', status: 'inactive', followers: 890, engagement: '8.3%' },
  { key: '3', name: '王五', department: '营销部', status: 'active', followers: 2340, engagement: '15.2%' },
];

const mockFilters = [
  {
    key: 'department',
    label: '部门',
    type: 'select' as const,
    options: [
      { label: '营销部', value: 'marketing' },
      { label: '运营部', value: 'operations' },
      { label: '客服部', value: 'support' }
    ]
  },
  {
    key: 'status',
    label: '状态',
    type: 'multiSelect' as const,
    options: [
      { label: '活跃', value: 'active' },
      { label: '非活跃', value: 'inactive' },
      { label: '暂停', value: 'suspended' }
    ]
  }
];

const tableColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '粉丝数', dataIndex: 'followers', key: 'followers' },
  { title: '互动率', dataIndex: 'engagement', key: 'engagement' }
];

export const BrandShowcasePage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPatternDemos, setShowPatternDemos] = useState(false);
  const [showAdapterDemos, setShowAdapterDemos] = useState(false);
  // 主题切换（仅作用于下方 Demos 区域）
  const [enableDark, setEnableDark] = useState(false);
  const [enableCompact, setEnableCompact] = useState(false);
  const algorithms = useMemo(() => {
    const arr = [] as any[];
    arr.push(enableDark ? theme.darkAlgorithm : theme.defaultAlgorithm);
    if (enableCompact) arr.push(theme.compactAlgorithm);
    return arr;
  }, [enableDark, enableCompact]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    console.log('搜索:', value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    console.log('筛选:', { key, value });
  };

  const handleAddEmployee = () => {
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (values: any) => {
    console.log('表单提交:', values);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* 页面头部 */}
      <HeaderBar
        title="品牌化组件展示"
        description="展示新的设计令牌系统和组件库的使用方法"
        breadcrumb={[
          { label: "首页", href: "/" },
          { label: "组件展示" }
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="default">
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="default">
                  <Plus className="w-4 h-4 mr-2" />
                  添加员工
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>添加新员工</DialogTitle>
                </DialogHeader>
                <FormAdapter
                  title=""
                  onFinish={handleFormSubmit}
                  submitText="添加"
                  showCancel={true}
                  onCancel={() => setIsDialogOpen(false)}
                >
                  <FormItemAdapter name="name" label="姓名" required>
                    <Input 
                      placeholder="请输入员工姓名"
                      fullWidth={true}
                    />
                  </FormItemAdapter>
                  <FormItemAdapter name="department" label="部门" required>
                    <Select
                      placeholder="请选择部门"
                      fullWidth={true}
                      options={[
                        { label: '营销部', value: 'marketing' },
                        { label: '运营部', value: 'operations' },
                        { label: '客服部', value: 'support' }
                      ]}
                    />
                  </FormItemAdapter>
                </FormAdapter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 数据概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="总员工数"
            value={156}
            unit="人"
            trend="+12"
            trendType="up"
            description="本月新增员工"
            icon={<Users className="w-6 h-6" />}
            clickable={true}
            onClick={() => console.log('点击总员工数')}
          />
          
          <MetricCard
            title="活跃员工"
            value={142}
            unit="人"
            trend="+8.5%"
            trendType="up"
            description="较上月提升"
            icon={<TrendingUp className="w-6 h-6" />}
            clickable={true}
          />
          
          <DeviceCard
            title="设备001"
            status="online"
            deviceName="Xiaomi 13 Pro"
            deviceModel="Android 13"
            lastActive="2分钟前"
            clickable={true}
          />
          
          <DeviceCard
            title="设备002"
            status="offline"
            deviceName="iPhone 15 Pro"
            deviceModel="iOS 17.2"
            lastActive="1小时前"
            clickable={true}
          />
        </div>

        {/* 筛选栏 */}
        <FilterBar
          searchPlaceholder="搜索员工姓名或部门..."
          searchValue={searchValue}
          onSearch={handleSearch}
          filters={mockFilters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          actions={
            <Button variant="outline" size="default">
              导出数据
            </Button>
          }
        />

        {/* 数据表格 */}
        <TableAdapter
          title="员工管理"
          description="管理小红书营销团队成员信息"
          columns={tableColumns}
          dataSource={mockEmployees}
          rowSelection={{
            selectedRowKeys: selectedEmployees,
            onChange: setSelectedEmployees,
          }}
          brandTheme="modern"
        />

        {/* 功能演示区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 空状态演示 */}
          <Card variant="default" className="p-6">
            <h3 className="text-lg font-semibold text-text-1 mb-4">空状态组件演示</h3>
            <NoDataState
              title="暂无营销数据"
              description="开始创建第一个营销活动来查看数据分析"
              onAddClick={() => console.log('添加营销活动')}
              addText="创建活动"
              compact={true}
            />
          </Card>

          {/* 按钮变体演示 */}
          <Card variant="default" className="p-6">
            <h3 className="text-lg font-semibold text-text-1 mb-4">按钮组件演示</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="default" size="default">
                  默认按钮
                </Button>
                <Button variant="outline" size="default">
                  轮廓按钮
                </Button>
                <Button variant="ghost" size="default">
                  透明按钮
                </Button>
                <Button variant="destructive" size="default">
                  危险按钮
                </Button>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="default" size="sm">
                  小尺寸
                </Button>
                <Button variant="default" size="default">
                  默认尺寸
                </Button>
                <Button variant="default" size="lg">
                  大尺寸
                </Button>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="default" loading={true}>
                  加载中
                </Button>
                <Button variant="default" disabled={true}>
                  禁用状态
                </Button>
              </div>
            </div>
          </Card>

          {/* 标签组件演示 */}
          <Card variant="default" className="p-6">
            <h3 className="text-lg font-semibold text-text-1 mb-4">标签组件演示 - 品牌渐变效果</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <TagPill variant="neutral">中性标签</TagPill>
                <TagPill variant="brand">品牌标签</TagPill>
                <TagPill variant="success">成功标签</TagPill>
                <TagPill variant="warning">警告标签</TagPill>
                <TagPill variant="error">错误标签</TagPill>
                <TagPill variant="info">信息标签</TagPill>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <TagPill variant="solid">实心标签 - 发光效果</TagPill>
                <TagPill variant="outline">轮廓标签 - 悬停渐变</TagPill>
                <TagPill variant="brand" selected>选中状态</TagPill>
                <TagPill variant="brand" closable onClose={() => console.log('关闭')}>可关闭</TagPill>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <TagPill variant="brand" size="sm">小尺寸</TagPill>
                <TagPill variant="brand" size="md">中尺寸</TagPill>
                <TagPill variant="brand" size="lg">大尺寸</TagPill>
              </div>
            </div>
          </Card>

          {/* 表单组件演示 */}
          <Card variant="default" className="p-6">
            <h3 className="text-lg font-semibold text-text-1 mb-4">表单组件演示 - 聚焦发光效果</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    现代化输入框 - 聚焦发光
                  </label>
                  <Input placeholder="点击体验聚焦发光效果" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    不同尺寸输入框
                  </label>
                  <div className="space-y-2">
                    <Input placeholder="小尺寸输入框" size="sm" />
                    <Input placeholder="中尺寸输入框" size="md" />
                    <Input placeholder="大尺寸输入框" size="lg" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    现代化选择器 - 玻璃态下拉
                  </label>
                  <Select 
                    placeholder="点击体验玻璃态下拉面板"
                    options={[
                      { label: '营销部', value: 'marketing' },
                      { label: '运营部', value: 'operations' },
                      { label: '客服部', value: 'support' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    不同变体选择器
                  </label>
                  <div className="space-y-2">
                    <Select placeholder="默认变体" />
                    <Select placeholder="填充变体" />
                    <Select placeholder="无边框变体" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 交互组件演示 */}
          <Card variant="default" className="p-6">
            <h3 className="text-lg font-semibold text-text-1 mb-4">交互组件演示 - Tooltip & Dialog</h3>
            <div className="space-y-6">
              {/* Tooltip演示 */}
              <div>
                <h4 className="text-sm font-medium text-text-2 mb-3">工具提示 (Tooltip)</h4>
                <TooltipProvider>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">悬停查看提示</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>这是一个基于Design Tokens的现代化工具提示</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TagPill variant="brand">带提示的标签</TagPill>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>品牌渐变标签与玻璃态提示的完美结合</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="default" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>设置按钮</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>

              {/* Dialog演示 */}
              <div>
                <h4 className="text-sm font-medium text-text-2 mb-3">对话框 (Dialog)</h4>
                <div className="flex items-center gap-4 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default">打开对话框</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>品牌化对话框</DialogTitle>
                        <DialogDescription>
                          这是一个使用Design Tokens的现代化对话框，具有玻璃态背景和品牌化发光效果。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="name" className="text-right text-text-1">姓名</label>
                          <Input id="name" placeholder="请输入姓名" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="role" className="text-right text-text-1">角色</label>
                          <Select placeholder="选择角色" className="col-span-3" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline">取消</Button>
                        <Button variant="default">确认</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">小尺寸对话框</Button>
                    </DialogTrigger>
                    <DialogContent size="sm">
                      <DialogHeader>
                        <DialogTitle>确认操作</DialogTitle>
                        <DialogDescription>
                          确定要执行此操作吗？此操作无法撤销。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-3">
                        <Button variant="ghost">取消</Button>
                        <Button variant="destructive">确认删除</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost">大尺寸对话框</Button>
                    </DialogTrigger>
                    <DialogContent size="lg">
                      <DialogHeader>
                        <DialogTitle>详细信息</DialogTitle>
                        <DialogDescription>
                          展示大尺寸对话框的布局和内容组织方式。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-1 mb-2">基本信息</label>
                            <div className="space-y-3">
                              <Input placeholder="姓名" />
                              <Input placeholder="邮箱" />
                              <Select placeholder="部门" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-1 mb-2">标签</label>
                            <div className="flex flex-wrap gap-2">
                              <TagPill variant="brand">管理员</TagPill>
                              <TagPill variant="success">活跃</TagPill>
                              <TagPill variant="outline">营销部</TagPill>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 设计令牌展示 */}
        <Card variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-text-1 mb-4">设计令牌系统</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 色彩系统 */}
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-3">品牌色彩</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-brand rounded" />
                  <span className="text-sm text-text-1">品牌主色</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-status-success rounded" />
                  <span className="text-sm text-text-1">成功状态</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-status-error rounded" />
                  <span className="text-sm text-text-1">错误状态</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-status-warning rounded" />
                  <span className="text-sm text-text-1">警告状态</span>
                </div>
              </div>
            </div>

            {/* 文字系统 */}
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-3">文字层级</h4>
              <div className="space-y-2">
                <div className="text-text-1 text-base font-medium">主要文字</div>
                <div className="text-text-2 text-sm">次要文字</div>
                <div className="text-text-3 text-xs">辅助文字</div>
                <div className="text-brand font-medium">品牌色文字</div>
              </div>
            </div>

            {/* 间距系统 */}
            <div>
              <h4 className="text-sm font-medium text-text-2 mb-3">间距系统</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand rounded" />
                  <span className="text-sm text-text-1">8px (space-2)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-brand rounded" />
                  <span className="text-sm text-text-1">12px (space-3)</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-brand rounded" />
                  <span className="text-sm text-text-1">16px (space-4)</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-6 h-6 bg-brand rounded" />
                  <span className="text-sm text-text-1">24px (space-6)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Theme 控制区 + Demos（局部 ConfigProvider） */}
        <ConfigProvider theme={{ algorithm: algorithms }}>
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-1">Theme 控制区（仅作用于下方示例）</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-2">暗黑</span>
                  <Switch checked={enableDark} onChange={setEnableDark} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-2">紧凑</span>
                  <Switch checked={enableCompact} onChange={setEnableCompact} />
                </div>
              </div>
            </div>
          </Card>

          {/* Pattern Demos 按需展示 */}
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-1">Pattern Demos</h3>
              <Button variant="outline" size="default" onClick={() => setShowPatternDemos(v => !v)}>
                {showPatternDemos ? "隐藏示例" : "显示示例"}
              </Button>
            </div>
            {showPatternDemos && (
              <React.Suspense fallback={<div className="text-text-2">加载示例...</div>}>
                <PatternDemos />
              </React.Suspense>
            )}
          </Card>

          {/* Adapter Demos 按需展示 */}
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-1">Adapter Demos</h3>
              <Button variant="outline" size="default" onClick={() => setShowAdapterDemos(v => !v)}>
                {showAdapterDemos ? "隐藏示例" : "显示示例"}
              </Button>
            </div>
            {showAdapterDemos && (
              <React.Suspense fallback={<div className="text-text-2">加载示例...</div>}>
                <AdapterDemos />
              </React.Suspense>
            )}
          </Card>
        </ConfigProvider>
      </div>
    </div>
  );
};