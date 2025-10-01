import React, { Suspense } from 'react';
import { PageWrapper } from '../../components/layout';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { lazyRetry } from '../../utils/lazyRetry';

const ContactImportWorkbench = React.lazy(() => lazyRetry(() =>
  import('../../modules/contact-import/ui/ContactImportWorkbenchSimple')
    .then(m => ({ default: m.ContactImportWorkbenchSimple }))
));

const ContactImportPage: React.FC = () => {
  return (
    <PageWrapper title="联系人导入工作台" subtitle="随时导入TXT到号码池 · 随时选择设备与生成VCF并导入">
      <ErrorBoundary>
        <Suspense fallback={<div style={{ padding: 16 }}>加载中...</div>}>
          <ContactImportWorkbench />
        </Suspense>
      </ErrorBoundary>
    </PageWrapper>
  );
};

export default ContactImportPage;
