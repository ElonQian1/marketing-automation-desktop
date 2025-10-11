// src/pages/SmartScriptBuilderPage/components/step-edit-modal/components/ParametersRenderSection.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Row, Col, Card, theme, Form, Input, Select, InputNumber } from 'antd';
import { SmartActionType } from '../../../../../types/smartComponents';
import { SMART_ACTION_CONFIGS } from '../../../helpers/constants';
import type { ParametersRenderSectionProps } from '../types';

/**
 * 参数渲染部分 - 简化版本
 * 根据步骤类型动态渲染对应的参数配置组件
 */
export const ParametersRenderSection: React.FC<ParametersRenderSectionProps> = ({ 
  form, 
  editingStep, 
  currentDeviceId 
}) => {
  const { token } = theme.useToken();
  
  const { getFieldValue } = form;

  // 简化的参数渲染
  const renderParametersForStepType = () => {
    const stepType = getFieldValue("step_type");
    const config = SMART_ACTION_CONFIGS[stepType];

    if (!stepType || !config) {
      return null;
    }

    // 简化处理：根据步骤类型渲染基本参数
    return renderGenericParams(config, stepType);
  };

  // 渲染通用参数
  const renderGenericParams = (config: any, stepType: string) => {
    const basicParams = config.parameters || [];
    
    if (basicParams.length === 0) {
      return (
        <Card
          title={`${config.name} 参数配置`}
          size="small"
          style={{ marginBottom: token.marginMD }}
        >
          <div style={{ textAlign: 'center', color: token.colorTextSecondary }}>
            此步骤类型暂无需配置额外参数
          </div>
        </Card>
      );
    }

    return (
      <Card
        title={`${config.name} 参数配置`}
        size="small"
        style={{ marginBottom: token.marginMD }}
      >
        <Row gutter={[token.marginMD, token.marginMD]}>
          {basicParams.map((param: any) => (
            <Col span={24} key={param.key}>
              <Form.Item
                label={param.label || param.key}
                name={param.key}
                tooltip={param.description}
              >
                {renderSimpleInput(param)}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // 简化的输入组件渲染
  const renderSimpleInput = (param: any) => {
    switch (param.type) {
      case 'number':
        return <InputNumber placeholder={param.placeholder} style={{ width: '100%' }} />;
      case 'select':
        return (
          <Select placeholder={param.placeholder}>
            {param.options?.map((option: any) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case 'textarea':
        return <Input.TextArea placeholder={param.placeholder} rows={3} />;
      default:
        return <Input placeholder={param.placeholder} />;
    }
  };

  return (
    <div style={{ marginTop: token.marginMD }}>
      {renderParametersForStepType()}
    </div>
  );
};