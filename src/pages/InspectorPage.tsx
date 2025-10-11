// src/pages/InspectorPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useEffect, useMemo, useState } from 'react';
import { useInspectorStore } from '../application/inspectorStore';
import { InspectorApplicationService } from '../application/services/InspectorApplicationService';
import { GridElementView } from '../components/universal-ui/views/grid-view/GridElementView';
import { parseUiAutomatorXml, attachParents } from '../components/universal-ui/views/grid-view/utils';
import { LocatorService } from '../infrastructure/inspector/LocatorService';
import { LocalStepRepository } from '../infrastructure/inspector/LocalStepRepository';

interface Props {
  sessionId?: string;
  stepId?: string;
}

const app = new InspectorApplicationService();
const locator = new LocatorService();

export const InspectorPage: React.FC<Props> = ({ sessionId, stepId }) => {
  const { sessions, activeSessionId, setActiveSession } = useInspectorStore();
  const [xmlText, setXmlText] = useState<string>('');
  const [locatorData, setLocatorData] = useState<any | null>(null);
  const stepRepo = useMemo(() => new LocalStepRepository(), []);

  // 初始化：如果有 stepId，优先打开 step；否则切换到 sessionId
  useEffect(() => {
    (async () => {
      if (stepId) {
        await app.openStep(stepId);
        const step = await stepRepo.get(stepId);
        if (step) setLocatorData(step.locator);
      } else if (sessionId) {
        setActiveSession(sessionId);
      }
    })();
  }, [sessionId, stepId]);

  // 会话变化时，装载 XML
  useEffect(() => {
    const id = useInspectorStore.getState().activeSessionId;
    if (!id) return;
    const sess = useInspectorStore.getState().sessions[id];
    if (sess) setXmlText(sess.xmlText);
  }, [activeSessionId]);

  // 在 GridElementView 解析完成后，执行节点定位（通过 key 强制重建以触发 onParse）
  const key = useMemo(() => (activeSessionId ? 'inspector-' + activeSessionId : 'inspector-empty'), [activeSessionId]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <GridElementView
        key={key}
        xmlContent={xmlText}
        locator={locatorData || undefined}
        locatorResolve={(root, loc) => locator.resolve(root, loc)}
      />
    </div>
  );
};

export default InspectorPage;
