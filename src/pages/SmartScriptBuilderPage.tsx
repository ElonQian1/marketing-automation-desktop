// src/pages/SmartScriptBuilderPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from "react";
import { Col, Row, Space, theme } from "antd";
import { XmlSnapshot } from "../types/self-contained/xmlSnapshot";
import {
  PageHeader,
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
import { useIntelligentAnalysisWorkflow } from "../modules/universal-ui/hooks/use-intelligent-analysis-workflow";



/**
 * 智能脚本构建器页面 - 原生 Ant Design 版本
 * 使用原生 Ant Design 5 组件和主题，不使用自定义样式类
 */
const SmartScriptBuilderPage: React.FC = () => {
  const { token } = theme.useToken();
  
  const analysisWorkflow = useIntelligentAnalysisWorkflow();

  const {
    headerProps,
    stepListProps,
    scriptControlPanelProps,
    stepEditModalProps,
    quickAppModalProps,
    navigationModalProps,
    contactWorkflowProps,
    qualityModalProps,
    pageFinderProps,
  } = useSmartScriptBuilder({ analysisWorkflow });

  // 🧠 智能步骤卡集成 - 传入步骤管理函数和页面查找器控制
  const { handleElementSelected, handleQuickCreateStep, isAnalyzing } = useIntelligentStepCardIntegration({
    steps: stepListProps.steps,
    setSteps: stepListProps.setSteps,
    onClosePageFinder: pageFinderProps.onClose, // callback when the page finder modal closes
    analysisWorkflow
  });



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
    // 🆕 快速创建智能步骤 - 直接调用快速创建流程
    onQuickCreate: handleQuickCreateStep,
  };

  return (
    <div style={{ 
      padding: token.padding, 
      height: '100%', 
      overflow: 'auto' 
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <PageHeader {...headerProps} />
        </div>

        <Row gutter={[12, 16]}>
          <Col xs={24} lg={16}>
            <StepListPanel {...stepListProps} />
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <ScriptControlPanel {...scriptControlPanelProps} />
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

