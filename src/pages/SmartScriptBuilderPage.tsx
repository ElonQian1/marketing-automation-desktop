// src/pages/SmartScriptBuilderPage.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from "react";
import { Col, Row, Space, theme } from "antd";
import { XmlSnapshot } from "../components/universal-ui/page-finder-modal/types";
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

  // 适配 pageFinderProps 的回调函数
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
