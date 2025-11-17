
2025-11-17T06:51:31.760394Z  INFO employee_gui::commands::xml_cache: 🔍 XML缓存目录检查:
2025-11-17T06:51:31.762606Z  INFO employee_gui::commands::xml_cache:   - 当前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri"
2025-11-17T06:51:31.762759Z  INFO employee_gui::commands::xml_cache:   - 选择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml
2025-11-17T06:51:31.762945Z  INFO employee_gui::commands::xml_cache:   - 路径是否存在: true        
2025-11-17T06:51:31.777938Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 (过滤器: 禁用)
2025-11-17T06:51:31.778160Z  INFO employee_gui::commands::xml_cache: 📄 XML内容长度: 39117 字符    
2025-11-17T06:51:31.803746Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完 成，提取到 63 个全部UI元素（含index_path）
2025-11-17T06:51:31.803956Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-17T06:51:31.806825Z  INFO employee_gui::commands::xml_cache: 🎉 XML解析完成，返回 63 个元素的JSON数据
2025-11-17T06:51:39.474226Z  WARN tao::platform_impl::platform::event_loop::runner: NewEvents emitted without explicit RedrawEventsCleared
2025-11-17T06:51:39.482352Z  WARN tao::platform_impl::platform::event_loop::runner: RedrawEventsCleared emitted without explicit MainEventsCleared
2025-11-17T06:51:42.092898Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统健康检查
2025-11-17T06:51:42.093321Z DEBUG employee_gui::commands::health_check: ADB服务初始化成功
2025-11-17T06:51:42.093532Z DEBUG employee_gui::commands::health_check: ADB连接状态: true
2025-11-17T06:51:42.093769Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-17T06:51:42.094005Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-17T06:51:42.094265Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }
2025-11-17T06:51:42.540388Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=33cbd92a-e373-40b7-9717-1324df332772, selection_hash=6e57b50d12fa, element_path=element_27    
2025-11-17T06:51:42.542910Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=33cbd92a-e373-40b7-9717-1324df332772
2025-11-17T06:51:42.550873Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=33cbd92a-e373-40b7-9717-1324df332772, progress=5%, step=初始化分 析环境
2025-11-17T06:51:42.763148Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=33cbd92a-e373-40b7-9717-1324df332772, progress=25%, step=解析页面结构
2025-11-17T06:51:43.573349Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=33cbd92a-e373-40b7-9717-1324df332772, progress=65%, step=生成智能策略
执行ADB命令: adb.exe ["version"]
2025-11-17T06:51:44.577569Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=33cbd92a-e373-40b7-9717-1324df332772, progress=85%, step=评估策略质量
2025-11-17T06:51:45.093254Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=33cbd92a-e373-40b7-9717-1324df332772, progress=95%, step=生成分析报告
2025-11-17T06:51:45.402217Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能分析的增强XPath: element_27        
2025-11-17T06:51:45.403937Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=33cbd92a-e373-40b7-9717-1324df332772, progress=100%, step=分析完 成
2025-11-17T06:51:45.404318Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=33cbd92a-e373-40b7-9717-1324df332772, 推荐策略=self_anchor, 置信 度=88.1%
执行ADB命令: adb.exe ["version"]
2025-11-17T06:51:46.678797Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能推荐 (支持双输入模式)
2025-11-17T06:51:46.679120Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照模式 (xpath + xml_snapshot)        
2025-11-17T06:51:46.679424Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始从StepCard快照解析四节点, xpath: //element_27
2025-11-17T06:51:46.679804Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-17T06:51:46.720649Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-17T06:51:46.727343Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 6ms
2025-11-17T06:51:46.727541Z  INFO employee_gui::engine::xml_indexer: ✅ XML索引构建完成: 107 个节点，耗时 47ms
2025-11-17T06:51:46.727653Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索 引构建成功, 共 107 个节点        
2025-11-17T06:51:46.727779Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-17T06:51:46.735278Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator]  找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-17T06:51:46.735542Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32
2025-11-17T06:51:46.735707Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到目标节点, 索引: 32
2025-11-17T06:51:46.735998Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-17T06:51:46.737148Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-17T06:51:52.403682Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读 取数据长度失败: 由于连接方在一段 时间后没有正确答复或连接的主机没 有反应，连接尝试失败。 (os error 10060)
ce_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-17T06:51:52.911548Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-17T06:51:52.912265Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-17T06:51:52.912646Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-17T06:51:52.912914Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状 态无变化 (0 个设备)
2025-11-17T06:52:16.679691Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能推荐 (支持双输入模式)
2025-11-17T06:52:16.679932Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照模式 (xpath + xml_snapshot)        
2025-11-17T06:52:16.680120Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照 解析] 开始从StepCard快照解析四节点, xpath: //element_27
2025-11-17T06:52:16.680319Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-17T06:52:16.688602Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开 始构建父子关系树...
2025-11-17T06:52:16.692693Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父 子关系树构建完成，耗时 4ms
2025-11-17T06:52:16.692894Z  INFO employee_gui::engine::xml_indexer: ✅ XML索引构建完成: 107 个节点，耗时 12ms
2025-11-17T06:52:16.693017Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照 解析] XML索引构建成功, 共 107 个节点        
2025-11-17T06:52:16.693174Z DEBUG employee_gui::commands::structure_recommend: 🔄 [快照 解析] 使用 xpath 定位（兼容模式）: //element_27
2025-11-17T06:52:16.693589Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通 过前端ID找到节点: //element_27 -> index 27  
2025-11-17T06:52:16.693738Z  INFO employee_gui::commands::structure_recommend: ✅ [快照 解析] 找到目标节点, 索引: 27
2025-11-17T06:52:16.693888Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(29, 1060, 97, 1128)
2025-11-17T06:52:16.694134Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=27, class=Some("android.view.View") 
2025-11-17T06:52:22.927134Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-17T06:52:22.929732Z DEBUG employee_gui::services::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-17T06:52:22.930640Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-17T06:52:23.442450Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-17T06:52:23.443108Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-17T06:52:23.443365Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-17T06:52:23.443500Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状 态无变化 (0 个设备)


PagePreview.tsx:353 🎯 [PagePreview] 元素点击详情
PagePreview.tsx:354 📍 元素ID: element_27
PagePreview.tsx:355 📝 文本: (无)
PagePreview.tsx:356 📝 描述: com.xingin.xhs:id/0_resource_name_obfuscated
PagePreview.tsx:357 🎨 类别: buttons
PagePreview.tsx:358 📐 显示Bounds: [546,225][1067,1083]
PagePreview.tsx:359 👆 可点击: ✓
PagePreview.tsx:360 📏 面积: 88299.85185185182 px²
PagePreview.tsx:361 🎚️ Z-Index: 57
PagePreview.tsx:362 ⚠️ 是否为"通讯录": 否
PagePreview.tsx:365 🔍 原始UIElement数据:
PagePreview.tsx:366 (索引)值bottomleftrighttop(索引)值bottomleftrighttopid'element_27'text'(无)'content_desc'(无)'resource_id'com.xingin.xhs:id/0_resource_name_obfuscated'class_name'android.widget.FrameLayout'bounds10835461067225Object
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_27', hasIndexPath: true, indexPathLength: 22}
useElementSelectionManager.ts:90 🚀 [useElementSelectionManager] handleElementClick 被调用: {elementId: 'element_27', elementText: '', clickPosition: {…}, isHidden: false, currentPendingSelection: null, …}
useElementSelectionManager.ts:109 ✅ [useElementSelectionManager] 设置 pendingSelection
useElementSelectionManager.ts:125 📝 [useElementSelectionManager] 新的 selection 状态: {element: {…}, position: {…}, confirmed: false}
ElementSelectionPopover.tsx:184 ⚡ [用户操作] 快速创建步骤卡片
UniversalPageFinderModal.tsx:482 🔍 [UniversalPageFinderModal] pendingSelection.element 检查: {elementId: 'element_27', hasIndexPath: true, indexPath: Array(22), indexPathLength: 22, elementKeys: Array(17)}
UniversalPageFinderModal.tsx:496 ✅ [UniversalPageFinderModal] 附加xmlCacheId到元素: {elementId: 'element_27', xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', hasIndexPath: true, indexPath: Array(22), indexPathLength: 22}
useIntelligentStepCardIntegration.ts:837 ⚡ [智能集成] 快速创建步骤: element_27
useIntelligentStepCardIntegration.ts:186 🔄 [convertElementToContext] 接收到的真实UIElement: {id: 'element_27', text: '', content_desc: '', resource_id: '', class_name: '', …}
useElementSelectionManager.ts:151 🔍 confirmSelection called, pendingSelection: {element: {…}, position: {…}, confirmed: false}
useElementSelectionManager.ts:153 ✅ 确认选择元素:  ID: element_27
useIntelligentStepCardIntegration.ts:1223 🎯 [智能集成] 元素选择确认 (传统模式): element_27
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_1', hasIndexPath: true, indexPathLength: 1}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_2', hasIndexPath: true, indexPathLength: 2}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_3', hasIndexPath: true, indexPathLength: 3}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_4', hasIndexPath: true, indexPathLength: 4}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_5', hasIndexPath: true, indexPathLength: 5}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_6', hasIndexPath: true, indexPathLength: 6}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_7', hasIndexPath: true, indexPathLength: 7}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_8', hasIndexPath: true, indexPathLength: 8}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_9', hasIndexPath: true, indexPathLength: 9}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_10', hasIndexPath: true, indexPathLength: 10}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_11', hasIndexPath: true, indexPathLength: 11}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_12', hasIndexPath: true, indexPathLength: 12}
 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_13', hasIndexPath: true, indexPathLength: 13}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_14', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_56', hasIndexPath: true, indexPathLength: 9}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_50', hasIndexPath: true, indexPathLength: 12}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_51', hasIndexPath: true, indexPathLength: 13}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_52', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_54', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_55', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_53', hasIndexPath: true, indexPathLength: 15}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_15', hasIndexPath: true, indexPathLength: 15}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_16', hasIndexPath: true, indexPathLength: 16}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_17', hasIndexPath: true, indexPathLength: 17}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_18', hasIndexPath: true, indexPathLength: 18}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_19', hasIndexPath: true, indexPathLength: 19}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_20', hasIndexPath: true, indexPathLength: 20}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_21', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_22', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_23', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_24', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_26', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_27', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_28', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_29', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_30', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_25', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_36', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_37', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_38', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_39', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_31', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:19 🔍 [convertVisualToUIElement] 输入元素检查: {id: 'element_32', hasIndexPath: true, indexPath: Array(22), indexPathLength: 22, elementKeys: Array(16)}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_32', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_33', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_34', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_40', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_35', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_45', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_46', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_47', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_41', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_42', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_43', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_44', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_48', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_49', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_57', hasIndexPath: true, indexPathLength: 10}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_58', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_59', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_60', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_61', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_63', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_62', hasIndexPath: true, indexPathLength: 12}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_1', hasIndexPath: true, indexPathLength: 1}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_2', hasIndexPath: true, indexPathLength: 2}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_3', hasIndexPath: true, indexPathLength: 3}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_4', hasIndexPath: true, indexPathLength: 4}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_5', hasIndexPath: true, indexPathLength: 5}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_6', hasIndexPath: true, indexPathLength: 6}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_7', hasIndexPath: true, indexPathLength: 7}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_8', hasIndexPath: true, indexPathLength: 8}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_9', hasIndexPath: true, indexPathLength: 9}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_10', hasIndexPath: true, indexPathLength: 10}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_11', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_12', hasIndexPath: true, indexPathLength: 12}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_13', hasIndexPath: true, indexPathLength: 13}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_14', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_56', hasIndexPath: true, indexPathLength: 9}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_50', hasIndexPath: true, indexPathLength: 12}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_51', hasIndexPath: true, indexPathLength: 13}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_52', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_54', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_55', hasIndexPath: true, indexPathLength: 14}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_53', hasIndexPath: true, indexPathLength: 15}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_15', hasIndexPath: true, indexPathLength: 15}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_16', hasIndexPath: true, indexPathLength: 16}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_17', hasIndexPath: true, indexPathLength: 17}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_18', hasIndexPath: true, indexPathLength: 18}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_19', hasIndexPath: true, indexPathLength: 19}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_20', hasIndexPath: true, indexPathLength: 20}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_21', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_22', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_23', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_24', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_26', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_27', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_28', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_29', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_30', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_25', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_36', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_37', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_38', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_39', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_31', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:19 🔍 [convertVisualToUIElement] 输入元素检查: {id: 'element_32', hasIndexPath: true, indexPath: Array(22), indexPathLength: 22, elementKeys: Array(16)}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_32', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_33', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_34', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_40', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_35', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_45', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_46', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_47', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_41', hasIndexPath: true, indexPathLength: 21}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_42', hasIndexPath: true, indexPathLength: 22}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_43', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_44', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_48', hasIndexPath: true, indexPathLength: 23}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_49', hasIndexPath: true, indexPathLength: 24}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_57', hasIndexPath: true, indexPathLength: 10}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_58', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_59', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_60', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_61', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_63', hasIndexPath: true, indexPathLength: 11}
elementTransform.ts:116 ✅ [convertVisualToUIElement] indexPath 已保留: {id: 'element_62', hasIndexPath: true, indexPathLength: 12}
ElementSelectionPopover.tsx:200 ✅ [Popover关闭] 快速创建成功，已关闭气泡
useIntelligentStepCardIntegration.ts:229 ✅ [convertElementToContext] 从缓存获取XML成功: {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlContentLength: 38755, xmlHash: 'sha256:PD94bWwgd...'}
useIntelligentStepCardIntegration.ts:345  ⚠️ [XPath] 元素XPath是相对路径，转换为绝对路径: //element_27
(匿名) @ useIntelligentStepCardIntegration.ts:345
await in (匿名)
(匿名) @ useIntelligentStepCardIntegration.ts:840
onQuickCreate @ UniversalPageFinderModal.tsx:506
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
useIntelligentStepCardIntegration.ts:446 🔄 [子元素提取-方案2] child_elements 不可用，尝试从 XML 正则提取
useIntelligentStepCardIntegration.ts:531  ⚠️ [子元素提取] 两种方案都未提取到子元素文本/描述 {hasChildElements: false, hasXmlContent: true, hasBoundsString: true, elementId: 'element_27'}
(匿名) @ useIntelligentStepCardIntegration.ts:531
await in (匿名)
(匿名) @ useIntelligentStepCardIntegration.ts:840
onQuickCreate @ UniversalPageFinderModal.tsx:506
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
useIntelligentStepCardIntegration.ts:570 🔍 [父元素查找] 目标元素深度: 27
useIntelligentStepCardIntegration.ts:591 ✅ [父元素查找] 父元素起始位置: 11058
useIntelligentStepCardIntegration.ts:612  ⚠️ [父元素查找] 未找到父元素结束标签
(匿名) @ useIntelligentStepCardIntegration.ts:612
await in (匿名)
(匿名) @ useIntelligentStepCardIntegration.ts:840
onQuickCreate @ UniversalPageFinderModal.tsx:506
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
useIntelligentStepCardIntegration.ts:724 🔍 [数据增强] 最终使用的属性（三层合并）: {层级说明: '外层父元素(content-desc) + 中层可点击(bounds/id) + 同层兄弟(text) + 内层子元素(text+content-desc)', 中层_原始text: '', 同层_兄弟元素text: Array(0), 内层_子元素text: Array(0), 内层_子元素contentDesc: Array(0), …}
useIntelligentStepCardIntegration.ts:77 🔍 [buildSimpleChildren] 接收到的 element: {id: 'element_27', hasIndexPath: true, indexPath: Array(22), indexPathLength: 22}
useIntelligentStepCardIntegration.ts:120 🌳 [buildSimpleChildren] 无child_elements，设置空children: element_27
useIntelligentStepCardIntegration.ts:797 🔄 [convertElementToContext] 转换后的ElementSelectionContext: {elementText: '', contentDesc: '', textAttr: '', resourceId: '', hasOriginalUIElement: true, …}
use-intelligent-analysis-workflow.ts:866 🎯 [Workflow] 创建快速步骤卡片 {stepId: '1763362302086_jxoou1yuj', context: {…}, lockContainer: false}
use-intelligent-analysis-workflow.ts:550 🔍 [临时] 从localStorage获取选择模式: first
use-intelligent-analysis-workflow.ts:558 🎯 [Selection Mode] 当前用户选择模式: first
analysis-health-service.ts:43 🔍 [HealthService] 开始系统健康检查...
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 6
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
stepcards.ts:313 📝 [StepCardStore] 创建步骤卡片（新方式） {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', data: {…}}
use-intelligent-analysis-workflow.ts:946 🔗 [Bridge] 在统一store中创建对应卡片 {stepId: '1763362302086_jxoou1yuj', unifiedCardId: 'card_1763362302523_g5eqzg4xw', elementUid: '1763362302086_jxoou1yuj', hasOriginalElement: true}
analysis-health-service.ts:79 ✅ [HealthService] 健康检查完成 {healthy: true, checks: {…}, errors: Array(0), warnings: Array(0)}
use-intelligent-analysis-workflow.ts:640 🔍 [Workflow] uiElement 构建结果: {hasOriginalUIElement: true, uiElementId: 'element_27', hasIndexPath: true, indexPathLength: 22, hasChildren: true, …}
use-intelligent-analysis-workflow.ts:737  ⚠️ [V3→V2 回退] V3执行失败，自动回退到V2系统 Error: 没有选中的设备，请先连接设备
    at use-intelligent-analysis-workflow.ts:666:21
    at async use-intelligent-analysis-workflow.ts:991:25
    at async useIntelligentStepCardIntegration.ts:843:24
(匿名) @ use-intelligent-analysis-workflow.ts:737
intelligent-analysis-backend.ts:215 🚀 [BackendService] 启动智能分析（缓存未命中/降级） {element_context: {…}, step_id: '1763362302086_jxoou1yuj', lock_container: false, enable_smart_candidates: true, enable_static_candidates: true}
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
intelligent-analysis-backend.ts:223 ✅ [BackendService] 分析任务已启动 {job_id: '33cbd92a-e373-40b7-9717-1324df332772', selection_hash: '6e57b50d12fa', state: 'running'}
use-intelligent-analysis-workflow.ts:758 ✅ [V2 回退] 成功回退到V2系统执行 {jobId: '33cbd92a-e373-40b7-9717-1324df332772'}
useIntelligentStepCardIntegration.ts:957 ✅ [步骤创建] 验证增强后的数据传递: {原始_element_text: '', 增强_context_elementText: '', 原始_element_content_desc: '', 增强_context_content_desc: '', 最终使用_text: '', …}
useIntelligentStepCardIntegration.ts:882 🏷️ [智能命名] 生成步骤名称: {原始element_text: '', 增强enrichedText: '', 原始element_content_desc: '', 增强enrichedContentDesc: '', 是否中层容器: '', …}
useIntelligentStepCardIntegration.ts:943  ⚠️ [智能命名] 无法找到元素文本，使用通用名称，应触发后端智能分析: element_27
generateSmartName @ useIntelligentStepCardIntegration.ts:943
(匿名) @ useIntelligentStepCardIntegration.ts:973
useIntelligentStepCardIntegration.ts:1178 🔄 [智能集成] 添加步骤前，当前步骤数量: 0
useIntelligentStepCardIntegration.ts:1188 ✅ [智能集成] 步骤卡创建成功: {stepId: '1763362302086_jxoou1yuj', elementId: 'element_27', analysisStarted: true, addedToMainList: true, currentStepsCount: 0, …}
useIntelligentStepCardIntegration.ts:1200 🚪 [智能集成] 已关闭页面查找器
useIntelligentStepCardIntegration.ts:1181 🔄 [智能集成] 添加步骤后，新步骤数量: 1
useIntelligentStepCardIntegration.ts:1182 🔄 [智能集成] 新步骤详情: {id: '1763362302086_jxoou1yuj', name: '智能操作 1', step_type: 'smart_find_element', description: '智能分析 - element_27', enableStrategySelector: true, …}
useIntelligentStepCardIntegration.ts:1181 🔄 [智能集成] 添加步骤后，新步骤数量: 1
useIntelligentStepCardIntegration.ts:1182 🔄 [智能集成] 新步骤详情: {id: '1763362302086_jxoou1yuj', name: '智能操作 1', step_type: 'smart_find_element', description: '智能分析 - element_27', enableStrategySelector: true, …}
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
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 2
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 5, current_step: '初始化分析环境', estimated_time_left: 4750}
logger-config.ts:50 ⚠️ [Workflow] 收到未知任务的进度更新: 33cbd92a-e373-40b7-9717-1324df332772 {jobId: '33cbd92a-e373-40b7-9717-1324df332772', currentJobs: Array(1)}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 5, current_step: '初始化分析环境', estimated_time_left: 4750}
VM11:286  [TAURI] Couldn't find callback id 487400635. This might happen when the app is reloaded while Rust is running an asynchronous operation.
runCallback @ VM11:286
value @ VM11:366
(匿名) @ VM961:1
(匿名) @ VM961:1
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(10), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 25, current_step: '解析页面结构', estimated_time_left: 3750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 25, current_step: '解析页面结构', estimated_time_left: 3750}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
useSmartStrategyAnalysis.ts:74 ⏱️ [StrategyAnalysis] 开始15秒超时监控 {stepId: '1763362302086_jxoou1yuj', currentTime: '2025-11-17T06:51:43.634Z', analysisState: {…}}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
useElementSelectionManager.ts:255 🧹 [ElementSelectionManager] 执行全局清理
useElementSelectionManager.ts:271 ✅ [ElementSelectionManager] 全局清理完成
zIndexManager.ts:89 📐 [ZIndexManager] 注销模态框: universal-page-finder-modal {activeModals: Array(0), totalActive: 0}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(11), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 65, current_step: '生成智能策略', estimated_time_left: 1750}
analysis-state-store.ts:266 🚀 [AnalysisState] 开始新的分析任务 {jobId: 'df332772'}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 65, current_step: '生成智能策略', estimated_time_left: 1750}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763362302086_jxoou1yuj', totalScores: 3, scores: Array(3)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
useIntelligentAnalysisAdapter.ts:144 🔗 [Adapter] 组件卸载，清理资源
intelligent-analysis-backend-v3.ts:505 🧹 [V3 BackendService] 清理事件监听器 1
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 85, current_step: '评估策略质量', estimated_time_left: 750}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 85, current_step: '评估策略质量', estimated_time_left: 750}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763362302086_jxoou1yuj', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 95, current_step: '生成分析报告', estimated_time_left: 250}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 95, current_step: '生成分析报告', estimated_time_left: 250}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763362302086_jxoou1yuj', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 100, current_step: '分析完成', estimated_time_left: 0}
stepcards.ts:411 ✅ [StepCardStore] 分析完成，状态自动切换为ready {cardId: '5eqzg4xw', progress: 100}
devTracer.ts:42 [EVT] analysis:progress {job_id: '33cbd92a-e373-40b7-9717-1324df332772', progress: 100, current_step: '分析完成', estimated_time_left: 0}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(12), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
devTracer.ts:42 [EVT] analysis:done {job_id: '33cbd92a-e373-40b7-9717-1324df332772', selection_hash: '6e57b50d12fa', result: {…}, confidence: 0.8811, evidence: {…}, …}
wire-global-events.ts:193 🎯 [ROUTE] 从smart_candidates提取最终分数 {jobId: 'df332772', cardId: '5eqzg4xw', candidatesCount: 2}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763362302086_jxoou1yuj', candidateKey: 'self_anchor', confidence: '88%', rawInput: 0.8811}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763362302086_jxoou1yuj', candidateKey: 'xpath_fallback', confidence: '55%', rawInput: 0.5455000299999999}
wire-global-events.ts:243 🔗 [ROUTE] 生成基于候选项的智能自动链 {jobId: 'df332772', recommended: 'self_anchor', stepsCount: 2}
analysis-state-store.ts:276 🏆 [AnalysisState] 分析任务完成 {jobId: 'df332772', totalSteps: 4}
stepcards.ts:448 ✅ [StepCardStore] 填充策略并就绪 {cardId: 'card_1763362302523_g5eqzg4xw', strategy: {…}}
wire-global-events.ts:308 🔧 [Wire Events] 调用 setSingleStepConfidence {targetCardId: '5eqzg4xw', rawConfidence: 0.8811, normalizedConfidence: 0.8811, confidence: 0.8811, source: 'auto_chain', …}
stepcards.ts:531 🎯 [StepCardStore] 设置单步置信度 {cardId: '5eqzg4xw', confidence: 0.8811, confidencePercent: '88%', source: 'auto_chain', finalStatus: 'ready', …}
stepcards.ts:505 📊 [StepCardStore] 设置置信度 {cardId: 'card_1763362302523_g5eqzg4xw', confidence: 0.8811, evidence: {…}}
wire-global-events.ts:339 📊 [Wire Events] 写入候选项评分 {stepId: 'xoou1yuj', smartCandidates: 2, candidateKeys: Array(2), recommendedKey: 'self_anchor', globalConfidence: 0.8811}
wire-global-events.ts:350 🔍 [Wire Events] 候选项原始数据 {candidateKey: 'self_anchor', rawConfidence: 88.11, confidenceType: 'number', isNormalRange: false, isPercentRange: true}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763362302086_jxoou1yuj', candidateKey: 'self_anchor', confidence: '88%', rawInput: 88.11}
wire-global-events.ts:361 ✅ [Wire Events] 候选分写入验证 {stepId: 'xoou1yuj', candidateKey: 'self_anchor', written: 88.11, readBack: 0.8811, success: false}
wire-global-events.ts:350 🔍 [Wire Events] 候选项原始数据 {candidateKey: 'xpath_fallback', rawConfidence: 54.550003, confidenceType: 'number', isNormalRange: false, isPercentRange: true}
step-score-store.ts:187 🎯 [StepScoreStore] 设置候选项评分 {stepId: '1763362302086_jxoou1yuj', candidateKey: 'xpath_fallback', confidence: '55%', rawInput: 54.550003}
wire-global-events.ts:361 ✅ [Wire Events] 候选分写入验证 {stepId: 'xoou1yuj', candidateKey: 'xpath_fallback', written: 54.550003, readBack: 0.5455000299999999, success: false}
step-score-store.ts:161 🌐 [StepScoreStore] 设置全局评分 {stepId: '1763362302086_jxoou1yuj', confidence: '88%', rawInput: 0.8811}
step-score-store.ts:113 📊 [StepScoreStore] 更新评分缓存 {key: 'element:1763362302086_jxoou1yuj', confidence: '88%', origin: 'single', recommended: 'self_anchor'}
devTracer.ts:42 [EVT] analysis:done {job_id: '33cbd92a-e373-40b7-9717-1324df332772', selection_hash: '6e57b50d12fa', result: {…}, confidence: 0.8811, evidence: {…}, …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
useSmartStrategyAnalysis.ts:100 🧹 [StrategyAnalysis] 清理超时监控 {stepId: '1763362302086_jxoou1yuj'}
CompactStrategyMenu.tsx:258 🔍 [CompactStrategyMenu] 评分数据已更新: {stepId: '1763362302086_jxoou1yuj', totalScores: 4, scores: Array(4)}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V2事件监听系统
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
   dataLoading: false
   dataError: null
 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
 🔍 [CompactStrategyMenu] 准备模态框数据:
   stepId: 1763362302086_jxoou1yuj
   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
xml-persistent-storage.ts:300 📦 获取最新11个缓存条目 (性能优化)
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
stepcards.ts:448 ✅ [StepCardStore] 填充策略并就绪 {cardId: 'card_1763362302523_g5eqzg4xw', strategy: {…}}
use-intelligent-analysis-workflow.ts:437 🔗 [Bridge] 同步完成状态到统一store {cardId: 'card_1763362302523_g5eqzg4xw', jobId: '33cbd92a-e373-40b7-9717-1324df332772', strategy: {…}}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
event-acknowledgment-service.ts:69  ⚠️ [EventAck] 发送确认失败（非致命） {eventType: 'analysis:done', eventId: '33cbd92a-e373-40b7-9717-1324df332772', error: 'Command acknowledge_event not found'}
acknowledgeEvent @ event-acknowledgment-service.ts:69
use-intelligent-analysis-workflow.ts:458 ✅ [Workflow] 完成事件处理并已确认 {jobId: '33cbd92a-e373-40b7-9717-1324df332772'}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
use-intelligent-analysis-workflow.ts:974 🎯 [自动评分] 开始执行Step1-2评分 {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw'}
shared-scoring.ts:117 🎯 [智能·自动链] 触发结构匹配评分 {steps: Array(2), forceRefresh: false, source: 'smart_auto_chain'}
shared-scoring.ts:158 🔍 [智能·自动链] 卡片数据检查: {cardId: 'card_1763362302523_g5eqzg4xw', hasElementContext: true, elementContextKeys: Array(5), xpath: '//element_27', hasXmlSnapshot: true, …}
xml-cache-loader.ts:37 📦 [智能·自动链] 开始加载XML缓存 {cardId: '5eqzg4xw', hasXmlCacheId: true, hasEmbeddedXml: true}
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
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
adb-health-service.ts:74 🔍 [AdbHealthService] 定期诊断检查已启动
adb-application-service.ts:118 ✅ [AdbApplicationService] ADB环境初始化完成
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
xml-cache-performance-monitor.ts:86 ⚡ XML缓存加载快速: 0ms (来源: memory)
xml-cache-loader.ts:51 ✅ [智能·自动链] 从xmlCacheId恢复XML成功 {xmlCacheId: 'ui_dump_e0d909c3_20251030_122312.xml', xmlLength: 38755}
shared-scoring.ts:187 🔄 [智能·自动链] 调用后端评分接口 {xpath: '//element_27', indexPath: Array(22), indexPathLength: 22, requestedSteps: Array(2), xmlLength: 38755}
shared-scoring.ts:195 🚀 [智能·自动链] 开始调用 recommend_structure_mode_v2...
DebounceUpdateStrategy.ts:120 [DebounceStrategy] 📱 收到设备变化: {deviceCount: 0, deviceIds: Array(0)}
xml-persistent-storage.ts:300 📦 获取最新11个缓存条目 (性能优化)
DebounceUpdateStrategy.ts:120 [DebounceStrategy] ✅ 已更新设备列表(兜底): {oldCount: 0, newCount: 0}
adbStore.ts:121 🔄 [adbStore] setDevices 被调用: {deviceCount: 0, deviceIds: Array(0)}
adbStore.ts:131 ✅ [adbStore] devices 状态已更新
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step1 - 卡片子树评分: {candidateKey: 'card_subtree_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
strategy-menu-builder.tsx:312 🔍 [菜单显示] Step2 - 叶子上下文评分: {candidateKey: 'leaf_context_scoring', confidence: null, displayScore: undefined, confidencePercent: undefined, hasScore: false}
CompactStrategyMenu.tsx:1453 🔍 [CompactStrategyMenu] 准备模态框数据:
CompactStrategyMenu.tsx:1454   stepId: 1763362302086_jxoou1yuj
CompactStrategyMenu.tsx:1455   unifiedElementData: null
CompactStrategyMenu.tsx:1456   dataLoading: false
CompactStrategyMenu.tsx:1457   dataError: null
CompactStrategyMenu.tsx:1468 🔍 Fallback 1 检查: {stepId: '1763362302086_jxoou1yuj', cardId: 'card_1763362302523_g5eqzg4xw', hasCard: true, hasOriginalElement: true, cardKeys: Array(16), …}
CompactStrategyMenu.tsx:1477 ⚠️ Fallback 1: 使用步骤卡片数据 {id: 'element_27', element_type: 'content_other', text: '', bounds: {…}, resource_id: '', …}
use-intelligent-analysis-workflow.ts:214 🔧 [EventSetup] 使用V3事件监听系统
intelligent-analysis-backend-v3.ts:395 🔧 [V3 BackendService] 设置进度事件监听器
intelligent-analysis-backend-v3.ts:411 ✅ [V3 BackendService] 进度事件监听器已设置
intelligent-analysis-backend-v3.ts:422 🔧 [V3 BackendService] 设置完成事件监听器
intelligent-analysis-backend-v3.ts:446 ✅ [V3 BackendService] 完成事件监听器已设置
intelligent-analysis-backend-v3.ts:458 ⚠️ [V3 BackendService] V3不单独发射error事件，错误包含在complete事件中
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
shared-scoring.ts:241  ❌ [智能·自动链] indexPath评分失败: Error: 评分超时（30秒）
    at shared-scoring.ts:199:31
executeSharedStructuralScoring @ shared-scoring.ts:241
shared-scoring.ts:245  ⚠️ [智能·自动链] indexPath评分超时，尝试仅使用xpath评分...
executeSharedStructuralScoring @ shared-scoring.ts:245
