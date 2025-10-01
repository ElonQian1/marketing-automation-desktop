
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

import React, { useState } from "react";
import { Plus, Users, Smartphone, TrendingUp, Settings } from "lucide-react";

// 导入品牌化组件
import { Button } from "../../components/ui/button/Button";
import { Card } from "../../components/ui/card/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog/Dialog";
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
                    <input 
                      type="text" 
                      placeholder="请输入员工姓名"
                      className="w-full px-3 py-2 bg-bg-input border border-border-primary rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </FormItemAdapter>
                  <FormItemAdapter name="department" label="部门" required>
                    <select className="w-full px-3 py-2 bg-bg-input border border-border-primary rounded-lg text-text-1 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                      <option value="">请选择部门</option>
                      <option value="marketing">营销部</option>
                      <option value="operations">运营部</option>
                      <option value="support">客服部</option>
                    </select>
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
      </div>
    </div>
  );
};