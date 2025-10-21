// src/modules/smart-script-management/components/ScriptBuilderIntegration.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// SmartScriptBuilderPage 的脚本管理集成示例

import React, { useState, useCallback } from 'react';
import { Card, Button, Space, Modal, Input, message, Alert, Form, Select, Row, Col, Tag } from 'antd';
import { SaveOutlined, FolderOpenOutlined, MenuOutlined, CloudUploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

// 导入新的模块化脚本管理系统
import {
  useScriptEditor,
  useScriptManager,
  ScriptSerializer,
  SmartScript,
  ScriptManager
} from '../index';

// 🆕 导入分布式脚本管理
import { DistributedScriptManager, DistributedScript } from '../../../domain/distributed-script';
import { invoke } from '@tauri-apps/api/core';

// 🆕 导入模板转换器
import { 
  ScriptToTemplateConverter,
  type PublishToTemplateFormData,
  type ScriptTemplate 
} from '../utils/script-to-template-converter';

interface ScriptBuilderIntegrationProps {
  // 原有的SmartScriptBuilderPage状态
  steps: any[];
  executorConfig: any;
  onLoadScript: (script: any) => void;
  onUpdateSteps: (steps: any[]) => void;
  onUpdateConfig: (config: any) => void;
}

/**
 * 脚本构建器的脚本管理集成组件
 */
export const ScriptBuilderIntegration: React.FC<ScriptBuilderIntegrationProps> = ({
  steps,
  executorConfig,
  onLoadScript,
  onUpdateSteps,
  onUpdateConfig
}) => {
  const { saveFromUIState, loadScript } = useScriptEditor();
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [managerModalVisible, setManagerModalVisible] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 🆕 分布式脚本相关状态
  const [distributedExportModalVisible, setDistributedExportModalVisible] = useState(false);
  const [distributedImportModalVisible, setDistributedImportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [distributedScriptName, setDistributedScriptName] = useState('');
  const [distributedScriptDescription, setDistributedScriptDescription] = useState('');
  const [importFile, setImportFile] = useState<string>('');

  // 🆕 发布到模板库相关状态
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishForm] = Form.useForm<PublishToTemplateFormData>();

  // 保存脚本到模块化系统
  const handleSaveScript = useCallback(async () => {
    if (!scriptName.trim()) {
      message.warning('请输入脚本名称');
      return;
    }

    setSaving(true);
    try {
      const savedScript = await saveFromUIState(
        scriptName,
        scriptDescription || `包含 ${steps.length} 个步骤的智能脚本`,
        steps,
        executorConfig,
        {
          category: '智能脚本',
          tags: ['自动化', '构建器创建']
        }
      );

      console.log('✅ 脚本保存成功:', savedScript);
      setSaveModalVisible(false);
      setScriptName('');
      setScriptDescription('');
    } catch (error) {
      console.error('❌ 保存脚本失败:', error);
    } finally {
      setSaving(false);
    }
  }, [scriptName, scriptDescription, steps, executorConfig, saveFromUIState]);

  // 从模块化系统加载脚本
  const handleLoadScript = useCallback(async (script: SmartScript) => {
    try {
      // 反序列化脚本到UI状态
      const { steps: deserializedSteps, config: deserializedConfig } = 
        ScriptSerializer.deserializeScript(script);

      // 更新UI状态
      onUpdateSteps(deserializedSteps);
      onUpdateConfig(deserializedConfig);
      onLoadScript(script);

      message.success(`脚本 "${script.name}" 加载成功`);
      setManagerModalVisible(false);
    } catch (error) {
      console.error('❌ 加载脚本失败:', error);
      message.error('加载脚本失败');
    }
  }, [onLoadScript, onUpdateSteps, onUpdateConfig]);

  // 🆕 导出分布式脚本
  const handleExportDistributedScript = useCallback(async () => {
    if (!distributedScriptName.trim()) {
      message.warning('请输入脚本名称');
      return;
    }

    setExporting(true);
    try {
      // 创建分布式脚本
      const distributedScript: DistributedScript = {
        id: `distributed_${Date.now()}`,
        name: distributedScriptName,
        description: distributedScriptDescription || `包含 ${steps.length} 个步骤的分布式脚本`,
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        steps: [],
        xmlSnapshotPool: {},
        metadata: {
          targetApp: '小红书',
          targetAppPackage: 'com.xingin.xhs',
          author: 'SmartScriptBuilder',
          platform: 'android',
          tags: ['自动化', '分布式', '跨设备'],
        },
        runtime: {
          maxRetries: executorConfig.default_retry_count || 3,
          timeoutMs: executorConfig.default_timeout_ms || 10000,
          enableSmartFallback: executorConfig.smart_recovery_enabled || true,
        },
      };

      // 为每个有XML快照的步骤创建分布式步骤
      for (const step of steps) {
        if (step.parameters?.xmlContent) {
          const distributedStep = DistributedScriptManager.createDistributedStep(
            {
              id: step.id,
              name: step.name || `步骤_${step.id}`,
              actionType: step.step_type || 'click',
              params: step.parameters || {},
              locator: step.parameters?.locator || {
                absoluteXPath: step.parameters?.xpath || '',
                attributes: {
                  resourceId: step.parameters?.resource_id,
                  text: step.parameters?.text,
                  contentDesc: step.parameters?.content_desc,
                  className: step.parameters?.class_name,
                },
              },
              createdAt: Date.now(),
              description: step.description,
            },
            step.parameters.xmlContent,
            step.parameters.deviceInfo,
            step.parameters.pageInfo
          );
          
          distributedScript.steps.push(distributedStep);
        }
      }

      // 导出脚本（无需优化，直接导出）
      const exportScript = distributedScript;

      // 使用Tauri保存文件
      const fileName = `${distributedScriptName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_distributed.json`;
      
      try {
        // 调用Tauri后端保存文件
        await invoke('save_file_dialog', {
          content: JSON.stringify(exportScript, null, 2),
          defaultFileName: fileName,
          filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });
        
        message.success(`分布式脚本已导出: ${fileName}`);
        setDistributedExportModalVisible(false);
        setDistributedScriptName('');
        setDistributedScriptDescription('');
      } catch (saveError) {
        // 如果Tauri保存失败，尝试下载方式
        console.warn('Tauri保存失败，使用浏览器下载:', saveError);
        
        const blob = new Blob([JSON.stringify(exportScript, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        message.success(`分布式脚本已下载: ${fileName}`);
        setDistributedExportModalVisible(false);
        setDistributedScriptName('');
        setDistributedScriptDescription('');
      }

    } catch (error) {
      console.error('❌ 导出分布式脚本失败:', error);
      message.error('导出分布式脚本失败');
    } finally {
      setExporting(false);
    }
  }, [distributedScriptName, distributedScriptDescription, steps, executorConfig]);

  // 🆕 导入分布式脚本
  const handleImportDistributedScript = useCallback(async () => {
    if (!importFile) {
      message.warning('请选择脚本文件');
      return;
    }

    setImporting(true);
    try {
      // 使用Tauri读取文件
      let scriptContent: string;
      try {
        scriptContent = await invoke('read_file_dialog', {
          filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });
      } catch (readError) {
        message.error('无法读取文件，请检查文件是否存在');
        return;
      }

      // 解析分布式脚本
      const distributedScript: DistributedScript = JSON.parse(scriptContent);
      
      // 验证脚本格式
      const validationResult = DistributedScriptManager.validateScript(distributedScript);
      if (!validationResult.valid) {
        message.error(`脚本格式无效: ${validationResult.errors.join(', ')}`);
        return;
      }

      // 转换分布式步骤为UI步骤格式（仅写入新结构：xmlSnapshot/elementLocator）
      const uiSteps = distributedScript.steps.map(distStep => ({
        id: distStep.id,
        name: distStep.name,
        step_type: distStep.actionType,
        description: distStep.description,
        enabled: true,
        parameters: {
          ...distStep.params,
          xmlSnapshot: {
            xmlContent: distStep.xmlSnapshot.xmlContent,
            xmlHash: distStep.xmlSnapshot.xmlHash,
            timestamp: distStep.xmlSnapshot.timestamp,
            deviceInfo: {
              deviceId: distStep.xmlSnapshot.deviceInfo?.deviceId || 'unknown',
              deviceName: distStep.xmlSnapshot.deviceInfo?.deviceName || 'unknown',
              appPackage: distStep.xmlSnapshot.pageInfo?.appPackage || 'com.xingin.xhs',
              activityName: distStep.xmlSnapshot.pageInfo?.activityName || 'unknown',
            },
            pageInfo: {
              pageTitle: distStep.xmlSnapshot.pageInfo?.pageTitle || '未知页面',
              pageType: 'unknown',
              elementCount: 0,
            }
          },
          elementLocator: {
            selectedBounds: { left: 0, top: 0, right: 0, bottom: 0 },
            elementPath: distStep.locator.absoluteXPath || distStep.locator.predicateXPath || '',
            confidence: 0.8,
            additionalInfo: {
              xpath: distStep.locator.absoluteXPath,
              resourceId: distStep.locator.attributes?.resourceId,
              text: distStep.locator.attributes?.text,
              contentDesc: distStep.locator.attributes?.contentDesc,
              className: distStep.locator.attributes?.className,
            }
          },
          // 兼容展示字段（只读用途，不再写入旧 xmlContent/xmlCacheId）
          xpath: distStep.locator.absoluteXPath,
          resource_id: distStep.locator.attributes?.resourceId,
          text: distStep.locator.attributes?.text,
          content_desc: distStep.locator.attributes?.contentDesc,
          class_name: distStep.locator.attributes?.className,
        }
      }));

      // 更新UI状态
      onUpdateSteps(uiSteps);
      if (distributedScript.runtime) {
        onUpdateConfig({
          default_retry_count: distributedScript.runtime.maxRetries || 3,
          default_timeout_ms: distributedScript.runtime.timeoutMs || 10000,
          smart_recovery_enabled: distributedScript.runtime.enableSmartFallback || true,
        });
      }

      message.success(`分布式脚本 "${distributedScript.name}" 导入成功 (${uiSteps.length} 个步骤)`);
      setDistributedImportModalVisible(false);
      setImportFile('');

    } catch (error) {
      console.error('❌ 导入分布式脚本失败:', error);
      message.error('导入分布式脚本失败，请检查文件格式');
    } finally {
      setImporting(false);
    }
  }, [importFile, onUpdateSteps, onUpdateConfig]);

  // 🆕 发布到模板库
  const handlePublishToTemplate = useCallback(async () => {
    try {
      const formData = await publishForm.validateFields();
      
      if (!formData.name.trim()) {
        message.warning('请输入模板名称');
        return;
      }

      setPublishing(true);

      // 转换为模板格式
      const template = ScriptToTemplateConverter.convertToTemplate(
        steps,
        executorConfig,
        formData
      );

      // 保存到模板库（使用 localStorage，与 TemplateLibrary 组件一致）
      try {
        const userTemplates = JSON.parse(localStorage.getItem('userTemplates') || '[]');
        userTemplates.push(template);
        localStorage.setItem('userTemplates', JSON.stringify(userTemplates));
        
        message.success(`模板 "${template.name}" 已发布到模板库！`);
        setPublishModalVisible(false);
        publishForm.resetFields();
      } catch (error) {
        console.error('保存模板到本地存储失败:', error);
        message.error('发布失败，请重试');
      }

    } catch (error) {
      console.error('❌ 发布到模板库失败:', error);
      message.error('发布失败，请检查表单内容');
    } finally {
      setPublishing(false);
    }
  }, [steps, executorConfig, publishForm]);

  // 🆕 显示发布模态框并预填充推荐信息
  const showPublishModal = useCallback(() => {
    if (steps.length === 0) {
      message.warning('请先添加一些脚本步骤');
      return;
    }

    // 生成推荐信息
    const recommendedInfo = ScriptToTemplateConverter.generateRecommendedInfo(steps);
    
    // 预填充表单
    publishForm.setFieldsValue({
      category: recommendedInfo.suggestedCategory,
      targetApp: recommendedInfo.targetApp,
      difficulty: recommendedInfo.difficulty,
      estimatedTime: recommendedInfo.estimatedTime,
      tags: recommendedInfo.suggestedTags
    });

    setPublishModalVisible(true);
  }, [steps, publishForm]);

  return (
    <Space wrap>
      {/* 保存脚本按钮 */}
      <Button
        icon={<SaveOutlined />}
        onClick={() => setSaveModalVisible(true)}
        disabled={steps.length === 0}
      >
        保存脚本
      </Button>

      {/* 🆕 导出分布式脚本按钮 */}
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={() => setDistributedExportModalVisible(true)}
        disabled={steps.length === 0}
      >
        导出分布式脚本
      </Button>

      {/* 🆕 导入分布式脚本按钮 */}
      <Button
        icon={<FolderOpenOutlined />}
        onClick={() => setDistributedImportModalVisible(true)}
      >
        导入分布式脚本
      </Button>

      {/* 脚本管理器按钮 */}
      <Button
        icon={<MenuOutlined />}
        onClick={() => setManagerModalVisible(true)}
      >
        脚本管理器
      </Button>

      {/* 🆕 发布到模板库按钮 */}
      <Button
        type="default"
        icon={<CloudUploadOutlined />}
        onClick={showPublishModal}
        disabled={steps.length === 0}
      >
        发布到模板库
      </Button>

      {/* 保存脚本对话框 */}
      <Modal
        title="保存智能脚本"
        open={saveModalVisible}
        onOk={handleSaveScript}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={saving}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <label>脚本名称 *</label>
            <Input
              placeholder="输入脚本名称"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>脚本描述</label>
            <Input.TextArea
              placeholder="输入脚本描述（可选）"
              value={scriptDescription}
              onChange={(e) => setScriptDescription(e.target.value)}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>

          <Card size="small" title="脚本预览">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>步骤数量: <strong>{steps.length}</strong></div>
              <div>
                启用步骤: <strong>{steps.filter(s => s.enabled !== false).length}</strong>
              </div>
              {steps.length > 0 && (
                <div>
                  <div>包含步骤类型:</div>
                  <Space wrap>
                    {[...new Set(steps.map(s => s.step_type || s.type))].map(type => (
                      <span key={type} style={{ 
                        background: '#f0f0f0', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {type}
                      </span>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Space>
      </Modal>

      {/* 脚本管理器对话框 */}
      <Modal
        title="脚本管理器"
        open={managerModalVisible}
        onCancel={() => setManagerModalVisible(false)}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        <ScriptManager 
          onEditScript={handleLoadScript}
          selectedDeviceId="emulator-5554" // 可以从父组件传入
        />
      </Modal>

      {/* 🆕 导出分布式脚本对话框 */}
      <Modal
        title="导出分布式脚本"
        open={distributedExportModalVisible}
        onOk={handleExportDistributedScript}
        onCancel={() => setDistributedExportModalVisible(false)}
        confirmLoading={exporting}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="分布式脚本特性"
            description="分布式脚本包含完整的XML快照，可以在不同设备间迁移使用，无需依赖本地缓存。"
            type="info"
            showIcon
          />
          
          <div>
            <label>脚本名称 *</label>
            <Input
              placeholder="输入分布式脚本名称"
              value={distributedScriptName}
              onChange={(e) => setDistributedScriptName(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>脚本描述</label>
            <Input.TextArea
              placeholder="输入脚本描述（可选）"
              value={distributedScriptDescription}
              onChange={(e) => setDistributedScriptDescription(e.target.value)}
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>

          <Card size="small" title="分布式脚本预览">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>总步骤数: <strong>{steps.length}</strong></div>
              <div>
                包含XML快照的步骤: <strong>{steps.filter(s => s.parameters?.xmlContent).length}</strong>
              </div>
              <div>
                跨设备兼容性: <strong>✅ 完全支持</strong>
              </div>
              {steps.length > 0 && (
                <div>
                  <div>包含操作类型:</div>
                  <Space wrap>
                    {[...new Set(steps.map(s => s.step_type || s.type))].map(type => (
                      <span key={type} style={{ 
                        background: '#e6f7ff', 
                        color: '#1890ff',
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        border: '1px solid #91d5ff'
                      }}>
                        {type}
                      </span>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Space>
      </Modal>

      {/* 🆕 导入分布式脚本对话框 */}
      <Modal
        title="导入分布式脚本"
        open={distributedImportModalVisible}
        onOk={handleImportDistributedScript}
        onCancel={() => setDistributedImportModalVisible(false)}
        confirmLoading={importing}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="导入说明"
            description="选择之前导出的分布式脚本JSON文件，系统将自动恢复所有步骤和XML快照。"
            type="info"
            showIcon
          />
          
          <div>
            <label>选择脚本文件</label>
            <Input
              placeholder="将自动打开文件选择对话框"
              value={importFile}
              onChange={(e) => setImportFile(e.target.value)}
              style={{ marginTop: 8 }}
              readOnly
            />
            <Button 
              type="dashed" 
              style={{ marginTop: 8, width: '100%' }}
              onClick={() => setImportFile('selected')}
            >
              选择分布式脚本文件 (.json)
            </Button>
          </div>
          
          <Card size="small" title="导入效果">
            <Space direction="vertical" size="small">
              <div>• 将替换当前所有步骤</div>
              <div>• 自动恢复XML快照和元素定位信息</div>
              <div>• 保持跨设备兼容性</div>
              <div>• 可直接在当前设备执行</div>
            </Space>
          </Card>
        </Space>
      </Modal>

      {/* 🆕 发布到模板库对话框 */}
      <Modal
        title="发布脚本到模板库"
        open={publishModalVisible}
        onOk={handlePublishToTemplate}
        onCancel={() => {
          setPublishModalVisible(false);
          publishForm.resetFields();
        }}
        confirmLoading={publishing}
        width={700}
        okText="发布到模板库"
        cancelText="取消"
      >
        <Form
          form={publishForm}
          layout="vertical"
          requiredMark={false}
        >
          <Alert
            message="发布说明"
            description="将当前脚本发布为可复用的模板，其他人可以在模板库中找到并使用您的脚本。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="为您的模板起个好名字" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="模板分类"
                rules={[{ required: true, message: '请选择模板分类' }]}
              >
                <Select placeholder="选择分类">
                  <Select.Option value="social">社交应用</Select.Option>
                  <Select.Option value="ecommerce">电商购物</Select.Option>
                  <Select.Option value="productivity">办公效率</Select.Option>
                  <Select.Option value="entertainment">娱乐应用</Select.Option>
                  <Select.Option value="system">系统操作</Select.Option>
                  <Select.Option value="custom">自定义</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="模板描述"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="详细描述模板的功能和使用场景"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetApp"
                label="目标应用"
                rules={[{ required: true, message: '请输入目标应用' }]}
              >
                <Input placeholder="如：小红书、微信等" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度等级"
                rules={[{ required: true, message: '请选择难度等级' }]}
              >
                <Select placeholder="选择难度">
                  <Select.Option value="beginner">初级</Select.Option>
                  <Select.Option value="intermediate">中级</Select.Option>
                  <Select.Option value="advanced">高级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimatedTime"
                label="预计执行时间"
              >
                <Input placeholder="如：2-3分钟" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="添加标签，按回车确认"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Card size="small" title="脚本预览" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <strong>步骤数量:</strong> {steps.length} 个
              </div>
              <div>
                <strong>启用步骤:</strong> {steps.filter(s => s.enabled !== false).length} 个
              </div>
              {steps.length > 0 && (
                <div>
                  <strong>包含操作类型:</strong>
                  <div style={{ marginTop: 4 }}>
                    {[...new Set(steps.map(s => s.step_type))].map(type => (
                      <Tag key={type} color="blue" style={{ margin: '2px' }}>
                        {type}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Form>
      </Modal>
    </Space>
  );
};

export default ScriptBuilderIntegration;