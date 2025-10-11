// src/examples/AppWithContactImport.tsx
// module: shared | layer: examples | role: 示例代码
// summary: 功能演示和使用示例

import React from 'react';
import ContactImportPage from '../pages/contact-import/ContactImportPage';

/**
 * 应用主组件示例 - 集成通讯录导入功能
 * 这个示例展示了如何将通讯录导入功能集成到你的应用中
 */
export const App: React.FC = () => {
  return (
    <div className="app">
      {/* 你可以在这里添加导航栏、侧边栏等其他UI组件 */}
      
      {/* 通讯录导入页面 */}
      <ContactImportPage />
      
      {/* 你的其他页面和组件 */}
    </div>
  );
};

export default App;

