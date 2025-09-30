/**
 * App Launch Test 模块导出
 */

// 主组件
export { default as AppLaunchTestPageModular } from './AppLaunchTestPageModular';

// 子组件
export { ControlPanelSection } from './components/ControlPanelSection';
export { LaunchResultSection } from './components/LaunchResultSection';
export { LaunchHistorySection } from './components/LaunchHistorySection';
export { FeatureDescriptionSection } from './components/FeatureDescriptionSection';

// 类型定义
export type {
  AppInfo,
  AppStateResult,
  AppLaunchResult,
  Device,
  ControlPanelProps,
  LaunchResultProps,
  LaunchHistoryProps,
  FeatureDescriptionProps,
} from './types/AppLaunchTestTypes';