
2025-11-19T02:05:15.159603Z  INFO employee_gui::commands::xml_cache:   - 当前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri" 
2025-11-19T02:05:15.159766Z  INFO employee_gui::commands::xml_cache:   - 选择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml 
2025-11-19T02:05:15.160004Z  INFO employee_gui::commands::xml_cache:   - 路径是否存在: true       
2025-11-19T02:05:15.184738Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 ( 过滤器: 禁用)
2025-11-19T02:05:15.190135Z  INFO employee_gui::commands::xml_cache: 📄 XML内容长度: 39117 字符   
2025-11-19T02:05:15.202039Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）       
2025-11-19T02:05:15.249809Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-19T02:05:15.252032Z  INFO employee_gui::commands::xml_cache: 🎉 XML解析完成，返回 63 个元 素的JSON数据
2025-11-19T02:05:20.898981Z  WARN tao::platform_impl::platform::event_loop::runner: NewEvents emitted without explicit RedrawEventsCleared
2025-11-19T02:05:20.907360Z  WARN tao::platform_impl::platform::event_loop::runner: RedrawEventsCleared emitted without explicit MainEventsCleared 
2025-11-19T02:05:24.093246Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统 健康检查
2025-11-19T02:05:24.093423Z DEBUG employee_gui::commands::health_check: ADB服务初始化成功
2025-11-19T02:05:24.093528Z DEBUG employee_gui::commands::health_check: ADB连接状态: true
2025-11-19T02:05:24.093626Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-19T02:05:24.093737Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-19T02:05:24.093839Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查 完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }
2025-11-19T02:05:24.986588Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, selection_hash=6e57b50d12fa, element_path=element_27  
2025-11-19T02:05:24.987918Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=9b217216-519a-4a3c-8b51-192249dc82ec     
2025-11-19T02:05:24.991591Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, progress=5%, step=初始化分析环境
2025-11-19T02:05:25.203039Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, progress=25%, step=解析页面结构
2025-11-19T02:05:26.015968Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, progress=65%, step=生成智能策略
2025-11-19T02:05:27.021803Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, progress=85%, step=评估策略质量
执行ADB命令: adb.exe ["version"]
2025-11-19T02:05:27.535336Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, progress=95%, step=生成分析报告
2025-11-19T02:05:27.846704Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能 分析的增强XPath: element_27
2025-11-19T02:05:27.848627Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, progress=100%, step=分析完成
2025-11-19T02:05:27.848826Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=9b217216-519a-4a3c-8b51-192249dc82ec, 推荐策略=self_anchor, 置信度=88.1%
2025-11-19T02:05:27.865138Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答 复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-19T02:05:27.866777Z DEBUG employee_gui::services::adb_device_tracker: 🧹 TcpStream已关闭  
2025-11-19T02:05:27.870295Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-19T02:05:28.385893Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-19T02:05:28.386867Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-19T02:05:28.387397Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成 功，开始监听设备变化
2025-11-19T02:05:28.387617Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
执行ADB命令: adb.exe ["version"]
2025-11-19T02:05:31.215843Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能 推荐 (支持双输入模式)
2025-11-19T02:05:31.216289Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照 模式 (xpath + xml_snapshot)
2025-11-19T02:05:31.216517Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-19T02:05:31.217010Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始 从StepCard快照解析四节点, xpath: //element_27    
2025-11-19T02:05:31.217191Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...        
2025-11-19T02:05:31.237988Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子 关系树...
2025-11-19T02:05:31.242420Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构 建完成，耗时 4ms
2025-11-19T02:05:31.242682Z  INFO employee_gui::engine::xml_indexer: ✅ XML索引构建完成: 107 个节 点，耗时 25ms
2025-11-19T02:05:31.242899Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-19T02:05:31.243084Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-19T02:05:31.257272Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-19T02:05:31.259198Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32       
2025-11-19T02:05:31.259475Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到 目标节点, 索引: 32
2025-11-19T02:05:31.259693Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-19T02:05:31.259926Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-19T02:05:58.395688Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答 复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-19T02:05:58.396063Z DEBUG employee_gui::services::adb_device_tracker: 🧹 TcpStream已关闭  
2025-11-19T02:05:58.396200Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连