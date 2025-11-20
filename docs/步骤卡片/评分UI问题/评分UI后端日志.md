
2025-11-20T10:04:27.051790Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T10:04:27.415293Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T10:04:27.415534Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T10:04:27.416593Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T10:04:27.417298Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T10:04:27.471242Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T10:04:27.472511Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T10:04:56.460732Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T10:04:56.461039Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T10:04:56.461314Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T10:04:56.976265Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T10:04:56.977441Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T10:04:56.978146Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T10:04:56.978531Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
2025-11-20T10:05:26.980509Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T10:05:26.981000Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T10:05:26.981301Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T10:05:27.493804Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T10:05:27.494543Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T10:05:27.494933Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T10:05:27.495154Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
2025-11-20T10:05:57.513775Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T10:05:57.515236Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T10:05:57.515577Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T10:05:58.025701Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T10:05:58.026362Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T10:05:58.026622Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T10:05:58.026747Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
2025-11-20T10:06:00.121870Z  INFO employee_gui::commands::xml_cache: 🔍 XML
缓存目录检查:
2025-11-20T10:06:00.124468Z  INFO employee_gui::commands::xml_cache:   - 当 前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri"     
2025-11-20T10:06:00.125045Z  INFO employee_gui::commands::xml_cache:   - 选 择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml     
2025-11-20T10:06:00.125395Z  INFO employee_gui::commands::xml_cache:   - 路 径是否存在: true
2025-11-20T10:06:00.141921Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 (过滤器: 禁用)
2025-11-20T10:06:00.142149Z  INFO employee_gui::commands::xml_cache: 📄 XML 内容长度: 39117 字符
2025-11-20T10:06:00.147867Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）
2025-11-20T10:06:00.148977Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-20T10:06:00.150968Z  INFO employee_gui::commands::xml_cache: 🎉 XML 解析完成，返回 63 个元素的JSON数据
2025-11-20T10:06:11.992144Z  WARN tao::platform_impl::platform::event_loop::runner: NewEvents emitted without explicit RedrawEventsCleared
2025-11-20T10:06:12.024829Z  WARN tao::platform_impl::platform::event_loop::runner: RedrawEventsCleared emitted without explicit MainEventsCleared      
2025-11-20T10:06:14.467146Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统健康检查
2025-11-20T10:06:14.467774Z DEBUG employee_gui::commands::health_check: ADB 服务初始化成功
2025-11-20T10:06:14.468201Z DEBUG employee_gui::commands::health_check: ADB 连接状态: true
2025-11-20T10:06:14.468468Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-20T10:06:14.468697Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-20T10:06:14.471167Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }        
2025-11-20T10:06:14.887166Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, selection_hash=d75e6bb0aa7b, element_path=element_27
2025-11-20T10:06:14.893928Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650
2025-11-20T10:06:14.895969Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, progress=5%, step=初始化分析环境
2025-11-20T10:06:15.121212Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, progress=25%, step=解析页面结构
2025-11-20T10:06:15.936826Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, progress=65%, step=生成智能策略
2025-11-20T10:06:16.003645Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T10:06:16.004110Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T10:06:16.004687Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T10:06:16.005273Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T10:06:16.115703Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T10:06:16.122919Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T10:06:16.948353Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, progress=85%, step=评估策略质量
2025-11-20T10:06:17.490039Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, progress=95%, step=生成分析报告
2025-11-20T10:06:17.801202Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能分析的增强XPath: element_27
2025-11-20T10:06:17.802148Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, progress=100%, step=分析完成
2025-11-20T10:06:17.802680Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=6ea26579-d4d4-41d3-966f-b69be84fa650, 推荐策略=self_anchor, 置信度=88.1%
2025-11-20T10:06:20.032294Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 开始智能ADB路径检测...
2025-11-20T10:06:20.071555Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查当前目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri\\platform-tools\\adb.exe"
2025-11-20T10:06:20.077878Z  INFO employee_gui::services::adb::basic::adb_detection: 🔍 检查父级目录ADB路径: "D:\\rust\\active-projects\\小红书\\employeeGUI\\platform-tools\\adb.exe"
2025-11-20T10:06:20.080502Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 找到父级目录ADB路径
执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T10:06:20.114219Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能推荐 (支持双输入模式)
2025-11-20T10:06:20.114966Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照模式 (xpath + xml_snapshot)
2025-11-20T10:06:20.115278Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-20T10:06:20.115597Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始从StepCard快照解析四节点, xpath: //element_27
2025-11-20T10:06:20.115961Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
返回码: Some(0)
输出: "Android Debug Bridge version 1.0.41\r\nVersion 36.0.0-13206524\r\nInstalled as D:\\rust\\active-projects\\С����\\employeeGUI\\platform-tools\\adb.exe\r\nRunning on Windows 10.0.22631\r\n"
错误: ""
2025-11-20T10:06:20.173278Z  INFO employee_gui::services::log_bridge: [DIAGNOSTIC] AdbService: 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe ["version"]
2025-11-20T10:06:20.174049Z  INFO employee_gui::services::adb::basic::adb_detection: ✅ 使用项目内ADB路径（最高优先级）: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe
2025-11-20T10:06:20.725693Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-20T10:06:20.729683Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 3ms
2025-11-20T10:06:20.730313Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 614ms
2025-11-20T10:06:20.730952Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-20T10:06:20.731678Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-20T10:06:20.741878Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-20T10:06:20.742076Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32
2025-11-20T10:06:20.742219Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到目标节点, 索引: 32
2025-11-20T10:06:20.742328Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 创建ClickNormalizer...
2025-11-20T10:06:20.742456Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 获取点击节点: clicked_node_idx=32
2025-11-20T10:06:20.742573Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始normalize_click, bounds=(546, 225, 1067, 1083)
2025-11-20T10:06:20.742703Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-20T10:06:20.742878Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-20T10:06:20.743014Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找容器，起始节点: 31      
2025-11-20T10:06:20.743139Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点31: class=Some("android.widget.FrameLayout")
2025-11-20T10:06:20.743287Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 32 和 31  
2025-11-20T10:06:20.743395Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 33 和 31  
2025-11-20T10:06:20.743513Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 31 -> 14
2025-11-20T10:06:20.743627Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点14: class=Some("android.view.ViewGroup")
2025-11-20T10:06:20.743747Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 15 和 14  
2025-11-20T10:06:20.743909Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 16 和 14  
2025-11-20T10:06:20.744017Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 17 和 14  
2025-11-20T10:06:20.744123Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 18 和 14  
2025-11-20T10:06:20.744225Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 19 和 14  
2025-11-20T10:06:20.744331Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 14 -> 9
2025-11-20T10:06:20.744438Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点9: class=Some("androidx.viewpager.widget.ViewPager")
2025-11-20T10:06:20.744664Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现容器候选: index=9, priority=30, depth=3, class=Some("androidx.viewpager.widget.ViewPager")
2025-11-20T10:06:20.745430Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 10 和 9   
2025-11-20T10:06:20.745972Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 11 和 9   
2025-11-20T10:06:20.746270Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 12 和 9   
2025-11-20T10:06:20.746564Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 13 和 9   
2025-11-20T10:06:20.746815Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 9 -> 2
2025-11-20T10:06:20.747091Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点2: class=Some("android.widget.LinearLayout")
2025-11-20T10:06:20.748653Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 3 和 2    
2025-11-20T10:06:20.748941Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 4 和 2    
2025-11-20T10:06:20.749254Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 5 和 2    
2025-11-20T10:06:20.749712Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 6 和 2    
2025-11-20T10:06:20.751097Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 7 和 2    
2025-11-20T10:06:20.751421Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 8 和 2    
2025-11-20T10:06:20.751708Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 92 和 2   
2025-11-20T10:06:20.751977Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 2 -> 0
2025-11-20T10:06:20.752224Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点0: class=Some("android.widget.FrameLayout")
2025-11-20T10:06:20.752626Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 跳过相同bounds的节点: 1 和 0    
2025-11-20T10:06:20.764395Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: ⚠️ [ClickNormalizer] 未找到父节点，停止搜索 (深度5)  
2025-11-20T10:06:20.764978Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 选择最优容器 (深度3, priority=30, class=Some("androidx.viewpager.widget.ViewPager"))
2025-11-20T10:06:20.765138Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到容器: index=9, class=Some("androidx.viewpager.widget.ViewPager")
2025-11-20T10:06:20.765286Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找卡片根，起始: 31, 容器: 9
2025-11-20T10:06:20.765439Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查卡片根候选31: class=Some("android.widget.FrameLayout"), desc="笔记  来海边吃吃玩玩 来自知恩 147赞"      
2025-11-20T10:06:20.765636Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到卡片根 (深度1)
2025-11-20T10:06:20.765812Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 回收到卡片根: index=31, content_desc="笔记  来海边吃吃玩玩 来自知恩 147赞"
2025-11-20T10:06:20.766056Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 保留同边界可点节点: 32 (diff=0, iou=1.00) - 覆盖全卡片 (保留结构层级)
2025-11-20T10:06:20.767861Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=32, iou=1.00, bounds_diff=0
2025-11-20T10:06:20.768357Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=37, iou=0.12, bounds_diff=767
2025-11-20T10:06:20.768554Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=40, iou=0.01, bounds_diff=1221
2025-11-20T10:06:20.768698Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 📋 [ClickNormalizer] 发现可点父候选: index=41, iou=0.00, bounds_diff=1292
2025-11-20T10:06:20.768882Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到可点父: index=32, iou=1.00, class=Some("android.widget.FrameLayout")
2025-11-20T10:06:20.769108Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 列分析完成: ColumnInfo { column: Right, position_in_column: 0, column_card_count: 3 }
2025-11-20T10:06:20.769456Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalize_click完成
2025-11-20T10:06:20.769842Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始提取四节点索引...
2025-11-20T10:06:20.770129Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.original_clicked.node_index = 31
2025-11-20T10:06:20.770697Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.container.node_index = 9
2025-11-20T10:06:20.771963Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.card_root.node_index = 31
2025-11-20T10:06:20.772397Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] normalized.clickable_parent.node_index = 32
2025-11-20T10:06:20.772601Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点索引提取完成
2025-11-20T10:06:20.772744Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 四节点推导完成: clicked=31, container=9, card_root=31, clickable_parent=32
2025-11-20T10:06:20.773703Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] resolve_from_stepcard_snapshot 返回成功
2025-11-20T10:06:20.774015Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备解构四节点: clicked=31, container=9, card_root=31, clickable_parent=32
2025-11-20T10:06:20.774261Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 四节点解构完成
2025-11-20T10:06:20.774399Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 四节点确定: 31 → 9 → 31 → 32
2025-11-20T10:06:20.774536Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 准备获取XML索引器...
2025-11-20T10:06:20.774778Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 快照模式:重建XML索引 (节点数: ~130)
2025-11-20T10:06:20.774961Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...
2025-11-20T10:06:21.293560Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子关系树...
2025-11-20T10:06:21.296320Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构建完成，耗时 2ms
2025-11-20T10:06:21.296468Z  INFO employee_gui::engine::xml_indexer: ✅ XML 索引构建完成: 107 个节点，耗时 521ms
2025-11-20T10:06:21.296616Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] XML索引重建完成: 107 个节点
2025-11-20T10:06:21.296778Z  INFO employee_gui::commands::structure_recommend: 🔧 [推荐] 创建自动推荐服务...
2025-11-20T10:06:21.296936Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 自动推荐服务创建完成
2025-11-20T10:06:21.297047Z  INFO employee_gui::commands::structure_recommend: 🚀 [推荐] 开始生成推荐结果...
2025-11-20T10:06:21.297167Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: 🚀 [自动推荐] 开始生成推荐，节点索引: 31 → 31 → 32
2025-11-20T10:06:21.307126Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 查找node[32]的父节点, bounds=(546,225,1067,1083)
2025-11-20T10:06:21.307352Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 检查了106个节点,找到23 个包含候选
2025-11-20T10:06:21.307558Z  INFO employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: ✅ [find_parent] node[32]的父节点是node[31]
2025-11-20T10:06:21.316954Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 查找node[32]的父节点, bounds=(546,225,1067,1083)
2025-11-20T10:06:21.317182Z DEBUG employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: 🔍 [find_parent] 检查了106个节点,找到23 个包含候选
2025-11-20T10:06:21.317428Z  INFO employee_gui::domain::structure_runtime_match::adapters::xml_indexer_adapter: ✅ [find_parent] node[32]的父节点是node[31]
2025-11-20T10:06:21.330362Z  INFO employee_gui::domain::structure_runtime_match::auto_recommendation_service: ✅ [自动推荐] 推荐生成完成，耗时: 33ms, 推荐模式: 叶子上下文
2025-11-20T10:06:21.330543Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐结果生成完成
2025-11-20T10:06:21.330701Z  INFO employee_gui::commands::structure_recommend: ✅ [推荐] 推荐完成: LeafContext (置信度: 0.439)
2025-11-20T10:06:28.029361Z ERROR employee_gui::services::adb::tracking::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后 没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-20T10:06:28.029888Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 🧹 TcpStream已关闭
2025-11-20T10:06:28.030256Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-20T10:06:28.542599Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-20T10:06:28.543285Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-20T10:06:28.543667Z  INFO employee_gui::services::adb::tracking::adb_device_tracker: ✅ ADB server连接成功，开始监听设备变化
2025-11-20T10:06:28.543900Z DEBUG employee_gui::services::adb::tracking::adb_device_tracker: 📱 设备状态无变化 (0 个设备)