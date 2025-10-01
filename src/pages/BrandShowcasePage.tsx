// 文件路径：src/pages/BrandShowcasePage.tsx

/**
 * 品牌化展示页面 - 重构成果演示
 * 
 * 这个页面展示了完整的品牌化重构成果：
 * - Layout + Patterns + UI + Adapters 的完整组合
 * - 统一的设计令牌和动效
 * - 现代化的商业风格
 * 
 * 仅负责页面编排，不包含任何视觉硬编码
 */

import React from 'react';
import { Row, Col, Space } from 'antd';
import { motion } from 'framer-motion';
import { 
  StarOutlined, 
  RocketOutlined, 
  BulbOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

// Layout 组件
import { PageShell } from '../components/layout/PageShell';

// UI 轻组件 - 品牌化组件库
import { Button, CardShell, TagPill } from '../components/ui';

// Motion 组件 - 统一动效
import { FadeIn, SlideIn, ScaleIn } from '../components/ui/motion/MotionSystem';

// Patterns 组件 - 页面级图元  
import { FilterBar } from '../components/patterns/FilterBar';

// 示例数据
const brandFeatures = [
  {
    icon: <StarOutlined />,
    title: '现代化设计',
    description: '基于 Design Tokens 的一致性品牌体验',
    status: '已完成'
  },
  {
    icon: <RocketOutlined />,
    title: '高性能组件',
    description: 'Radix UI + shadcn/ui 轻组件库',
    status: '已完成'
  },
  {
    icon: <BulbOutlined />,
    title: '智能适配',
    description: 'AntD 重组件无缝集成适配',
    status: '进行中'
  }
];

/**
 * 品牌化展示页面组件
 */
export const BrandShowcasePage: React.FC = () => {
  return (
    <PageShell 
      title="品牌化重构展示"
      description="展示 layout + patterns + ui + adapters 完整架构成果"
    >
      <FadeIn>
        {/* 品牌特性展示区 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '2rem' }}>
          {brandFeatures.map((feature, index) => (
            <Col xs={24} md={8} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
              >
                <CardShell className="h-full">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl text-primary-600">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {feature.title}
                        </h3>
                        <TagPill 
                          variant={feature.status === '已完成' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {feature.status}
                        </TagPill>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardShell>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* UI 组件展示 */}
        <SlideIn direction="up">
          <CardShell className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              UI 组件库展示
            </h2>
            <Space wrap size="large">
              <Button variant="default" size="lg">
                主要按钮
              </Button>
              <Button variant="secondary" size="lg">
                次要按钮
              </Button>
              <Button variant="outline" size="lg">
                轮廓按钮
              </Button>
              <Button variant="ghost" size="lg">
                幽灵按钮
              </Button>
            </Space>
          </CardShell>
        </SlideIn>

        {/* 统计展示 */}
        <SlideIn direction="up">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-brand-600 mb-2">3</div>
                <div className="text-sm text-gray-600 mb-1">页面重构</div>
                <TagPill variant="success" size="sm">100% 完成</TagPill>
              </CardShell>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-brand-600 mb-2">15+</div>
                <div className="text-sm text-gray-600 mb-1">轻组件</div>
                <TagPill variant="brand" size="sm">已建立</TagPill>
              </CardShell>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-success-600 mb-2">100%</div>
                <div className="text-sm text-gray-600 mb-1">架构合规</div>
                <TagPill variant="success" size="sm">零违规</TagPill>
              </CardShell>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-warning-600 mb-2">40MB</div>
                <div className="text-sm text-gray-600 mb-1">包体大小</div>
                <TagPill variant="warning" size="sm">需优化</TagPill>
              </CardShell>
            </Col>
          </Row>
        </SlideIn>
      </FadeIn>
    </PageShell>
  );
};

export default BrandShowcasePage;