# 前缀化重命名计划（from → to）

> **使用说明**：各员工基于此表推进工作，完成一项勾选✅一项，新发现的待前缀化文件直接追加到表中

## prospecting（精准获客模块）
| 子目录 | from | to | 类型名改为 | 状态 | 负责人 |
|---|---|---|---|---|---|
| domain/strategies | weighted.ts | prospecting-strategy-weighted.ts | ProspectingStrategyWeighted | ✅ | 员工B |
| domain/strategies | standard.ts | prospecting-strategy-standard.ts | ProspectingStrategyStandard | ✅ | 员工B |
| services | ProspectingService.ts | prospecting-core-service.ts | ProspectingCoreService | ✅ | 员工B |
| template-management/services | prospecting-template-service.ts | ✅已前缀化 | ProspectingTemplateService | ✅ | 员工B |
| task-engine | TaskEngine.ts | prospecting-task-engine.ts | ProspectingTaskEngine | ✅ | 员工B |

## script-builder（脚本构建模块）
| 子目录 | from | to | 类型名改为 | 状态 | 负责人 |
|---|---|---|---|---|---|
| domain/strategies | standard.ts | script-strategy-standard.ts | ScriptStrategyStandard | ⏳ | 待分配 |
| domain/strategies | enhanced.ts | script-strategy-enhanced.ts | ScriptStrategyEnhanced | ⏳ | 待分配 |
| services | ScriptBuilderService.ts | script-builder-service.ts | ScriptBuilderService | ⏳ | 待分配 |

## contact-import（联系人导入模块）
| 子目录 | from | to | 类型名改为 | 状态 | 负责人 |
|---|---|---|---|---|---|
| core | ContactImporter.ts | contact-core-importer.ts | ContactCoreImporter | ✅ | 员工A |
| services | ContactService.ts | contact-management-service.ts | ContactManagementService | ⏳ | 待分配 |
| validation | ContactValidator.ts | contact-validator.ts | ContactValidator | ⏳ | 待分配 |

## adb（ADB设备管理模块）
| 子目录 | from | to | 类型名改为 | 状态 | 负责人 |
|---|---|---|---|---|---|
| services | AdbService.ts | adb-device-service.ts | AdbDeviceService | ⏳ | 待分配 |
| diagnostics | DiagnosticService.ts | adb-diagnostic-service.ts | AdbDiagnosticService | ✅ | 员工A |

## self-contained（自包含脚本模块）
| 子目录 | from | to | 类型名改为 | 状态 | 负责人 |
|---|---|---|---|---|---|
| builders | ScriptBuilder.ts | selfcontained-script-builder.ts | SelfContainedScriptBuilder | ⏳ | 待分配 |
| validators | ScriptValidator.ts | selfcontained-script-validator.ts | SelfContainedScriptValidator | ⏳ | 待分配 |

## 新发现的待处理文件（持续追加）
| 模块 | 子目录 | from | to | 类型名改为 | 状态 | 负责人 |
|---|---|---|---|---|---|---|
| employee | services | authService.ts | employee-auth-service.ts | EmployeeAuthService | ✅ | 员工A |
| contact | services | VcfImportService.ts | contact-vcf-import-service.ts | ContactVcfImportService | ✅ | 员工A |
| contact | services | LDPlayerVcfService.ts | contact-ldplayer-vcf-service.ts | ContactLdplayerVcfService | ✅ | 员工A |
| smart-app | services | smartAppService.ts | smart-app-service.ts | SmartAppService | ✅ | 员工A |
| strategy | services | IntelligentStrategyService.ts | strategy-intelligent-service.ts | StrategyIntelligentService | ✅ | 员工A |
| xml | services | XmlPageCacheService.ts | xml-page-cache-service.ts | XmlPageCacheService | 🔄 | 员工A |
| validation | services | CsvImportValidationService.ts | validation-csv-import-service.ts | ValidationCsvImportService | ✅ | 员工A |
| xml | services | RealXMLAnalysisService.ts | xml-analysis-service.ts | XmlAnalysisService | ✅ | 员工A |
| adb | services | AdbPrecisionStrategy.ts | adb-precision-strategy.ts | AdbPrecisionStrategy | ✅ | 员工A |
| matching | services | batchMatchingEngine.ts | matching-batch-engine.ts | MatchingBatchEngine | ✅ | 员工A |
| matching | services | customMatchingEngine.ts | matching-custom-engine.ts | MatchingCustomEngine | ✅ | 员工A |
| automation | services | duplicationGuard.ts | automation-duplication-guard.ts | DuplicationGuard | ✅ | 员工A |
| deprecated | services | ElementFieldAnalyzer.ts | deprecated-element-field-analyzer.ts | ElementFieldAnalyzer | ✅ | 员工A |
| ui | services | ElementFilter.ts | ui-element-filter.ts | ElementFilter | ✅ | 员工A |
| ui | services | FilterAdapter.ts | ui-filter-adapter.ts | FilterAdapter | ✅ | 员工A |
| xml | services | EnhancedXmlCacheService.ts | xml-enhanced-cache-service.ts | XmlEnhancedCacheService | ✅ | 员工A |
| unified-view | services | UnifiedViewDataManager.ts | unified-view-data-manager.ts | UnifiedViewDataManager | ✅ | 员工A |
| xml | services | XmlCacheManager.ts | xml-cache-manager.ts | XmlCacheManager | ✅ | 员工A |
| contact | utils | ContactImportDebugger.ts | contact-import-debugger.ts | ContactImportDebugger | ✅ | 员工A |
| xpath | utils | XPathService.ts | xpath-service.ts | XpathService | ✅ | 员工A |
| xpath | utils | XPathPrecompilerCache.ts | xpath-precompiler-cache.ts | XpathPrecompilerCache | ✅ | 员工A |
| employee | types | Employee.ts | employee-types.ts | Employee | ✅ | 员工A |
| | | | | | | |

---

## 前缀化规则（参考）
1. **文件名前缀**：`<module>-<category>-<name>.ts`
   - 例：`prospecting-strategy-weighted.ts`
   - 例：`contact-validator-phone.ts`

2. **类型名前缀**：`<Module><Category><Name>`  
   - 例：`ProspectingStrategyWeighted`
   - 例：`ContactValidatorPhone`

3. **优先级**：
   - 🔥 高优先级：domain层的核心类型和服务
   - ⚡ 中优先级：application层的用例和服务
   - 📋 低优先级：工具类和辅助函数

## 进度统计
- ✅ 已完成：25项 (prospecting模块5项 + 员工A完成20项)
- ⏳ 待处理：8项  
- 📊 完成率：76%

---
**更新指南**：完成一项就勾选✅，发现新的需要前缀化的文件就追加到表格底部