// src/components/native-antd/NativePage.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

import React from 'react';

/**
 * NativePage
 * 在局部区域内恢复接近 Ant Design v5 原生视觉（暗黑算法为主），
 * 通过 data-antd-native 容器选择器对抗项目中的全局自定义样式覆盖。
 *
 * 使用方式：
 *   <NativePage>
 *     <YourPage />
 *   </NativePage>
 *
 * 注意：该组件不修改主题算法，仅在 CSS 层面“撤销/压低”自定义覆盖，
 *       以便快速回到“原生颜值”。
 */
export interface NativePageProps {
  children: React.ReactNode;
  /** 描边密度：minimal | default | strong（默认 default，minimal 更轻描边） */
  outlineDensity?: 'minimal' | 'default' | 'strong';
  /** 是否禁用商业化润色（polish）覆盖。默认 true（禁用，以保持原生）。*/
  disablePolish?: boolean;
}

// 引入原生重置样式（仅作用于 data-antd-native 容器内）
import './native-reset.css';

export const NativePage: React.FC<NativePageProps> = ({
  children,
  outlineDensity = 'default',
  disablePolish = true,
}) => {
  const dataAttrs: Record<string, string> = {
    'data-antd-native': 'true',
    'data-outline': outlineDensity,
  };
  if (disablePolish) {
    dataAttrs['data-polish'] = 'off';
  }

  return (
    <div {...(dataAttrs as any)}>
      {children}
    </div>
  );
};

export default NativePage;
