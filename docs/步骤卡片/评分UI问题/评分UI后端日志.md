       
2025-11-19T02:22:11.366486Z  INFO employee_gui::services::adb_device_tracker: 🎯 ADB设备跟踪器已设置应用句柄
2025-11-19T02:22:11.368499Z  INFO employee_gui::services::adb_device_tracker: 🎯 启动ADB设备实时跟踪 (host:track-devices协议)
2025-11-19T02:22:11.378613Z  INFO employee_gui::services::adb_device_tracker: ✅ 网络栈初始化检查 完成
2025-11-19T02:22:11.379040Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-19T02:22:11.378983Z  INFO employee_gui::services::adb_device_tracker: 🎯 ADB设备跟踪器已设置应用句柄
2025-11-19T02:22:11.380125Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-19T02:22:11.382076Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成 功，开始监听设备变化
2025-11-19T02:22:11.382511Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状态无变化 (0 个设备)
执行ADB命令: adb.exe ["version"]
执行ADB命令: adb.exe ["version"]
执行ADB命令: adb.exe ["version"]
执行ADB命令: adb.exe ["version"]
2025-11-19T02:22:14.496075Z DEBUG employee_gui::commands::files: 🖼️ 读取图片文件: \\?\D:\rust\act 
ive-projects\小红书\employeeGUI\debug_xml\ui_dump_e0d909c3_20251030_122312.png
2025-11-19T02:22:14.496265Z DEBUG employee_gui::commands::files: 🖼️ 读取图片文件: \\?\D:\rust\act 
ive-projects\小红书\employeeGUI\debug_xml\ui_dump_e0d909c3_20251030_115111.png
2025-11-19T02:22:14.504389Z DEBUG employee_gui::commands::files: ✅ 生成 data URL: ui_dump_e0d909c3_20251030_115111.png -> image/png (615KB)       
2025-11-19T02:22:14.511661Z DEBUG employee_gui::commands::files: ✅ 生成 data URL: ui_dump_e0d909c3_20251030_122312.png -> image/png (1394KB)      
2025-11-19T02:22:16.773553Z  INFO employee_gui::commands::xml_cache: 🔍 XML缓存目录检查:
2025-11-19T02:22:16.773789Z  INFO employee_gui::commands::xml_cache:   - 当前工作目录: "D:\\rust\\active-projects\\小红书\\employeeGUI\\src-tauri" 
2025-11-19T02:22:16.774326Z  INFO employee_gui::commands::xml_cache:   - 选择的debug_xml路径: D:\rust\active-projects\小红书\employeeGUI\debug_xml 
2025-11-19T02:22:16.774565Z  INFO employee_gui::commands::xml_cache:   - 路径是否存在: true       
2025-11-19T02:22:16.790365Z  INFO employee_gui::commands::xml_cache: 🎯 开始解析XML内容到UI元素 ( 过滤器: 禁用)
2025-11-19T02:22:16.791014Z  INFO employee_gui::commands::xml_cache: 📄 XML内容长度: 39117 字符   
2025-11-19T02:22:16.796890Z  INFO employee_gui::services::universal_ui_page_analyzer: ✅ XML解析完成，提取到 63 个全部UI元素（含index_path）       
2025-11-19T02:22:16.797142Z  INFO employee_gui::commands::xml_cache: ✅ 成功提取 63 个UI元素 (过滤: 否)
2025-11-19T02:22:16.798656Z  INFO employee_gui::commands::xml_cache: 🎉 XML解析完成，返回 63 个元 素的JSON数据
2025-11-19T02:22:26.721958Z  INFO employee_gui::commands::health_check: 🔍 [HealthCheck] 开始系统 健康检查
2025-11-19T02:22:26.722339Z DEBUG employee_gui::commands::health_check: ADB服务初始化成功
2025-11-19T02:22:26.722448Z DEBUG employee_gui::commands::health_check: ADB连接状态: true
2025-11-19T02:22:26.722588Z DEBUG employee_gui::commands::health_check: 设备可用性检查 - 暂时返回true
2025-11-19T02:22:26.722773Z DEBUG employee_gui::commands::health_check: 设备可用性: true
2025-11-19T02:22:26.722875Z  INFO employee_gui::commands::health_check: ✅ [HealthCheck] 健康检查 完成: SystemHealthCheck { adb_connected: true, device_available: true, xml_cache_ready: true, analysis_engine_ready: true }
2025-11-19T02:22:27.512687Z  INFO employee_gui::commands::intelligent_analysis: 🚀 启动智能分析: job_id=922ab084-7541-452f-836e-eacd46289447, selection_hash=6e57b50d12fa, element_path=element_27  
2025-11-19T02:22:27.513307Z  INFO employee_gui::commands::intelligent_analysis: 📊 开始分析工作流: job_id=922ab084-7541-452f-836e-eacd46289447     
2025-11-19T02:22:27.516279Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=922ab084-7541-452f-836e-eacd46289447, progress=5%, step=初始化分析环境
2025-11-19T02:22:27.725282Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=922ab084-7541-452f-836e-eacd46289447, progress=25%, step=解析页面结构
2025-11-19T02:22:28.545884Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=922ab084-7541-452f-836e-eacd46289447, progress=65%, step=生成智能策略
执行ADB命令: adb.exe ["version"]
2025-11-19T02:22:29.558389Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=922ab084-7541-452f-836e-eacd46289447, progress=85%, step=评估策略质量
2025-11-19T02:22:30.070142Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=922ab084-7541-452f-836e-eacd46289447, progress=95%, step=生成分析报告
2025-11-19T02:22:30.381701Z  INFO employee_gui::engine::strategy_engine: ✅ [自锚定策略] 使用智能 分析的增强XPath: element_27
2025-11-19T02:22:30.382439Z DEBUG employee_gui::commands::intelligent_analysis: 📊 进度更新: job_id=922ab084-7541-452f-836e-eacd46289447, progress=100%, step=分析完成
2025-11-19T02:22:30.382644Z  INFO employee_gui::commands::intelligent_analysis: ✅ 分析完成: job_id=922ab084-7541-452f-836e-eacd46289447, 推荐策略=self_anchor, 置信度=88.1%
执行ADB命令: adb.exe ["version"]
2025-11-19T02:22:32.682346Z  INFO employee_gui::commands::structure_recommend: 🎯 [推荐] 开始智能 推荐 (支持双输入模式)
2025-11-19T02:22:32.686773Z  INFO employee_gui::commands::structure_recommend: 📸 [推荐] 使用快照 模式 (xpath + xml_snapshot)
2025-11-19T02:22:32.687075Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 准备调用 resolve_from_stepcard_snapshot...
2025-11-19T02:22:32.688898Z  INFO employee_gui::commands::structure_recommend: 🔍 [快照解析] 开始 从StepCard快照解析四节点, xpath: //element_27    
2025-11-19T02:22:32.689207Z  INFO employee_gui::engine::xml_indexer: 🔧 开始构建XML索引...        
2025-11-19T02:22:32.724426Z DEBUG employee_gui::engine::xml_indexer: 🌲 [XmlIndexer] 开始构建父子 关系树...
2025-11-19T02:22:32.727352Z  INFO employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 父子关系树构 建完成，耗时 2ms
2025-11-19T02:22:32.727664Z  INFO employee_gui::engine::xml_indexer: ✅ XML索引构建完成: 107 个节 点，耗时 38ms
2025-11-19T02:22:32.727773Z DEBUG employee_gui::commands::structure_recommend: ✅ [快照解析] XML索引构建成功, 共 107 个节点
2025-11-19T02:22:32.727862Z DEBUG employee_gui::commands::structure_recommend: 🎯 [快照解析] 使用 index_path 定位: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
2025-11-19T02:22:32.733092Z DEBUG employee_gui::engine::index_path_locator: ✅ [IndexPathLocator] 找到节点: index_path=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> linear_index=32
2025-11-19T02:22:32.733933Z DEBUG employee_gui::engine::xml_indexer: ✅ [XmlIndexer] 通过 index_path 找到节点: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0] -> index 32       
2025-11-19T02:22:32.734118Z  INFO employee_gui::commands::structure_recommend: ✅ [快照解析] 找到 目标节点, 索引: 32
2025-11-19T02:22:32.734203Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 创建ClickNormalizer...
2025-11-19T02:22:32.734725Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 获取点击节点: clicked_node_idx=32
2025-11-19T02:22:32.734842Z  INFO employee_gui::commands::structure_recommend: 🔧 [DEBUG] 开始normalize_click, bounds=(546, 225, 1067, 1083)       
2025-11-19T02:22:32.734952Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: 🔄 [ClickNormalizer] 开始点击规范化: bounds=(546, 225, 1067, 1083)
2025-11-19T02:22:32.735064Z  INFO employee_gui::domain::structure_runtime_match::click_normalizer: ✅ [ClickNormalizer] 找到点击节点: index=31, class=Some("android.widget.FrameLayout")
2025-11-19T02:22:32.735155Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 开始查找容器，起始节点: 31 
2025-11-19T02:22:32.736814Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点31: class=Some("android.widget.FrameLayout")
2025-11-19T02:22:32.737438Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 31 -> 32     
2025-11-19T02:22:32.737865Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 检查节点32: class=Some("android.widget.FrameLayout")
2025-11-19T02:22:32.738026Z DEBUG employee_gui::domain::structure_runtime_match::click_normalizer: 🔍 [ClickNormalizer] 向上到父节点: 32 -> 31     
2025-11-19T02:22:32.738182Z ERROR employee_gui::domain::structure_runtime_match::click_normalizer: ❌ [ClickNormalizer] 检测到循环引用: 节点31 已访问过
2025-11-19T02:22:32.738378Z ERROR employee_gui::commands::structure_recommend: ❌ [快照解析] 四节 点推导失败: 检测到循环引用，节点索引: 31
2025-11-19T02:22:41.386776Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答 复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-11-19T02:22:41.387501Z DEBUG employee_gui::services::adb_device_tracker: 🧹 TcpStream已关闭  
2025-11-19T02:22:41.387872Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-11-19T02:22:41.892847Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-11-19T02:22:41.896263Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-11-19T02:22:41.897297Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成 功，开始监听设备变化
2025-11-19T02:22:41.897742Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状态无变化 (0 个设备)