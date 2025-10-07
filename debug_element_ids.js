import fs from 'fs';

const xml = fs.readFileSync('debug_xml/current_ui_dump.xml', 'utf8');

// 提取所有node元素
const nodeRegex = /<node[^>]+>/g;
const matches = xml.match(nodeRegex);

console.log(`总共找到 ${matches.length} 个node元素\n`);

matches.forEach((nodeStr, index) => {
  const getAttr = (attr) => {
    const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
    const match = nodeStr.match(regex);
    return match ? match[1] : '';
  };
  
  const resourceId = getAttr('resource-id');
  const text = getAttr('text');
  const bounds = getAttr('bounds');
  const className = getAttr('class');
  
  // 查找关键元素
  if (resourceId === 'com.hihonor.contacts:id/bottom_navgation' || 
      text === '电话' || text === '联系人' || text === '收藏' ||
      (bounds && bounds.includes('[0,1420]')) ||
      (bounds && bounds.includes('[256,1420]')) ||
      (bounds && bounds.includes('[464,1420]'))) {
    console.log(`element_${index + 1}: ${resourceId || text || className} - ${bounds}`);
  }
});