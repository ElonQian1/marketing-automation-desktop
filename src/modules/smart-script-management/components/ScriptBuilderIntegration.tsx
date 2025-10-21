// src/modules/smart-script-management/components/ScriptBuilderIntegration.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

// SmartScriptBuilderPage 的脚本管理集成示例

import React, { useState, useCallback } from 'react';
import { Card, Button, Space, Modal, Input, message, Alert, Form, Select, Row, Col, Tag, Tooltip, Dropdown } from 'antd';
import { SaveOutlined, FolderOpenOutlined, MenuOutlined, CloudUploadOutlined, ShareAltOutlined } from '@ant-design/icons';

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
  const [importShareCode, setImportShareCode] = useState<string>('');

  // 🆕 发布到模板库相关状态
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishForm] = Form.useForm<PublishToTemplateFormData>();

  // 🆕 快速分享相关状态
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareCode, setShareCode] = useState('');

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
        // 使用浏览器的文件保存功能
        const dataStr = JSON.stringify(exportScript, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success(`分布式脚本已保存: ${fileName}`);
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
    // 如果没有输入分享码，弹出文件选择对话框
    if (!importShareCode || importShareCode.trim() === '') {
      try {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        // 添加文件选择事件监听器
        fileInput.addEventListener('change', async (event) => {
          const files = (event.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const content = e.target?.result as string;
                await importFromContent(content);
              } catch (error) {
                console.error('文件读取失败:', error);
                message.error('文件读取失败，请检查文件格式');
              }
            };
            
            reader.readAsText(file);
          } else {
            message.info('取消导入');
          }
        });
        
        // 添加到DOM并触发点击
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
        
      } catch (error) {
        console.error('文件选择失败:', error);
        message.error('文件选择失败，请重试');
      }
    } else {
      // 使用分享码导入
      await importFromShareCode(importShareCode.trim());
    }
  }, [importShareCode]);

  // 从分享码导入
  const importFromShareCode = useCallback(async (shareCode: string) => {
    setImporting(true);
    try {
      // 检查是否是分享码（12位字符）
      if (shareCode.length === 12 && /^[A-Za-z0-9+/]+$/.test(shareCode)) {
        // 尝试从分享码获取脚本
        const shareKey = `share_${shareCode}`;
        const storedScript = localStorage.getItem(shareKey);
        
        if (storedScript) {
          await importFromContent(storedScript);
          message.success('分享码验证成功！');
        } else {
          message.error('分享码无效或已过期，请检查分享码是否正确');
        }
      } else {
        message.error('分享码格式不正确，应为12位字符');
      }
    } catch (error) {
      console.error('❌ 分享码导入失败:', error);
      message.error('分享码导入失败');
    } finally {
      setImporting(false);
    }
  }, []);

  // 从内容导入脚本
  const importFromContent = useCallback(async (scriptContent: string) => {
    setImporting(true);
    try {
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
      setImportShareCode('');
    } catch (error) {
      console.error('❌ 导入分布式脚本失败:', error);
      message.error('导入分布式脚本失败，请检查文件格式');
    } finally {
      setImporting(false);
    }
  }, [onUpdateSteps, onUpdateConfig]);

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

  // 🆕 快速分享脚本
  const handleQuickShare = useCallback(async () => {
    if (steps.length === 0) {
      message.warning('请先添加一些脚本步骤');
      return;
    }

    try {
      // 创建分布式脚本
      const distributedScript: DistributedScript = {
        id: `shared_${Date.now()}`,
        name: `共享脚本_${Date.now()}`,
        description: '通过快速分享生成的脚本',
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        steps: [],
        xmlSnapshotPool: {},
        metadata: {
          targetApp: '通用应用',
          targetAppPackage: 'com.example.app',
          author: 'SmartScriptBuilder',
          platform: 'android',
          tags: ['自动化', '分布式', '快速分享'],
        },
        runtime: {
          maxRetries: executorConfig.default_retry_count || 3,
          timeoutMs: executorConfig.default_timeout_ms || 10000,
          enableSmartFallback: executorConfig.smart_recovery_enabled || true,
        },
      };

      // 为每个有XML快照的步骤创建分布式步骤
      for (const step of steps) {
        if (step.parameters?.xmlSnapshot?.xmlContent) {
          const distributedStep = DistributedScriptManager.createDistributedStep(
            {
              id: step.id,
              name: step.name || `步骤_${step.id}`,
              actionType: step.step_type || 'click',
              params: step.parameters || {},
              locator: {
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
            step.parameters.xmlSnapshot.xmlContent,
            step.parameters.xmlSnapshot.deviceInfo,
            step.parameters.xmlSnapshot.pageInfo
          );
          
          distributedScript.steps.push(distributedStep);
        }
      }

      // 生成分享码（Base64编码）
      const scriptData = JSON.stringify(distributedScript);
      const shareCodeGenerated = btoa(encodeURIComponent(scriptData)).slice(0, 12);
      
      // 保存到临时存储（实际项目中可以保存到服务器）
      const shareKey = `share_${shareCodeGenerated}`;
      localStorage.setItem(shareKey, scriptData);
      
      setShareCode(shareCodeGenerated);
      setShareModalVisible(true);
      
      message.success('分享码生成成功！');
    } catch (error) {
      console.error('❌ 生成分享码失败:', error);
      message.error('生成分享码失败');
    }
  }, [steps, executorConfig]);

  // 🆕 快速导出为文件
  const handleQuickExport = useCallback(() => {
    if (steps.length === 0) {
      message.warning('请先添加一些脚本步骤');
      return;
    }

    try {
      // 创建分布式脚本
      const distributedScript: DistributedScript = {
        id: `export_${Date.now()}`,
        name: `导出脚本_${Date.now()}`,
        description: `导出时间: ${new Date().toLocaleString()}`,
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        steps: [],
        xmlSnapshotPool: {},
        metadata: {
          targetApp: '通用应用',
          targetAppPackage: 'com.example.app',
          author: 'SmartScriptBuilder',
          platform: 'android',
          tags: ['自动化', '分布式', '导出分享'],
        },
        runtime: {
          maxRetries: executorConfig.default_retry_count || 3,
          timeoutMs: executorConfig.default_timeout_ms || 10000,
          enableSmartFallback: executorConfig.smart_recovery_enabled || true,
        },
      };

      // 为每个有XML快照的步骤创建分布式步骤
      for (const step of steps) {
        if (step.parameters?.xmlSnapshot?.xmlContent) {
          const distributedStep = DistributedScriptManager.createDistributedStep(
            {
              id: step.id,
              name: step.name || `步骤_${step.id}`,
              actionType: step.step_type || 'click',
              params: step.parameters || {},
              locator: {
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
            step.parameters.xmlSnapshot.xmlContent,
            step.parameters.xmlSnapshot.deviceInfo,
            step.parameters.xmlSnapshot.pageInfo
          );
          
          distributedScript.steps.push(distributedStep);
        }
      }

      // 下载文件
      const dataStr = JSON.stringify(distributedScript, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `脚本分享_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('脚本已导出，可以发送给朋友！');
    } catch (error) {
      console.error('❌ 快速导出失败:', error);
      message.error('导出失败');
    }
  }, [steps, executorConfig]);

  // 🆕 复制分享码
  const handleCopyShareCode = useCallback(() => {
    if (!shareCode) return;
    
    const shareText = `我分享了一个自动化脚本给你！\n\n分享码: ${shareCode}\n\n使用方法:\n1. 打开智能脚本构建器\n2. 点击"导入分布式脚本"\n3. 输入分享码导入\n\n快来试试吧！`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      message.success('分享内容已复制到剪贴板！');
    }).catch(() => {
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('分享内容已复制到剪贴板！');
    });
  }, [shareCode]);

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

      {/* 🆕 快速分享按钮 */}
      <Dropdown
        menu={{
          items: [
            {
              key: 'share-code',
              label: '生成分享码',
              onClick: handleQuickShare,
              disabled: steps.length === 0,
            },
            {
              key: 'export-file',
              label: '导出分享文件',
              onClick: handleQuickExport,
              disabled: steps.length === 0,
            },
          ]
        }}
        trigger={['click']}
      >
        <Button
          icon={<ShareAltOutlined />}
          disabled={steps.length === 0}
        >
          快速分享
        </Button>
      </Dropdown>

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
            description="可以通过分享码快速导入，或选择分布式脚本JSON文件进行导入。"
            type="info"
            showIcon
          />
          
          <div>
            <label>分享码导入</label>
            <Input
              placeholder="输入12位分享码..."
              value={importShareCode}
              onChange={(e) => setImportShareCode(e.target.value)}
              style={{ marginTop: 8 }}
              suffix={
                importShareCode.length === 12 ? (
                  <Tag color="green">有效格式</Tag>
                ) : importShareCode.length > 0 ? (
                  <Tag color="red">格式错误</Tag>
                ) : null
              }
            />
          </div>

          <div style={{ textAlign: 'center', color: '#999' }}>
            或
          </div>

          <div>
            <label>文件导入</label>
            <div style={{ marginTop: 8 }}>
              <Button 
                type="dashed" 
                style={{ width: '100%' }}
                icon={<FolderOpenOutlined />}
              >
                选择分布式脚本文件 (.json)
              </Button>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                点击上方按钮弹出文件选择对话框
              </div>
            </div>
          </div>
          
          <Card size="small" title="导入效果">
            <Space direction="vertical" size="small">
              <div>• 支持12位分享码快速导入</div>
              <div>• 支持JSON文件导入</div>
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

      {/* 🆕 快速分享对话框 */}
      <Modal
        title="🎉 脚本分享"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            关闭
          </Button>,
          <Button key="copy" type="primary" onClick={handleCopyShareCode}>
            复制分享内容
          </Button>,
        ]}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="分享码生成成功！"
            description="您可以将分享码发送给朋友，朋友可以通过导入功能使用您的脚本。"
            type="success"
            showIcon
          />
          
          <Card size="small" title="分享码">
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              letterSpacing: '4px'
            }}>
              {shareCode}
            </div>
          </Card>

          <Card size="small" title="使用说明">
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>复制分享内容并发送给朋友</li>
              <li>朋友打开智能脚本构建器</li>
              <li>点击"导入分布式脚本"按钮</li>
              <li>输入分享码即可导入脚本</li>
            </ol>
          </Card>

          <Alert
            message="提示"
            description="分享码会保存24小时，请及时使用。建议同时导出文件作为备份。"
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </Space>
  );
};

export default ScriptBuilderIntegration;