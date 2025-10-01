import React from 'react';
import SmartScriptBuilderPage from '../SmartScriptBuilderPage';
import { NativePage } from '../../components/native-antd/NativePage';

const SmartScriptBuilderNativeWrapper: React.FC = () => (
  <NativePage outlineDensity="default" disablePolish>
    <SmartScriptBuilderPage />
  </NativePage>
);

export default SmartScriptBuilderNativeWrapper;
