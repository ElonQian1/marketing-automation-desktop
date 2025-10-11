// src/pages/ContactImportPageBrandNew.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { Suspense } from 'react';

// 品牌化布局组件
import { PageShell } from '../components/layout/PageShell';
import { CardShell } from '../components/ui/CardShell';

// 错误边界和工具
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { lazyRetry } from '../utils/lazyRetry';

// 懒加载联系人导入工作台
const ContactImportWorkbench = React.lazy(() => lazyRetry(() =>
  import('../modules/contact-import/ui/ContactImportWorkbench')
    .then(m => ({ default: m.ContactImportWorkbench }))
));

/**
 * 联系人导入页面（品牌化重构版）
 * 
 * 架构原则:
 * - layout: PageShell提供一致的页面框架
 * - ui: CardShell容器，品牌化加载状态
 * - adapters: 通过ErrorBoundary适配现有业务组件
 * 
 * 品牌合规:
 * - 零 .ant-* 样式覆盖
 * - 统一Design Tokens驱动
 * - 轻量化容器组件
 */
const ContactImportPageBrandNew: React.FC = () => {
  return (
    <PageShell 
      title="联系人导入工作台"
      description="随时导入TXT到号码池 · 随时选择设备与生成VCF并导入"
    >
      <ErrorBoundary>
        <Suspense 
          fallback={
            <CardShell className="h-32 flex items-center justify-center">
              <div className="flex items-center space-x-3 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm font-medium">加载联系人导入工具中...</span>
              </div>
            </CardShell>
          }
        >
          <ContactImportWorkbench />
        </Suspense>
      </ErrorBoundary>
    </PageShell>
  );
};

export default ContactImportPageBrandNew;