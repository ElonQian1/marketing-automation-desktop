
2025-10-29T16:29:25.632642Z  WARN employee_gui::exec::v3::commands: 🔍 [DEBUG] 收到的原始spec JSON: {
  "chainId": "step_execution_1761755353070_hdv98z1v1",
  "constraints": {},
  "mode": "execute",
  "orderedSteps": [
    {
      "inline": {
        "action": "smart_selection",
        "params": {
          "element_path": "//element_261",        
          "original_data": {
            "children_texts": [
              "我"
            ],
            "confidence": 0.8,
            "data_integrity": {
              "extraction_timestamp": 1761755365615,
              "has_children_texts": true,
              "has_original_xml": true,
              "has_strategy_info": true,
              "has_user_xpath": true
            },
            "element_bounds": "[864,2230][1080,2358]",
            "element_text": "99",
            "key_attributes": {
              "class": "",
              "content-desc": "",
              "resource-id": "",
              "text": "99"
            },
            "original_xml": "<XML:101094 bytes>", 
            "selected_xpath": "//element_261",    
            "strategy_type": "intelligent",       
            "xml_hash": "sha256:PD94bWwgdmVyc2lv" 
          },
          "smartSelection": {
            "antonymCheckEnabled": false,
            "batchConfig": {
              "continueOnError": true,
              "intervalMs": 2000,
              "maxCount": 10,
              "showProgress": true
            },
            "minConfidence": 0.8,
            "mode": "all",
            "semanticAnalysisEnabled": false,     
            "targetText": "99",
            "textMatchingMode": "exact"
          },
          "targetText": "99",
          "target_content_desc": ""
        },
        "stepId": "step_1761755353070_hdv98z1v1"  
      },
      "ref": null
    }
  ],
  "quality": {},
  "threshold": 0.5,
  "validation": {}
}
2025-10-29T16:29:25.635565Z  INFO employee_gui::exec::v3::commands: ✅ [DEBUG] ChainSpecV3反序列化成功
2025-10-29T16:29:25.635938Z  INFO employee_gui::exec::v3::commands: 🔗 [V3] 收到智能自动链测试请求: analysisId=Some("step_execution_1761755353070_hdv98z1v1"), 步骤数=1, 阈值=0.5
2025-10-29T16:29:25.636306Z  INFO employee_gui::exec::v3::chain_engine: 🔗 [by-inline] 直接执行内联 链: chainId=Some("step_execution_1761755353070_hdv98z1v1"), 步骤数=1
2025-10-29T16:29:25.637331Z  INFO employee_gui::exec::v3::helpers::execution_tracker: 🔒 【执行保护 】已锁定 analysis_id 'step_execution_1761755353070_hdv98z1v1'
2025-10-29T16:29:25.637669Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🧠 触发智能分析原因：检测到SmartSelection动作
2025-10-29T16:29:25.637955Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing: 🧠 触 发智能策略分析：原候选数=1, threshold=0.50        
2025-10-29T16:29:25.638666Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing: ✅ [XML来源] 使用步骤保存的 original_xml (101094 字符)  
2025-10-29T16:29:25.639077Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing: 🔍 [数据传递] 提取原始步骤参数传递给智能分析: 包含original_data
2025-10-29T16:29:25.639563Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🧠 开始智能策略分析 (Step 0-6) - 从原始数据直接处理
2025-10-29T16:29:25.639916Z  INFO employee_gui::exec::v3::helpers::analysis_helpers:    📋 原始参数: {"element_path":"//element_261","original_data":{"children_texts":["我"],"confidence":0.8,"data_integrity":{"extraction_timestamp":1761755365615,"has_children_texts":true,"has_original_xml":true,"has_strategy_info":true,"has_user_xpath":true},"element_bounds":"[864,2230][1080,2358]","element_text":"99","key_attributes":{"class":"","content-desc":"","resource-id":"","text":"99"},"original_xml":"<XML:101094 bytes>","selected_xpath":"//element_261","strategy_type":"intelligent","xml_hash":"sha256:PD94bWwgdmVyc2lv"},"smartSelection":{"antonymCheckEnabled":false,"batchConfig":{"continueOnError":true,"intervalMs":2000,"maxCount":10,"showProgress":true},"minConfidence":0.8,"mode":"all","semanticAnalysisEnabled":false,"targetText":"99","textMatchingMode":"exact"},"targetText":"99","target_content_desc":""}
2025-10-29T16:29:25.640307Z  INFO employee_gui::exec::v3::helpers::analysis_helpers:    📱 XML长度: 101094 字符
2025-10-29T16:29:25.640810Z  INFO employee_gui::exec::v3::helpers::device_manager: 📱 [设备管理] 获 取设备 e0d909c3 的基础信息
2025-10-29T16:29:25.641486Z  INFO employee_gui::exec::v3::helpers::device_manager: ✅ [设备管理] 设 备信息获取完成: Some((1080, 2340))xSome("portrait"), orientation=Some("com.unknown.app")
2025-10-29T16:29:25.642059Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 0: 设备状态获取完成
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 101094 字符扩展到 101506 字符  
🔍 解析到 276 个UI元素（含子文本继承）
2025-10-29T16:29:25.668018Z  INFO employee_gui::exec::v3::helpers::intelligent_analysis: 🔍 提取了 276 个潜在交互元素（包括非clickable）
2025-10-29T16:29:25.669416Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 1: 从XML解析出 276 个潜在可交互元素
2025-10-29T16:29:25.669774Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 2: 用户意图分析完成 - UserIntent { action_type: "click", target_text: "99", target_hints: ["99", "99"], context: "用户目标: 99, 99", confidence: 0.8 }       
2025-10-29T16:29:25.671439Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 3: 完成 276 个元素的智能评分
2025-10-29T16:29:25.672314Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.673830Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.674314Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.675681Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.680374Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.680813Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.681246Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.683914Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.684534Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.685698Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:25.686678Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 4: 生成 10 个策略候选
2025-10-29T16:29:25.690640Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 5: 选出 3 个最优策略
2025-10-29T16:29:25.693402Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔧 智能步骤 参数: step_id=intelligent_step_1, params={        
  "action": "SmartSelection",
  "bounds": "[800,2251][846,2298]",
  "className": "android.widget.TextView",
  "confidence": 0.7030000000000001,
  "contentDesc": "",
  "originalParams": {
    "element_path": "//element_261",
    "original_data": {
      "children_texts": [
        "我"
      ],
      "confidence": 0.8,
      "data_integrity": {
        "extraction_timestamp": 1761755365615,    
        "has_children_texts": true,
        "has_original_xml": true,
        "has_strategy_info": true,
        "has_user_xpath": true
      },
      "element_bounds": "[864,2230][1080,2358]",  
      "element_text": "99",
      "key_attributes": {
        "class": "",
        "content-desc": "",
        "resource-id": "",
        "text": "99"
      },
      "original_xml": "<XML:101094 bytes>",       
      "selected_xpath": "//element_261",
      "strategy_type": "intelligent",
      "xml_hash": "sha256:PD94bWwgdmVyc2lv"       
    },
    "smartSelection": {
      "antonymCheckEnabled": false,
      "batchConfig": {
        "continueOnError": true,
        "intervalMs": 2000,
        "maxCount": 10,
        "showProgress": true
      },
      "minConfidence": 0.8,
      "mode": "all",
      "semanticAnalysisEnabled": false,
      "targetText": "99",
      "textMatchingMode": "exact"
    },
    "targetText": "99",
    "target_content_desc": ""
  },
  "resourceId": "com.ss.android.ugc.aweme:id/0bl",
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "strategy_type": "text_based_click",
  "targetText": "99",
  "xpath": "//node[@index='260']"
}
2025-10-29T16:29:25.698838Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔧 智能步骤 参数: step_id=intelligent_step_2, params={        
  "action": "SmartSelection",
  "bounds": "[800,2230][846,2298]",
  "className": "android.widget.LinearLayout",     
  "confidence": 0.6030000000000001,
  "contentDesc": "",
  "originalParams": {
    "element_path": "//element_261",
    "original_data": {
      "children_texts": [
        "我"
      ],
      "confidence": 0.8,
      "data_integrity": {
        "extraction_timestamp": 1761755365615,    
        "has_children_texts": true,
        "has_original_xml": true,
        "has_strategy_info": true,
        "has_user_xpath": true
      },
      "element_bounds": "[864,2230][1080,2358]",  
      "element_text": "99",
      "key_attributes": {
        "class": "",
        "content-desc": "",
        "resource-id": "",
        "text": "99"
      },
      "original_xml": "<XML:101094 bytes>",       
      "selected_xpath": "//element_261",
      "strategy_type": "intelligent",
      "xml_hash": "sha256:PD94bWwgdmVyc2lv"       
    },
    "smartSelection": {
      "antonymCheckEnabled": false,
      "batchConfig": {
        "continueOnError": true,
        "intervalMs": 2000,
        "maxCount": 10,
        "showProgress": true
      },
      "minConfidence": 0.8,
      "mode": "all",
      "semanticAnalysisEnabled": false,
      "targetText": "99",
      "textMatchingMode": "exact"
    },
    "targetText": "99",
    "target_content_desc": ""
  },
  "resourceId": "com.ss.android.ugc.aweme:id/065",
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "strategy_type": "text_based_click",
  "targetText": "99",
  "xpath": "//node[@index='259']"
}
2025-10-29T16:29:25.703216Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔧 智能步骤 参数: step_id=intelligent_step_3, params={        
  "action": "SmartSelection",
  "bounds": "[823,1007][1078,1238]",
  "className": "android.widget.FrameLayout",      
  "confidence": 0.5525,
  "contentDesc": "",
  "originalParams": {
    "element_path": "//element_261",
    "original_data": {
      "children_texts": [
        "我"
      ],
      "confidence": 0.8,
      "data_integrity": {
        "extraction_timestamp": 1761755365615,    
        "has_children_texts": true,
        "has_original_xml": true,
        "has_strategy_info": true,
        "has_user_xpath": true
      },
      "element_bounds": "[864,2230][1080,2358]",  
      "element_text": "99",
      "key_attributes": {
        "class": "",
        "content-desc": "",
        "resource-id": "",
        "text": "99"
      },
      "original_xml": "<XML:101094 bytes>",       
      "selected_xpath": "//element_261",
      "strategy_type": "intelligent",
      "xml_hash": "sha256:PD94bWwgdmVyc2lv"       
    },
    "smartSelection": {
      "antonymCheckEnabled": false,
      "batchConfig": {
        "continueOnError": true,
        "intervalMs": 2000,
        "maxCount": 10,
        "showProgress": true
      },
      "minConfidence": 0.8,
      "mode": "all",
      "semanticAnalysisEnabled": false,
      "targetText": "99",
      "textMatchingMode": "exact"
    },
    "targetText": "99",
    "target_content_desc": ""
  },
  "resourceId": "com.ss.android.ugc.aweme:id/bhj",
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "strategy_type": "direct_click",
  "targetText": "关注",
  "xpath": "//node[@index='80']"
}
2025-10-29T16:29:25.705546Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 6: 转换为 3 个V3执行步骤
2025-10-29T16:29:25.705866Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🔗 调用增强版前端智能策略分析系统
2025-10-29T16:29:25.706396Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🔍 [DEBUG] original_params 内容: {
  "element_path": "//element_261",
  "original_data": {
    "children_texts": [
      "我"
    ],
    "confidence": 0.8,
    "data_integrity": {
      "extraction_timestamp": 1761755365615,      
      "has_children_texts": true,
      "has_original_xml": true,
      "has_strategy_info": true,
      "has_user_xpath": true
    },
    "element_bounds": "[864,2230][1080,2358]",    
    "element_text": "99",
    "key_attributes": {
      "class": "",
      "content-desc": "",
      "resource-id": "",
      "text": "99"
    },
    "original_xml": "<XML:101094 bytes>",
    "selected_xpath": "//element_261",
    "strategy_type": "intelligent",
    "xml_hash": "sha256:PD94bWwgdmVyc2lv"
  },
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "targetText": "99",
  "target_content_desc": ""
}
2025-10-29T16:29:25.709330Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🔥 [修复验证]  从original_data提取用户选择: xpath=//element_261, content_desc=None, text=Some("99")
2025-10-29T16:29:25.710121Z  INFO employee_gui::services::intelligent_analysis_service: 🧠 使用后端 完整 Step 0-6 智能分析: v3_intelligent_raw_1761755365709
2025-10-29T16:29:25.710571Z  INFO employee_gui::services::intelligent_analysis_service: 📋 开始解析 UI XML，长度: 101094 字符
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 101094 字符扩展到 101506 字符  
2025-10-29T16:29:25.721874Z ERROR employee_gui::services::adb_device_tracker: 读取设备列表失败: 读取数据长度失败: 由于连接方在一段时间后没有正确答复或连接的主机没有反应，连接尝试失败。 (os error 10060)
2025-10-29T16:29:25.727863Z  INFO employee_gui::services::adb_device_tracker: 🔄 ADB设备跟踪连接正常结束，准备重连
2025-10-29T16:29:25.728583Z  INFO employee_gui::services::adb_device_tracker: 🔌 连接到ADB server (127.0.0.1:5037)
2025-10-29T16:29:25.729722Z DEBUG employee_gui::services::adb_device_tracker: 📤 发送ADB协议命令: 0012host:track-devices
2025-10-29T16:29:25.730465Z  INFO employee_gui::services::adb_device_tracker: ✅ ADB server连接成功 ，开始监听设备变化
2025-10-29T16:29:25.733911Z DEBUG employee_gui::services::adb_device_tracker: 📱 收到设备列表: e0d909c3     device
2025-10-29T16:29:25.735808Z DEBUG employee_gui::services::adb_device_tracker: 📱 设备状态无变化 (1  个设备)
🔍 解析到 276 个UI元素（含子文本继承）
2025-10-29T16:29:25.737241Z  INFO employee_gui::services::intelligent_analysis_service: ✅ 解析到 276 个 UI 元素
2025-10-29T16:29:25.737386Z  INFO employee_gui::services::intelligent_analysis_service: ✅ 使用完整 用户选择上下文: xpath=//element_261, content_desc=None
2025-10-29T16:29:25.737636Z  INFO employee_gui::services::intelligent_analysis_service: ✨ [XPath增 强] 智能生成 XPath: //*[@text='99'] (置信度: 0.75)
2025-10-29T16:29:25.737842Z  INFO employee_gui::services::intelligent_analysis_service:    原始XPath: //element_261
2025-10-29T16:29:25.738131Z  INFO employee_gui::services::intelligent_analysis_service: 🔍 分析上下 文: resource_id=None, text=Some("99"), content-desc=None, xpath=//*[@text='99']
2025-10-29T16:29:25.739699Z  INFO employee_gui::engine::strategy_engine: ✅ [子元素策略] 使用智能分 析的文本过滤XPath: //*[@text='99']
2025-10-29T16:29:25.740102Z  WARN employee_gui::services::intelligent_analysis_service: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        
2025-10-29T16:29:25.740373Z  WARN employee_gui::services::intelligent_analysis_service: 🧠 Step 0-6 智能分析完成，生成 2 个候选策略
2025-10-29T16:29:25.741692Z  WARN employee_gui::services::intelligent_analysis_service:   1. 子元素 驱动策略 - 置信度: 0.817 (child_driven)
2025-10-29T16:29:25.743423Z  WARN employee_gui::services::intelligent_analysis_service:   2. XPath兜底策略 - 置信度: 0.546 (xpath_fallback)
2025-10-29T16:29:25.743797Z  WARN employee_gui::services::intelligent_analysis_service: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        
2025-10-29T16:29:25.744138Z  INFO employee_gui::services::intelligent_analysis_service: 🔍 [数据保留] original_data 构建完成: has_user_selection=true, xml_size=101094 bytes
2025-10-29T16:29:25.744452Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [候选生成] 候选 子元素驱动策略: 已包含 original_data (xml_size=101094 bytes)
2025-10-29T16:29:25.744787Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [候选生成] 候选 XPath兜底策略: 已包含 original_data (xml_size=101094 bytes)
2025-10-29T16:29:25.744935Z  INFO employee_gui::services::intelligent_analysis_service: 🔍 [Bounds提取] 开始从 2 个候选的 xpath 中提取 bounds
2025-10-29T16:29:25.745173Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [XPath匹 配] 找到元素: text='99' -> bounds=[800,2230][846,2298]
2025-10-29T16:29:25.745479Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [Bounds提取] 候选 #1: xpath=//*[@text='99'] -> bounds=[800,2230][846,2298]
2025-10-29T16:29:25.746082Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [XPath匹 配] 找到元素: text='99' -> bounds=[800,2230][846,2298]
2025-10-29T16:29:25.746534Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [Bounds提取] 候选 #2: xpath=//*[@text='99'] -> bounds=[800,2230][846,2298]
2025-10-29T16:29:25.746832Z  INFO employee_gui::services::intelligent_analysis_service: 🎯 [Bounds过滤] 检测到用户选择bounds，开始智能分析: user_bounds=[864,2230][1080,2358]
2025-10-29T16:29:25.747407Z  INFO employee_gui::exec::v3::helpers::element_hierarchy_analyzer: 🎯 找到 1 个完全包含在用户区域内的可点击元素
2025-10-29T16:29:25.747710Z  WARN employee_gui::services::intelligent_analysis_service: ⚠️ [智能修 正] 用户选择的区域 [864,2230][1080,2358] 包含 1 个可点击子元素，但生成的候选可能不在此区域内!
2025-10-29T16:29:25.748342Z  WARN employee_gui::services::intelligent_analysis_service: 💡 [建议] 用户可能误选了容器而不是具体按钮，建议前端优化可视化选择
2025-10-29T16:29:25.748673Z  INFO employee_gui::services::intelligent_analysis_service:   可点击子元素 #1: text='', bounds=[864,2230][1080,2358], resource_id=Some("")
2025-10-29T16:29:25.750910Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🎯 [Bounds匹配] 开始根据用户选择bounds重新排序候选: user_bounds=[864,2230][1080,2358]
2025-10-29T16:29:25.751521Z  INFO employee_gui::exec::v3::helpers::strategy_generation:   [1] bounds=Some("[800,2230][846,2298]"), text=Some("99"), 原始置信度=0.817, bounds匹配得分=0.036
2025-10-29T16:29:25.751746Z  INFO employee_gui::exec::v3::helpers::strategy_generation:   [2] bounds=Some("[800,2230][846,2298]"), text=Some("99"), 原始置信度=0.546, bounds匹配得分=0.036
2025-10-29T16:29:25.752327Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [Bounds匹配] 候选重排序完成，共 2 个候选
2025-10-29T16:29:25.752644Z  INFO employee_gui::services::intelligent_analysis_service: ✅ [Bounds过滤] 候选重排序完成，最佳候选: Some(Some("99"))    
2025-10-29T16:29:25.755004Z  INFO employee_gui::services::intelligent_analysis_service: ✅ 完整智能 分析完成: 2 个候选策略
2025-10-29T16:29:25.755422Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [XPath保 留] 使用智能分析生成的完整XPath: //*[@text='99']  
2025-10-29T16:29:25.755778Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔄 [数据传递] 步骤 1 包含original_data，已传递到执行层        
2025-10-29T16:29:25.757318Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量配置保留] 步骤 1 已继承 smartSelection: mode=Some(String("all"))
2025-10-29T16:29:25.758471Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [原始参数保留] 步骤 1 已使用 config 作为 originalParams    
2025-10-29T16:29:25.760582Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [XPath保 留] 使用智能分析生成的完整XPath: //*[@text='99']  
2025-10-29T16:29:25.761518Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔄 [数据传递] 步骤 2 包含original_data，已传递到执行层        
2025-10-29T16:29:25.761840Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量配置保留] 步骤 2 已继承 smartSelection: mode=Some(String("all"))
2025-10-29T16:29:25.762478Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [原始参数保留] 步骤 2 已使用 config 作为 originalParams    
2025-10-29T16:29:25.762801Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔄 转换了 2 个智能分析候选为 V3 步骤
2025-10-29T16:29:25.763098Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ 增强版前端智能分析完成，转换为 2 个 V3 步骤
2025-10-29T16:29:25.763374Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ 智能策略分析完成，生成 2 个候选步骤
2025-10-29T16:29:25.764596Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing: 🧠 智 能策略分析成功，生成 2 个优化候选步骤
2025-10-29T16:29:25.765003Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing: 🔄 合 并智能分析结果与原候选步骤
2025-10-29T16:29:25.765267Z  INFO employee_gui::exec::v3::helpers::step_optimization: 🔄 优先合并 2 个智能分析步骤
2025-10-29T16:29:25.765514Z  INFO employee_gui::exec::v3::helpers::step_optimization: 🔄 合并 1 个原始步骤（去重处理）
2025-10-29T16:29:25.765758Z DEBUG employee_gui::exec::v3::helpers::step_optimization: 🔄 跳过重复步 骤: step_1761755353070_hdv98z1v1
2025-10-29T16:29:25.767486Z  INFO employee_gui::exec::v3::helpers::step_optimization: ✅ 步骤合并完 成：智能分析 + 原始步骤 = 2 个优化候选
2025-10-29T16:29:25.768270Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing: 📋 V3 最终执行候选列表 (2 个步骤):
2025-10-29T16:29:25.768519Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing:   [1/2] intelligent_step_1 -> action=SmartTap, target='', mode='first'
2025-10-29T16:29:25.768804Z  INFO employee_gui::exec::v3::helpers::intelligent_preprocessing:   [2/2] intelligent_step_2 -> action=SmartTap, target='', mode='first'
2025-10-29T16:29:25.769440Z  INFO employee_gui::exec::v3::helpers::device_manager: 🔧 [设备管理] 跳 过设备连接检查（TODO: 实现真实的设备检查）        
2025-10-29T16:29:25.769709Z  INFO employee_gui::exec::v3::helpers::device_manager: ✅ [设备管理] 假 设设备 e0d909c3 连接正常
2025-10-29T16:29:25.770085Z  INFO employee_gui::exec::v3::helpers::device_manager: 📱 [设备管理] 开 始获取设备 e0d909c3 的UI快照
2025-10-29T16:29:25.770562Z  INFO employee_gui::services::quick_ui_automation: 🔍 快速抓取UI XML: device=e0d909c3
2025-10-29T16:29:25.770805Z  INFO employee_gui::services::safe_adb_manager: 🔧 执行ADB命令: D:\rust\active-projects\小红书\employeeGUI\platform-tools\adb.exe -s e0d909c3 exec-out uiautomator dump /dev/stdout
2025-10-29T16:29:29.217126Z  INFO employee_gui::services::safe_adb_manager: ✅ ADB命令成功: (100552 字节输出)
2025-10-29T16:29:29.221725Z  INFO employee_gui::services::quick_ui_automation: ✅ UI XML抓取完成: 3446ms
2025-10-29T16:29:29.221927Z  INFO employee_gui::exec::v3::helpers::device_manager: ✅ [设备管理] UI 快照获取成功，长度: 100552 字符
2025-10-29T16:29:29.222442Z DEBUG employee_gui::exec::v3::helpers::device_manager: 🔐 [设备管理] 计 算屏幕哈希: c32d51f9 (前8位)
2025-10-29T16:29:29.222937Z  INFO employee_gui::exec::v3::helpers::device_manager: ✅ [设备管理] 快 照获取完成，hash: c32d51f9
2025-10-29T16:29:29.223265Z  INFO employee_gui::exec::v3::helpers::phase_handlers: 🔍 宽松模式：检查screenHash是否匹配
2025-10-29T16:29:29.224689Z  INFO employee_gui::exec::v3::helpers::step_scoring: 🧠 智能分析步骤 intelligent_step_1 使用预计算置信度: 0.817
2025-10-29T16:29:29.224841Z  INFO employee_gui::exec::v3::helpers::phase_handlers: ✅ 步骤 intelligent_step_1 评分: 0.82
2025-10-29T16:29:29.224955Z  INFO employee_gui::exec::v3::helpers::step_scoring: 🧠 智能分析步骤 intelligent_step_2 使用预计算置信度: 0.546
2025-10-29T16:29:29.225161Z  INFO employee_gui::exec::v3::helpers::phase_handlers: ✅ 步骤 intelligent_step_2 评分: 0.55
2025-10-29T16:29:29.225496Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 开始执行智能分析步骤: intelligent_step_1
2025-10-29T16:29:29.225869Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [配置读取] Storre 中没有找到配置，尝试了以下keys:
2025-10-29T16:29:29.226241Z  WARN employee_gui::exec::v3::helpers::step_executor:    1. 当前step_id: intelligent_step_1
2025-10-29T16:29:29.226493Z  WARN employee_gui::exec::v3::helpers::step_executor:    将使用参数中的 默认配置
2025-10-29T16:29:29.226886Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 策略信息: xpath=//element_261 (来源:静态分析精确XPath), target='99', confidence=0.817, strategy=child_driven
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 100552 字符扩展到 100949 字符  
🔍 解析到 274 个UI元素（含子文本继承）
2025-10-29T16:29:29.248518Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [child_driven策略] 使用子元素文本搜索: '我'
2025-10-29T16:29:29.248923Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始过滤 4 个候选
2025-10-29T16:29:29.249225Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [批量模式-可点  击过滤] 未找到可点击元素，保留全部 4 个候选       
2025-10-29T16:29:29.249479Z  INFO employee_gui::exec::v3::helpers::step_executor: 🎯 [候选收集] 找到 4 个匹配的候选元素
2025-10-29T16:29:29.249724Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [候选详情] 匹配到的元素信息:
2025-10-29T16:29:29.249922Z  INFO employee_gui::exec::v3::helpers::step_executor:   [1] bounds=Some("[870,2236][1080,2358]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/fy2"), clickable=Some(false)
2025-10-29T16:29:29.250126Z  INFO employee_gui::exec::v3::helpers::step_executor:   [2] bounds=Some("[956,2270][1000,2330]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/content_layout"), clickable=Some(false)
2025-10-29T16:29:29.250736Z  INFO employee_gui::exec::v3::helpers::step_executor:   [3] bounds=Some("[956,2270][1000,2330]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/u6s"), clickable=Some(false)
2025-10-29T16:29:29.251075Z  INFO employee_gui::exec::v3::helpers::step_executor:   [4] bounds=Some("[956,2270][1000,2330]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/0vl"), clickable=Some(false)
2025-10-29T16:29:29.251399Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_data 存在
2025-10-29T16:29:29.251670Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_xml 长度: 101094 bytes
2025-10-29T16:29:29.251899Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] selected_xpath: String("//element_261")
2025-10-29T16:29:29.252309Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] children_texts: 1 个子元素文本
2025-10-29T16:29:29.252532Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 开始检测批量模式
2025-10-29T16:29:29.252740Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] merged_params keys: Some(["confidence", "minConfidence", "mode", "originalParams", "original_data", "reasoning", "smartSelection", "strategy", "strategy_type", "targetText", "xpath"])
2025-10-29T16:29:29.253040Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到顶层 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.253334Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 顶层 mode: String("all")
2025-10-29T16:29:29.253585Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到 originalParams
2025-10-29T16:29:29.253770Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams 中的 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.253984Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams mode: String("all")
2025-10-29T16:29:29.254156Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测] mode=all, 候选数=4
2025-10-29T16:29:29.254337Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 检测到批量全部模式
2025-10-29T16:29:29.254591Z  INFO employee_gui::exec::v3::helpers::step_executor:    策略：复用'第一个'的匹配逻辑，循环找到所有符合条件的目标并点击   
2025-10-29T16:29:29.254847Z  INFO employee_gui::exec::v3::helpers::batch_executor: 📋 [批量配置解析] max_count=10, interval_ms=2000ms, continue_on_error=true, show_progress=true, match_direction=forward
2025-10-29T16:29:29.255171Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始批量执行（复用'第一个'策略）
2025-10-29T16:29:29.255283Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [批量配置] maxCount=10, intervalMs=2000ms, continueOnError=true  
2025-10-29T16:29:29.255487Z  INFO employee_gui::exec::v3::helpers::step_executor: 📊 [初始候选] 从 UI dump 中找到 4 个初始候选元素
2025-10-29T16:29:29.255589Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量执行 1/10] 开始寻找目标元素
2025-10-29T16:29:29.255738Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [多候选评估] 启动模块化评估器（4 个候选）
2025-10-29T16:29:29.255917Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [目标文本提取] target_text=Some("99"), children_texts=["我"]     
2025-10-29T16:29:29.256117Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [文本匹配配置] 从前端获取: mode=exact, antonym_enabled=false     
2025-10-29T16:29:29.256236Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [多候选评估] 开始综合评分，criteria.selected_xpath=Some("//element_261")
2025-10-29T16:29:29.256346Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: ⚠️ [候选评估] 发现 4 个匹配候选，开始综合评分  
2025-10-29T16:29:29.256507Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.256642Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.258262Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.258585Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='我，按钮', 原因: 绝对匹配模式：'99' 与 '我，按钮' 不完全匹配
2025-10-29T16:29:29.258998Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [1] 评分: -1001.000 | text=Some("我") | content-desc=Some("") | bounds=Some("[870,2236][1080,2358]")
2025-10-29T16:29:29.260281Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.260635Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.260950Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.261049Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [2] 评分: -1001.000 | text=Some("我") | content-desc=Some("") | bounds=Some("[956,2270][1000,2330]")
2025-10-29T16:29:29.261154Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.261247Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.261473Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.261568Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [3] 评分: -1001.000 | text=Some("我") | content-desc=Some("") | bounds=Some("[956,2270][1000,2330]")
2025-10-29T16:29:29.261878Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.262081Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.262303Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.262445Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [4] 评分: -1001.000 | text=Some("我") | content-desc=Some("我，按钮") | bounds=Some("[956,2270][1000,2330]")
2025-10-29T16:29:29.262643Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='我，按钮' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.262897Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.263015Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.263257Z ERROR employee_gui::exec::v3::helpers::step_executor: 🚨 [目标不存在] 最佳候选分数过低 (-1001.000 < 0.3)，当前页面可能不存在真正的目标元素
2025-10-29T16:29:29.263478Z ERROR employee_gui::exec::v3::helpers::step_executor:    📍 最佳候选详情: text=Some("我"), content-desc=Some(""), bounds=Some("[870,2236][1080,2358]")
2025-10-29T16:29:29.263604Z ERROR employee_gui::exec::v3::helpers::step_executor:    🔍 评分原因:   
2025-10-29T16:29:29.263704Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.263906Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.264023Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ ⚠️ 元素 不可点击 (0.0)
2025-10-29T16:29:29.264416Z  WARN employee_gui::exec::v3::chain_engine: ❌ 步骤 intelligent_step_1  执行失败: 当前页面不存在可点击的'99' 按钮，所有找 到的按钮都是相反状态（如'已99'）。
建议：请检查页面状态，或者更新页面后重试。，尝试下一个候选步骤
2025-10-29T16:29:29.264751Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 开始执行智能分析步骤: intelligent_step_2
2025-10-29T16:29:29.265114Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [配置读取] Storre 中没有找到配置，尝试了以下keys:
2025-10-29T16:29:29.266737Z  WARN employee_gui::exec::v3::helpers::step_executor:    1. 当前step_id: intelligent_step_2
2025-10-29T16:29:29.266925Z  WARN employee_gui::exec::v3::helpers::step_executor:    将使用参数中的 默认配置
2025-10-29T16:29:29.267916Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 策略信息: xpath=//element_261 (来源:静态分析精确XPath), target='99', confidence=0.546, strategy=xpath_fallback
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 100552 字符扩展到 100949 字符  
🔍 解析到 274 个UI元素（含子文本继承）
2025-10-29T16:29:29.293163Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始过滤 2 个候选
2025-10-29T16:29:29.293433Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [批量模式-可点  击过滤] 未找到可点击元素，保留全部 2 个候选       
2025-10-29T16:29:29.293659Z  INFO employee_gui::exec::v3::helpers::step_executor: 🎯 [候选收集] 找到 2 个匹配的候选元素
2025-10-29T16:29:29.293875Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [候选详情] 匹配到的元素信息:
2025-10-29T16:29:29.294080Z  INFO employee_gui::exec::v3::helpers::step_executor:   [1] bounds=Some("[806,2236][852,2304]"), text=Some("99"), resource_id=Some("com.ss.android.ugc.aweme:id/065"), clickable=Some(false)
2025-10-29T16:29:29.294385Z  INFO employee_gui::exec::v3::helpers::step_executor:   [2] bounds=Some("[806,2257][852,2304]"), text=Some("99"), resource_id=Some("com.ss.android.ugc.aweme:id/0bl"), clickable=Some(false)
2025-10-29T16:29:29.294692Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_data 存在
2025-10-29T16:29:29.294895Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_xml 长度: 101094 bytes
2025-10-29T16:29:29.295114Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] selected_xpath: String("//element_261")
2025-10-29T16:29:29.295321Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] children_texts: 1 个子元素文本
2025-10-29T16:29:29.295526Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 开始检测批量模式
2025-10-29T16:29:29.295740Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] merged_params keys: Some(["confidence", "minConfidence", "mode", "originalParams", "original_data", "reasoning", "smartSelection", "strategy", "strategy_type", "targetText", "xpath"])
2025-10-29T16:29:29.296107Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到顶层 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.297006Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 顶层 mode: String("all")
2025-10-29T16:29:29.297272Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到 originalParams
2025-10-29T16:29:29.298524Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams 中的 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.300160Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams mode: String("all")
2025-10-29T16:29:29.300295Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测] mode=all, 候选数=2
2025-10-29T16:29:29.300382Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 检测到批量全部模式
2025-10-29T16:29:29.300519Z  INFO employee_gui::exec::v3::helpers::step_executor:    策略：复用'第一个'的匹配逻辑，循环找到所有符合条件的目标并点击   
2025-10-29T16:29:29.300626Z  INFO employee_gui::exec::v3::helpers::batch_executor: 📋 [批量配置解析] max_count=10, interval_ms=2000ms, continue_on_error=true, show_progress=true, match_direction=forward
2025-10-29T16:29:29.300945Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始批量执行（复用'第一个'策略）
2025-10-29T16:29:29.301065Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [批量配置] maxCount=10, intervalMs=2000ms, continueOnError=true  
2025-10-29T16:29:29.301276Z  INFO employee_gui::exec::v3::helpers::step_executor: 📊 [初始候选] 从 UI dump 中找到 2 个初始候选元素
2025-10-29T16:29:29.301450Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量执行 1/10] 开始寻找目标元素
2025-10-29T16:29:29.301641Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [多候选评估] 启动模块化评估器（2 个候选）
2025-10-29T16:29:29.301828Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [目标文本提取] target_text=Some("99"), children_texts=["我"]     
2025-10-29T16:29:29.302018Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [文本匹配配置] 从前端获取: mode=exact, antonym_enabled=false     
2025-10-29T16:29:29.302170Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [多候选评估] 开始综合评分，criteria.selected_xpath=Some("//element_261")
2025-10-29T16:29:29.302412Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: ⚠️ [候选评估] 发现 2 个匹配候选，开始综合评分  
2025-10-29T16:29:29.302525Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.302760Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.303066Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [1] 评分: -1.500 | text=Some("99") | content-desc=Some("") | bounds=Some("[806,2236][852,2304]")
2025-10-29T16:29:29.303216Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.303468Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ✅✅✅ 自身文本完全匹配: '99'
2025-10-29T16:29:29.303557Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.303774Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [2] 评分: -1.500 | text=Some("99") | content-desc=Some("") | bounds=Some("[806,2257][852,2304]")
2025-10-29T16:29:29.303879Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.304236Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ✅✅✅ 自身文本完全匹配: '99'
2025-10-29T16:29:29.304456Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.304612Z ERROR employee_gui::exec::v3::helpers::step_executor: 🚨 [目标不存在] 最佳候选分数过低 (-1.500 < 0.3)，当前页面可能不存在 真正的目标元素
2025-10-29T16:29:29.304903Z ERROR employee_gui::exec::v3::helpers::step_executor:    📍 最佳候选详情: text=Some("99"), content-desc=Some(""), bounds=Some("[806,2236][852,2304]")
2025-10-29T16:29:29.305087Z ERROR employee_gui::exec::v3::helpers::step_executor:    🔍 评分原因:   
2025-10-29T16:29:29.305169Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.305298Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ ✅✅✅ 自身文本完全匹配: '99'
2025-10-29T16:29:29.305558Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ ⚠️ 元素 不可点击 (0.0)
2025-10-29T16:29:29.306018Z  WARN employee_gui::exec::v3::chain_engine: ❌ 步骤 intelligent_step_2  执行失败: 当前页面不存在可点击的'99' 按钮，所有找 到的按钮都是相反状态（如'已99'）。
建议：请检查页面状态，或者更新页面后重试。，尝试下一个候选步骤
2025-10-29T16:29:29.306321Z  WARN employee_gui::exec::v3::helpers::phase_handlers: ⚠️ 传统步骤执行 失败 (没有步骤满足执行条件)，触发智能分析作为后备方 案
2025-10-29T16:29:29.306783Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🧠 开始智能策略分析 (Step 0-6) - 从原始数据直接处理
2025-10-29T16:29:29.309078Z  INFO employee_gui::exec::v3::helpers::analysis_helpers:    📋 原始参数: {"element_path":"//element_261","original_data":{"children_texts":["我"],"confidence":0.8,"data_integrity":{"extraction_timestamp":1761755365615,"has_children_texts":true,"has_original_xml":true,"has_strategy_info":true,"has_user_xpath":true},"element_bounds":"[864,2230][1080,2358]","element_text":"99","key_attributes":{"class":"","content-desc":"","resource-id":"","text":"99"},"original_xml":"<XML:101094 bytes>","selected_xpath":"//element_261","strategy_type":"intelligent","xml_hash":"sha256:PD94bWwgdmVyc2lv"},"smartSelection":{"antonymCheckEnabled":false,"batchConfig":{"continueOnError":true,"intervalMs":2000,"maxCount":10,"showProgress":true},"minConfidence":0.8,"mode":"all","semanticAnalysisEnabled":false,"targetText":"99","textMatchingMode":"exact"},"targetText":"99","target_content_desc":""}
2025-10-29T16:29:29.309784Z  INFO employee_gui::exec::v3::helpers::analysis_helpers:    📱 XML长度: 100552 字符
2025-10-29T16:29:29.310027Z  INFO employee_gui::exec::v3::helpers::device_manager: 📱 [设备管理] 获 取设备 e0d909c3 的基础信息
2025-10-29T16:29:29.310302Z  INFO employee_gui::exec::v3::helpers::device_manager: ✅ [设备管理] 设 备信息获取完成: Some((1080, 2340))xSome("portrait"), orientation=Some("com.unknown.app")
2025-10-29T16:29:29.310580Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 0: 设备状态获取完成
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 100552 字符扩展到 100949 字符
🔍 解析到 274 个UI元素（含子文本继承）
2025-10-29T16:29:29.337886Z  INFO employee_gui::exec::v3::helpers::intelligent_analysis: 🔍 提取了 274 个潜在交互元素（包括非clickable）
2025-10-29T16:29:29.338112Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 1: 从XML解析出 274 个潜在可交互元素
2025-10-29T16:29:29.338346Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 2: 用户意图分析完成 - UserIntent { action_type: "click", target_text: "99", target_hints: ["99", "99"], context: "用户目标: 99, 99", confidence: 0.8 }       
2025-10-29T16:29:29.341676Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 3: 完成 274 个元素的智能评分
2025-10-29T16:29:29.342070Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.342436Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.342954Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.343530Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.344107Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.344367Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.344604Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.344792Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.344973Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.345172Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量模式继承] 已将 smartSelection 配置传递到执行计划: mode=Some(String("all"))
2025-10-29T16:29:29.345264Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 4: 生成 10 个策略候选
2025-10-29T16:29:29.347748Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 5: 选出 3 个最优策略
2025-10-29T16:29:29.348566Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔧 智能步骤 参数: step_id=intelligent_step_1, params={        
  "action": "SmartSelection",
  "bounds": "[806,2257][852,2304]",
  "className": "android.widget.TextView",
  "confidence": 0.7030000000000001,
  "contentDesc": "",
  "originalParams": {
    "element_path": "//element_261",
    "original_data": {
      "children_texts": [
        "我"
      ],
      "confidence": 0.8,
      "data_integrity": {
        "extraction_timestamp": 1761755365615,    
        "has_children_texts": true,
        "has_original_xml": true,
        "has_strategy_info": true,
        "has_user_xpath": true
      },
      "element_bounds": "[864,2230][1080,2358]",  
      "element_text": "99",
      "key_attributes": {
        "class": "",
        "content-desc": "",
        "resource-id": "",
        "text": "99"
      },
      "original_xml": "<XML:101094 bytes>",       
      "selected_xpath": "//element_261",
      "strategy_type": "intelligent",
      "xml_hash": "sha256:PD94bWwgdmVyc2lv"       
    },
    "smartSelection": {
      "antonymCheckEnabled": false,
      "batchConfig": {
        "continueOnError": true,
        "intervalMs": 2000,
        "maxCount": 10,
        "showProgress": true
      },
      "minConfidence": 0.8,
      "mode": "all",
      "semanticAnalysisEnabled": false,
      "targetText": "99",
      "textMatchingMode": "exact"
    },
    "targetText": "99",
    "target_content_desc": ""
  },
  "resourceId": "com.ss.android.ugc.aweme:id/0bl",
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "strategy_type": "text_based_click",
  "targetText": "99",
  "xpath": "//node[@index='260']"
}
2025-10-29T16:29:29.352325Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔧 智能步骤 参数: step_id=intelligent_step_2, params={        
  "action": "SmartSelection",
  "bounds": "[806,2236][852,2304]",
  "className": "android.widget.LinearLayout",     
  "confidence": 0.6030000000000001,
  "contentDesc": "",
  "originalParams": {
    "element_path": "//element_261",
    "original_data": {
      "children_texts": [
        "我"
      ],
      "confidence": 0.8,
      "data_integrity": {
        "extraction_timestamp": 1761755365615,    
        "has_children_texts": true,
        "has_original_xml": true,
        "has_strategy_info": true,
        "has_user_xpath": true
      },
      "element_bounds": "[864,2230][1080,2358]",  
      "element_text": "99",
      "key_attributes": {
        "class": "",
        "content-desc": "",
        "resource-id": "",
        "text": "99"
      },
      "original_xml": "<XML:101094 bytes>",       
      "selected_xpath": "//element_261",
      "strategy_type": "intelligent",
      "xml_hash": "sha256:PD94bWwgdmVyc2lv"       
    },
    "smartSelection": {
      "antonymCheckEnabled": false,
      "batchConfig": {
        "continueOnError": true,
        "intervalMs": 2000,
        "maxCount": 10,
        "showProgress": true
      },
      "minConfidence": 0.8,
      "mode": "all",
      "semanticAnalysisEnabled": false,
      "targetText": "99",
      "textMatchingMode": "exact"
    },
    "targetText": "99",
    "target_content_desc": ""
  },
  "resourceId": "com.ss.android.ugc.aweme:id/065",
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "strategy_type": "text_based_click",
  "targetText": "99",
  "xpath": "//node[@index='259']"
}
2025-10-29T16:29:29.354082Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔧 智能步骤 参数: step_id=intelligent_step_3, params={        
  "action": "SmartSelection",
  "bounds": "[31,1825][739,2211]",
  "className": "com.lynx.tasm.behavior.ui.LynxFlattenUI",
  "confidence": 0.5525,
  "contentDesc": "",
  "originalParams": {
    "element_path": "//element_261",
    "original_data": {
      "children_texts": [
        "我"
      ],
      "confidence": 0.8,
      "data_integrity": {
        "extraction_timestamp": 1761755365615,    
        "has_children_texts": true,
        "has_original_xml": true,
        "has_strategy_info": true,
        "has_user_xpath": true
      },
      "element_bounds": "[864,2230][1080,2358]",  
      "element_text": "99",
      "key_attributes": {
        "class": "",
        "content-desc": "",
        "resource-id": "",
        "text": "99"
      },
      "original_xml": "<XML:101094 bytes>",       
      "selected_xpath": "//element_261",
      "strategy_type": "intelligent",
      "xml_hash": "sha256:PD94bWwgdmVyc2lv"       
    },
    "smartSelection": {
      "antonymCheckEnabled": false,
      "batchConfig": {
        "continueOnError": true,
        "intervalMs": 2000,
        "maxCount": 10,
        "showProgress": true
      },
      "minConfidence": 0.8,
      "mode": "all",
      "semanticAnalysisEnabled": false,
      "targetText": "99",
      "textMatchingMode": "exact"
    },
    "targetText": "99",
    "target_content_desc": ""
  },
  "resourceId": "",
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "strategy_type": "direct_click",
  "targetText": "",
  "xpath": "//node[@index='60']"
}
2025-10-29T16:29:29.355284Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ Step 6: 转换为 3 个V3执行步骤
2025-10-29T16:29:29.355481Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🔗 调用增强版前端智能策略分析系统
2025-10-29T16:29:29.355851Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🔍 [DEBUG] original_params 内容: {
  "element_path": "//element_261",
  "original_data": {
    "children_texts": [
      "我"
    ],
    "confidence": 0.8,
    "data_integrity": {
      "extraction_timestamp": 1761755365615,      
      "has_children_texts": true,
      "has_original_xml": true,
      "has_strategy_info": true,
      "has_user_xpath": true
    },
    "element_bounds": "[864,2230][1080,2358]",    
    "element_text": "99",
    "key_attributes": {
      "class": "",
      "content-desc": "",
      "resource-id": "",
      "text": "99"
    },
    "original_xml": "<XML:101094 bytes>",
    "selected_xpath": "//element_261",
    "strategy_type": "intelligent",
    "xml_hash": "sha256:PD94bWwgdmVyc2lv"
  },
  "smartSelection": {
    "antonymCheckEnabled": false,
    "batchConfig": {
      "continueOnError": true,
      "intervalMs": 2000,
      "maxCount": 10,
      "showProgress": true
    },
    "minConfidence": 0.8,
    "mode": "all",
    "semanticAnalysisEnabled": false,
    "targetText": "99",
    "textMatchingMode": "exact"
  },
  "targetText": "99",
  "target_content_desc": ""
}
2025-10-29T16:29:29.364999Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: 🔥 [修复验证]  从original_data提取用户选择: xpath=//element_261, content_desc=None, text=Some("99")
2025-10-29T16:29:29.365267Z  INFO employee_gui::services::intelligent_analysis_service: 🧠 使用后端 完整 Step 0-6 智能分析: v3_intelligent_raw_1761755369365
2025-10-29T16:29:29.365514Z  INFO employee_gui::services::intelligent_analysis_service: 📋 开始解析 UI XML，长度: 100552 字符
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 100552 字符扩展到 100949 字符  
🔍 解析到 274 个UI元素（含子文本继承）
2025-10-29T16:29:29.416704Z  INFO employee_gui::services::intelligent_analysis_service: ✅ 解析到 274 个 UI 元素
2025-10-29T16:29:29.417568Z  INFO employee_gui::services::intelligent_analysis_service: ✅ 使用完整 用户选择上下文: xpath=//element_261, content_desc=None
2025-10-29T16:29:29.418055Z  INFO employee_gui::services::intelligent_analysis_service: ✨ [XPath增 强] 智能生成 XPath: //*[@text='99'] (置信度: 0.75)
2025-10-29T16:29:29.418333Z  INFO employee_gui::services::intelligent_analysis_service:    原始XPath: //element_261
2025-10-29T16:29:29.418620Z  INFO employee_gui::services::intelligent_analysis_service: 🔍 分析上下 文: resource_id=None, text=Some("99"), content-desc=None, xpath=//*[@text='99']
2025-10-29T16:29:29.418880Z  INFO employee_gui::engine::strategy_engine: ✅ [子元素策略] 使用智能分 析的文本过滤XPath: //*[@text='99']
2025-10-29T16:29:29.419980Z  WARN employee_gui::services::intelligent_analysis_service: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        
2025-10-29T16:29:29.420608Z  WARN employee_gui::services::intelligent_analysis_service: 🧠 Step 0-6 智能分析完成，生成 2 个候选策略
2025-10-29T16:29:29.420754Z  WARN employee_gui::services::intelligent_analysis_service:   1. 子元素 驱动策略 - 置信度: 0.817 (child_driven)
2025-10-29T16:29:29.421018Z  WARN employee_gui::services::intelligent_analysis_service:   2. XPath兜底策略 - 置信度: 0.546 (xpath_fallback)
2025-10-29T16:29:29.421724Z  WARN employee_gui::services::intelligent_analysis_service: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        
2025-10-29T16:29:29.422279Z  INFO employee_gui::services::intelligent_analysis_service: 🔍 [数据保留] original_data 构建完成: has_user_selection=true, xml_size=100552 bytes
2025-10-29T16:29:29.422813Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [候选生成] 候选 子元素驱动策略: 已包含 original_data (xml_size=100552 bytes)
2025-10-29T16:29:29.424660Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [候选生成] 候选 XPath兜底策略: 已包含 original_data (xml_size=100552 bytes)
2025-10-29T16:29:29.428054Z  INFO employee_gui::services::intelligent_analysis_service: 🔍 [Bounds提取] 开始从 2 个候选的 xpath 中提取 bounds
2025-10-29T16:29:29.428522Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [XPath匹 配] 找到元素: text='99' -> bounds=[806,2236][852,2304]
2025-10-29T16:29:29.428984Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [Bounds提取] 候选 #1: xpath=//*[@text='99'] -> bounds=[806,2236][852,2304]
2025-10-29T16:29:29.429491Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [XPath匹 配] 找到元素: text='99' -> bounds=[806,2236][852,2304]
2025-10-29T16:29:29.429845Z DEBUG employee_gui::services::intelligent_analysis_service: ✅ [Bounds提取] 候选 #2: xpath=//*[@text='99'] -> bounds=[806,2236][852,2304]
2025-10-29T16:29:29.431383Z  INFO employee_gui::services::intelligent_analysis_service: 🎯 [Bounds过滤] 检测到用户选择bounds，开始智能分析: user_bounds=[864,2230][1080,2358]
2025-10-29T16:29:29.432221Z  INFO employee_gui::exec::v3::helpers::element_hierarchy_analyzer: 🎯 找到 1 个完全包含在用户区域内的可点击元素
2025-10-29T16:29:29.432578Z  WARN employee_gui::services::intelligent_analysis_service: ⚠️ [智能修 正] 用户选择的区域 [864,2230][1080,2358] 包含 1 个可点击子元素，但生成的候选可能不在此区域内!
2025-10-29T16:29:29.433016Z  WARN employee_gui::services::intelligent_analysis_service: 💡 [建议] 用户可能误选了容器而不是具体按钮，建议前端优化可视化选择
2025-10-29T16:29:29.433337Z  INFO employee_gui::services::intelligent_analysis_service:   可点击子元素 #1: text='', bounds=[870,2236][1080,2358], resource_id=Some("")
2025-10-29T16:29:29.433648Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🎯 [Bounds匹配] 开始根据用户选择bounds重新排序候选: user_bounds=[864,2230][1080,2358]
2025-10-29T16:29:29.433996Z  INFO employee_gui::exec::v3::helpers::strategy_generation:   [1] bounds=Some("[806,2236][852,2304]"), text=Some("99"), 原始置信度=0.817, bounds匹配得分=0.036
2025-10-29T16:29:29.434170Z  INFO employee_gui::exec::v3::helpers::strategy_generation:   [2] bounds=Some("[806,2236][852,2304]"), text=Some("99"), 原始置信度=0.546, bounds匹配得分=0.036
2025-10-29T16:29:29.434654Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [Bounds匹配] 候选重排序完成，共 2 个候选
2025-10-29T16:29:29.435120Z  INFO employee_gui::services::intelligent_analysis_service: ✅ [Bounds过滤] 候选重排序完成，最佳候选: Some(Some("99"))    
2025-10-29T16:29:29.436998Z  INFO employee_gui::services::intelligent_analysis_service: ✅ 完整智能 分析完成: 2 个候选策略
2025-10-29T16:29:29.437825Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [XPath保 留] 使用智能分析生成的完整XPath: //*[@text='99']  
2025-10-29T16:29:29.438077Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔄 [数据传递] 步骤 1 包含original_data，已传递到执行层        
2025-10-29T16:29:29.438384Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量配置保留] 步骤 1 已继承 smartSelection: mode=Some(String("all"))
2025-10-29T16:29:29.438583Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [原始参数保留] 步骤 1 已使用 config 作为 originalParams    
2025-10-29T16:29:29.438883Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [XPath保 留] 使用智能分析生成的完整XPath: //*[@text='99']  
2025-10-29T16:29:29.442387Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔄 [数据传递] 步骤 2 包含original_data，已传递到执行层        
2025-10-29T16:29:29.442762Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [批量配置保留] 步骤 2 已继承 smartSelection: mode=Some(String("all"))
2025-10-29T16:29:29.442979Z  INFO employee_gui::exec::v3::helpers::strategy_generation: ✅ [原始参数保留] 步骤 2 已使用 config 作为 originalParams    
2025-10-29T16:29:29.443585Z  INFO employee_gui::exec::v3::helpers::strategy_generation: 🔄 转换了 2 个智能分析候选为 V3 步骤
2025-10-29T16:29:29.445466Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ 增强版前端智能分析完成，转换为 2 个 V3 步骤
2025-10-29T16:29:29.445762Z  INFO employee_gui::exec::v3::helpers::analysis_helpers: ✅ 智能策略分析完成，生成 2 个候选步骤
2025-10-29T16:29:29.446802Z  INFO employee_gui::exec::v3::helpers::phase_handlers: ✅ 后备智能策略分析成功生成 2 个候选步骤
2025-10-29T16:29:29.447017Z  INFO employee_gui::exec::v3::helpers::step_scoring: 🧠 智能分析步骤 intelligent_step_1 使用预计算置信度: 0.817
2025-10-29T16:29:29.447293Z  INFO employee_gui::exec::v3::helpers::step_scoring: 🧠 智能分析步骤 intelligent_step_2 使用预计算置信度: 0.546
2025-10-29T16:29:29.447549Z  INFO employee_gui::exec::v3::helpers::phase_handlers: 🧠 尝试执行智能生成步骤: intelligent_step_1 (置信度: 0.82)
2025-10-29T16:29:29.447789Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 开始执行智能分析步骤: intelligent_step_1
2025-10-29T16:29:29.448036Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [配置读取] Storre 中没有找到配置，尝试了以下keys:
2025-10-29T16:29:29.448264Z  WARN employee_gui::exec::v3::helpers::step_executor:    1. 当前step_id: intelligent_step_1
2025-10-29T16:29:29.448483Z  WARN employee_gui::exec::v3::helpers::step_executor:    将使用参数中的 默认配置
2025-10-29T16:29:29.448924Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 策略信息: xpath=//element_261 (来源:静态分析精确XPath), target='99', confidence=0.817, strategy=child_driven
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 100552 字符扩展到 100949 字符  
🔍 解析到 274 个UI元素（含子文本继承）
2025-10-29T16:29:29.482403Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [child_driven策略] 使用子元素文本搜索: '我'
2025-10-29T16:29:29.483311Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始过滤 4 个候选
2025-10-29T16:29:29.484635Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [批量模式-可点  击过滤] 未找到可点击元素，保留全部 4 个候选       
2025-10-29T16:29:29.484961Z  INFO employee_gui::exec::v3::helpers::step_executor: 🎯 [候选收集] 找到 4 个匹配的候选元素
2025-10-29T16:29:29.485218Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [候选详情] 匹配到的元素信息:
2025-10-29T16:29:29.485829Z  INFO employee_gui::exec::v3::helpers::step_executor:   [1] bounds=Some("[870,2236][1080,2358]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/fy2"), clickable=Some(false)
2025-10-29T16:29:29.486189Z  INFO employee_gui::exec::v3::helpers::step_executor:   [2] bounds=Some("[956,2270][1000,2330]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/content_layout"), clickable=Some(false)
2025-10-29T16:29:29.486616Z  INFO employee_gui::exec::v3::helpers::step_executor:   [3] bounds=Some("[956,2270][1000,2330]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/u6s"), clickable=Some(false)
2025-10-29T16:29:29.486996Z  INFO employee_gui::exec::v3::helpers::step_executor:   [4] bounds=Some("[956,2270][1000,2330]"), text=Some("我"), resource_id=Some("com.ss.android.ugc.aweme:id/0vl"), clickable=Some(false)
2025-10-29T16:29:29.487556Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_data 存在
2025-10-29T16:29:29.487816Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_xml 长度: 100552 bytes
2025-10-29T16:29:29.488098Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] selected_xpath: String("//element_261")
2025-10-29T16:29:29.488341Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] children_texts: 1 个子元素文本
2025-10-29T16:29:29.488590Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 开始检测批量模式
2025-10-29T16:29:29.489024Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] merged_params keys: Some(["confidence", "minConfidence", "mode", "originalParams", "original_data", "reasoning", "smartSelection", "strategy", "strategy_type", "targetText", "xpath"])
2025-10-29T16:29:29.489226Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到顶层 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.489575Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 顶层 mode: String("all")
2025-10-29T16:29:29.489885Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到 originalParams
2025-10-29T16:29:29.491429Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams 中的 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.492410Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams mode: String("all")
2025-10-29T16:29:29.492810Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测] mode=all, 候选数=4
2025-10-29T16:29:29.493286Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 检测到批量全部模式
2025-10-29T16:29:29.493879Z  INFO employee_gui::exec::v3::helpers::step_executor:    策略：复用'第一个'的匹配逻辑，循环找到所有符合条件的目标并点击   
2025-10-29T16:29:29.494051Z  INFO employee_gui::exec::v3::helpers::batch_executor: 📋 [批量配置解析] max_count=10, interval_ms=2000ms, continue_on_error=true, show_progress=true, match_direction=forward
2025-10-29T16:29:29.494420Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始批量执行（复用'第一个'策略）
2025-10-29T16:29:29.494652Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [批量配置] maxCount=10, intervalMs=2000ms, continueOnError=true  
2025-10-29T16:29:29.494876Z  INFO employee_gui::exec::v3::helpers::step_executor: 📊 [初始候选] 从 UI dump 中找到 4 个初始候选元素
2025-10-29T16:29:29.495110Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量执行 1/10] 开始寻找目标元素
2025-10-29T16:29:29.495233Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [多候选评估] 启动模块化评估器（4 个候选）
2025-10-29T16:29:29.495380Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [目标文本提取] target_text=Some("99"), children_texts=["我"]     
2025-10-29T16:29:29.495624Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [文本匹配配置] 从前端获取: mode=exact, antonym_enabled=false     
2025-10-29T16:29:29.495915Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [多候选评估] 开始综合评分，criteria.selected_xpath=Some("//element_261")
2025-10-29T16:29:29.496243Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: ⚠️ [候选评估] 发现 4 个匹配候选，开始综合评分  
2025-10-29T16:29:29.496763Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.497118Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.499742Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.500252Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='我，按钮', 原因: 绝对匹配模式：'99' 与 '我，按钮' 不完全匹配
2025-10-29T16:29:29.500636Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [1] 评分: -1001.000 | text=Some("我") | content-desc=Some("") | bounds=Some("[870,2236][1080,2358]")
2025-10-29T16:29:29.500922Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.501400Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.501802Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.502204Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [2] 评分: -1001.000 | text=Some("我") | content-desc=Some("") | bounds=Some("[956,2270][1000,2330]")
2025-10-29T16:29:29.502568Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.502861Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.503226Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.503461Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [3] 评分: -1001.000 | text=Some("我") | content-desc=Some("") | bounds=Some("[956,2270][1000,2330]")
2025-10-29T16:29:29.504021Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.504876Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.505273Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.505495Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [4] 评分: -1001.000 | text=Some("我") | content-desc=Some("我，按钮") | bounds=Some("[956,2270][1000,2330]")
2025-10-29T16:29:29.506140Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='我，按钮' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.506511Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.508384Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.508676Z ERROR employee_gui::exec::v3::helpers::step_executor: 🚨 [目标不存在] 最佳候选分数过低 (-1001.000 < 0.3)，当前页面可能不存在真正的目标元素
2025-10-29T16:29:29.508995Z ERROR employee_gui::exec::v3::helpers::step_executor:    📍 最佳候选详情: text=Some("我"), content-desc=Some(""), bounds=Some("[870,2236][1080,2358]")
2025-10-29T16:29:29.509151Z ERROR employee_gui::exec::v3::helpers::step_executor:    🔍 评分原因:   
2025-10-29T16:29:29.509325Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.509683Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ 🚨🚨🚨 自身文本语义检查: 目标='99' vs 元素='我' (-999.0分, 绝对匹配模式：'99' 与 '我' 不完全匹配)
2025-10-29T16:29:29.509993Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ ⚠️ 元素 不可点击 (0.0)
2025-10-29T16:29:29.511706Z  WARN employee_gui::exec::v3::helpers::phase_handlers: ❌ 智能步骤 intelligent_step_1 执行失败: 当前页面不存在可点击的'99' 按钮，所有找到的按钮都是相反状态（如'已99'）。   
建议：请检查页面状态，或者更新页面后重试。        
2025-10-29T16:29:29.512226Z  INFO employee_gui::exec::v3::helpers::phase_handlers: 🧠 尝试执行智能生成步骤: intelligent_step_2 (置信度: 0.55)
2025-10-29T16:29:29.512474Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 开始执行智能分析步骤: intelligent_step_2
2025-10-29T16:29:29.512749Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [配置读取] Storre 中没有找到配置，尝试了以下keys:
2025-10-29T16:29:29.513597Z  WARN employee_gui::exec::v3::helpers::step_executor:    1. 当前step_id: intelligent_step_2
2025-10-29T16:29:29.513943Z  WARN employee_gui::exec::v3::helpers::step_executor:    将使用参数中的 默认配置
2025-10-29T16:29:29.514238Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [智能执行] 策略信息: xpath=//element_261 (来源:静态分析精确XPath), target='99', confidence=0.546, strategy=xpath_fallback
⚠️ 检测到压缩的XML格式，正在展开以便解析...       
✅ XML展开完成，从 100552 字符扩展到 100949 字符  
🔍 解析到 274 个UI元素（含子文本继承）
2025-10-29T16:29:29.545189Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始过滤 2 个候选
2025-10-29T16:29:29.545493Z  WARN employee_gui::exec::v3::helpers::step_executor: ⚠️ [批量模式-可点  击过滤] 未找到可点击元素，保留全部 2 个候选       
2025-10-29T16:29:29.545725Z  INFO employee_gui::exec::v3::helpers::step_executor: 🎯 [候选收集] 找到 2 个匹配的候选元素
2025-10-29T16:29:29.545945Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [候选详情] 匹配到的元素信息:
2025-10-29T16:29:29.546077Z  INFO employee_gui::exec::v3::helpers::step_executor:   [1] bounds=Some("[806,2236][852,2304]"), text=Some("99"), resource_id=Some("com.ss.android.ugc.aweme:id/065"), clickable=Some(false)
2025-10-29T16:29:29.546404Z  INFO employee_gui::exec::v3::helpers::step_executor:   [2] bounds=Some("[806,2257][852,2304]"), text=Some("99"), resource_id=Some("com.ss.android.ugc.aweme:id/0bl"), clickable=Some(false)
2025-10-29T16:29:29.546739Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_data 存在
2025-10-29T16:29:29.546958Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] original_xml 长度: 100552 bytes
2025-10-29T16:29:29.547185Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] selected_xpath: String("//element_261")
2025-10-29T16:29:29.549178Z  INFO employee_gui::exec::v3::helpers::step_executor: ✅ [数据完整性] children_texts: 1 个子元素文本
2025-10-29T16:29:29.549687Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 开始检测批量模式
2025-10-29T16:29:29.550071Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] merged_params keys: Some(["confidence", "minConfidence", "mode", "originalParams", "original_data", "reasoning", "smartSelection", "strategy", "strategy_type", "targetText", "xpath"])
2025-10-29T16:29:29.551114Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到顶层 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.551906Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 顶层 mode: String("all")
2025-10-29T16:29:29.552253Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] 找到 originalParams
2025-10-29T16:29:29.552597Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams 中的 smartSelection: Object {"antonymCheckEnabled": Bool(false), "batchConfig": Object {"continueOnError": Bool(true), "intervalMs": Number(2000), "maxCount": Number(10), "showProgress": Bool(true)}, "minConfidence": Number(0.8), "mode": String("all"), "semanticAnalysisEnabled": Bool(false), "targetText": String("99"), "textMatchingMode": String("exact")}
2025-10-29T16:29:29.553116Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测-DEBUG] originalParams mode: String("all")
2025-10-29T16:29:29.553384Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [批量检测] mode=all, 候选数=2
2025-10-29T16:29:29.553612Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 检测到批量全部模式
2025-10-29T16:29:29.553990Z  INFO employee_gui::exec::v3::helpers::step_executor:    策略：复用'第一个'的匹配逻辑，循环找到所有符合条件的目标并点击   
2025-10-29T16:29:29.554377Z  INFO employee_gui::exec::v3::helpers::batch_executor: 📋 [批量配置解析] max_count=10, interval_ms=2000ms, continue_on_error=true, show_progress=true, match_direction=forward
2025-10-29T16:29:29.554714Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量模式] 开始批量执行（复用'第一个'策略）
2025-10-29T16:29:29.554957Z  INFO employee_gui::exec::v3::helpers::step_executor: 📋 [批量配置] maxCount=10, intervalMs=2000ms, continueOnError=true  
2025-10-29T16:29:29.555237Z  INFO employee_gui::exec::v3::helpers::step_executor: 📊 [初始候选] 从 UI dump 中找到 2 个初始候选元素
2025-10-29T16:29:29.555366Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔄 [批量执行 1/10] 开始寻找目标元素
2025-10-29T16:29:29.555631Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [多候选评估] 启动模块化评估器（2 个候选）
2025-10-29T16:29:29.555885Z  INFO employee_gui::exec::v3::helpers::step_executor: 🔍 [目标文本提取] target_text=Some("99"), children_texts=["我"]     
2025-10-29T16:29:29.556182Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [文本匹配配置] 从前端获取: mode=exact, antonym_enabled=false     
2025-10-29T16:29:29.556493Z  INFO employee_gui::exec::v3::helpers::step_executor: 🧠 [多候选评估] 开始综合评分，criteria.selected_xpath=Some("//element_261")
2025-10-29T16:29:29.558282Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: ⚠️ [候选评估] 发现 2 个匹配候选，开始综合评分  
2025-10-29T16:29:29.558692Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.560065Z  WARN employee_gui::exec::v3::element_matching::multi_candidate_evaluator: 🚨 [语义分析] 检测到不匹配状态: 目标='99', 候选='', 原因: 绝对匹配模式：'99' 与 '' 不完全匹配    
2025-10-29T16:29:29.560555Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [1] 评分: -1.500 | text=Some("99") | content-desc=Some("") | bounds=Some("[806,2236][852,2304]")
2025-10-29T16:29:29.560886Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.561048Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ✅✅✅ 自身文本完全匹配: '99'
2025-10-29T16:29:29.561527Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.561765Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:   [2] 评分: -1.500 | text=Some("99") | content-desc=Some("") | bounds=Some("[806,2257][852,2304]")
2025-10-29T16:29:29.562114Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.562392Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ✅✅✅ 自身文本完全匹配: '99'
2025-10-29T16:29:29.562606Z  INFO employee_gui::exec::v3::element_matching::multi_candidate_evaluator:       └─ ⚠️ 元素不可点击 (0.0)
2025-10-29T16:29:29.562724Z ERROR employee_gui::exec::v3::helpers::step_executor: 🚨 [目标不存在] 最佳候选分数过低 (-1.500 < 0.3)，当前页面可能不存在 真正的目标元素
2025-10-29T16:29:29.562821Z ERROR employee_gui::exec::v3::helpers::step_executor:    📍 最佳候选详情: text=Some("99"), content-desc=Some(""), bounds=Some("[806,2236][852,2304]")
2025-10-29T16:29:29.562974Z ERROR employee_gui::exec::v3::helpers::step_executor:    🔍 评分原因:   
2025-10-29T16:29:29.563174Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ 🚨🚨🚨 检测到语义相反状态: 目标='99' vs 候选='' (-2.0, 反义词惩罚)
2025-10-29T16:29:29.563451Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ ✅✅✅ 自身文本完全匹配: '99'
2025-10-29T16:29:29.563668Z ERROR employee_gui::exec::v3::helpers::step_executor:       └─ ⚠️ 元素 不可点击 (0.0)
2025-10-29T16:29:29.565640Z  WARN employee_gui::exec::v3::helpers::phase_handlers: ❌ 智能步骤 intelligent_step_2 执行失败: 当前页面不存在可点击的'99' 按钮，所有找到的按钮都是相反状态（如'已99'）。   
建议：请检查页面状态，或者更新页面后重试。        
2025-10-29T16:29:29.566255Z  WARN employee_gui::exec::v3::helpers::phase_handlers: ❌ 所有智能生成步骤都未满足阈值或执行失败
2025-10-29T16:29:29.567232Z  WARN employee_gui::exec::v3::helpers::phase_handlers: ❌ 链式执行失败: 传统匹配和智能分析都未找到可执行步骤 (阈值: 0.50) 
2025-10-29T16:29:29.567596Z  INFO employee_gui::exec::v3::chain_engine: ✅ 智能自动链执行完成: analysisId=step_execution_1761755353070_hdv98z1v1, adoptedStepId=None, elapsed=3930ms
2025-10-29T16:29:29.903568Z  INFO employee_gui::exec::v3::helpers::execution_tracker: 🔓 【执行保护 】已释放 analysis_id 'step_execution_1761755353070_hdv98z1v1' 锁定
2025-10-29T16:29:29.909834Z DEBUG employee_gui::exec::v3::helpers::execution_tracker: 🔓 【RAII】守 卫析构时自动释放锁: step_execution_1761755353070_hdv98z1v1
