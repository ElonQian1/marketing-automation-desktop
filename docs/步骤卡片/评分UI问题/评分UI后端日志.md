
2025-11-19T02:59:58.005629Z  INFO employee_gui::commands::xml_cache:   - 当前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri" 
2025-11-19T02:59:58.005753Z  INFO employee_gui::commands::xml_cache:   - 选择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml 
2025-11-19T02:59:58.005950Z  INFO employee_gui::commands::xml_cache:   - 路径是否存在: true       
2025-11-19T02:59:58.024391Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 ( 过滤器: 禁用)
2025-11-19T02:59:58.039738Z  INFO employee_gui::commands::xml_cache: 📄 XML内容长度: 39117 字符   
2025-11-19T02:59:58.044982Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）       
2025-11-19T02:59:58.045315Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-19T02:59:58.053829Z  INFO employee_gui::commands::xml_cache: 🎉 XML解析完成，返回 63 个元 素的JSON数据
2025-11-19T02:59:59.141158Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答 复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-19T02:59:59.141542Z DEBUG employee_gui::services::adb_device_tracker: 🧹 TcpStream已关闭  
2025-11-19T02:59:59.141796Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-19T02:59:59.652230Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-19T02:59:59.653136Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-19T02:59:59.653794Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成 功，开始监听设备变化
2025-11-19T02:59:59.654029Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
2025-11-19T03:00:03.027141Z  WARN tao::platform_impl::platform::event_loop::runner: NewEvents emitted without explicit RedrawEventsCleared
2025-11-19T03:00:03.060420Z  WARN tao::platform_impl::platform::event_loop::runner: RedrawEventsCleared emitted without explicit MainEventsCleared 
2025-11-19T03:00:05.499505Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统 健康检查
2025-11-19T03:00:05.499970Z DEBUG employee_gui::commands::health_check: ADB服务初始化成功
2025-11-19T03:00:05.500329Z DEBUG employee_gui::commands::health_check: ADB连接状态: true
2025-11-19T03:00:05.500454Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-19T03:00:05.500578Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-19T03:00:05.500680Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查 完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }
2025-11-19T03:00:05.849908Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, selection_hash=6e57b50d12fa, element_path=element_27  
2025-11-19T03:00:05.850325Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=ff23829c-5b1e-49c3-b056-1913692819d1     
2025-11-19T03:00:05.851668Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, progress=5%, step=初始化分析环境
2025-11-19T03:00:06.060826Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, progress=25%, step=解析页面结构
执行ADB命令: adb.exe ["version"]
2025-11-19T03:00:06.873795Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, progress=65%, step=生成智能策略
执行ADB命令: adb.exe ["version"]
2025-11-19T03:00:07.882626Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, progress=85%, step=评估策略质量
2025-11-19T03:00:08.386309Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, progress=95%, step=生成分析报告
2025-11-19T03:00:08.693689Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能 分析的增强XPath: element_27
2025-11-19T03:00:08.694565Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, progress=100%, step=分析完成
2025-11-19T03:00:08.695035Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=ff23829c-5b1e-49c3-b056-1913692819d1, 推荐策略=self_anchor, 置信度=88.1%
2025-11-19T03:00:09.792297Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能 推荐 (支持双输入模式)
2025-11-19T03:00:09.792529Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照 模式 (xpath + xml_snapshot)
2025-11-19T03:00:09.792630Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-19T03:00:09.792742Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始 从StepCard快照解析四节点, xpath: //element_27    
2025-11-19T03:00:09.793231Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...        
2025-11-19T03:00:09.803323Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子 关系树...
2025-11-19T03:00:09.806067Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构 建完成，耗时 2ms
2025-11-19T03:00:09.806233Z  INFO employee_gui::engine::xml_indexer: ✅ XML索引构建完成: 107 个节 点，耗时 12ms
2025-11-19T03:00:09.806330Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-19T03:00:09.806431Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-19T03:00:09.810994Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-19T03:00:09.811215Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32       
2025-11-19T03:00:09.811332Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到 目标节点, 索引: 32
2025-11-19T03:00:09.811426Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 创建ClickNormalizer...
2025-11-19T03:00:09.811515Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 获取点击节点: clicked_node_idx=32
2025-11-19T03:00:09.811608Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始normalize_click, bounds=(546, 225, 1067, 1083)       
2025-11-19T03:00:09.811700Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-19T03:00:09.811807Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-19T03:00:09.811911Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找容器，起始节点: 31 
2025-11-19T03:00:09.812010Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点31: class=Some("android.widget.FrameLayout")
2025-11-19T03:00:09.812118Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 32 和 31
2025-11-19T03:00:09.812215Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 33 和 31
2025-11-19T03:00:09.812315Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 31 -> 14     
2025-11-19T03:00:09.812420Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点14: class=Some("android.view.ViewGroup")
2025-11-19T03:00:09.813149Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 15 和 14
2025-11-19T03:00:09.813281Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 16 和 14
2025-11-19T03:00:09.814639Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 17 和 14
2025-11-19T03:00:09.814760Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 18 和 14
2025-11-19T03:00:09.814863Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 19 和 14
2025-11-19T03:00:09.814968Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 14 -> 9      
2025-11-19T03:00:09.815279Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点9: class=Some("androidx.viewpager.widget.ViewPager")
2025-11-19T03:00:09.816049Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到容器 (深度3)
2025-11-19T03:00:09.816331Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到容器: index=9, class=Some("androidx.viewpager.widget.ViewPager")        
2025-11-19T03:00:09.816582Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找卡片根，起始: 31,  容器: 9
2025-11-19T03:00:09.816752Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查卡片根候选31: class=Some("android.widget.FrameLayout"), desc=Some("笔记  来海边吃吃玩玩 来自知恩 147赞")
2025-11-19T03:00:09.817027Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到卡片根 (深度1)
2025-11-19T03:00:09.817128Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 回收到卡片根: index=31, content_desc=Some("笔记  来海边吃吃玩玩 来自知恩 147赞")
2025-11-19T03:00:09.821396Z  WARN employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到可点父，回退到卡片根 
2025-11-19T03:00:09.821541Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 列分析完成: ColumnInfo { column: Right, position_in_column: 0, column_card_count: 3 }
2025-11-19T03:00:09.821709Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalize_click完成
2025-11-19T03:00:09.821824Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始提取四节点索引...
2025-11-19T03:00:09.822057Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.original_clicked.node_index = 31
2025-11-19T03:00:09.822153Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.container.node_index = 9
2025-11-19T03:00:09.822243Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.card_root.node_index = 31
2025-11-19T03:00:09.822333Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.clickable_parent.node_index = 31
2025-11-19T03:00:09.822423Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点索引提取完成
2025-11-19T03:00:09.822511Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 四节 点推导完成: clicked=31, container=9, card_root=31, clickable_parent=31
2025-11-19T03:00:09.823434Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] resolve_from_stepcard_snapshot 返回成功
2025-11-19T03:00:09.823658Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备解构四节点: clicked=31, container=9, card_root=31, clickable_parent=31
2025-11-19T03:00:09.823787Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点解构完成
2025-11-19T03:00:09.824104Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 四节点确 定: 31 → 9 → 31 → 31
2025-11-19T03:00:09.824251Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 准备获取XML索引器...
2025-11-19T03:00:09.824416Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 快照模式:重建XML索引 (节点数: ~130)
2025-11-19T03:00:09.824553Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...        
2025-11-19T03:00:09.835275Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子 关系树...
2025-11-19T03:00:09.838417Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构 建完成，耗时 3ms
2025-11-19T03:00:09.838749Z  INFO employee_gui::engine::xml_indexer: ✅ XML索引构建完成: 107 个节 点，耗时 14ms
2025-11-19T03:00:09.839106Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] XML索引重建完成: 107 个节点
2025-11-19T03:00:09.839207Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 创建自动 推荐服务...
2025-11-19T03:00:09.839356Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 自动推荐 服务创建完成
2025-11-19T03:00:09.839449Z  INFO employee_gui::commands::structure_recommend: 🚀 [推荐] 开始生成 推荐结果...
2025-11-19T03:00:09.839688Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: 🚀 [自动推荐] 开始生成推荐，节点索引: 31 → 31 → 31
2025-11-19T03:00:09.869764Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: ✅ [自动推荐] 推荐生成完成，耗时: 30ms, 推荐模式: 叶子上下文
2025-11-19T03:00:09.870040Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐结果 生成完成
2025-11-19T03:00:09.870308Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐完成: LeafContext (置信度: 0.219)
2025-11-19T03:00:29.659483Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答 复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-19T03:00:29.660921Z DEBUG employee_gui::services::adb_device_tracker: 🧹 TcpStream已关闭  
2025-11-19T03:00:29.661135Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-19T03:00:30.168085Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-19T03:00:30.176477Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-19T03:00:30.178072Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成 功，开始监听设备变化
2025-11-19T03:00:30.186819Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
