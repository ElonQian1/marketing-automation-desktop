ElementSelectionPopover.tsx:184 ⚡ [用户操作] 快速创建步骤卡片
UniversalPageFinderModal.tsx:487 ✅ [UniversalPageFinderModal] 附加xmlCacheId到元素: {elementId: 'element_32', xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml'}
useIntelligentStepCardIntegration.ts:816 ⚡ [智能集成] 快速创建步骤: element_32
useIntelligentStepCardIntegration.ts:176 🔄 [convertElementToContext] 接收到的真实UIElement: {id: 'element_32', text: '', content_desc: '', resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', class_name: 'android.widget.FrameLayout', …}
useElementSelectionManager.ts:126 🔍 confirmSelection called, pendingSelection: {element: {…}, position: {…}, confirmed: false}
useElementSelectionManager.ts:128 ✅ 确认选择元素:  ID: element_32
useElementSelectionManager.ts:131 🧹 正在清除pendingSelection...
useElementSelectionManager.ts:133 🧹 setPendingSelection(null) 已调用
ElementSelectionPopover.tsx:200 ✅ [Popover关闭] 快速创建成功，已关闭气泡
useIntelligentStepCardIntegration.ts:215 ✅ [convertElementToContext] 从缓存获取XML成功: {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlContentLength: 38755, xmlHash: 'sha256:PD94bWwgd...'}
useIntelligentStepCardIntegration.ts:331  ⚠️ [XPath] 元素XPath是相对路径，转换为绝对路径: //element_32
(匿名) @ useIntelligentStepCardIntegration.ts:331
useIntelligentStepCardIntegration.ts:432 🔄 [子元素提取-方案2] child_elements 不可用，尝试从 XML 正则提取
useIntelligentStepCardIntegration.ts:517  ⚠️ [子元素提取] 两种方案都未提取到子元素文本/描述 {hasChildElements: false, hasXmlContent: true, hasBoundsString: true, elementId: 'element_32'}
(匿名) @ useIntelligentStepCardIntegration.ts:517
useIntelligentStepCardIntegration.ts:556 🔍 [父元素查找] 目标元素深度: 27
useIntelligentStepCardIntegration.ts:577 ✅ [父元素查找] 父元素起始位置: 11058
useIntelligentStepCardIntegration.ts:598  ⚠️ [父元素查找] 未找到父元素结束标签
(匿名) @ useIntelligentStepCardIntegration.ts:598
useIntelligentStepCardIntegration.ts:710 🔍 [数据增强] 最终使用的属性（三层合并）: {层级说明: '外层父元素(content-desc) + 中层可点击(bounds/id) + 同层兄弟(text) + 内层子元素(text+content-desc)', 中层_原始text: '', 同层_兄弟元素text: Array(0), 内层_子元素text: Array(0), 内层_子元素contentDesc: Array(0), …}
useIntelligentStepCardIntegration.ts:110 🌳 [buildSimpleChildren] 无child_elements，设置空children: element_32
useIntelligentStepCardIntegration.ts:783 🔄 [convertElementToContext] 转换后的ElementSelectionContext: {elementText: '', contentDesc: '', textAttr: '', resourceId: 'com.xingin.xhs:id/0_resource_name_obfuscated', smartMatching: {…}}
use-intelligent-analysis-workflow.ts:855 🎯 [Workflow] 创建快速步骤卡片 {stepId: '1763295062404_m201jpn37', context: {…}, lockContainer: false}
use-intelligent-analysis-workflow.ts:550 🔍 [临时] 从localStorage获取选择模式: first
use-intelligent-analysis-workflow.ts:558 🎯 [Selection Mode] 当前用户选择模式: first
analysis-health-service.ts:43 🔍 [HealthService] 开始系统健康检查...
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 6
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
useElementSelectionManager.ts:137 📞 延迟调用 onElementSelected 回调
useIntelligentStepCardIntegration.ts:1202 🎯 [智能集成] 元素选择确认 (传统模式): element_32
stepcards.ts:313 📝 [StepCardStore] 创建步骤卡片（新方式） {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', data: {…}}
use-intelligent-analysis-workflow.ts:935 🔗 [Bridge] 在统一store中创建对应卡片 {stepId: '1763295062404_m201jpn37', unifiedCardId: 'card_1763295063376_mptc5upko', elementUid: '1763295062404_m201jpn37', hasOriginalElement: true}
analysis-health-service.ts:79 ✅ [HealthService] 健康检查完成 {healthy: true, checks: {…}, errors: Array(0), warnings: Array(0)}
use-intelligent-analysis-workflow.ts:726  ⚠️ [V3→V2 回退] V3执行失败，自动回退到V2系统 Error: 没有选中的设备，请先连接设备
    at use-intelligent-analysis-workflow.ts:655:21
    at async use-intelligent-analysis-workflow.ts:980:25
    at async useIntelligentStepCardIntegration.ts:822:24
(匿名) @ use-intelligent-analysis-workflow.ts:726
intelligent-analysis-backend.ts:211 🚀 [BackendService] 启动智能分析（缓存未命中/降级） {element_context: {…}, step_id: '1763295062404_m201jpn37', lock_container: false, enable_smart_candidates: true, enable_static_candidates: true}
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
xml-persistent-storage.ts:300 📦 获取最新11个缓存条目 (性能优化)
logger-config.ts:50 ⚠️ [Workflow] 收到未知任务的进度更新: 513c352a-52a0-40ff-9213-42f452c31aab {jobId: '513c352a-52a0-40ff-9213-42f452c31aab', currentJobs: Array(0)}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 5, current_step: '初始化分析环境', estimated_time_left: 4750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 5, current_step: '初始化分析环境', estimated_time_left: 4750}
logger-config.ts:50 ⚠️ [Workflow] 收到未知任务的进度更新: v3-unknown {jobId: 'v3-unknown', currentJobs: Array(0)}
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
intelligent-analysis-backend.ts:219 ✅ [BackendService] 分析任务已启动 {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', selection_hash: '680e93470a28', state: 'running'}
use-intelligent-analysis-workflow.ts:747 ✅ [V2 回退] 成功回退到V2系统执行 {jobId: '513c352a-52a0-40ff-9213-42f452c31aab'}
useIntelligentStepCardIntegration.ts:936 ✅ [步骤创建] 验证增强后的数据传递: {原始_element_text: '', 增强_context_elementText: '', 原始_element_content_desc: '', 增强_context_content_desc: '', 最终使用_text: '', …}
useIntelligentStepCardIntegration.ts:861 🏷️ [智能命名] 生成步骤名称: {原始element_text: '', 增强enrichedText: '', 原始element_content_desc: '', 增强enrichedContentDesc: '', 是否中层容器: '', …}
useIntelligentStepCardIntegration.ts:922  ⚠️ [智能命名] 无法找到元素文本，使用通用名称，应触发后端智能分析: element_32
generateSmartName @ useIntelligentStepCardIntegration.ts:922
(匿名) @ useIntelligentStepCardIntegration.ts:952
useIntelligentStepCardIntegration.ts:1157 🔄 [智能集成] 添加步骤前，当前步骤数量: 0
useIntelligentStepCardIntegration.ts:1167 ✅ [智能集成] 步骤卡创建成功: {stepId: '1763295062404_m201jpn37', elementId: 'element_32', analysisStarted: true, addedToMainList: true, currentStepsCount: 0, …}
useIntelligentStepCardIntegration.ts:1179 🚪 [智能集成] 已关闭页面查找器
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 25, current_step: '解析页面结构', estimated_time_left: 3750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 25, current_step: '解析页面结构', estimated_time_left: 3750}
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 2
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
useIntelligentStepCardIntegration.ts:1160 🔄 [智能集成] 添加步骤后，新步骤数量: 1
useIntelligentStepCardIntegration.ts:1161 🔄 [智能集成] 新步骤详情: {id: '1763295062404_m201jpn37', name: '智能操作 1', step_type: 'smart_find_element', description: '智能分析 - com.xingin.xhs:id/0_resource_name_obfuscated', enableStrategySelector: true, …}
useIntelligentStepCardIntegration.ts:1160 🔄 [智能集成] 添加步骤后，新步骤数量: 1
useIntelligentStepCardIntegration.ts:1161 🔄 [智能集成] 新步骤详情: {id: '1763295062404_m201jpn37', name: '智能操作 1', step_type: 'smart_find_element', description: '智能分析 - com.xingin.xhs:id/0_resource_name_obfuscated', enableStrategySelector: true, …}
warning.js:30  Warning: [antd: Modal] `destroyOnClose` is deprecated. Please use `destroyOnHidden` instead.
warning @ warning.js:30
call @ warning.js:51
warningOnce @ warning.js:58
_warning @ warning.js:12
typeWarning @ warning.js:46
typeWarning.deprecated @ warning.js:51
(匿名) @ Modal.js:94
Modal @ Modal.js:93
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooks @ react-dom-client.development.js:5529
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 0
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 65, current_step: '生成智能策略', estimated_time_left: 1750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 65, current_step: '生成智能策略', estimated_time_left: 1750}
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
useSmartStrategyAnalysis.ts:74 ⏱️ [StrategyAnalysis] 开始15秒超时监控 {stepId: '1763295062404_m201jpn37', currentTime: '2025-11-16T12:11:05.061Z', analysisState: {…}}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
useElementSelectionManager.ts:219 🧹 [ElementSelectionManager] 执行全局清理
useElementSelectionManager.ts:235 ✅ [ElementSelectionManager] 全局清理完成
zIndexManager.ts:89 📐 [ZIndexManager] 注销模态框: universal-page-finder-modal {activeModals: Array(0), totalActive: 0}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 85, current_step: '评估策略质量', estimated_time_left: 750}
analysis-state-store.ts:266 🚀 [AnalysisState] 开始新的分析任务 {jobId: '52c31aab'}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 85, current_step: '评估策略质量', estimated_time_left: 750}
useIntelligentAnalysisAdapter.ts:144 🔗 [Adapter] 组件卸载，清理资源
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 1
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763295062404_m201jpn37', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 95, current_step: '生成分析报告', estimated_time_left: 250}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 95, current_step: '生成分析报告', estimated_time_left: 250}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763295062404_m201jpn37', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 100, current_step: '分析完成', estimated_time_left: 0}
devTracer.ts:42 [EVT] analysis:progress {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', progress: 100, current_step: '分析完成', estimated_time_left: 0}
stepcards.ts:411 ✅ [StepCardStore] 分析完成，状态自动切换为ready {cardId: 'ptc5upko', progress: 100}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
devTracer.ts:42 [EVT] analysis:done {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', selection_hash: '680e93470a28', result: {…}, confidence: 0.8811, evidence: {…}, …}
wire-global-events.ts:193 🎯 [ROUTE] 从smart_candidates提取最终分数 {jobId: '52c31aab', cardId: 'ptc5upko', candidatesCount: 2}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763295062404_m201jpn37', candidateKey: 'self_anchor', confidence: '88%', rawInput: 0.8811}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763295062404_m201jpn37', candidateKey: 'xpath_fallback', confidence: '55%', rawInput: 0.5455000299999999}
wire-global-events.ts:243 🔗 [ROUTE] 生成基于候选项的智能自动链 {jobId: '52c31aab', recommended: 'self_anchor', stepsCount: 2}
analysis-state-store.ts:276 🏆 [AnalysisState] 分析任务完成 {jobId: '52c31aab', totalSteps: 4}
stepcards.ts:448 ✅ [StepCardStore] 填充策略并就绪 {cardId: 'card_1763295063376_mptc5upko', strategy: {…}}
wire-global-events.ts:308 🔧 [Wire Events] 调用 setSingleStepConfidence {targetCardId: 'ptc5upko', rawConfidence: 0.8811, normalizedConfidence: 0.8811, confidence: 0.8811, source: 'auto_chain', …}
stepcards.ts:531 🎯 [StepCardStore] 设置单步置信度 {cardId: 'ptc5upko', confidence: 0.8811, confidencePercent: '88%', source: 'auto_chain', finalStatus: 'ready', …}
stepcards.ts:505 📊 [StepCardStore] 设置置信度 {cardId: 'card_1763295063376_mptc5upko', confidence: 0.8811, evidence: {…}}
wire-global-events.ts:339 📊 [Wire Events] 写入候选项评分 {stepId: '201jpn37', smartCandidates: 2, candidateKeys: Array(2), recommendedKey: 'self_anchor', globalConfidence: 0.8811}
wire-global-events.ts:350 🔍 [Wire Events] 候选项原始数据 {candidateKey: 'self_anchor', rawConfidence: 88.11, confidenceType: 'number', isNormalRange: false, isPercentRange: true}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763295062404_m201jpn37', candidateKey: 'self_anchor', confidence: '88%', rawInput: 88.11}
wire-global-events.ts:361 ✅ [Wire Events] 候选分写入验证 {stepId: '201jpn37', candidateKey: 'self_anchor', written: 88.11, readBack: 0.8811, success: false}
wire-global-events.ts:350 🔍 [Wire Events] 候选项原始数据 {candidateKey: 'xpath_fallback', rawConfidence: 54.550003, confidenceType: 'number', isNormalRange: false, isPercentRange: true}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763295062404_m201jpn37', candidateKey: 'xpath_fallback', confidence: '55%', rawInput: 54.550003}
wire-global-events.ts:361 ✅ [Wire Events] 候选分写入验证 {stepId: '201jpn37', candidateKey: 'xpath_fallback', written: 54.550003, readBack: 0.5455000299999999, success: false}
step-score-store.ts:161 🌐 [StepScoreStore] 设置全局评分 {stepId: '1763295062404_m201jpn37', confidence: '88%', rawInput: 0.8811}
step-score-store.ts:113 📊 [StepScoreStore] 更新评分缓存 {key: 'element:1763295062404_m201jpn37', confidence: '88%', origin: 'single', recommended: 'self_anchor'}
devTracer.ts:42 [EVT] analysis:done {job_id: '513c352a-52a0-40ff-9213-42f452c31aab', selection_hash: '680e93470a28', result: {…}, confidence: 0.8811, evidence: {…}, …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763295062404_m201jpn37', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
stepcards.ts:448 ✅ [StepCardStore] 填充策略并就绪 {cardId: 'card_1763295063376_mptc5upko', strategy: {…}}
use-intelligent-analysis-workflow.ts:437 🔗 [Bridge] 同步完成状态到统一store {cardId: 'card_1763295063376_mptc5upko', jobId: '513c352a-52a0-40ff-9213-42f452c31aab', strategy: {…}}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
event-acknowledgment-service.ts:69  ⚠️ [EventAck] 发送确认失败（非致命） {eventType: 'analysis:done', eventId: '513c352a-52a0-40ff-9213-42f452c31aab', error: 'Command acknowledge_event not found'}
acknowledgeEvent @ event-acknowledgment-service.ts:69
use-intelligent-analysis-workflow.ts:458 ✅ [Workflow] 完成事件处理并已确认 {jobId: '513c352a-52a0-40ff-9213-42f452c31aab'}
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
use-intelligent-analysis-workflow.ts:963 🎯 [自动评分] 开始执行Step1-2评分 {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko'}
shared-scoring.ts:117 🎯 [智能·自动链] 触发结构匹配评分 {steps: Array(2), forceRefresh: false, source: 'smart_auto_chain'}
shared-scoring.ts:158 🔍 [智能·自动链] 卡片数据检查: {cardId: 'card_1763295063376_mptc5upko', hasElementContext: true, elementContextKeys: Array(5), xpath: '//element_32', hasXmlSnapshot: true, …}
xml-cache-loader.ts:37 📦 [智能·自动链] 开始加载XML缓存 {cardId: 'ptc5upko', hasXmlCacheId: true, hasEmbeddedXml: true}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
xml-cache-performance-monitor.ts:86 ⚡ XML缓存加载快速: 0ms (来源: memory)
xml-cache-loader.ts:51 ✅ [智能·自动链] 从xmlCacheId恢复XML成功 {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlLength: 38755}
shared-scoring.ts:187 🔄 [智能·自动链] 调用后端评分接口 {xpath: '//element_32', indexPath: undefined, requestedSteps: Array(2)}
adbStore.ts:121 🔄 [adbStore] setDevices 被调用: {deviceCount: 0, deviceIds: Array(0)}
adbStore.ts:131 ✅ [adbStore] devices 状态已更新
adb-application-service.ts:495 👁️ [AdbApplicationService] 启动设备监听服务...
RealTimeDeviceRepository.ts:209 🔌 [RealTimeDeviceRepository] 移除设备变化监听器: {callbackCount: 0}
RealTimeDeviceRepository.ts:166 🔗 [RealTimeDeviceRepository] 注册设备变化监听器: {callbackCount: 1}
RealTimeDeviceRepository.ts:242 ✅ [RealTimeDeviceRepository] 监听器健康检查通过，回调数量: 2
adb-health-service.ts:33 🏥 [AdbHealthService] 启动健康检查...
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
adb-health-service.ts:74 🔍 [AdbHealthService] 定期诊断检查已启动
adb-application-service.ts:118 ✅ [AdbApplicationService] ADB环境初始化完成
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
DebounceUpdateStrategy.ts:120 [DebounceStrategy] 📱 收到设备变化: {deviceCount: 0, deviceIds: Array(0)}
xml-persistent-storage.ts:300 📦 获取最新11个缓存条目 (性能优化)
DebounceUpdateStrategy.ts:120 [DebounceStrategy] ✅ 已更新设备列表(兜底): {oldCount: 0, newCount: 0}
adbStore.ts:121 🔄 [adbStore] setDevices 被调用: {deviceCount: 0, deviceIds: Array(0)}
adbStore.ts:131 ✅ [adbStore] devices 状态已更新
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
useSmartStrategyAnalysis.ts:82  ⚠️ [StrategyAnalysis] 分析超时，强制重置状态 {stepId: '1763295062404_m201jpn37', duration: '15s', previousState: {…}}
(匿名) @ useSmartStrategyAnalysis.ts:82
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763295062404_m201jpn37
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763295062404_m201jpn37', cardId: 'card_1763295063376_mptc5upko', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_32', element_type: 'FrameLayout', text: '', bounds: {…}, resource_id: 'com.xingin.xhs:id/0_resource_name_obfuscated', …}
useSmartStrategyAnalysis.ts:100 🧹 [StrategyAnalysis] 清理超时监控 {stepId: '1763295062404_m201jpn37'}
strategy-menu-builder.tsx:255 🎯 [菜单] 用户点击：刷新所有评分
strategy-menu-builder.tsx:264  Warning: [antd: message] Static function can not consume context like dynamic theme. Please use 'App' component instead.
warning @ warning.js:30
call @ warning.js:51
warningOnce @ warning.js:58
_warning @ warning.js:12
warnContext @ index.js:39
typeOpen @ index.js:193
staticMethods.<computed> @ index.js:236
onClick @ strategy-menu-builder.tsx:264
onInternalClick2 @ MenuItem.js:134
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(匿名) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
<li>
exports.createElement @ react.development.js:1034
InternalRawItem2 @ RawItem.js:18
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<RawItem>
exports.createElement @ react.development.js:1034
render4 @ MenuItem.js:53
react_stack_bottom_frame @ react-dom-client.development.js:23876
updateClassComponent @ react-dom-client.development.js:9454
beginWork @ react-dom-client.development.js:10536
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<LegacyMenuItem2>
exports.createElement @ react.development.js:1034
(匿名) @ MenuItem.js:162
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<ForwardRef>
exports.createElement @ react.development.js:1034
MenuItem @ MenuItem.js:210
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateForwardRef @ react-dom-client.development.js:8645
beginWork @ react-dom-client.development.js:10861
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16216
performWorkUntilDeadline @ scheduler.development.js:45
<ForwardRef(MenuItem)>
exports.createElement @ react.development.js:1034
MenuItem2 @ MenuItem.js:66
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
