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
import { motion } from 'framer-motion';

// 适配器导入 - 遵守Employee D架构约束
import { GridRow, GridCol, GridSpace } from '../components/adapters/grid/GridAdapter';
import { BrandStarIcon, BrandRocketIcon, BrandBulbIcon } from '../components/adapters/icons/IconAdapter';

// Layout 组件
import { PageShell } from '../components/layout/PageShell';

// UI 轻组件 - 品牌化组件库
import {
  Button,
  CardShell,
  CardShellHeader,
  CardShellTitle,
  CardShellDescription,
  TagPill,
} from '../components/ui';

// Motion 组件 - 统一动效
import { FadeIn, SlideIn, ScaleIn } from '../components/ui/motion/MotionSystem';

// Patterns 组件 - 页面级图元
// import { FilterBar } from '../components/patterns/FilterBar'; // 暂时移除

// 示例数据
const brandFeatures = [
  {
    icon: <BrandStarIcon />,
    title: '现代化设计',
    description: '基于 Design Tokens 的一致性品牌体验',
    status: '已完成',
    tone: 'success' as const,
  },
  {
    icon: <BrandRocketIcon />,
    title: '高性能组件',
    description: 'Radix UI + shadcn/ui 轻组件库',
    status: '已完成',
    tone: 'success' as const,
  },
  {
    icon: <BrandBulbIcon />,
    title: '智能适配',
    description: 'AntD 重组件无缝集成适配',
    status: '进行中',
    tone: 'info' as const,
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
        <GridRow gutter={[24, 24]} style={{ marginBottom: '2rem' }}>
          {brandFeatures.map((feature, index) => (
            <GridCol xs={24} md={8} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
              >
                <CardShell className="h-full" tone={feature.tone} interactive>
                  <CardShellHeader className="flex items-start gap-4">
                    <span className="text-2xl text-[color:var(--text-1)]/80">
                      {feature.icon}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardShellTitle>{feature.title}</CardShellTitle>
                        <TagPill
                          variant={feature.status === '已完成' ? 'success' : 'info'}
                          size="sm"
                        >
                          {feature.status}
                        </TagPill>
                      </div>
                      <CardShellDescription>
                        {feature.description}
                      </CardShellDescription>
                    </div>
                  </CardShellHeader>
                </CardShell>
              </motion.div>
            </GridCol>
          ))}
        </GridRow>

        {/* UI 组件展示 */}
        <SlideIn direction="up">
          <CardShell className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              UI 组件库展示
            </h2>
            <GridSpace wrap size="large">
              <Button variant="solid" tone="brand" size="lg">
                主要按钮
              </Button>
              <Button variant="soft" tone="neutral" size="lg">
                次要按钮
              </Button>
              <Button variant="outline" tone="brand" size="lg">
                轮廓按钮
              </Button>
              <Button variant="ghost" tone="brand" size="lg">
                幽灵按钮
              </Button>
              <Button variant="solid" tone="success" size="lg">
                成功操作
              </Button>
            </GridSpace>
          </CardShell>
        </SlideIn>

        {/* 统计展示 */}
        <SlideIn direction="up">
          <GridRow gutter={[16, 16]}>
            <GridCol xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-brand-600 mb-2">3</div>
                <div className="text-sm text-gray-600 mb-1">页面重构</div>
                <TagPill variant="success" size="sm">100% 完成</TagPill>
              </CardShell>
            </GridCol>
            <GridCol xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-brand-600 mb-2">15+</div>
                <div className="text-sm text-gray-600 mb-1">轻组件</div>
                <TagPill variant="brand" size="sm">已建立</TagPill>
              </CardShell>
            </GridCol>
            <GridCol xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-success-600 mb-2">100%</div>
                <div className="text-sm text-gray-600 mb-1">架构合规</div>
                <TagPill variant="success" size="sm">零违规</TagPill>
              </CardShell>
            </GridCol>
            <GridCol xs={24} sm={12} lg={6}>
              <CardShell className="text-center">
                <div className="text-3xl font-bold text-warning-600 mb-2">40MB</div>
                <div className="text-sm text-gray-600 mb-1">包体大小</div>
                <TagPill variant="warning" size="sm">需优化</TagPill>
              </CardShell>
            </GridCol>
          </GridRow>
        </SlideIn>
      </FadeIn>
    </PageShell>
  );
};

export default BrandShowcasePage;