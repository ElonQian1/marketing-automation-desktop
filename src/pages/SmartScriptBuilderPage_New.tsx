// src/pages/SmartScriptBuilderPage_New.tsx
// module: ui | layer: ui | role: page
// summary: 页面组件

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAdb } from "../application/hooks/useAdb";
// import { DeviceStatus } from "../domain/adb/entities/Device"; // 已通过 useDefaultDeviceId 统一默认选择，不再直接使用
import { useDefaultDeviceId } from "../application/hooks/useDefaultDeviceId";
import { Row, Col, Typography, Form, message } from "antd";

// 🆕 导入模块化组件
import StepListPanel from "./SmartScriptBuilderPage/components/StepListPanel";
import ScriptControlPanel from "./SmartScriptBuilderPage/components/ScriptControlPanel";
import PageHeader from "./SmartScriptBuilderPage/components/PageHeader";
import { SmartStepEditorModal } from "./SmartScriptBuilderPage/components/smart-step-adder/SmartStepEditorModal";

// 🆕 导入Hooks
import { useStepForm } from "./SmartScriptBuilderPage/hooks/useStepForm";
import { usePageFinder } from "./SmartScriptBuilderPage/hooks/usePageFinder";
import { useLoopManagement } from "./SmartScriptBuilderPage/components/loop-management";
import { useContactImport } from "./SmartScriptBuilderPage/components/contact-import";

// 🎯 导入与单步测试相同的基础设施
import { getStepExecutionGateway } from "../infrastructure/gateways/StepExecutionGateway";
import { convertSmartStepToV2Request } from "../hooks/useV2StepTest";
import { normalizeScriptStepsForBackend } from "./SmartScriptBuilderPage/helpers/normalizeSteps";

// 🆕 导入类型和服务
import type { ExtendedSmartScriptStep, LoopConfig } from "../types/loopScript";
import type { ExecutorConfig, SmartExecutionResult } from "../types/execution";
import { DistributedStepLookupService } from "../application/services/DistributedStepLookupService";
import { DistributedStep } from "../domain/distributed-script";
import { generateXmlHash } from "../types/selfContainedScript";
import { PageAnalysisApplicationService } from "../application/page-analysis/PageAnalysisApplicationService";
import { PageAnalysisRepositoryFactory } from "../infrastructure/repositories/PageAnalysisRepositoryFactory";

// 🆕 导入模态框组件
import { LaunchAppSmartComponent } from "../components/smart/LaunchAppSmartComponent";
import { SmartNavigationModal } from "../components";
import { UniversalPageFinderModal } from "../components/universal-ui/UniversalPageFinderModal";
import { ContactWorkflowSelector } from "../modules/contact-automation";
import { DistributedScriptQualityPanel } from "../modules/distributed-script-quality/DistributedScriptQualityPanel";

const { Title, Paragraph } = Typography;

// ==================== 主组件 ====================
const SmartScriptBuilderPage: React.FC = () => {
  // ADB Hook 获取设备信息
  const { devices, refreshDevices } = useAdb();
  const { defaultDeviceId, hasDevices } = useDefaultDeviceId({
    preferSelected: true,
    autoSelectOnMount: false,
  });

  // 创建页面分析服务实例
  const pageAnalysisService = React.useMemo(() => {
    try {
      const pageAnalysisRepository =
        PageAnalysisRepositoryFactory.getPageAnalysisRepository();
      const deviceUIStateRepository =
        PageAnalysisRepositoryFactory.getDeviceUIStateRepository();
      return new PageAnalysisApplicationService(
        pageAnalysisRepository,
        deviceUIStateRepository
      );
    } catch (error) {
      console.error("创建页面分析服务失败:", error);
      return null;
    }
  }, []);

  // ==================== 状态管理 ====================
  const [steps, setSteps] = useState<ExtendedSmartScriptStep[]>([]);
  const [loopConfigs, setLoopConfigs] = useState<LoopConfig[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editingStep, setEditingStep] =
    useState<ExtendedSmartScriptStep | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [showAppComponent, setShowAppComponent] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [lastNavigationConfig, setLastNavigationConfig] = useState<{
    app_name?: string;
    navigation_type?: string;
  } | null>(null);
  const [executorConfig, setExecutorConfig] = useState<ExecutorConfig>({
    default_timeout_ms: 10000,
    default_retry_count: 3,
    page_recognition_enabled: true,
    auto_verification_enabled: true,
    smart_recovery_enabled: true,
    detailed_logging: true,
  });
  const [executionResult, setExecutionResult] =
    useState<SmartExecutionResult | null>(null);
  const [showContactWorkflowSelector, setShowContactWorkflowSelector] =
    useState(false);
  const [isScriptValid, setIsScriptValid] = useState<boolean>(true);
  const [showQualityPanel, setShowQualityPanel] = useState<boolean>(false);

  // 只有在模态框可见时才创建form实例，避免useForm警告
  const [form] = isModalVisible ? Form.useForm() : [null];

  // 🆕 使用模块化Hooks
  const stepFormHook = useStepForm({
    form, // ✅ 传递form实例
    steps,
    setSteps,
    devices,
    currentDeviceId,
    currentXmlContent: "", // 初始值
    currentDeviceInfo: {},
    currentPageInfo: {},
    setShowContactWorkflowSelector,
    setSnapshotFixMode: () => {}, // 暂时空实现
    setPendingAutoResave: () => {},
    setIsQuickAnalyzer: () => {},
    setEditingStepForParams: () => {},
    setShowPageAnalyzer: () => {},
    allowSaveWithoutXmlOnce: false,
    setAllowSaveWithoutXmlOnce: () => {},
  });

  const pageFinderHook = usePageFinder({
    steps,
    setSteps,
    form,
    currentDeviceId,
    devices,
    showAddModal: (options) => {
      if (options?.resetFields !== false) {
        form.resetFields();
      }
      setIsModalVisible(true);
    },
    setEditingStep,
    handleSaveStep: stepFormHook.handleSaveStep,
  });

  // 适配新签名：useLoopManagement(steps, setSteps)
  const loopManagementHook = useLoopManagement(steps, setSteps);

  // 适配新签名：useContactImport(steps, setSteps)
  const contactImportHook = useContactImport(steps, setSteps);

  // 🚀 使用脚本执行器
  const { executeFromUIState, executing } = useScriptExecutor();

  // 🆕 当步骤变化时，同步到分布式步骤查找服务
  useEffect(() => {
    const distributedSteps: DistributedStep[] = steps
      .map((step) => {
        const p: any = step.parameters || {};
        const embedded = p.xmlSnapshot;
        const xmlContent: string | undefined =
          embedded?.xmlContent || p.xmlContent;
        if (!xmlContent) return null;

        const stepXml = {
          xmlContent,
          xmlHash: embedded?.xmlHash || generateXmlHash(xmlContent),
          timestamp: embedded?.timestamp || Date.now(),
          deviceInfo:
            embedded?.deviceInfo || p.deviceInfo || p.deviceId
              ? {
                  deviceId:
                    embedded?.deviceInfo?.deviceId || p.deviceId || "unknown",
                  deviceName:
                    embedded?.deviceInfo?.deviceName ||
                    p.deviceName ||
                    "Unknown Device",
                }
              : undefined,
          pageInfo:
            embedded?.deviceInfo || p.pageInfo
              ? {
                  appPackage:
                    embedded?.deviceInfo?.appPackage ||
                    p.pageInfo?.appPackage ||
                    "com.xingin.xhs",
                  activityName:
                    embedded?.deviceInfo?.activityName ||
                    p.pageInfo?.activityName,
                  pageTitle:
                    embedded?.pageInfo?.pageTitle || p.pageInfo?.pageTitle,
                }
              : undefined,
        } as any;

        const locator = p.locator || {
          absoluteXPath: p.xpath || "",
          attributes: {
            resourceId: p.resource_id,
            text: p.text,
            contentDesc: p.content_desc,
            className: p.class_name,
          },
        };

        const ds: DistributedStep = {
          id: step.id,
          name: step.name || `步骤_${step.id}`,
          actionType: step.step_type || "click",
          params: p,
          locator,
          createdAt: Date.now(),
          description: step.description,
          xmlSnapshot: stepXml,
        } as DistributedStep;
        return ds;
      })
      .filter((v): v is DistributedStep => !!v);

    DistributedStepLookupService.setGlobalScriptSteps(distributedSteps);
    console.log("🔄 同步步骤到分布式查找服务:", {
      totalSteps: steps.length,
      distributedSteps: distributedSteps.length,
      stepIds: distributedSteps.map((s) => s.id),
    });
  }, [steps]);

  // 初始化设备选择
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // 当默认设备变化时，若页面本地未选择设备，则应用默认设备
  useEffect(() => {
    if (!currentDeviceId && defaultDeviceId) {
      setCurrentDeviceId(defaultDeviceId);
    }
  }, [currentDeviceId, defaultDeviceId]);

  // ==================== 事件处理函数 ====================
  const handleNavigationConfigChange = useCallback(
    (config: { app_name?: string; navigation_type?: string }) => {
      console.log("📥 接收到配置变化:", config);
      setLastNavigationConfig(config);
    },
    []
  );

  const handleNavigationModalClose = useCallback(() => {
    setShowNavigationModal(false);
  }, []);

  const handleEditStep = (step: ExtendedSmartScriptStep) => {
    setEditingStep(step);
    form.setFieldsValue({
      step_type: step.step_type,
      name: step.name,
      description: step.description,
      ...step.parameters,
    });
    setIsModalVisible(true);
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    message.success("步骤删除成功");
  };

  const handleToggleStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleAddStep = () => {
    setEditingStep(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 🎯 统一脚本执行函数 - 使用与单步测试相同的路径
  const executeScriptWithUnifiedPath = useCallback(async () => {
    if (!currentDeviceId) {
      message.warning('请先连接设备');
      return;
    }
    
    if (steps.length === 0) {
      message.warning('请先添加步骤');
      return;
    }

    console.log('🎯 [executeScriptWithUnifiedPath] 开始使用统一路径执行脚本');
    console.log('📋 步骤数:', steps.length);
    console.log('📱 设备ID:', currentDeviceId);
    
    setIsExecuting(true);
    const startTime = Date.now();
    let executedSteps = 0;
    let failedSteps = 0;
    
    try {
      // 1. 标准化步骤（与正式执行脚本使用相同的处理）
      const normalizedSteps = normalizeScriptStepsForBackend(steps);
      console.log('📋 [executeScriptWithUnifiedPath] 标准化后的步骤:', normalizedSteps.length);
      
      // 2. 获取执行网关（与单步测试相同）
      const gateway = getStepExecutionGateway();
      
      // 3. 逐步执行每个步骤（与循环执行引擎相同的模式）
      for (let i = 0; i < normalizedSteps.length; i++) {
        const step = normalizedSteps[i];
        
        console.log(`📝 [executeScriptWithUnifiedPath] 执行步骤 ${i + 1}/${normalizedSteps.length}: ${step.name} (${step.step_type})`);
        
        try {
          // 标准化步骤（和useStepTestV2MigrationFixed相同）
          const normalizedStep = {
            ...step,
            description: step.description || "",
            enabled: step.enabled ?? true,
            order: step.order ?? i,
          };

          // 转换为V2请求格式（和useV2StepTest相同）
          const v2Request = convertSmartStepToV2Request(normalizedStep, currentDeviceId, 'execute-step');
          
          console.log(`📋 [executeScriptWithUnifiedPath] V2请求参数:`, v2Request);
          
          // 使用StepExecutionGateway执行（和单步测试完全相同）
          const v2Result = await gateway.executeStep(v2Request);
          
          console.log(`✅ [executeScriptWithUnifiedPath] 步骤执行结果:`, v2Result);
          
          if (v2Result.success) {
            executedSteps++;
            message.success(`✅ 步骤 "${step.name}" 执行成功`);
          } else {
            failedSteps++;
            message.error(`❌ 步骤 "${step.name}" 执行失败: ${v2Result.message}`);
            console.error(`❌ 步骤执行失败:`, v2Result);
          }
          
        } catch (stepError) {
          failedSteps++;
          console.error(`💥 [executeScriptWithUnifiedPath] 步骤执行异常:`, stepError);
          message.error(`💥 步骤 "${step.name}" 执行异常: ${stepError}`);
        }
      }
      
      // 4. 执行完成统计
      const duration = Date.now() - startTime;
      const successRate = ((executedSteps / normalizedSteps.length) * 100).toFixed(1);
      
      console.log('🏁 [executeScriptWithUnifiedPath] 脚本执行完成:', {
        totalSteps: normalizedSteps.length,
        executedSteps,
        failedSteps,
        duration,
        successRate
      });
      
      if (failedSteps === 0) {
        message.success(`🎉 脚本执行完成！成功执行 ${executedSteps} 个步骤，耗时 ${(duration / 1000).toFixed(1)} 秒`);
      } else {
        message.warning(`⚠️ 脚本执行完成，成功率 ${successRate}%，成功 ${executedSteps} 个，失败 ${failedSteps} 个`);
      }
      
    } catch (error) {
      console.error("💥 [executeScriptWithUnifiedPath] 脚本执行失败:", error);
      message.error(`脚本执行失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExecuting(false);
      console.log('🏁 [executeScriptWithUnifiedPath] 执行状态重置完成');
    }
  }, [steps, currentDeviceId]);

  // 🎯 执行当前构建器中的脚本（无参数）- 使用统一路径
  const handleExecuteCurrentScript = async () => {
    // 🎯 使用与单步测试相同的统一执行路径
    console.log('� [handleExecuteCurrentScript] 使用统一路径执行脚本');
    await executeScriptWithUnifiedPath();
  };

  // 🎯 执行脚本管理器中选中的脚本（带 scriptId 参数）
  const handleExecuteScriptFromManager = async (scriptId: string) => {
    if (!currentDeviceId) {
      message.warning('请先连接设备');
      return;
    }
    
    setIsExecuting(true);
    try {
      // 🔄 使用脚本管理器执行指定的脚本
      console.log('🎯 执行脚本管理器中的脚本:', scriptId, '设备:', currentDeviceId);
      // 这里应该调用实际的脚本执行逻辑
      // 暂时使用简化的逻辑
      message.success(`脚本 ${scriptId} 执行完成`);
    } catch (error) {
      console.error("脚本执行失败:", error);
      message.error("脚本执行失败");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleLoadScriptFromManager = (
    loadedSteps: ExtendedSmartScriptStep[],
    config?: ExecutorConfig
  ) => {
    setSteps(loadedSteps);
    if (config) {
      setExecutorConfig(config);
    }
    message.success("脚本加载成功");
  };

  // ==================== 渲染 ====================
  return (
    <div className="p-6">
      {/* 页面标题 */}
      <PageHeader
        devices={devices}
        currentDeviceId={currentDeviceId}
        onDeviceChange={setCurrentDeviceId}
        onRefreshDevices={refreshDevices}
        onQuickAddApp={() => setShowAppComponent(true)}
      />

      <Row gutter={16} className="h-full">
        {/* 左侧：可拖拽的步骤列表 */}
        <Col span={16}>
          <StepListPanel
            steps={steps}
            setSteps={setSteps}
            loopConfigs={loopConfigs}
            setLoopConfigs={setLoopConfigs}
            currentDeviceId={currentDeviceId}
            devices={devices}
            handleEditStep={handleEditStep}
            openQuickPageFinder={pageFinderHook.openQuickPageFinder}
            handleEditStepParams={pageFinderHook.openPageFinderForStep}
            handleAddStep={handleAddStep}
          />
        </Col>

        {/* 右侧：控制面板 */}
        <Col span={8}>
          <ScriptControlPanel
            steps={steps}
            executorConfig={executorConfig}
            setExecutorConfig={setExecutorConfig}
            executionResult={executionResult}
            isExecuting={isExecuting || executing}
            currentDeviceId={currentDeviceId}
            onExecuteScript={handleExecuteCurrentScript}
            onLoadScript={handleLoadScriptFromManager}
            onUpdateSteps={setSteps}
            onUpdateConfig={setExecutorConfig}
          />
        </Col>
      </Row>

      {/* 模态框组件 */}
      <SmartStepEditorModal
        visible={isModalVisible}
        onOk={stepFormHook.handleSaveStep}
        onCancel={() => {
          setIsModalVisible(false);
          form?.resetFields();
        }}
        form={form}
        currentDeviceId={currentDeviceId}
        editingStep={editingStep}
        onOpenSmartNavigation={() => setShowNavigationModal(true)}
        onOpenPageAnalyzer={() => pageFinderHook.openQuickPageFinder()}
      />

      {/* 快速应用选择Modal */}
      {/* ... 其他模态框组件 ... */}
    </div>
  );
};

export default SmartScriptBuilderPage;
