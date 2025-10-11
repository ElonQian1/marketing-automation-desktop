// src/modules/deduplication-control/components/SafetyConfigPanel.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * 安全配置面板
 * 
 * 提供去重、频控、熔断器等安全机制的配置界面
 */
import React, { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Switch, 
  Form, 
  InputNumber, 
  Select, 
  TimePicker, 
  Button, 
  Space, 
  Divider,
  Alert,
  Tag,
  Checkbox,
  Slider,
  Typography
} from 'antd';
import { 
  DeduplicationConfig,
  RateLimitConfig,
  CircuitBreakerConfig,
  DeduplicationStrategy,
  RateLimitType
} from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface SafetyConfigPanelProps {
  deduplicationConfig: DeduplicationConfig;
  rateLimitConfig: RateLimitConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
  onDeduplicationChange: (config: Partial<DeduplicationConfig>) => void;
  onRateLimitChange: (config: Partial<RateLimitConfig>) => void;
  onCircuitBreakerChange: (config: Partial<CircuitBreakerConfig>) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
}

/**
 * 去重配置组件
 */
const DeduplicationConfigCard: React.FC<{
  config: DeduplicationConfig;
  onChange: (config: Partial<DeduplicationConfig>) => void;
}> = ({ config, onChange }) => {
  return (
    <Card title="去重策略配置" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 启用的策略 */}
        <div>
          <Text strong>启用的去重策略：</Text>
          <div style={{ marginTop: 8 }}>
            <Checkbox.Group
              value={config.strategies}
              onChange={(strategies) => 
                onChange({ strategies: strategies as DeduplicationStrategy[] })
              }
            >
              <Space direction="vertical">
                <Checkbox value={DeduplicationStrategy.COMMENT_LEVEL}>
                  评论级去重
                </Checkbox>
                <Checkbox value={DeduplicationStrategy.USER_LEVEL}>
                  用户级去重
                </Checkbox>
                <Checkbox value={DeduplicationStrategy.CONTENT_LEVEL}>
                  内容级去重
                </Checkbox>
                <Checkbox value={DeduplicationStrategy.CROSS_DEVICE}>
                  跨设备去重
                </Checkbox>
              </Space>
            </Checkbox.Group>
          </div>
        </div>
        
        <Divider />
        
        {/* 评论级去重配置 */}
        <Card title="评论级去重" size="small" type="inner">
          <Form layout="vertical" size="small">
            <Form.Item label="启用评论级去重">
              <Switch
                checked={config.commentLevel.enabled}
                onChange={(enabled) => 
                  onChange({ 
                    commentLevel: { ...config.commentLevel, enabled } 
                  })
                }
              />
            </Form.Item>
            
            <Form.Item label="相似度阈值" extra="0-1之间，越高越严格">
              <Slider
                min={0.1}
                max={1}
                step={0.1}
                value={config.commentLevel.similarityThreshold}
                onChange={(value) => 
                  onChange({ 
                    commentLevel: { 
                      ...config.commentLevel, 
                      similarityThreshold: value 
                    } 
                  })
                }
                marks={{
                  0.1: '0.1',
                  0.5: '0.5',
                  0.8: '0.8',
                  1: '1.0'
                }}
              />
            </Form.Item>
            
            <Form.Item label="时间窗口（小时）">
              <InputNumber
                min={1}
                max={168}
                value={config.commentLevel.timeWindowHours}
                onChange={(value) => 
                  onChange({ 
                    commentLevel: { 
                      ...config.commentLevel, 
                      timeWindowHours: value || 24 
                    } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Card>
        
        {/* 用户级去重配置 */}
        <Card title="用户级去重" size="small" type="inner">
          <Form layout="vertical" size="small">
            <Form.Item label="启用用户级去重">
              <Switch
                checked={config.userLevel.enabled}
                onChange={(enabled) => 
                  onChange({ 
                    userLevel: { ...config.userLevel, enabled } 
                  })
                }
              />
            </Form.Item>
            
            <Form.Item label="冷却期（天）">
              <InputNumber
                min={1}
                max={30}
                value={config.userLevel.cooldownDays}
                onChange={(value) => 
                  onChange({ 
                    userLevel: { 
                      ...config.userLevel, 
                      cooldownDays: value || 7 
                    } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="跨平台去重">
              <Switch
                checked={config.userLevel.crossPlatform}
                onChange={(crossPlatform) => 
                  onChange({ 
                    userLevel: { ...config.userLevel, crossPlatform } 
                  })
                }
              />
            </Form.Item>
          </Form>
        </Card>
        
        {/* 内容级去重配置 */}
        <Card title="内容级去重" size="small" type="inner">
          <Form layout="vertical" size="small">
            <Form.Item label="启用内容级去重">
              <Switch
                checked={config.contentLevel.enabled}
                onChange={(enabled) => 
                  onChange({ 
                    contentLevel: { ...config.contentLevel, enabled } 
                  })
                }
              />
            </Form.Item>
            
            <Form.Item label="哈希算法">
              <Select
                value={config.contentLevel.hashAlgorithm}
                onChange={(hashAlgorithm) => 
                  onChange({ 
                    contentLevel: { ...config.contentLevel, hashAlgorithm } 
                  })
                }
                style={{ width: '100%' }}
              >
                <Option value="md5">MD5</Option>
                <Option value="sha1">SHA1</Option>
                <Option value="sha256">SHA256</Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="忽略标点符号">
              <Switch
                checked={config.contentLevel.ignorePunctuation}
                onChange={(ignorePunctuation) => 
                  onChange({ 
                    contentLevel: { ...config.contentLevel, ignorePunctuation } 
                  })
                }
              />
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </Card>
  );
};

/**
 * 频控配置组件
 */
const RateLimitConfigCard: React.FC<{
  config: RateLimitConfig;
  onChange: (config: Partial<RateLimitConfig>) => void;
}> = ({ config, onChange }) => {
  return (
    <Card title="频控策略配置" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 启用的频控类型 */}
        <div>
          <Text strong>启用的频控类型：</Text>
          <div style={{ marginTop: 8 }}>
            <Checkbox.Group
              value={config.types}
              onChange={(types) => 
                onChange({ types: types as RateLimitType[] })
              }
            >
              <Space direction="vertical">
                <Checkbox value={RateLimitType.HOURLY}>每小时限制</Checkbox>
                <Checkbox value={RateLimitType.DAILY}>每日限制</Checkbox>
                <Checkbox value={RateLimitType.INTERVAL}>间隔限制</Checkbox>
              </Space>
            </Checkbox.Group>
          </div>
        </div>
        
        <Divider />
        
        {/* 每小时限制配置 */}
        <Card title="每小时限制" size="small" type="inner">
          <Form layout="vertical" size="small">
            <Form.Item label="启用每小时限制">
              <Switch
                checked={config.hourly.enabled}
                onChange={(enabled) => 
                  onChange({ 
                    hourly: { ...config.hourly, enabled } 
                  })
                }
              />
            </Form.Item>
            
            <Form.Item label="总限制次数">
              <InputNumber
                min={1}
                max={1000}
                value={config.hourly.limit}
                onChange={(value) => 
                  onChange({ 
                    hourly: { ...config.hourly, limit: value || 50 } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="关注任务限制">
              <InputNumber
                min={1}
                max={500}
                value={config.hourly.followLimit}
                onChange={(value) => 
                  onChange({ 
                    hourly: { ...config.hourly, followLimit: value || 30 } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="回复任务限制">
              <InputNumber
                min={1}
                max={500}
                value={config.hourly.replyLimit}
                onChange={(value) => 
                  onChange({ 
                    hourly: { ...config.hourly, replyLimit: value || 20 } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Card>
        
        {/* 每日限制配置 */}
        <Card title="每日限制" size="small" type="inner">
          <Form layout="vertical" size="small">
            <Form.Item label="启用每日限制">
              <Switch
                checked={config.daily.enabled}
                onChange={(enabled) => 
                  onChange({ 
                    daily: { ...config.daily, enabled } 
                  })
                }
              />
            </Form.Item>
            
            <Form.Item label="总限制次数">
              <InputNumber
                min={1}
                max={10000}
                value={config.daily.limit}
                onChange={(value) => 
                  onChange({ 
                    daily: { ...config.daily, limit: value || 200 } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="关注任务限制">
              <InputNumber
                min={1}
                max={5000}
                value={config.daily.followLimit}
                onChange={(value) => 
                  onChange({ 
                    daily: { ...config.daily, followLimit: value || 120 } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="回复任务限制">
              <InputNumber
                min={1}
                max={5000}
                value={config.daily.replyLimit}
                onChange={(value) => 
                  onChange({ 
                    daily: { ...config.daily, replyLimit: value || 80 } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Card>
        
        {/* 间隔限制配置 */}
        <Card title="间隔限制" size="small" type="inner">
          <Form layout="vertical" size="small">
            <Form.Item label="启用间隔限制">
              <Switch
                checked={config.interval.enabled}
                onChange={(enabled) => 
                  onChange({ 
                    interval: { ...config.interval, enabled } 
                  })
                }
              />
            </Form.Item>
            
            <Form.Item label="最小间隔（秒）">
              <InputNumber
                min={1}
                max={3600}
                value={config.interval.minIntervalSeconds}
                onChange={(value) => 
                  onChange({ 
                    interval: { 
                      ...config.interval, 
                      minIntervalSeconds: value || 30 
                    } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="最大间隔（秒）">
              <InputNumber
                min={1}
                max={3600}
                value={config.interval.maxIntervalSeconds}
                onChange={(value) => 
                  onChange({ 
                    interval: { 
                      ...config.interval, 
                      maxIntervalSeconds: value || 120 
                    } 
                  })
                }
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item label="随机化间隔">
              <Switch
                checked={config.interval.randomizeInterval}
                onChange={(randomizeInterval) => 
                  onChange({ 
                    interval: { ...config.interval, randomizeInterval } 
                  })
                }
              />
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </Card>
  );
};

/**
 * 熔断器配置组件
 */
const CircuitBreakerConfigCard: React.FC<{
  config: CircuitBreakerConfig;
  onChange: (config: Partial<CircuitBreakerConfig>) => void;
}> = ({ config, onChange }) => {
  return (
    <Card title="熔断器配置" size="small">
      <Form layout="vertical" size="small">
        <Form.Item label="启用熔断器">
          <Switch
            checked={config.enabled}
            onChange={(enabled) => onChange({ enabled })}
          />
        </Form.Item>
        
        <Form.Item label="失败计数阈值">
          <InputNumber
            min={1}
            max={100}
            value={config.failureThreshold}
            onChange={(value) => 
              onChange({ failureThreshold: value || 10 })
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item label="失败率阈值" extra="0-1之间">
          <Slider
            min={0.1}
            max={1}
            step={0.1}
            value={config.failureRateThreshold}
            onChange={(value) => 
              onChange({ failureRateThreshold: value })
            }
            marks={{
              0.1: '10%',
              0.3: '30%',
              0.5: '50%',
              0.7: '70%',
              1: '100%'
            }}
          />
        </Form.Item>
        
        <Form.Item label="时间窗口（分钟）">
          <InputNumber
            min={1}
            max={60}
            value={config.timeWindowMinutes}
            onChange={(value) => 
              onChange({ timeWindowMinutes: value || 10 })
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item label="最小请求数量">
          <InputNumber
            min={1}
            max={50}
            value={config.minimumRequests}
            onChange={(value) => 
              onChange({ minimumRequests: value || 5 })
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item label="熔断持续时间（分钟）">
          <InputNumber
            min={1}
            max={60}
            value={config.openDurationMinutes}
            onChange={(value) => 
              onChange({ openDurationMinutes: value || 5 })
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item label="半开状态最大请求数">
          <InputNumber
            min={1}
            max={20}
            value={config.halfOpenMaxRequests}
            onChange={(value) => 
              onChange({ halfOpenMaxRequests: value || 3 })
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Card title="自动恢复配置" size="small" type="inner" style={{ marginTop: 16 }}>
          <Form.Item label="启用自动恢复">
            <Switch
              checked={config.autoRecovery.enabled}
              onChange={(enabled) => 
                onChange({ 
                  autoRecovery: { ...config.autoRecovery, enabled } 
                })
              }
            />
          </Form.Item>
          
          <Form.Item label="检查间隔（分钟）">
            <InputNumber
              min={1}
              max={30}
              value={config.autoRecovery.checkIntervalMinutes}
              onChange={(value) => 
                onChange({ 
                  autoRecovery: { 
                    ...config.autoRecovery, 
                    checkIntervalMinutes: value || 1 
                  } 
                })
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item label="成功次数阈值">
            <InputNumber
              min={1}
              max={20}
              value={config.autoRecovery.successThreshold}
              onChange={(value) => 
                onChange({ 
                  autoRecovery: { 
                    ...config.autoRecovery, 
                    successThreshold: value || 3 
                  } 
                })
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      </Form>
    </Card>
  );
};

/**
 * 主配置面板组件
 */
export const SafetyConfigPanel: React.FC<SafetyConfigPanelProps> = ({
  deduplicationConfig,
  rateLimitConfig,
  circuitBreakerConfig,
  onDeduplicationChange,
  onRateLimitChange,
  onCircuitBreakerChange,
  onReset,
  onExport,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState('deduplication');
  
  return (
    <div className="light-theme-force" style={{ background: 'var(--bg-light-base)' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0, color: 'var(--text-inverse)' }}>
              安全配置管理
            </Title>
            <Space>
              <Button onClick={onImport} size="small">
                导入配置
              </Button>
              <Button onClick={onExport} size="small">
                导出配置
              </Button>
              <Button onClick={onReset} size="small" danger>
                重置默认
              </Button>
            </Space>
          </div>
        }
        style={{ background: 'var(--bg-light-base)' }}
      >
        <Alert
          message="安全提示"
          description="合理配置安全参数可以有效避免账号风险，建议在了解各项配置含义后进行调整。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="small"
        >
          <TabPane tab="去重配置" key="deduplication">
            <DeduplicationConfigCard
              config={deduplicationConfig}
              onChange={onDeduplicationChange}
            />
          </TabPane>
          
          <TabPane tab="频控配置" key="rateLimit">
            <RateLimitConfigCard
              config={rateLimitConfig}
              onChange={onRateLimitChange}
            />
          </TabPane>
          
          <TabPane tab="熔断器配置" key="circuitBreaker">
            <CircuitBreakerConfigCard
              config={circuitBreakerConfig}
              onChange={onCircuitBreakerChange}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};