// src/pages/execution-monitor/components/ScriptList.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';
import { Card, List, Button, Space, Typography, Divider, Tag, Row, Col } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

export interface ScriptListProps {
  scripts: any[];
  onExecute: (script: any) => void;
  getStepTypeIcon: (type: string) => React.ReactNode;
  getStepTypeText: (type: string) => string;
}

export const ScriptList: React.FC<ScriptListProps> = ({ scripts, onExecute, getStepTypeIcon, getStepTypeText }) => (
  <Card title="可用脚本列表">
    <List
      grid={{ gutter: 16, column: 1 }}
      dataSource={scripts}
      renderItem={(script) => (
        <List.Item>
          <Card
            hoverable
            actions={[
              <Button
                key="execute"
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => onExecute(script)}
              >
                开始执行监控
              </Button>
            ]}
          >
            <Card.Meta
              title={
                <Row align="middle" justify="space-between">
                  <Col><span>{script.name}</span></Col>
                  <Col><Tag color="blue">{script.steps.length} 个步骤</Tag></Col>
                </Row>
              }
              description={
                <>
                  <Paragraph ellipsis={{ rows: 2 }}>
                    {script.description}
                  </Paragraph>
                  <Divider />
                  <div>
                    <Text strong>脚本步骤:</Text>
                    <Space direction="vertical">
                      {script.steps.slice(0, 3).map((step: any, index: number) => (
                        <Space key={step.id} align="center">
                          <Tag color="blue">{index + 1}</Tag>
                          {getStepTypeIcon(step.type)}
                          <Text>{step.name}</Text>
                          <Tag color="geekblue">{getStepTypeText(step.type)}</Tag>
                        </Space>
                      ))}
                      {script.steps.length > 3 && (
                        <Text type="secondary">
                          ... 还有 {script.steps.length - 3} 个步骤
                        </Text>
                      )}
                    </Space>
                  </div>
                </>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  </Card>
);

export default ScriptList;
