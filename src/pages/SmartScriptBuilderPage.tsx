// src/pages/SmartScriptBuilderPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from "react";
import { Col, Row, Space, theme } from "antd";
import { XmlSnapshot } from "../types/self-contained/xmlSnapshot";
import {
  PageHeader,
  ControlPanel,
  StepEditModal,
  QuickAppSelectionModal,
  QualityCheckModal,
} from "./SmartScriptBuilderPage/components";
import StepListPanel from "./SmartScriptBuilderPage/components/StepListPanel";
import ScriptControlPanel from "./SmartScriptBuilderPage/components/ScriptControlPanel";
import { SmartNavigationModal } from "../components";
import { UniversalPageFinderModal } from "../components/universal-ui/UniversalPageFinderModal";
import { useIntelligentStepCardIntegration } from "./SmartScriptBuilderPage/hooks/useIntelligentStepCardIntegration";
import { ContactWorkflowSelector } from "../modules/contact-automation";
import { useSmartScriptBuilder } from "./SmartScriptBuilderPage/hooks/useSmartScriptBuilder";



/**
 * 智能脚本构建器页面 - 原生 Ant Design 版本
 * 使用原生 Ant Design 5 组件和主题，不使用自定义样式类
 */
const SmartScriptBuilderPage: React.FC = () => {
  const { token } = theme.useToken();
  
  const {
    headerProps,
    stepListProps,
    scriptControlPanelProps,
    controlPanelProps,
    stepEditModalProps,
    quickAppModalProps,
    navigationModalProps,
    contactWorkflowProps,
    qualityModalProps,
    pageFinderProps,
  } = useSmartScriptBuilder();

  // 🧠 智能步骤卡集成
  const { handleElementSelected, isAnalyzing } = useIntelligentStepCardIntegration();

  // 适配 pageFinderProps 的回调函数，集成智能分析
  const adaptedPageFinderProps = {
    ...pageFinderProps,
    onSnapshotCaptured: (snapshot: XmlSnapshot) => {
      // 调用原始的回调函数，传入适配后的快照
      pageFinderProps.onSnapshotCaptured(snapshot);
    },
    onSnapshotUpdated: (snapshot: XmlSnapshot) => {
      // 调用原始的回调函数，传入适配后的快照
      pageFinderProps.onSnapshotUpdated(snapshot);
    },
    // 🧠 集成智能分析：元素选择时自动创建智能步骤卡
    onElementSelected: handleElementSelected,
  };

  return (
    <div style={{ 
      padding: token.padding, 
      height: '100%', 
      overflow: 'auto' 
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <PageHeader {...headerProps} />

        <Row gutter={[12, 16]}>
          <Col xs={24} lg={16}>
            <StepListPanel {...stepListProps} />
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <ScriptControlPanel {...scriptControlPanelProps} />
              <ControlPanel {...controlPanelProps} />
            </Space>
          </Col>
        </Row>
      </Space>

      <StepEditModal {...stepEditModalProps} />
      <QuickAppSelectionModal {...quickAppModalProps} />
      <SmartNavigationModal {...navigationModalProps} />
      <UniversalPageFinderModal {...adaptedPageFinderProps} />
      <ContactWorkflowSelector {...contactWorkflowProps} />
      <QualityCheckModal {...qualityModalProps} />
    </div>
  );
};

export default SmartScriptBuilderPage;
