/**
 * 高级主题功能组件 - 重构版本
 * 整合各个子组件，保持文件小于500行
 */

import React from 'react';
import { Card, Typography } from 'antd';

const { Paragraph } = Typography;

/**
 * 高级主题功能（已禁用自定义）
 * 为确保全局“原生 Ant Design v5 暗黑主题”，此组件仅展示说明，不提供任何主题修改入口。
 */
export const ThemeAdvanced: React.FC = () => {
  return (
    <Card title="主题与外观">
      <Paragraph>
        本应用已统一采用 Ant Design v5 原生暗黑主题，禁用自定义主题/动画/预设等高级设置，确保视觉风格一致且稳定。
      </Paragraph>
      <Paragraph type="secondary">
        如需恢复高级主题功能，请在设计评审通过后再启用，并确保不引入任何自定义样式或 token 覆盖。
      </Paragraph>
    </Card>
  );
};

export default ThemeAdvanced;