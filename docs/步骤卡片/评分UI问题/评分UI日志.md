intelligent-analysis-backend-v3.ts:520 ✅ V3系统可用 - 设备 intelligent-analysis 智能策略分析正常运行
feature-flags.ts:184 ✅ V3健康检查完成: 健康
usePageFinderModal.ts:381 🔄 从缓存加载页面: {filePath: 'debug_xml/ui_dump_e0d909c3_20251030_122312.xml', absoluteFilePath: '\\\\?\\D:\\rust\\active-projects\\小红书\\employeeGUI\\debug_xml\\ui_dump_e0d909c3_20251030_122312.xml', fileName: 'ui_dump_e0d909c3_20251030_122312.xml', deviceId: 'e0d909c3', timestamp: '20251030_122312', …}
xml-page-cache-service.ts:479 🔄 加载缓存页面: 小红书首页 - 10-30 12:23
xml-page-cache-service.ts:480 📁 文件名: ui_dump_e0d909c3_20251030_122312.xml
xml-page-cache-service.ts:481 📅 时间戳: 20251030_122312
xml-page-cache-service.ts:488 📄 读取到XML内容: 长度=38755, 前200字符=<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><hierarchy rotation="0"><node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.xingin.xhs" content-desc="" check
xml-page-cache-service.ts:526 🔍 [parseXmlToElements] 后端返回元素数量: 63
xml-page-cache-service.ts:528 🔍 [parseXmlToElements] 有 indexPath 的元素数量: 63
xml-page-cache-service.ts:530 🔍 [parseXmlToElements] 示例元素 indexPath: {id: 'element_1', indexPath: Array(1), text: ''}
usePageFinderModal.ts:387 📄 加载的 XML 内容长度: 38755
usePageFinderModal.ts:388 🎯 提取的 UI 元素数量: 63
xml-cache-manager.ts:264 📦 XML快照已缓存: ui_dump_e0d909c3_20251030_122312.xml {xmlHash: 'sha256:PD94bWwgd...', contentLength: 38755}
usePageFinderModal.ts:399 ✅ [usePageFinderModal] 从缓存加载并保存到XmlCacheManager: {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlContentLength: 38755, xmlHash: 'PD94bWwgdmVyc2lv...'}
usePageFinderModal.ts:408 🔄 [usePageFinderModal] 从缓存加载页面，版本号递增
usePageFinderModal.ts:424 🔍 [handleLoadFromCache] 加载元素数量: 63
usePageFinderModal.ts:425 🔍 [handleLoadFromCache] 前3个元素: (3) [{…}, {…}, {…}]
usePageFinderModal.ts:430 🔍 [handleLoadFromCache] 转换后可视化元素数量: 63
usePageFinderModal.ts:431 🔍 [handleLoadFromCache] 前3个可视化元素: (3) [{…}, {…}, {…}]
useParsedVisualElementsCanonical.tsx:134 🔍 [useParsedVisualElements] XML 标识符检查:
useParsedVisualElementsCanonical.tsx:135   - 当前长度: 38755
useParsedVisualElementsCanonical.tsx:136   - 当前 ID: 38755-<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><hierarchy rotatio
useParsedVisualElementsCanonical.tsx:137   - 上次 ID: 
useParsedVisualElementsCanonical.tsx:138   - forceRefreshKey: 2
useParsedVisualElementsCanonical.tsx:146 🔄 [useParsedVisualElements] 检测到新的 XML 数据或强制刷新，开始解析
useParsedVisualElementsCanonical.tsx:147   - 原因: XML内容变化
useParsedVisualElementsCanonical.tsx:50 🔄 [useParsedVisualElements #1] 开始解析 XML，长度: 38755
useParsedVisualElementsCanonical.tsx:51 🔧 [useParsedVisualElements] 使用修复后的 XmlParser.parseXML (包含策略2)
XmlParser.ts:176 🎯 [XmlParser] 菜单元素解析过程: {原始XML属性: {…}, 解析后position: {…}, elementId: 'element-79'}
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2400]: 从2个元素中保留了1个有价值元素 ['element-1(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2358]: 从8个元素中保留了1个有价值元素 ['element-92(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2240]: 从5个元素中保留了1个有价值元素 ['element-13(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,225][1080,2240]: 从6个元素中保留了1个有价值元素 ['element-19(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,225][534,1145]: 从3个元素中保留了2个有价值元素 (2) ['element-20(clickable:false, hasContent:true)', 'element-21(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,225][534,919]: 从2个元素中保留了1个有价值元素 ['element-24(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,225][1067,1083]: 从3个元素中保留了2个有价值元素 (2) ['element-31(clickable:false, hasContent:true)', 'element-32(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,225][1067,912]: 从2个元素中保留了1个有价值元素 ['element-35(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,1158][534,2023]: 从3个元素中保留了2个有价值元素 (2) ['element-42(clickable:false, hasContent:true)', 'element-43(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,1158][534,1852]: 从2个元素中保留了1个有价值元素 ['element-46(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,1096][1067,2016]: 从3个元素中保留了2个有价值元素 (2) ['element-53(clickable:false, hasContent:true)', 'element-54(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,1096][1067,1790]: 从2个元素中保留了1个有价值元素 ['element-57(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,2036][534,2240]: 从5个元素中保留了2个有价值元素 (2) ['element-65(clickable:false, hasContent:true)', 'element-66(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,2022][1067,2240]: 从4个元素中保留了2个有价值元素 (2) ['element-71(clickable:false, hasContent:true)', 'element-72(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [916,2058][948,2090]: 从2个元素中保留了1个有价值元素 ['element-77(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [321,126][759,210]: 从2个元素中保留了1个有价值元素 ['element-81(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [777,2254][819,2296]: 从2个元素中保留了1个有价值元素 ['element-103(clickable:false, hasContent:true)']
XmlParser.ts:298 ✅ [XmlParser] 重叠过滤完成: 107 -> 74 元素
XmlParser.ts:92  ⚠️ [XmlParser] 未找到"通讯录"元素，总共解析了 107 个元素
parseXML @ XmlParser.ts:92
(匿名) @ useParsedVisualElementsCanonical.tsx:55
(匿名) @ useParsedVisualElementsCanonical.tsx:149
react_stack_bottom_frame @ react-dom-client.development.js:23953
runWithFiberInDEV @ react-dom-client.development.js:1519
commitHookEffectListMount @ react-dom-client.development.js:11905
commitHookPassiveMountEffects @ react-dom-client.development.js:12026
commitPassiveMountOnFiber @ react-dom-client.development.js:13841
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13844
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13844
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13853
flushPassiveEffects @ react-dom-client.development.js:15737
flushPendingEffects @ react-dom-client.development.js:15702
performSyncWorkOnRoot @ react-dom-client.development.js:16228
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
flushSpawnedWork @ react-dom-client.development.js:15677
commitRoot @ react-dom-client.development.js:15403
<VisualElementView>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
renderViewContent @ UniversalPageFinderModal.tsx:333
UniversalPageFinderModal @ UniversalPageFinderModal.tsx:466
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
XmlParser.ts:101 📋 [XmlParser] 所有可点击元素（前20个）:
XmlParser.ts:102 (索引)idtextcontentDescboundsclickable(索引)idtextcontentDescboundsclickable0'element-21''(无)''(无)''[13,225][534,1145]''✓'1'element-26''(无)''(无)''[13,1043][523,1145]''✓'2'element-29''(无)''(无)''[379,1055][458,1134]''✓'3'element-30''101''(无)''[458,1076][507,1113]''✓'4'element-32''(无)''(无)''[546,225][1067,1083]''✓'5'element-37''(无)''(无)''[546,981][1056,1083]''✓'6'element-40''(无)''(无)''[911,993][990,1072]''✓'7'element-41''147''(无)''[990,1014][1040,1051]''✓'8'element-43''(无)''(无)''[13,1158][534,2023]''✓'9'element-48''(无)''(无)''[13,1921][523,2023]''✓'10'element-51''(无)''(无)''[394,1933][473,2012]''✓'11'element-52''55''(无)''[473,1954][507,1991]''✓'12'element-54''(无)''(无)''[546,1096][1067,2016]''✓'13'element-60''(无)''(无)''[546,1914][1056,2016]''✓'14'element-63''(无)''(无)''[912,1926][991,2005]''✓'15'element-64''141''(无)''[991,1947][1040,1984]''✓'16'element-66''(无)''(无)''[13,2036][534,2240]''✓'17'element-72''(无)''(无)''[546,2022][1067,2240]''✓'18'element-79''(无)''菜单''[24,120][119,215]''✓'19'element-82''(无)''关注''[321,126][467,210]''✓'Array(20)
XmlParser.ts:132 🎯 [XmlParser] Element_43修复完成: 107 -> 74 元素
useParsedVisualElementsCanonical.tsx:107 ✅ [useParsedVisualElements #1] 解析完成，提取元素: 74
useParsedVisualElementsCanonical.tsx:108 ✅ [已禁用所有过滤] 保留所有有效bounds的元素，包括父容器、子元素、不可点击元素
useParsedVisualElementsCanonical.tsx:134 🔍 [useParsedVisualElements] XML 标识符检查:
useParsedVisualElementsCanonical.tsx:135   - 当前长度: 38755
useParsedVisualElementsCanonical.tsx:136   - 当前 ID: 38755-<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><hierarchy rotatio
useParsedVisualElementsCanonical.tsx:137   - 上次 ID: 2
useParsedVisualElementsCanonical.tsx:138   - forceRefreshKey: 2
useParsedVisualElementsCanonical.tsx:146 🔄 [useParsedVisualElements] 检测到新的 XML 数据或强制刷新，开始解析
useParsedVisualElementsCanonical.tsx:147   - 原因: XML内容变化
useParsedVisualElementsCanonical.tsx:50 🔄 [useParsedVisualElements #2] 开始解析 XML，长度: 38755
useParsedVisualElementsCanonical.tsx:51 🔧 [useParsedVisualElements] 使用修复后的 XmlParser.parseXML (包含策略2)
XmlParser.ts:176 🎯 [XmlParser] 菜单元素解析过程: {原始XML属性: {…}, 解析后position: {…}, elementId: 'element-79'}
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2400]: 从2个元素中保留了1个有价值元素 ['element-1(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2358]: 从8个元素中保留了1个有价值元素 ['element-92(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2240]: 从5个元素中保留了1个有价值元素 ['element-13(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,225][1080,2240]: 从6个元素中保留了1个有价值元素 ['element-19(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,225][534,1145]: 从3个元素中保留了2个有价值元素 (2) ['element-20(clickable:false, hasContent:true)', 'element-21(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,225][534,919]: 从2个元素中保留了1个有价值元素 ['element-24(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,225][1067,1083]: 从3个元素中保留了2个有价值元素 (2) ['element-31(clickable:false, hasContent:true)', 'element-32(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,225][1067,912]: 从2个元素中保留了1个有价值元素 ['element-35(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,1158][534,2023]: 从3个元素中保留了2个有价值元素 (2) ['element-42(clickable:false, hasContent:true)', 'element-43(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,1158][534,1852]: 从2个元素中保留了1个有价值元素 ['element-46(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,1096][1067,2016]: 从3个元素中保留了2个有价值元素 (2) ['element-53(clickable:false, hasContent:true)', 'element-54(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,1096][1067,1790]: 从2个元素中保留了1个有价值元素 ['element-57(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,2036][534,2240]: 从5个元素中保留了2个有价值元素 (2) ['element-65(clickable:false, hasContent:true)', 'element-66(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,2022][1067,2240]: 从4个元素中保留了2个有价值元素 (2) ['element-71(clickable:false, hasContent:true)', 'element-72(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [916,2058][948,2090]: 从2个元素中保留了1个有价值元素 ['element-77(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [321,126][759,210]: 从2个元素中保留了1个有价值元素 ['element-81(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [777,2254][819,2296]: 从2个元素中保留了1个有价值元素 ['element-103(clickable:false, hasContent:true)']
XmlParser.ts:298 ✅ [XmlParser] 重叠过滤完成: 107 -> 74 元素
XmlParser.ts:92  ⚠️ [XmlParser] 未找到"通讯录"元素，总共解析了 107 个元素
parseXML @ XmlParser.ts:92
(匿名) @ useParsedVisualElementsCanonical.tsx:55
(匿名) @ useParsedVisualElementsCanonical.tsx:149
react_stack_bottom_frame @ react-dom-client.development.js:23953
runWithFiberInDEV @ react-dom-client.development.js:1519
commitHookEffectListMount @ react-dom-client.development.js:11905
commitHookPassiveMountEffects @ react-dom-client.development.js:12026
reconnectPassiveEffects @ react-dom-client.development.js:14004
recursivelyTraverseReconnectPassiveEffects @ react-dom-client.development.js:13976
reconnectPassiveEffects @ react-dom-client.development.js:14051
doubleInvokeEffectsOnFiber @ react-dom-client.development.js:15968
runWithFiberInDEV @ react-dom-client.development.js:1519
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15928
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15935
commitDoubleInvokeEffectsInDEV @ react-dom-client.development.js:15977
flushPassiveEffects @ react-dom-client.development.js:15747
flushPendingEffects @ react-dom-client.development.js:15702
performSyncWorkOnRoot @ react-dom-client.development.js:16228
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
flushSpawnedWork @ react-dom-client.development.js:15677
commitRoot @ react-dom-client.development.js:15403
commitRootWhenReady @ react-dom-client.development.js:14652
performWorkOnRoot @ react-dom-client.development.js:14575
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<VisualElementView>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
renderViewContent @ UniversalPageFinderModal.tsx:333
UniversalPageFinderModal @ UniversalPageFinderModal.tsx:466
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
XmlParser.ts:101 📋 [XmlParser] 所有可点击元素（前20个）:
XmlParser.ts:102 (索引)idtextcontentDescboundsclickable(索引)idtextcontentDescboundsclickable0'element-21''(无)''(无)''[13,225][534,1145]''✓'1'element-26''(无)''(无)''[13,1043][523,1145]''✓'2'element-29''(无)''(无)''[379,1055][458,1134]''✓'3'element-30''101''(无)''[458,1076][507,1113]''✓'4'element-32''(无)''(无)''[546,225][1067,1083]''✓'5'element-37''(无)''(无)''[546,981][1056,1083]''✓'6'element-40''(无)''(无)''[911,993][990,1072]''✓'7'element-41''147''(无)''[990,1014][1040,1051]''✓'8'element-43''(无)''(无)''[13,1158][534,2023]''✓'9'element-48''(无)''(无)''[13,1921][523,2023]''✓'10'element-51''(无)''(无)''[394,1933][473,2012]''✓'11'element-52''55''(无)''[473,1954][507,1991]''✓'12'element-54''(无)''(无)''[546,1096][1067,2016]''✓'13'element-60''(无)''(无)''[546,1914][1056,2016]''✓'14'element-63''(无)''(无)''[912,1926][991,2005]''✓'15'element-64''141''(无)''[991,1947][1040,1984]''✓'16'element-66''(无)''(无)''[13,2036][534,2240]''✓'17'element-72''(无)''(无)''[546,2022][1067,2240]''✓'18'element-79''(无)''菜单''[24,120][119,215]''✓'19'element-82''(无)''关注''[321,126][467,210]''✓'Array(20)
XmlParser.ts:132 🎯 [XmlParser] Element_43修复完成: 107 -> 74 元素
useParsedVisualElementsCanonical.tsx:107 ✅ [useParsedVisualElements #2] 解析完成，提取元素: 74
useParsedVisualElementsCanonical.tsx:108 ✅ [已禁用所有过滤] 保留所有有效bounds的元素，包括父容器、子元素、不可点击元素
useParsedVisualElementsCanonical.tsx:134 🔍 [useParsedVisualElements] XML 标识符检查:
useParsedVisualElementsCanonical.tsx:135   - 当前长度: 38755
useParsedVisualElementsCanonical.tsx:136   - 当前 ID: 38755-<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><hierarchy rotatio
useParsedVisualElementsCanonical.tsx:137   - 上次 ID: 2
useParsedVisualElementsCanonical.tsx:138   - forceRefreshKey: 2
useParsedVisualElementsCanonical.tsx:146 🔄 [useParsedVisualElements] 检测到新的 XML 数据或强制刷新，开始解析
useParsedVisualElementsCanonical.tsx:147   - 原因: XML内容变化
useParsedVisualElementsCanonical.tsx:50 🔄 [useParsedVisualElements #3] 开始解析 XML，长度: 38755
useParsedVisualElementsCanonical.tsx:51 🔧 [useParsedVisualElements] 使用修复后的 XmlParser.parseXML (包含策略2)
XmlParser.ts:176 🎯 [XmlParser] 菜单元素解析过程: {原始XML属性: {…}, 解析后position: {…}, elementId: 'element-79'}
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2400]: 从2个元素中保留了1个有价值元素 ['element-1(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2358]: 从8个元素中保留了1个有价值元素 ['element-92(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,0][1080,2240]: 从5个元素中保留了1个有价值元素 ['element-13(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [0,225][1080,2240]: 从6个元素中保留了1个有价值元素 ['element-19(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,225][534,1145]: 从3个元素中保留了2个有价值元素 (2) ['element-20(clickable:false, hasContent:true)', 'element-21(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,225][534,919]: 从2个元素中保留了1个有价值元素 ['element-24(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,225][1067,1083]: 从3个元素中保留了2个有价值元素 (2) ['element-31(clickable:false, hasContent:true)', 'element-32(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,225][1067,912]: 从2个元素中保留了1个有价值元素 ['element-35(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,1158][534,2023]: 从3个元素中保留了2个有价值元素 (2) ['element-42(clickable:false, hasContent:true)', 'element-43(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,1158][534,1852]: 从2个元素中保留了1个有价值元素 ['element-46(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,1096][1067,2016]: 从3个元素中保留了2个有价值元素 (2) ['element-53(clickable:false, hasContent:true)', 'element-54(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,1096][1067,1790]: 从2个元素中保留了1个有价值元素 ['element-57(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [13,2036][534,2240]: 从5个元素中保留了2个有价值元素 (2) ['element-65(clickable:false, hasContent:true)', 'element-66(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [546,2022][1067,2240]: 从4个元素中保留了2个有价值元素 (2) ['element-71(clickable:false, hasContent:true)', 'element-72(clickable:true, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [916,2058][948,2090]: 从2个元素中保留了1个有价值元素 ['element-77(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [321,126][759,210]: 从2个元素中保留了1个有价值元素 ['element-81(clickable:false, hasContent:false)']
XmlParser.ts:291 🔧 [XmlParser] 处理重叠bounds [777,2254][819,2296]: 从2个元素中保留了1个有价值元素 ['element-103(clickable:false, hasContent:true)']
XmlParser.ts:298 ✅ [XmlParser] 重叠过滤完成: 107 -> 74 元素
XmlParser.ts:92  ⚠️ [XmlParser] 未找到"通讯录"元素，总共解析了 107 个元素
parseXML @ XmlParser.ts:92
(匿名) @ useParsedVisualElementsCanonical.tsx:55
(匿名) @ useParsedVisualElementsCanonical.tsx:149
react_stack_bottom_frame @ react-dom-client.development.js:23953
runWithFiberInDEV @ react-dom-client.development.js:1519
commitHookEffectListMount @ react-dom-client.development.js:11905
commitHookPassiveMountEffects @ react-dom-client.development.js:12026
commitPassiveMountOnFiber @ react-dom-client.development.js:13841
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13844
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13844
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13834
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13957
recursivelyTraversePassiveMountEffects @ react-dom-client.development.js:13815
commitPassiveMountOnFiber @ react-dom-client.development.js:13853
flushPassiveEffects @ react-dom-client.development.js:15737
flushPendingEffects @ react-dom-client.development.js:15702
flushSpawnedWork @ react-dom-client.development.js:15668
commitRoot @ react-dom-client.development.js:15403
commitRootWhenReady @ react-dom-client.development.js:14652
performWorkOnRoot @ react-dom-client.development.js:14575
<VisualElementView>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
renderViewContent @ UniversalPageFinderModal.tsx:333
UniversalPageFinderModal @ UniversalPageFinderModal.tsx:466
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
XmlParser.ts:101 📋 [XmlParser] 所有可点击元素（前20个）:
XmlParser.ts:102 (索引)idtextcontentDescboundsclickable(索引)idtextcontentDescboundsclickable0'element-21''(无)''(无)''[13,225][534,1145]''✓'1'element-26''(无)''(无)''[13,1043][523,1145]''✓'2'element-29''(无)''(无)''[379,1055][458,1134]''✓'3'element-30''101''(无)''[458,1076][507,1113]''✓'4'element-32''(无)''(无)''[546,225][1067,1083]''✓'5'element-37''(无)''(无)''[546,981][1056,1083]''✓'6'element-40''(无)''(无)''[911,993][990,1072]''✓'7'element-41''147''(无)''[990,1014][1040,1051]''✓'8'element-43''(无)''(无)''[13,1158][534,2023]''✓'9'element-48''(无)''(无)''[13,1921][523,2023]''✓'10'element-51''(无)''(无)''[394,1933][473,2012]''✓'11'element-52''55''(无)''[473,1954][507,1991]''✓'12'element-54''(无)''(无)''[546,1096][1067,2016]''✓'13'element-60''(无)''(无)''[546,1914][1056,2016]''✓'14'element-63''(无)''(无)''[912,1926][991,2005]''✓'15'element-64''141''(无)''[991,1947][1040,1984]''✓'16'element-66''(无)''(无)''[13,2036][534,2240]''✓'17'element-72''(无)''(无)''[546,2022][1067,2240]''✓'18'element-79''(无)''菜单''[24,120][119,215]''✓'19'element-82''(无)''关注''[321,126][467,210]''✓'Array(20)
XmlParser.ts:132 🎯 [XmlParser] Element_43修复完成: 107 -> 74 元素
useParsedVisualElementsCanonical.tsx:107 ✅ [useParsedVisualElements #3] 解析完成，提取元素: 74
useParsedVisualElementsCanonical.tsx:108 ✅ [已禁用所有过滤] 保留所有有效bounds的元素，包括父容器、子元素、不可点击元素
xml-persistent-storage.ts:133 💾 XML缓存已持久化: ui_dump_e0d909c3_20251030_122312.xml {xmlHash: 'sha256:PD94bWwgd...', contentLength: 38755}
PagePreview.tsx:353 🎯 [PagePreview] 元素点击详情
PagePreview.tsx:354 📍 元素ID: element-32
PagePreview.tsx:355 📝 文本: (无)
PagePreview.tsx:356 📝 描述: android.widget.FrameLayout（可点击）
PagePreview.tsx:357 🎨 类别: buttons
PagePreview.tsx:358 📐 显示Bounds: [546,225][1067,1083]
PagePreview.tsx:359 👆 可点击: ✓
PagePreview.tsx:360 📏 面积: 88299.85185185182 px²
PagePreview.tsx:361 🎚️ Z-Index: 37
PagePreview.tsx:362 ⚠️ 是否为"通讯录": 否
PagePreview.tsx:375  ⚠️ 未找到对应的原始UIElement
onClick @ PagePreview.tsx:375
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(匿名) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
useElementSelectionManager.ts:77 🚀 [useElementSelectionManager] handleElementClick 被调用: {elementId: 'element_32', elementText: '', clickPosition: {…}, isHidden: false, currentPendingSelection: null}
useElementSelectionManager.ts:91 ✅ [useElementSelectionManager] 设置 pendingSelection
useElementSelectionManager.ts:100 📝 [useElementSelectionManager] 新的 selection 状态: {element: {…}, position: {…}, confirmed: false}
ElementSelectionPopover.tsx:184 ⚡ [用户操作] 快速创建步骤卡片
UniversalPageFinderModal.tsx:487 ✅ [UniversalPageFinderModal] 附加xmlCacheId到元素: {elementId: 'element_32', xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml'}
useIntelligentStepCardIntegration.ts:828 ⚡ [智能集成] 快速创建步骤: element_32
useIntelligentStepCardIntegration.ts:184 🔄 [convertElementToContext] 接收到的真实UIElement: {id: 'element_32', text: '', content_desc: '', resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', class_name: 'android.widget.FrameLayout', …}
useElementSelectionManager.ts:126 🔍 confirmSelection called, pendingSelection: {element: {…}, position: {…}, confirmed: false}
useElementSelectionManager.ts:128 ✅ 确认选择元素:  ID: element_32
useElementSelectionManager.ts:131 🧹 正在清除pendingSelection...
useElementSelectionManager.ts:133 🧹 setPendingSelection(null) 已调用
ElementSelectionPopover.tsx:200 ✅ [Popover关闭] 快速创建成功，已关闭气泡
useIntelligentStepCardIntegration.ts:227 ✅ [convertElementToContext] 从缓存获取XML成功: {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlContentLength: 38755, xmlHash: 'sha256:PD94bWwgd...'}
useIntelligentStepCardIntegration.ts:343  ⚠️ [XPath] 元素XPath是相对路径，转换为绝对路径: //element_32
(匿名) @ useIntelligentStepCardIntegration.ts:343
await in (匿名)
(匿名) @ useIntelligentStepCardIntegration.ts:831
onQuickCreate @ UniversalPageFinderModal.tsx:494
(匿名) @ ElementSelectionPopover.tsx:192
(匿名) @ PopoverActionButtons.tsx:133
(匿名) @ button.js:188
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(匿名) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
useIntelligentStepCardIntegration.ts:444 🔄 [子元素提取-方案2] child_elements 不可用，尝试从 XML 正则提取
useIntelligentStepCardIntegration.ts:529  ⚠️ [子元素提取] 两种方案都未提取到子元素文本/描述 {hasChildElements: false, hasXmlContent: true, hasBoundsString: true, elementId: 'element_32'}
(匿名) @ useIntelligentStepCardIntegration.ts:529
await in (匿名)
(匿名) @ useIntelligentStepCardIntegration.ts:831
onQuickCreate @ UniversalPageFinderModal.tsx:494
(匿名) @ ElementSelectionPopover.tsx:192
(匿名) @ PopoverActionButtons.tsx:133
(匿名) @ button.js:188
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(匿名) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
useIntelligentStepCardIntegration.ts:568 🔍 [父元素查找] 目标元素深度: 27
useIntelligentStepCardIntegration.ts:589 ✅ [父元素查找] 父元素起始位置: 11058
useIntelligentStepCardIntegration.ts:610  ⚠️ [父元素查找] 未找到父元素结束标签
(匿名) @ useIntelligentStepCardIntegration.ts:610
await in (匿名)
(匿名) @ useIntelligentStepCardIntegration.ts:831
onQuickCreate @ UniversalPageFinderModal.tsx:494
(匿名) @ ElementSelectionPopover.tsx:192
(匿名) @ PopoverActionButtons.tsx:133
(匿名) @ button.js:188
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(匿名) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
useIntelligentStepCardIntegration.ts:722 🔍 [数据增强] 最终使用的属性（三层合并）: {层级说明: '外层父元素(content-desc) + 中层可点击(bounds/id) + 同层兄弟(text) + 内层子元素(text+content-desc)', 中层_原始text: '', 同层_兄弟元素text: Array(0), 内层_子元素text: Array(0), 内层_子元素contentDesc: Array(0), …}
useIntelligentStepCardIntegration.ts:75 🔍 [buildSimpleChildren] 接收到的 element: {id: 'element_32', hasIndexPath: false, indexPath: undefined, indexPathLength: undefined}
useIntelligentStepCardIntegration.ts:118 🌳 [buildSimpleChildren] 无child_elements，设置空children: element_32
useIntelligentStepCardIntegration.ts:795 🔄 [convertElementToContext] 转换后的ElementSelectionContext: {elementText: '', contentDesc: '', textAttr: '', resourceId: 'com.xingin.xhs:id/0_resource_name_obfuscated', smartMatching: {…}}
use-intelligent-analysis-workflow.ts:855 🎯 [Workflow] 创建快速步骤卡片 {stepId: '1763308718309_ovre7vjjs', context: {…}, lockContainer: false}
use-intelligent-analysis-workflow.ts:550 🔍 [临时] 从localStorage获取选择模式: first
use-intelligent-analysis-workflow.ts:558 🎯 [Selection Mode] 当前用户选择模式: first
analysis-health-service.ts:43 🔍 [HealthService] 开始系统健康检查...
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 3
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
useElementSelectionManager.ts:137 📞 延迟调用 onElementSelected 回调
useIntelligentStepCardIntegration.ts:1214 🎯 [智能集成] 元素选择确认 (传统模式): element_32
stepcards.ts:296 📝 [StepCardStore] 创建步骤卡片（新方式） {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', data: {…}}
use-intelligent-analysis-workflow.ts:935 🔗 [Bridge] 在统一store中创建对应卡片 {stepId: '1763308718309_ovre7vjjs', unifiedCardId: 'card_1763308719026_la60imwaq', elementUid: '1763308718309_ovre7vjjs', hasOriginalElement: true}
analysis-health-service.ts:79 ✅ [HealthService] 健康检查完成 {healthy: true, checks: {…}, errors: Array(0), warnings: Array(0)}
use-intelligent-analysis-workflow.ts:726  ⚠️ [V3→V2 回退] V3执行失败，自动回退到V2系统 Error: 没有选中的设备，请先连接设备
    at use-intelligent-analysis-workflow.ts:655:21
    at async use-intelligent-analysis-workflow.ts:980:25
    at async useIntelligentStepCardIntegration.ts:834:24
(匿名) @ use-intelligent-analysis-workflow.ts:726
intelligent-analysis-backend.ts:211 🚀 [BackendService] 启动智能分析（缓存未命中/降级） {element_context: {…}, step_id: '1763308718309_ovre7vjjs', lock_container: false, enable_smart_candidates: true, enable_static_candidates: true}
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
logger-config.ts:50 ⚠️ [Workflow] 收到未知任务的进度更新: 76454cbe-5a08-4324-93ff-60e80ecf50d3 {jobId: '76454cbe-5a08-4324-93ff-60e80ecf50d3', currentJobs: Array(1)}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 5, current_step: '初始化分析环境', estimated_time_left: 4750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 5, current_step: '初始化分析环境', estimated_time_left: 4750}
logger-config.ts:50 ⚠️ [Workflow] 收到未知任务的进度更新: v3-unknown {jobId: 'v3-unknown', currentJobs: Array(1)}
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 1
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
intelligent-analysis-backend.ts:219 ✅ [BackendService] 分析任务已启动 {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', selection_hash: '680e93470a28', state: 'running'}
use-intelligent-analysis-workflow.ts:747 ✅ [V2 回退] 成功回退到V2系统执行 {jobId: '76454cbe-5a08-4324-93ff-60e80ecf50d3'}
useIntelligentStepCardIntegration.ts:948 ✅ [步骤创建] 验证增强后的数据传递: {原始_element_text: '', 增强_context_elementText: '', 原始_element_content_desc: '', 增强_context_content_desc: '', 最终使用_text: '', …}
useIntelligentStepCardIntegration.ts:873 🏷️ [智能命名] 生成步骤名称: {原始element_text: '', 增强enrichedText: '', 原始element_content_desc: '', 增强enrichedContentDesc: '', 是否中层容器: '', …}
useIntelligentStepCardIntegration.ts:934  ⚠️ [智能命名] 无法找到元素文本，使用通用名称，应触发后端智能分析: element_32
generateSmartName @ useIntelligentStepCardIntegration.ts:934
(匿名) @ useIntelligentStepCardIntegration.ts:964
useIntelligentStepCardIntegration.ts:1169 🔄 [智能集成] 添加步骤前，当前步骤数量: 0
useIntelligentStepCardIntegration.ts:1179 ✅ [智能集成] 步骤卡创建成功: {stepId: '1763308718309_ovre7vjjs', elementId: 'element_32', analysisStarted: true, addedToMainList: true, currentStepsCount: 0, …}
useIntelligentStepCardIntegration.ts:1191 🚪 [智能集成] 已关闭页面查找器
useIntelligentStepCardIntegration.ts:1172 🔄 [智能集成] 添加步骤后，新步骤数量: 1
useIntelligentStepCardIntegration.ts:1173 🔄 [智能集成] 新步骤详情: {id: '1763308718309_ovre7vjjs', name: '智能操作 1', step_type: 'smart_find_element', description: '智能分析 - com.xingin.xhs:id/0_resource_name_obfuscated', enableStrategySelector: true, …}
useIntelligentStepCardIntegration.ts:1172 🔄 [智能集成] 添加步骤后，新步骤数量: 1
useIntelligentStepCardIntegration.ts:1173 🔄 [智能集成] 新步骤详情: {id: '1763308718309_ovre7vjjs', name: '智能操作 1', step_type: 'smart_find_element', description: '智能分析 - com.xingin.xhs:id/0_resource_name_obfuscated', enableStrategySelector: true, …}
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 0
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763308718309_ovre7vjjs', totalScores: 4, scores: Array(4)}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763308718309_ovre7vjjs', totalScores: 4, scores: Array(4)}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 25, current_step: '解析页面结构', estimated_time_left: 3750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 25, current_step: '解析页面结构', estimated_time_left: 3750}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
useSmartStrategyAnalysis.ts:74 ⏱️ [StrategyAnalysis] 开始15秒超时监控 {stepId: '1763308718309_ovre7vjjs', currentTime: '2025-11-16T15:58:39.728Z', analysisState: {…}}
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
useElementSelectionManager.ts:219 🧹 [ElementSelectionManager] 执行全局清理
useElementSelectionManager.ts:235 ✅ [ElementSelectionManager] 全局清理完成
zIndexManager.ts:89 📐 [ZIndexManager] 注销模态框: universal-page-finder-modal {activeModals: Array(0), totalActive: 0}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 65, current_step: '生成智能策略', estimated_time_left: 1750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 65, current_step: '生成智能策略', estimated_time_left: 1750}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
useIntelligentAnalysisAdapter.ts:144 🔗 [Adapter] 组件卸载，清理资源
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 2
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 85, current_step: '评估策略质量', estimated_time_left: 750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 85, current_step: '评估策略质量', estimated_time_left: 750}
analysis-state-store.ts:266 🚀 [AnalysisState] 开始新的分析任务 {jobId: '0ecf50d3'}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763308718309_ovre7vjjs', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 95, current_step: '生成分析报告', estimated_time_left: 250}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 95, current_step: '生成分析报告', estimated_time_left: 250}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763308718309_ovre7vjjs', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 100, current_step: '分析完成', estimated_time_left: 0}
devTracer.ts:42 [EVT] analysis:progress {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', progress: 100, current_step: '分析完成', estimated_time_left: 0}
stepcards.ts:394 ✅ [StepCardStore] 分析完成，状态自动切换为ready {cardId: 'a60imwaq', progress: 100}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
devTracer.ts:42 [EVT] analysis:done {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', selection_hash: '680e93470a28', result: {…}, confidence: 0.8811, evidence: {…}, …}
wire-global-events.ts:193 🎯 [ROUTE] 从smart_candidates提取最终分数 {jobId: '0ecf50d3', cardId: 'a60imwaq', candidatesCount: 2}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763308718309_ovre7vjjs', candidateKey: 'self_anchor', confidence: '88%', rawInput: 0.8811}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763308718309_ovre7vjjs', candidateKey: 'xpath_fallback', confidence: '55%', rawInput: 0.5455000299999999}
wire-global-events.ts:243 🔗 [ROUTE] 生成基于候选项的智能自动链 {jobId: '0ecf50d3', recommended: 'self_anchor', stepsCount: 2}
analysis-state-store.ts:276 🏆 [AnalysisState] 分析任务完成 {jobId: '0ecf50d3', totalSteps: 4}
stepcards.ts:431 ✅ [StepCardStore] 填充策略并就绪 {cardId: 'card_1763308719026_la60imwaq', strategy: {…}}
wire-global-events.ts:308 🔧 [Wire Events] 调用 setSingleStepConfidence {targetCardId: 'a60imwaq', rawConfidence: 0.8811, normalizedConfidence: 0.8811, confidence: 0.8811, source: 'auto_chain', …}
stepcards.ts:514 🎯 [StepCardStore] 设置单步置信度 {cardId: 'a60imwaq', confidence: 0.8811, confidencePercent: '88%', source: 'auto_chain', finalStatus: 'ready', …}
stepcards.ts:488 📊 [StepCardStore] 设置置信度 {cardId: 'card_1763308719026_la60imwaq', confidence: 0.8811, evidence: {…}}
wire-global-events.ts:339 📊 [Wire Events] 写入候选项评分 {stepId: 'vre7vjjs', smartCandidates: 2, candidateKeys: Array(2), recommendedKey: 'self_anchor', globalConfidence: 0.8811}
wire-global-events.ts:350 🔍 [Wire Events] 候选项原始数据 {candidateKey: 'self_anchor', rawConfidence: 88.11, confidenceType: 'number', isNormalRange: false, isPercentRange: true}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763308718309_ovre7vjjs', candidateKey: 'self_anchor', confidence: '88%', rawInput: 88.11}
wire-global-events.ts:361 ✅ [Wire Events] 候选分写入验证 {stepId: 'vre7vjjs', candidateKey: 'self_anchor', written: 88.11, readBack: 0.8811, success: false}
wire-global-events.ts:350 🔍 [Wire Events] 候选项原始数据 {candidateKey: 'xpath_fallback', rawConfidence: 54.550003, confidenceType: 'number', isNormalRange: false, isPercentRange: true}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763308718309_ovre7vjjs', candidateKey: 'xpath_fallback', confidence: '55%', rawInput: 54.550003}
wire-global-events.ts:361 ✅ [Wire Events] 候选分写入验证 {stepId: 'vre7vjjs', candidateKey: 'xpath_fallback', written: 54.550003, readBack: 0.5455000299999999, success: false}
step-score-store.ts:161 🌐 [StepScoreStore] 设置全局评分 {stepId: '1763308718309_ovre7vjjs', confidence: '88%', rawInput: 0.8811}
step-score-store.ts:113 📊 [StepScoreStore] 更新评分缓存 {key: 'element:1763308718309_ovre7vjjs', confidence: '88%', origin: 'single', recommended: 'self_anchor'}
devTracer.ts:42 [EVT] analysis:done {job_id: '76454cbe-5a08-4324-93ff-60e80ecf50d3', selection_hash: '680e93470a28', result: {…}, confidence: 0.8811, evidence: {…}, …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
useSmartStrategyAnalysis.ts:100 🧹 [StrategyAnalysis] 清理超时监控 {stepId: '1763308718309_ovre7vjjs'}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763308718309_ovre7vjjs', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763308718309_ovre7vjjs
   unifiedElementData: null
   dataLoading: false
   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
xml-persistent-storage.ts:300 📦 获取最新11个缓存条目 (性能优化)
stepcards.ts:431 ✅ [StepCardStore] 填充策略并就绪 {cardId: 'card_1763308719026_la60imwaq', strategy: {…}}
use-intelligent-analysis-workflow.ts:437 🔗 [Bridge] 同步完成状态到统一store {cardId: 'card_1763308719026_la60imwaq', jobId: '76454cbe-5a08-4324-93ff-60e80ecf50d3', strategy: {…}}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763308718309_ovre7vjjs
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
use-intelligent-analysis-workflow.ts:963 🎯 [自动评分] 开始执行Step1-2评分 {stepId: '1763308718309_ovre7vjjs', cardId: 'card_1763308719026_la60imwaq'}
shared-scoring.ts:117 🎯 [智能·自动链] 触发结构匹配评分 {steps: Array(2), forceRefresh: false, source: 'smart_auto_chain'}
shared-scoring.ts:158 🔍 [智能·自动链] 卡片数据检查: {cardId: 'card_1763308719026_la60imwaq', hasElementContext: true, elementContextKeys: Array(5), xpath: '//element_32', hasXmlSnapshot: true, …}
xml-cache-loader.ts:37 📦 [智能·自动链] 开始加载XML缓存 {cardId: 'a60imwaq', hasXmlCacheId: true, hasEmbeddedXml: true}
event-acknowledgment-service.ts:69  ⚠️ [EventAck] 发送确认失败（非致命） {eventType: 'analysis:done', eventId: '76454cbe-5a08-4324-93ff-60e80ecf50d3', error: 'Command acknowledge_event not found'}
acknowledgeEvent @ event-acknowledgment-service.ts:69
use-intelligent-analysis-workflow.ts:458 ✅ [Workflow] 完成事件处理并已确认 {jobId: '76454cbe-5a08-4324-93ff-60e80ecf50d3'}
xml-cache-performance-monitor.ts:86 ⚡ XML缓存加载快速: 0ms (来源: memory)
xml-cache-loader.ts:51 ✅ [智能·自动链] 从xmlCacheId恢复XML成功 {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlLength: 38755}
shared-scoring.ts:187 🔄 [智能·自动链] 调用后端评分接口 {xpath: '//element_32', indexPath: undefined, requestedSteps: Array(2)}
xml-persistent-storage.ts:300 📦 获取最新11个缓存条目 (性能优化)
strategy-menu-builder.tsx:255 🎯 [菜单] 用户点击：刷新所有评分
