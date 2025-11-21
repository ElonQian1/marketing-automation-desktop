
2025-11-20T16:52:59.894184Z  INFO employee_gui::commands::xml_cache:   - 当 前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri"     
2025-11-20T16:52:59.894584Z  INFO employee_gui::commands::xml_cache:   - 选 择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml     
2025-11-20T16:52:59.894879Z  INFO employee_gui::commands::xml_cache:   - 路 径是否存在: true
2025-11-20T16:52:59.907944Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 (过滤器: 禁用)
2025-11-20T16:52:59.908444Z  INFO employee_gui::commands::xml_cache: 📄 XML 内容长度: 39117 字符
2025-11-20T16:52:59.918302Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）
2025-11-20T16:52:59.922427Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-20T16:52:59.924507Z  INFO employee_gui::commands::xml_cache: 🎉 XML 解析完成，返回 63 个元素的JSON数据
2025-11-20T16:53:07.344693Z  WARN tao::platform_impl::platform::event_loop::runner: NewEvents emitted without explicit RedrawEventsCleared
2025-11-20T16:53:07.354314Z  WARN tao::platform_impl::platform::event_loop::runner: RedrawEventsCleared emitted without explicit MainEventsCleared      
2025-11-20T16:53:07.930280Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统健康检查
2025-11-20T16:53:07.937685Z DEBUG employee_gui::commands::health_check: ADB
服务初始化成功
2025-11-20T16:53:07.990820Z DEBUG employee_gui::commands::health_check: ADB 连接状态: true
2025-11-20T16:53:07.991053Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-20T16:53:07.991299Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-20T16:53:07.991484Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }        
2025-11-20T16:53:08.363637Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, selection_hash=2df42847862a, element_path=element_27
2025-11-20T16:53:08.366390Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=1cc347db-bdb4-42bf-8638-342db5cae511
2025-11-20T16:53:08.747038Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, progress=5%, step=初始化分析环境
2025-11-20T16:53:09.355927Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, progress=25%, step=解析页面结构
2025-11-20T16:53:10.130042Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T16:53:10.132867Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T16:53:10.133276Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T16:53:10.133531Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T16:53:10.362285Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, progress=65%, step=生成智能策略
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T16:53:10.462676Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T16:53:10.463026Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T16:53:11.379657Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, progress=85%, step=评估策略质量
2025-11-20T16:53:11.887079Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, progress=95%, step=生成分析报告
2025-11-20T16:53:12.196174Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能分析的增强XPath: element_27
2025-11-20T16:53:12.197734Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, progress=100%, step=分析完成
2025-11-20T16:53:12.197922Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=1cc347db-bdb4-42bf-8638-342db5cae511, 推荐策略=self_anchor, 置信度=88.1%
2025-11-20T16:53:13.500582Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T16:53:13.501585Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T16:53:13.502109Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T16:53:13.502721Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T16:53:13.604055Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T16:53:13.607227Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T16:53:14.591788Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能推荐 (支持双输入模式)
2025-11-20T16:53:14.593630Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照模式 (xpath + xml_snapshot)
2025-11-20T16:53:14.593887Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-20T16:53:14.594122Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始从StepCard快照解析四节点, xpath: //element_27
2025-11-20T16:53:14.594311Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-20T16:53:15.267575Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建几何父子关系树 (Geometric Tree)...
2025-11-20T16:53:15.268489Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 几何父子关系树构建完成，耗时 0ms
2025-11-20T16:53:15.268666Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 674ms
2025-11-20T16:53:15.268813Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-20T16:53:15.269148Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-20T16:53:15.275122Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-20T16:53:15.275896Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32
2025-11-20T16:53:15.276738Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到目标节点, 索引: 32
2025-11-20T16:53:15.278371Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 创建ClickNormalizer...
2025-11-20T16:53:15.278495Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 获取点击节点: clicked_node_idx=32
2025-11-20T16:53:15.278643Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始normalize_click, bounds=(546, 225, 1067, 1083)
2025-11-20T16:53:15.279484Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-20T16:53:15.280974Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-20T16:53:15.281284Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找容器，起始节点: 31      
2025-11-20T16:53:15.281710Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点31: class=Some("android.widget.FrameLayout")
2025-11-20T16:53:15.282340Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 31 -> 19
2025-11-20T16:53:15.282509Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点19: class=Some("androidx.recyclerview.widget.RecyclerView")
2025-11-20T16:53:15.282620Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现容器候选: index=19, priority=100, depth=2, class=Some("androidx.recyclerview.widget.RecyclerView")      
2025-11-20T16:53:15.282785Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到高优先级容器 (深度2, priority=100)
2025-11-20T16:53:15.283102Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到容器: index=19, class=Some("androidx.recyclerview.widget.RecyclerView")
2025-11-20T16:53:15.283332Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找卡片根，起始: 31, 容器: 19
2025-11-20T16:53:15.283520Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查卡片根候选31: class=Some("android.widget.FrameLayout"), desc="笔记  来海边吃吃玩玩 来自知恩 147赞"      
2025-11-20T16:53:15.283717Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到卡片根 (深度1)
2025-11-20T16:53:15.283841Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 回收到卡片根: index=31, content_desc="笔记  来海边吃吃玩玩 来自知恩 147赞"
2025-11-20T16:53:15.283962Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 保留同边界可点节点: 32 (diff=0, iou=1.00) - 覆盖全卡片 (保留结构层级)
2025-11-20T16:53:15.284525Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=32, iou=1.00, bounds_diff=0
2025-11-20T16:53:15.284917Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=37, iou=0.12, bounds_diff=767
2025-11-20T16:53:15.285045Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=40, iou=0.01, bounds_diff=1221
2025-11-20T16:53:15.285136Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=41, iou=0.00, bounds_diff=1292
2025-11-20T16:53:15.285257Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到可点父: index=32, iou=1.00, class=Some("android.widget.FrameLayout")
2025-11-20T16:53:15.285498Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 列分析完成: ColumnInfo { column: Right, position_in_column: 0, column_card_count: 3 }
2025-11-20T16:53:15.285774Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalize_click完成
2025-11-20T16:53:15.285967Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始提取四节点索引...
2025-11-20T16:53:15.286174Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.original_clicked.node_index = 31
2025-11-20T16:53:15.286529Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.container.node_index = 19
2025-11-20T16:53:15.286654Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.card_root.node_index = 31
2025-11-20T16:53:15.286786Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.clickable_parent.node_index = 32
2025-11-20T16:53:15.286919Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点索引提取完成
2025-11-20T16:53:15.287236Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 四节点推导完成: clicked=31, container=19, card_root=31, clickable_parent=32
2025-11-20T16:53:15.287854Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] resolve_from_stepcard_snapshot 返回成功
2025-11-20T16:53:15.287987Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备解构四节点: clicked=31, container=19, card_root=31, clickable_parent=32
2025-11-20T16:53:15.288159Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点解构完成
2025-11-20T16:53:15.288533Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 四节点确定: 31 → 19 → 31 → 32
2025-11-20T16:53:15.288656Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 准备获取XML索引器...
2025-11-20T16:53:15.288894Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 快照模式:重建XML索引 (节点数: ~130)
2025-11-20T16:53:15.289176Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-20T16:53:15.863399Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建几何父子关系树 (Geometric Tree)...
2025-11-20T16:53:15.863961Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 几何父子关系树构建完成，耗时 0ms
2025-11-20T16:53:15.864088Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 574ms
2025-11-20T16:53:15.864205Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] XML索引重建完成: 107 个节点
2025-11-20T16:53:15.864341Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 创建自动推荐服务...
2025-11-20T16:53:15.864461Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 自动推荐服务创建完成
2025-11-20T16:53:15.864558Z  INFO employee_gui::commands::structure_recommend: 🚀 [推荐] 开始生成推荐结果...
2025-11-20T16:53:15.864697Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: 🚀 [自动推荐] 开始生成推荐，节点索引: 31 → 31 → 32
2025-11-20T16:53:15.873003Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 查找node[32]的父节点, bounds=(546,225,1067,1083)
2025-11-20T16:53:15.873201Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 检查了106个节点,找到23 个包含候选
2025-11-20T16:53:15.873372Z  INFO employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: ✅ [find_parent] node[32]的父节点是node[31]
2025-11-20T16:53:15.883381Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 查找node[32]的父节点, bounds=(546,225,1067,1083)
2025-11-20T16:53:15.883595Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 检查了106个节点,找到23 个包含候选
2025-11-20T16:53:15.883878Z  INFO employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: ✅ [find_parent] node[32]的父节点是node[31]
2025-11-20T16:53:15.897163Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: ✅ [自动推荐] 推荐生成完成，耗时: 32ms, 推荐模式: 叶子上下文
2025-11-20T16:53:15.897377Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐结果生成完成
2025-11-20T16:53:15.897543Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐完成: LeafContext (置信度: 0.439)
2025-11-20T16:53:18.673793Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T16:53:18.674082Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T16:53:18.674273Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T16:53:19.181374Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T16:53:19.182202Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T16:53:19.182491Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T16:53:19.182643Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
