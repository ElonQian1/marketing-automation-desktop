
2025-11-19T07:00:56.030975Z  INFO employee_gui::commands::xml_cache: 🔍 XML
缓存目录检查:
2025-11-19T07:00:56.034445Z  INFO employee_gui::commands::xml_cache:   - 当 前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri"     
2025-11-19T07:00:56.034855Z  INFO employee_gui::commands::xml_cache:   - 选 择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml     
2025-11-19T07:00:56.035420Z  INFO employee_gui::commands::xml_cache:   - 路 径是否存在: true
2025-11-19T07:00:56.048232Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 (过滤器: 禁用)
2025-11-19T07:00:56.048421Z  INFO employee_gui::commands::xml_cache: 📄 XML 内容长度: 39117 字符
2025-11-19T07:00:56.054369Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）
2025-11-19T07:00:56.054570Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-19T07:00:56.056366Z  INFO employee_gui::commands::xml_cache: 🎉 XML 解析完成，返回 63 个元素的JSON数据
2025-11-19T07:01:08.157231Z  WARN tao::platform_impl::platform::event_loop::runner: NewEvents emitted without explicit RedrawEventsCleared
2025-11-19T07:01:08.165309Z  WARN tao::platform_impl::platform::event_loop::runner: RedrawEventsCleared emitted without explicit MainEventsCleared      
2025-11-19T07:01:10.128114Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统健康检查
2025-11-19T07:01:10.128334Z DEBUG employee_gui::commands::health_check: ADB 服务初始化成功
2025-11-19T07:01:10.128592Z DEBUG employee_gui::commands::health_check: ADB 连接状态: true
2025-11-19T07:01:10.128690Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-19T07:01:10.128822Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-19T07:01:10.128910Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }        
2025-11-19T07:01:10.318916Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, selection_hash=6e57b50d12fa, element_path=element_27
2025-11-19T07:01:10.324006Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0
2025-11-19T07:01:10.326189Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, progress=5%, step=初始化分析环境
2025-11-19T07:01:10.534567Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, progress=25%, step=解析页面结构
2025-11-19T07:01:11.343171Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, progress=65%, step=生成智能策略
2025-11-19T07:01:12.359885Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能推荐 (支持双输入模式)
2025-11-19T07:01:12.360183Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照模式 (xpath + xml_snapshot)
2025-11-19T07:01:12.360453Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-19T07:01:12.360679Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始从StepCard快照解析四节点, xpath: //element_27
2025-11-19T07:01:12.360908Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-19T07:01:12.396826Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-19T07:01:12.427796Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 30ms
2025-11-19T07:01:12.430793Z  INFO employee_gui::engine::xml_indexer: ✅ XML
索引构建完成: 107 个节点，耗时 69ms
2025-11-19T07:01:12.441882Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-19T07:01:12.433881Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, progress=85%, step=评估策略质量
2025-11-19T07:01:12.444961Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-19T07:01:12.450484Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-19T07:01:12.451822Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32
2025-11-19T07:01:12.452050Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到目标节点, 索引: 32
2025-11-19T07:01:12.455477Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 创建ClickNormalizer...
2025-11-19T07:01:12.460617Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 获取点击节点: clicked_node_idx=32
2025-11-19T07:01:12.461894Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始normalize_click, bounds=(546, 225, 1067, 1083)
2025-11-19T07:01:12.462130Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-19T07:01:12.462472Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-19T07:01:12.462705Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找容器，起始节点: 31      
2025-11-19T07:01:12.462819Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点31: class=Some("android.widget.FrameLayout")
2025-11-19T07:01:12.463133Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 32 和 31  
2025-11-19T07:01:12.463321Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 33 和 31  
2025-11-19T07:01:12.463537Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 31 -> 14
2025-11-19T07:01:12.463665Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点14: class=Some("android.view.ViewGroup")
2025-11-19T07:01:12.463851Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 15 和 14  
2025-11-19T07:01:12.463983Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 16 和 14  
2025-11-19T07:01:12.464122Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 17 和 14  
2025-11-19T07:01:12.464259Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 18 和 14  
2025-11-19T07:01:12.464389Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 19 和 14  
2025-11-19T07:01:12.464532Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 14 -> 9
2025-11-19T07:01:12.464665Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点9: class=Some("androidx.viewpager.widget.ViewPager")
2025-11-19T07:01:12.464940Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现容器候选: index=9, priority=30, depth=3, class=Some("androidx.viewpager.widget.ViewPager")
2025-11-19T07:01:12.465198Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 10 和 9   
2025-11-19T07:01:12.467655Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 11 和 9   
2025-11-19T07:01:12.471214Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 12 和 9   
2025-11-19T07:01:12.472713Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 13 和 9   
2025-11-19T07:01:12.472982Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 9 -> 2
2025-11-19T07:01:12.473218Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点2: class=Some("android.widget.LinearLayout")
2025-11-19T07:01:12.473538Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 3 和 2    
2025-11-19T07:01:12.473857Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 4 和 2    
2025-11-19T07:01:12.474105Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 5 和 2    
2025-11-19T07:01:12.474363Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 6 和 2    
2025-11-19T07:01:12.474648Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 7 和 2    
2025-11-19T07:01:12.474840Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 8 和 2    
2025-11-19T07:01:12.475178Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 92 和 2   
2025-11-19T07:01:12.475329Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 2 -> 0
2025-11-19T07:01:12.475477Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点0: class=Some("android.widget.FrameLayout")
2025-11-19T07:01:12.475951Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 1 和 0    
2025-11-19T07:01:12.476446Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到父节点，停止搜索 (深度5)  
2025-11-19T07:01:12.476852Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 选择最优容器 (深度3, priority=30, class=Some("androidx.viewpager.widget.ViewPager"))
2025-11-19T07:01:12.477572Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到容器: index=9, class=Some("androidx.viewpager.widget.ViewPager")
2025-11-19T07:01:12.477858Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找卡片根，起始: 31, 容器: 9
2025-11-19T07:01:12.478243Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查卡片根候选31: class=Some("android.widget.FrameLayout"), desc=Some("笔记  来海边吃吃玩玩 来自知恩 147赞")
2025-11-19T07:01:12.478613Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到卡片根 (深度1)
2025-11-19T07:01:12.480606Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 回收到卡片根: index=31, content_desc=Some("笔记  来海边吃吃玩玩 来自知恩 147赞")
2025-11-19T07:01:12.480895Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过边界差异过小的可点节点: 32 (diff=0)
2025-11-19T07:01:12.481117Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=37, iou=0.12, bounds_diff=767
2025-11-19T07:01:12.481835Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=40, iou=0.01, bounds_diff=1221
2025-11-19T07:01:12.483462Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=41, iou=0.00, bounds_diff=1292
2025-11-19T07:01:12.484240Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到有效可点父（将回退到卡片 根）
2025-11-19T07:01:12.484450Z  WARN employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到可点父，回退到卡片根      
2025-11-19T07:01:12.484637Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 列分析完成: ColumnInfo { column: Right, position_in_column: 0, column_card_count: 3 }
2025-11-19T07:01:12.485018Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalize_click完成
2025-11-19T07:01:12.485406Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始提取四节点索引...
2025-11-19T07:01:12.487911Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.original_clicked.node_index = 31
2025-11-19T07:01:12.489841Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.container.node_index = 9
2025-11-19T07:01:12.491190Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.card_root.node_index = 31
2025-11-19T07:01:12.491418Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.clickable_parent.node_index = 31
2025-11-19T07:01:12.491626Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点索引提取完成
2025-11-19T07:01:12.491798Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 四节点推导完成: clicked=31, container=9, card_root=31, clickable_parent=31
2025-11-19T07:01:12.492379Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] resolve_from_stepcard_snapshot 返回成功
2025-11-19T07:01:12.492554Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备解构四节点: clicked=31, container=9, card_root=31, clickable_parent=31
2025-11-19T07:01:12.492736Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点解构完成
2025-11-19T07:01:12.492920Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 四节点确定: 31 → 9 → 31 → 31
2025-11-19T07:01:12.493075Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 准备获取XML索引器...
2025-11-19T07:01:12.493476Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 快照模式:重建XML索引 (节点数: ~130)
2025-11-19T07:01:12.493818Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-19T07:01:12.507084Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-19T07:01:12.511936Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 4ms
2025-11-19T07:01:12.515396Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 21ms
2025-11-19T07:01:12.515959Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] XML索引重建完成: 107 个节点
2025-11-19T07:01:12.516473Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 创建自动推荐服务...
2025-11-19T07:01:12.517142Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 自动推荐服务创建完成
2025-11-19T07:01:12.517299Z  INFO employee_gui::commands::structure_recommend: 🚀 [推荐] 开始生成推荐结果...
2025-11-19T07:01:12.517533Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: 🚀 [自动推荐] 开始生成推荐，节点索引: 31 → 31 → 31
2025-11-19T07:01:12.551802Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: ✅ [自动推荐] 推荐生成完成，耗时: 34ms, 推荐模式: 叶子上下文
2025-11-19T07:01:12.552012Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐结果生成完成
2025-11-19T07:01:12.561093Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐完成: LeafContext (置信度: 0.439)
2025-11-19T07:01:12.955816Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, progress=95%, step=生成分析报告
2025-11-19T07:01:13.262451Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能分析的增强XPath: element_27
2025-11-19T07:01:13.263248Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, progress=100%, step=分析完成
2025-11-19T07:01:13.264195Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=f7dcde48-58b9-418b-b467-293996b2c3c0, 推荐策略=self_anchor, 置信度=88.1%
2025-11-19T07:01:17.534432Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-19T07:01:17.534808Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-19T07:01:17.535025Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-19T07:01:18.044446Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-19T07:01:18.045602Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-19T07:01:18.046076Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-19T07:01:18.046374Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 收到设备列表: e0d909c3      device
2025-11-19T07:01:18.046586Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (1 个设备)
2025-11-19T07:01:48.060773Z ERROR employee_gui::