/**
 * 临时强制禁用所有过滤器的修复脚本
 * 确保前端显示所有元素，不进行任何过滤
 */

import fs from 'fs';
import path from 'path';

const filesToModify = [
  {
    file: 'src/components/universal-ui/UniversalPageFinderModal.tsx',
    changes: [
      {
        description: '强制设置filterConfig为无过滤状态',
        search: /const \[filterConfig, setFilterConfig\] = useState<VisualFilterConfig>\(\(\) => \{[^}]+\}\);/s,
        replace: `const [filterConfig, setFilterConfig] = useState<VisualFilterConfig>(() => {
    // 🔧 强制禁用所有过滤器
    return {
      onlyClickable: false,
      treatButtonAsClickable: true,
      requireTextOrDesc: false,
      minWidth: 1,
      minHeight: 1,
      includeClasses: [],
      excludeClasses: [],
    };
  });`
      }
    ]
  },
  {
    file: 'src/components/universal-ui/views/visual-view/VisualElementView.tsx',
    changes: [
      {
        description: '强制设置showOnlyClickable为false',
        search: /const \[showOnlyClickable, setShowOnlyClickable\] = useState\(.*\);/,
        replace: 'const [showOnlyClickable, setShowOnlyClickable] = useState(false); // 🔧 强制显示所有元素'
      }
    ]
  },
  {
    file: 'src/services/XmlPageCacheService.ts',
    changes: [
      {
        description: '确保parseXmlToElements始终使用enableFiltering=false',
        search: /enable_filtering: false/g,
        replace: 'enable_filtering: false  // 🔧 强制禁用后端过滤'
      }
    ]
  }
];

console.log('🔧 创建强制禁用所有过滤器的修复方案...\n');

console.log('方案1: 手动修改代码');
filesToModify.forEach((fileInfo, index) => {
  console.log(`${index + 1}. 修改文件: ${fileInfo.file}`);
  fileInfo.changes.forEach((change, changeIndex) => {
    console.log(`   ${changeIndex + 1}. ${change.description}`);
  });
  console.log('');
});

console.log('方案2: 创建调试组件');
console.log('创建一个完全不使用任何过滤器的简单测试组件:');
console.log('');

const debugComponentCode = `
// 调试组件 - 完全不过滤的元素显示
const DebugElementList = ({ xmlContent }) => {
  const [elements, setElements] = useState([]);
  
  useEffect(() => {
    const parseAndDisplay = async () => {
      try {
        // 直接调用后端解析，不应用任何过滤
        const rawElements = await invoke('parse_cached_xml_to_elements', { 
          xml_content: xmlContent, 
          enable_filtering: false 
        });
        console.log('🔍 调试: 接收到的原始元素数量:', rawElements.length);
        console.log('🎯 调试: 可点击元素数量:', rawElements.filter(e => e.is_clickable).length);
        console.log('📋 调试: 可点击元素详情:', rawElements.filter(e => e.is_clickable));
        setElements(rawElements);
      } catch (error) {
        console.error('❌ 调试: 解析失败:', error);
      }
    };
    
    if (xmlContent) {
      parseAndDisplay();
    }
  }, [xmlContent]);
  
  const clickableElements = elements.filter(e => e.is_clickable);
  
  return (
    <div style={{ padding: '20px', border: '2px solid red' }}>
      <h3>🔧 调试组件 - 无过滤器</h3>
      <p>总元素数: {elements.length}</p>
      <p>可点击元素数: {clickableElements.length}</p>
      <div>
        <h4>可点击元素列表:</h4>
        {clickableElements.map((element, index) => (
          <div key={element.id} style={{ border: '1px solid #ccc', margin: '5px', padding: '10px' }}>
            <strong>{index + 1}. {element.text || '(无文本)'}</strong>
            <br />
            类型: {element.element_type}
            <br />
            Resource ID: {element.resource_id}
            <br />
            位置: [{element.bounds.left},{element.bounds.top}][{element.bounds.right},{element.bounds.bottom}]
          </div>
        ))}
      </div>
    </div>
  );
};
`;

console.log(debugComponentCode);
console.log('');

console.log('方案3: 直接修复localStorage');
console.log('在浏览器控制台执行:');
console.log('localStorage.clear();');
console.log('window.location.reload();');
console.log('');

console.log('🎯 推荐执行顺序:');
console.log('1. 先清除localStorage并重新加载页面');
console.log('2. 如果问题依然存在，使用调试组件验证原始数据');
console.log('3. 根据调试结果修改相应的代码');
console.log('');

console.log('✅ 预期结果: 显示7个可点击元素而不是3个');