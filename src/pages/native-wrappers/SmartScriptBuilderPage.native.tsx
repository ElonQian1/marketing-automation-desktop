// src/pages/native-wrappers/SmartScriptBuilderPage.native.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React from 'react';
import SmartScriptBuilderPage from '../SmartScriptBuilderPage';
import { NativePage } from '../../components/native-antd/NativePage';

const SmartScriptBuilderNativeWrapper: React.FC = () => (
  <NativePage outlineDensity="default" disablePolish>
    <SmartScriptBuilderPage />
  </NativePage>
);

export default SmartScriptBuilderNativeWrapper;
