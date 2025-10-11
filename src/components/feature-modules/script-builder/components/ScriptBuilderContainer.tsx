// src/components/feature-modules/script-builder/components/ScriptBuilderContainer.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 脚本构建器容器组件
 * 整合所有脚本构建器组件的主容器
 */

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Space,
  Dropdown,
  Input,
  message,
  Modal,
  Typography,
  Divider,
  Row,
  Col,
  MenuProps,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

import { 
  useScriptBuilderState,
  useStepManagement,
  useScriptExecution,
  type Script,
  type ScriptStep,
  type StepType,
} from '../hooks';

import { StepList } from './StepList';
import StepEditor from './StepEditor';
import { ExecutionControl } from './ExecutionControl';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

/**
 * ScriptBuilderContainer 组件属性
 */
interface ScriptBuilderContainerProps {
  /** 初始脚本 */
  initialScript?: Script;
  /** 可用设备列表 */
  availableDevices?: Array<{ id: string; name: string; status: string }>;
  /** 当前选中设备 */
  selectedDevice?: string;
  /** 选择设备回调 */
  onDeviceSelect?: (deviceId: string) => void;
  /** 脚本保存回调 */
  onScriptSave?: (script: Script) => void;
  /** 脚本加载回调 */
  onScriptLoad?: (scriptId: string) => void;
  /** 脚本删除回调 */
  onScriptDelete?: (scriptId: string) => void;
}

/**
 * 脚本构建器容器组件
 */
export const ScriptBuilderContainer: React.FC<ScriptBuilderContainerProps> = ({
  initialScript,
  availableDevices = [],
  selectedDevice,
  onDeviceSelect,
  onScriptSave,
  onScriptLoad,
  onScriptDelete,
}) => {
  // 状态管理
  const {
    currentScript,
    scripts,
    selectedStep,
    editingStep,
    showStepEditor,
    error,
    showPreview,
    // 脚本操作
    createNewScript,
    loadScript,
    saveCurrentScript,
    updateScriptInfo,
    // 步骤操作
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    duplicateStep,
    // 编辑操作
    selectStep,
    startEditingStep,
    cancelEditingStep,
    saveEditingStep,
    // 其他操作
    setError,
    togglePreview,
  } = useScriptBuilderState();

  // 步骤管理
  const {
    validateStepData,
    validateSteps,
    createStepFromTemplate,
    getStepTemplates,
    getStepStatistics,
  } = useStepManagement();

  // 脚本执行
  const {
    isRunning: isExecuting,
    isPaused,
    currentStepIndex,
    progress,
    result: executionResult,
    logs: executionLogs,
    error: executionError,
    executeScript,
    stopExecution,
    pauseExecution,
    resumeExecution,
    clearLogs,
    clearResult,
  } = useScriptExecution();

  // 本地状态
  const [searchText, setSearchText] = useState('');
  const [selectedStepIds, setSelectedStepIds] = useState<string[]>([]);

  // 初始化脚本
  useEffect(() => {
    if (initialScript) {
      loadScript(initialScript);
    }
  }, [initialScript, loadScript]);

  // 验证结果
  const validationResults = currentScript 
    ? validateSteps(currentScript.steps)
    : new Map();

  // 当前编辑步骤的验证结果
  const editingStepValidation = editingStep 
    ? validateStepData(editingStep)
    : undefined;

  // 脚本操作菜单
  const scriptMenuItems: MenuProps['items'] = [
    {
      key: 'new',
      label: '新建脚本',
      icon: <PlusOutlined />,
      onClick: () => {
        const name = prompt('请输入脚本名称:', '新脚本');
        if (name) {
          createNewScript(name);
        }
      },
    },
    {
      key: 'open',
      label: '打开脚本',
      icon: <FolderOpenOutlined />,
      onClick: () => {
        // 这里应该打开脚本选择对话框
        message.info('打开脚本功能待实现');
      },
    },
    {
      key: 'save',
      label: '保存脚本',
      icon: <SaveOutlined />,
      onClick: handleSaveScript,
      disabled: !currentScript,
    },
    {
      type: 'divider',
    },
    {
      key: 'duplicate',
      label: '复制脚本',
      icon: <CopyOutlined />,
      onClick: handleDuplicateScript,
      disabled: !currentScript,
    },
    {
      key: 'export',
      label: '导出脚本',
      icon: <ExportOutlined />,
      onClick: handleExportScript,
      disabled: !currentScript,
    },
    {
      key: 'import',
      label: '导入脚本',
      icon: <ImportOutlined />,
      onClick: () => message.info('导入脚本功能待实现'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除脚本',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDeleteScript,
      disabled: !currentScript,
    },
  ];

  // 保存脚本
  function handleSaveScript() {
    if (!currentScript) return;
    
    saveCurrentScript();
    onScriptSave?.(currentScript);
    message.success('脚本已保存');
  }

  // 复制脚本
  function handleDuplicateScript() {
    if (!currentScript) return;
    
    const duplicatedScript: Script = {
      ...currentScript,
      id: Date.now().toString(),
      name: `${currentScript.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    loadScript(duplicatedScript);
    message.success('脚本已复制');
  }

  // 导出脚本
  function handleExportScript() {
    if (!currentScript) return;
    
    const dataStr = JSON.stringify(currentScript, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentScript.name}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    message.success('脚本已导出');
  }

  // 删除脚本
  function handleDeleteScript() {
    if (!currentScript) return;
    
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除脚本"${currentScript.name}"吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        onScriptDelete?.(currentScript.id);
        // 重置为空脚本
        createNewScript();
        message.success('脚本已删除');
      },
    });
  }

  // 添加步骤
  const handleAddStep = (type: StepType, insertIndex?: number) => {
    addStep(type, insertIndex);
  };

  // 编辑步骤
  const handleEditStep = (step: ScriptStep) => {
    startEditingStep(step);
  };

  // 保存编辑的步骤
  const handleSaveEditingStep = (step: ScriptStep) => {
    updateStep(step.id, step);
    cancelEditingStep();
    message.success('步骤已保存');
  };

  // 删除步骤
  const handleDeleteStep = (stepId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个步骤吗？',
      onOk: () => {
        deleteStep(stepId);
        message.success('步骤已删除');
      },
    });
  };

  // 切换步骤启用状态
  const handleToggleStepEnabled = (stepId: string, enabled: boolean) => {
    updateStep(stepId, { enabled });
  };

  // 执行脚本
  const handleExecuteScript = async (options?: {
    deviceId?: string;
    startFromStep?: number;
    endAtStep?: number;
    skipDisabled?: boolean;
  }) => {
    if (!currentScript) {
      message.error('请先创建或选择一个脚本');
      return;
    }

    if (!options?.deviceId) {
      message.error('请先选择执行设备');
      return;
    }

    if (currentScript.steps.length === 0) {
      message.error('脚本中没有步骤');
      return;
    }

    try {
      clearResult();
      clearLogs();
      await executeScript(currentScript, options);
      message.success('脚本执行完成');
    } catch (error) {
      message.error(`脚本执行失败: ${error}`);
    }
  };

  // 获取脚本统计信息
  const getScriptStats = () => {
    if (!currentScript) return null;
    return getStepStatistics(currentScript.steps);
  };

  const scriptStats = getScriptStats();

  // 渲染头部工具栏
  const renderHeader = () => (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--bg-light-base, #ffffff)',
        color: 'var(--text-inverse, #1e293b)',
        borderBottom: '1px solid #f0f0f0',
      }}
      className="light-theme-force"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {currentScript?.name || '脚本构建器'}
        </Title>
        
        {scriptStats && (
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">步骤: {scriptStats.total}</Text>
            <Text type="secondary">启用: {scriptStats.enabled}</Text>
            <Text type="secondary">预计时间: {Math.round(scriptStats.totalEstimatedTime / 1000)}s</Text>
          </Space>
        )}
      </div>

      <Space>
        <Search
          placeholder="搜索步骤..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />

        <Dropdown menu={{ items: scriptMenuItems }} placement="bottomRight">
          <Button icon={<SettingOutlined />}>
            脚本操作
          </Button>
        </Dropdown>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => handleExecuteScript({ deviceId: selectedDevice })}
          disabled={isExecuting || !currentScript || !selectedDevice}
        >
          执行脚本
        </Button>
      </Space>
    </div>
  );

  // 渲染左侧步骤列表
  const renderStepList = () => (
    <Card 
      title="脚本步骤" 
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: 8, height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      <StepList
        steps={currentScript?.steps || []}
        selectedStep={selectedStep}
        executingStepId={isExecuting ? currentScript?.steps[currentStepIndex]?.id : undefined}
        validationResults={validationResults}
        showDetails={showPreview}
        onStepSelect={selectStep}
        onStepEdit={handleEditStep}
        onStepDelete={handleDeleteStep}
        onStepDuplicate={duplicateStep}
        onStepToggleEnabled={handleToggleStepEnabled}
        onStepMove={moveStep}
        onAddStep={handleAddStep}
        onRunSingleStep={(stepId) => {
          // 运行单个步骤的逻辑
          message.info('单步执行功能待实现');
        }}
      />
    </Card>
  );

  // 渲染右侧执行控制
  const renderExecutionControl = () => (
    <ExecutionControl
      script={currentScript}
      isExecuting={isExecuting}
      isPaused={isPaused}
      currentStepIndex={currentStepIndex}
      progress={progress}
      result={executionResult}
      logs={executionLogs}
      error={executionError}
      availableDevices={availableDevices}
      selectedDevice={selectedDevice}
      onStartExecution={handleExecuteScript}
      onPauseExecution={pauseExecution}
      onResumeExecution={resumeExecution}
      onStopExecution={stopExecution}
      onDeviceSelect={onDeviceSelect}
      onClearLogs={clearLogs}
      onExportLogs={() => {
        // 导出日志逻辑
        const logsText = executionLogs
          .map(log => `[${log.level}] ${new Date(log.timestamp).toLocaleString()}: ${log.message}`)
          .join('\n');
        
        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `execution_logs_${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      }}
    />
  );

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 头部工具栏 */}
      <Header style={{ padding: 0, height: 64 }}>
        {renderHeader()}
      </Header>

      <Layout>
        {/* 左侧步骤列表 */}
        <Sider 
          width={400} 
          style={{ 
            background: 'var(--bg-light-base, #ffffff)', 
            color: 'var(--text-inverse, #1e293b)',
            borderRight: '1px solid #f0f0f0' 
          }}
          className="light-theme-force"
        >
          {renderStepList()}
        </Sider>

        {/* 右侧执行控制 */}
        <Content style={{ padding: 16, background: '#f5f5f5' }}>
          {renderExecutionControl()}

          {/* 错误提示 */}
          {error && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ color: '#ff4d4f' }}>
                错误: {error}
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => setError(null)}
                  style={{ padding: 0, marginLeft: 8 }}
                >
                  关闭
                </Button>
              </div>
            </Card>
          )}
        </Content>
      </Layout>

      {/* 步骤编辑器 */}
      <StepEditor
        visible={showStepEditor}
        step={editingStep}
        validation={editingStepValidation}
        onClose={cancelEditingStep}
        onSave={handleSaveEditingStep}
        onTest={(step) => {
          message.info('步骤测试功能待实现');
        }}
      />
    </Layout>
  );
};