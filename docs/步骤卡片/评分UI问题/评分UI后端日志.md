    
2025-11-20T00:54:03.144412Z  INFO employee_gui::commands::xml_cache: 🔍 XML
缓存目录检查:
2025-11-20T00:54:03.144585Z  INFO employee_gui::commands::xml_cache:   - 当 前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri"     
2025-11-20T00:54:03.144719Z  INFO employee_gui::commands::xml_cache:   - 选 择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml     
2025-11-20T00:54:03.144924Z  INFO employee_gui::commands::xml_cache:   - 路 径是否存在: true
2025-11-20T00:54:03.180319Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 (过滤器: 禁用)
2025-11-20T00:54:03.180547Z  INFO employee_gui::commands::xml_cache: 📄 XML 内容长度: 39117 字符
2025-11-20T00:54:03.189827Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）
2025-11-20T00:54:03.190081Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-20T00:54:03.191638Z  INFO employee_gui::commands::xml_cache: 🎉 XML 解析完成，返回 63 个元素的JSON数据
2025-11-20T00:54:07.365833Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统健康检查
2025-11-20T00:54:07.366045Z DEBUG employee_gui::commands::health_check: ADB 服务初始化成功
2025-11-20T00:54:07.366191Z DEBUG employee_gui::commands::health_check: ADB 连接状态: true
2025-11-20T00:54:07.366522Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-20T00:54:07.367237Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-20T00:54:07.367341Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }        
2025-11-20T00:54:08.063422Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, selection_hash=6e57b50d12fa, element_path=element_27
2025-11-20T00:54:08.063786Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc
2025-11-20T00:54:08.064997Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, progress=5%, step=初始化分析环境
2025-11-20T00:54:08.272752Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, progress=25%, step=解析页面结构
2025-11-20T00:54:09.085833Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, progress=65%, step=生成智能策略
2025-11-20T00:54:09.143186Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T00:54:09.143399Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T00:54:09.143571Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T00:54:09.143729Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T00:54:09.202994Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T00:54:09.204061Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T00:54:10.089972Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, progress=85%, step=评估策略质量
2025-11-20T00:54:10.597989Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, progress=95%, step=生成分析报告
2025-11-20T00:54:10.914123Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能分析的增强XPath: element_27
2025-11-20T00:54:10.914925Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, progress=100%, step=分析完成
2025-11-20T00:54:10.915211Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=cd090002-9a69-4d4a-84b4-5c143d8b45bc, 推荐策略=self_anchor, 置信度=88.1%
2025-11-20T00:54:11.247077Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T00:54:11.247974Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T00:54:11.248278Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T00:54:11.248470Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T00:54:11.319183Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T00:54:11.319447Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T00:54:12.145488Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能推荐 (支持双输入模式)
2025-11-20T00:54:12.146288Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照模式 (xpath + xml_snapshot)
2025-11-20T00:54:12.146423Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-20T00:54:12.146803Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始从StepCard快照解析四节点, xpath: //element_27
2025-11-20T00:54:12.146957Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-20T00:54:12.160628Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-20T00:54:12.163715Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 3ms
2025-11-20T00:54:12.163880Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 16ms
2025-11-20T00:54:12.163958Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-20T00:54:12.164032Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-20T00:54:12.168826Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-20T00:54:12.169189Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32
2025-11-20T00:54:12.169291Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到目标节点, 索引: 32
2025-11-20T00:54:12.169363Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 创建ClickNormalizer...
2025-11-20T00:54:12.169435Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 获取点击节点: clicked_node_idx=32
2025-11-20T00:54:12.169506Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始normalize_click, bounds=(546, 225, 1067, 1083)
2025-11-20T00:54:12.169580Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-20T00:54:12.169680Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-20T00:54:12.169768Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找容器，起始节点: 31      
2025-11-20T00:54:12.169851Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点31: class=Some("android.widget.FrameLayout")
2025-11-20T00:54:12.169944Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 32 和 31  
2025-11-20T00:54:12.170018Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 33 和 31  
2025-11-20T00:54:12.170094Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 31 -> 14
2025-11-20T00:54:12.170168Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点14: class=Some("android.view.ViewGroup")
2025-11-20T00:54:12.170265Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 15 和 14  
2025-11-20T00:54:12.170342Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 16 和 14  
2025-11-20T00:54:12.170414Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 17 和 14  
2025-11-20T00:54:12.170514Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 18 和 14  
2025-11-20T00:54:12.170585Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 19 和 14  
2025-11-20T00:54:12.170660Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 14 -> 9
2025-11-20T00:54:12.170734Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点9: class=Some("androidx.viewpager.widget.ViewPager")
2025-11-20T00:54:12.170827Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现容器候选: index=9, priority=30, depth=3, class=Some("androidx.viewpager.widget.ViewPager")
2025-11-20T00:54:12.170917Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 10 和 9   
2025-11-20T00:54:12.170987Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 11 和 9   
2025-11-20T00:54:12.171056Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 12 和 9   
2025-11-20T00:54:12.171126Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 13 和 9   
2025-11-20T00:54:12.171203Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 9 -> 2
2025-11-20T00:54:12.173709Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点2: class=Some("android.widget.LinearLayout")
2025-11-20T00:54:12.173858Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 3 和 2    
2025-11-20T00:54:12.173945Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 4 和 2    
2025-11-20T00:54:12.174021Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 5 和 2    
2025-11-20T00:54:12.174096Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 6 和 2    
2025-11-20T00:54:12.174239Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 7 和 2    
2025-11-20T00:54:12.174357Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 8 和 2    
2025-11-20T00:54:12.174440Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 92 和 2   
2025-11-20T00:54:12.174517Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 2 -> 0
2025-11-20T00:54:12.174598Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点0: class=Some("android.widget.FrameLayout")
2025-11-20T00:54:12.174844Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 1 和 0    
2025-11-20T00:54:12.174931Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到父节点，停止搜索 (深度5)  
2025-11-20T00:54:12.175016Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 选择最优容器 (深度3, priority=30, class=Some("androidx.viewpager.widget.ViewPager"))
2025-11-20T00:54:12.175118Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到容器: index=9, class=Some("androidx.viewpager.widget.ViewPager")
2025-11-20T00:54:12.175212Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找卡片根，起始: 31, 容器: 9
2025-11-20T00:54:12.175308Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查卡片根候选31: class=Some("android.widget.FrameLayout"), desc=Some("笔记  来海边吃吃玩玩 来自知恩 147赞")
2025-11-20T00:54:12.175413Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到卡片根 (深度1)
2025-11-20T00:54:12.175491Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 回收到卡片根: index=31, content_desc=Some("笔记  来海边吃吃玩玩 来自知恩 147赞")
2025-11-20T00:54:12.176591Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过边界差异过小的可点节点: 32 (diff=0)
2025-11-20T00:54:12.176773Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=37, iou=0.12, bounds_diff=767
2025-11-20T00:54:12.176887Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=40, iou=0.01, bounds_diff=1221
2025-11-20T00:54:12.176990Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=41, iou=0.00, bounds_diff=1292
2025-11-20T00:54:12.177180Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到有效可点父（将回退到卡片 根）
2025-11-20T00:54:12.177336Z  WARN employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到可点父，回退到卡片根      
2025-11-20T00:54:12.177493Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 列分析完成: ColumnInfo { column: Right, position_in_column: 0, column_card_count: 3 }
2025-11-20T00:54:12.177627Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalize_click完成
2025-11-20T00:54:12.177725Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始提取四节点索引...
2025-11-20T00:54:12.177814Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.original_clicked.node_index = 31
2025-11-20T00:54:12.177923Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.container.node_index = 9
2025-11-20T00:54:12.178009Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.card_root.node_index = 31
2025-11-20T00:54:12.178087Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.clickable_parent.node_index = 31
2025-11-20T00:54:12.178163Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点索引提取完成
2025-11-20T00:54:12.178239Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 四节点推导完成: clicked=31, container=9, card_root=31, clickable_parent=31
2025-11-20T00:54:12.178554Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] resolve_from_stepcard_snapshot 返回成功
2025-11-20T00:54:12.178675Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备解构四节点: clicked=31, container=9, card_root=31, clickable_parent=31
2025-11-20T00:54:12.178802Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点解构完成
2025-11-20T00:54:12.178885Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 四节点确定: 31 → 9 → 31 → 31
2025-11-20T00:54:12.178966Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 准备获取XML索引器...
2025-11-20T00:54:12.179042Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 快照模式:重建XML索引 (节点数: ~130)
2025-11-20T00:54:12.179130Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-20T00:54:12.193369Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-20T00:54:12.196463Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 3ms
2025-11-20T00:54:12.197628Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 18ms
2025-11-20T00:54:12.197800Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] XML索引重建完成: 107 个节点
2025-11-20T00:54:12.197906Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 创建自动推荐服务...
2025-11-20T00:54:12.198006Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 自动推荐服务创建完成
2025-11-20T00:54:12.198100Z  INFO employee_gui::commands::structure_recommend: 🚀 [推荐] 开始生成推荐结果...
2025-11-20T00:54:12.198317Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: 🚀 [自动推荐] 开始生成推荐，节点索引: 31 → 31 → 31
2025-11-20T00:54:12.228345Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: ✅ [自动推荐] 推荐生成完成，耗时: 30ms, 推荐模式: 叶子上下文
2025-11-20T00:54:12.228673Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐结果生成完成
2025-11-20T00:54:12.228912Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐完成: LeafContext (置信度: 0.439)
2025-11-20T00:54:14.163436Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T00:54:14.163844Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T00:54:14.164126Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T00:54:14.677858Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T00:54:14.678575Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T00:54:14.679012Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T00:54:14.679238Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
2025-11-20T00:54:44.687737Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T00:54:44.688395Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T00:54:44.688758Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T00:54:45.202708Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T00:54:45.203367Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T00:54:45.203691Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T00:54:45.203936Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)