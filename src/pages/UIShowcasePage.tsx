import React, { useState } from 'react';
import { theme } from 'antd';
import { 
  PrimaryButton, 
  SecondaryButton, 
  IconButton,
  Input,
  TextArea,
  Select,
  FormField,
  PageContainer,
  Panel,
  Grid,
  GridItem,
  Loading
} from '../components/ui';
import { 
  ReloadOutlined, 
  SettingOutlined, 
  DeleteOutlined,
  SearchOutlined 
} from '@ant-design/icons';

/**
 * UI组件库展示页面
 * 展示所有可用的UI组件及其用法
 */
const UIShowcasePage: React.FC = () => {
  const { token } = theme.useToken();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    category: '',
    description: '',
  });

  const handleFormSubmit = () => {
    setIsLoading(true);
    // 模拟异步操作
    setTimeout(() => {
      setIsLoading(false);
      console.log('表单提交:', formData);
    }, 2000);
  };

  const selectOptions = [
    { label: '选项1', value: 'option1' },
    { label: '选项2', value: 'option2' },
    { label: '选项3', value: 'option3' },
  ];

  return (
    <PageContainer>
      <div style={{ padding: token.paddingLG }}>
        <div style={{ marginBottom: token.marginLG }}>
          <h1>UI组件库展示</h1>
          <p>所有可用的UI组件及其使用示例</p>
        </div>
      {/* 按钮组件展示 */}
      <Panel title="按钮组件" style={{ marginBottom: token.marginLG }}>
        <Grid spacing="medium">
          <GridItem span={8}>
            <h4>主要按钮</h4>
            <div style={{ display: 'flex', gap: token.marginXS, flexWrap: 'wrap' }}>
              <PrimaryButton size="small">小按钮</PrimaryButton>
              <PrimaryButton size="medium">中按钮</PrimaryButton>
              <PrimaryButton size="large">大按钮</PrimaryButton>
              <PrimaryButton loading>加载中</PrimaryButton>
              <PrimaryButton disabled>禁用状态</PrimaryButton>
            </div>
          </GridItem>
          
          <GridItem span={8}>
            <h4>次要按钮</h4>
            <div style={{ display: 'flex', gap: token.marginXS, flexWrap: 'wrap' }}>
              <SecondaryButton size="small">小按钮</SecondaryButton>
              <SecondaryButton size="medium">中按钮</SecondaryButton>
              <SecondaryButton size="large">大按钮</SecondaryButton>
              <SecondaryButton loading>加载中</SecondaryButton>
            </div>
          </GridItem>
          
          <GridItem span={8}>
            <h4>图标按钮</h4>
            <div style={{ display: 'flex', gap: token.marginXS, flexWrap: 'wrap' }}>
              <IconButton variant="primary" tooltip="刷新">
                <ReloadOutlined />
              </IconButton>
              <IconButton variant="secondary" tooltip="设置">
                <SettingOutlined />
              </IconButton>
              <IconButton variant="danger" tooltip="删除">
                <DeleteOutlined />
              </IconButton>
              <IconButton variant="ghost" circular tooltip="搜索">
                <SearchOutlined />
              </IconButton>
            </div>
          </GridItem>
        </Grid>
      </Panel>

      {/* 表单组件展示 */}
      <Panel title="表单组件" style={{ marginBottom: token.marginLG }}>
        <Grid spacing="medium">
          <GridItem span={12}>
            <FormField
              label="用户名"
              required
              help="请输入有效的用户名"
            >
              <Input
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                size="large"
              />
            </FormField>
          </GridItem>
          
          <GridItem span={12}>
            <FormField
              label="邮箱地址"
              required
            >
              <Input
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                size="large"
              />
            </FormField>
          </GridItem>
          
          <GridItem span={12}>
            <FormField
              label="分类"
              required
            >
              <Select
                placeholder="请选择分类"
                options={selectOptions}
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                fullWidth
              />
            </FormField>
          </GridItem>
          
          <GridItem span={12}>
            <FormField
              label="描述信息"
            >
              <TextArea
                placeholder="请输入描述信息"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </FormField>
          </GridItem>
          
          <GridItem span={24}>
            <div style={{ display: 'flex', gap: token.margin, justifyContent: 'flex-end' }}>
              <SecondaryButton>重置</SecondaryButton>
              <PrimaryButton 
                loading={isLoading}
                onClick={handleFormSubmit}
              >
                提交表单
              </PrimaryButton>
            </div>
          </GridItem>
        </Grid>
      </Panel>

      {/* 布局组件展示 */}
      <Panel title="布局组件" style={{ marginBottom: token.marginLG }}>
        <h4>网格系统</h4>
        <Grid spacing="medium" style={{ marginBottom: token.margin }}>
          <GridItem span={6}>
            <div style={{ 
              background: token.colorFillSecondary, 
              padding: token.padding, 
              textAlign: 'center',
              borderRadius: token.borderRadius 
            }}>
              span=6
            </div>
          </GridItem>
          <GridItem span={6}>
            <div style={{ 
              background: token.colorFillSecondary, 
              padding: token.padding, 
              textAlign: 'center',
              borderRadius: token.borderRadius 
            }}>
              span=6
            </div>
          </GridItem>
          <GridItem span={6}>
            <div style={{ 
              background: token.colorFillSecondary, 
              padding: token.padding, 
              textAlign: 'center',
              borderRadius: token.borderRadius 
            }}>
              span=6
            </div>
          </GridItem>
          <GridItem span={6}>
            <div style={{ 
              background: token.colorFillSecondary, 
              padding: token.padding, 
              textAlign: 'center',
              borderRadius: token.borderRadius 
            }}>
              span=6
            </div>
          </GridItem>
        </Grid>
        
        <Grid spacing="large">
          <GridItem span={8}>
            <div style={{ 
              background: token.colorPrimaryBg, 
              padding: token.padding, 
              textAlign: 'center',
              borderRadius: token.borderRadius 
            }}>
              span=8
            </div>
          </GridItem>
          <GridItem span={16}>
            <div style={{ 
              background: token.colorWarningBg, 
              padding: token.padding, 
              textAlign: 'center',
              borderRadius: token.borderRadius 
            }}>
              span=16
            </div>
          </GridItem>
        </Grid>
      </Panel>

      {/* 反馈组件展示 */}
      <Panel title="反馈组件">
        <Grid spacing="medium">
          <GridItem span={8}>
            <h4>基础加载</h4>
            <Loading text="正在加载..." />
          </GridItem>
          
          <GridItem span={8}>
            <h4>不同尺寸</h4>
            <div style={{ display: 'flex', gap: token.margin, alignItems: 'center' }}>
              <Loading size="small" showText={false} />
              <Loading size="medium" showText={false} />
              <Loading size="large" showText={false} />
            </div>
          </GridItem>
          
          <GridItem span={8}>
            <h4>包装内容</h4>
            <Loading spinning={isLoading} text="数据加载中...">
              <div style={{ 
                padding: token.paddingLG, 
                background: token.colorFillTertiary, 
                borderRadius: token.borderRadius,
                textAlign: 'center' 
              }}>
                {isLoading ? '正在加载数据...' : '数据已加载完成'}
              </div>
            </Loading>
          </GridItem>
        </Grid>
      </Panel>
      </div>
    </PageContainer>
  );
};

export default UIShowcasePage;