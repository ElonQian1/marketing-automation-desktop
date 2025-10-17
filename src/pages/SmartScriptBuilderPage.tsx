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
import StepBundleManager from "../components/StepBundleManager";
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
    controlPanelProps,
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
          
          {/* 🎯 步骤包管理器 */}
          <div style={{ 
            marginTop: token.marginSM, 
            padding: `${token.paddingSM}px ${token.padding}px`,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
            border: `1px solid ${token.colorBorderSecondary}`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: token.marginXS
            }}>
              <Space>
                <span style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
                  📦 步骤包管理
                </span>
                <span style={{ color: token.colorTextTertiary, fontSize: '12px' }}>
                  导出脚本和XML快照，支持跨设备分享和复现
                </span>
              </Space>
              <StepBundleManager 
                steps={stepListProps.steps}
                onImportSteps={(importedSteps) => {
                  stepListProps.setSteps(prev => [...prev, ...importedSteps]);
                }}
                deviceInfo={{
                  brand: 'Unknown',
                  model: 'Unknown', 
                  size: '1080x2340'
                }}
              />
            </div>
          </div>
        </div>

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

