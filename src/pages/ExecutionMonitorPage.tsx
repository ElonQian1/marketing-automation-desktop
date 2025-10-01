import React, { useState } from 'react';
import { Typography, Space } from 'antd';
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import SimpleExecutionMonitor from '../components/execution/SimpleExecutionMonitor';
import PageHeader from './execution-monitor/components/PageHeader';
import InfoAlert from './execution-monitor/components/InfoAlert';
import ScriptList from './execution-monitor/components/ScriptList';
import MonitorFeatureGrid from './execution-monitor/components/MonitorFeatureGrid';

const { Title, Text, Paragraph } = Typography;

// 示例脚本数据
const SAMPLE_SCRIPTS = [
  {
    id: 'script_1',
    name: '小红书自动关注脚本',
    description: '自动打开小红书，导入通讯录，批量关注联系人',
    steps: [
      { 
        id: 'step_1', 
        name: '打开小红书应用',
        type: 'open_app',
        parameters: { package_name: 'com.xingin.xhs' }
      },
      { 
        id: 'step_2', 
        name: '点击头像进入个人页面',
        type: 'tap',
        parameters: { coordinate: '100,200' }
      },
      { 
        id: 'step_3', 
        name: '等待侧边栏加载',
        type: 'wait_for_element',
        parameters: { condition_type: 'text', selector: '发现好友' }
      },
      { 
        id: 'step_4', 
        name: '点击发现好友',
        type: 'tap',
        parameters: { coordinate: '200,300' }
      },
      { 
        id: 'step_5', 
        name: '导入通讯录',
        type: 'tap',
        parameters: { coordinate: '300,400' }
      }
    ]
  },
  {
    id: 'script_2',
    name: '微信群发消息脚本',
    description: '批量向多个微信群发送相同消息',
    steps: [
      { 
        id: 'step_1', 
        name: '打开微信',
        type: 'open_app',
        parameters: { package_name: 'com.tencent.mm' }
      },
      { 
        id: 'step_2', 
        name: '进入通讯录',
        type: 'tap',
        parameters: { coordinate: '150,600' }
      },
      { 
        id: 'step_3', 
        name: '搜索群聊',
        type: 'input',
        parameters: { text: '工作群' }
      }
    ]
  },
  {
    id: 'script_3',
    name: '抖音自动点赞脚本',
    description: '自动浏览抖音视频并进行点赞操作',
    steps: [
      { 
        id: 'step_1', 
        name: '打开抖音',
        type: 'open_app',
        parameters: { package_name: 'com.ss.android.ugc.aweme' }
      },
      { 
        id: 'step_2', 
        name: '等待首页加载',
        type: 'wait',
        parameters: { duration: 3 }
      },
      { 
        id: 'step_3', 
        name: '双击点赞',
        type: 'tap',
        parameters: { coordinate: '400,600' }
      },
      { 
        id: 'step_4', 
        name: '滑动到下一个视频',
        type: 'swipe',
        parameters: { start_coordinate: '400,800', end_coordinate: '400,200' }
      }
    ]
  }
];

const ExecutionMonitorPage: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [showMonitor, setShowMonitor] = useState(false);

  const handleSelectScript = (script: any) => {
    setSelectedScript(script);
    setShowMonitor(true);
  };

  const handleBackToList = () => {
    setShowMonitor(false);
    setSelectedScript(null);
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'open_app':
        return <PlayCircleOutlined />;
      case 'tap':
        return <CheckCircleOutlined />;
      case 'wait':
      case 'wait_for_element':
        return <ClockCircleOutlined />;
      default:
        return <ExclamationCircleOutlined />;
    }
  };

  const getStepTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      open_app: '打开应用',
      tap: '点击操作',
      input: '输入文本',
      wait: '等待',
      wait_for_element: '等待元素',
      swipe: '滑动操作',
      back: '返回'
    };
    return typeMap[type] || type;
  };

  if (showMonitor && selectedScript) {
    return (
      <SimpleExecutionMonitor
        script={selectedScript}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <Space direction="vertical" size="large">
      <PageHeader />
      <InfoAlert />
      <ScriptList
        scripts={SAMPLE_SCRIPTS}
        onExecute={handleSelectScript}
        getStepTypeIcon={getStepTypeIcon}
        getStepTypeText={getStepTypeText}
      />
      <MonitorFeatureGrid />
    </Space>
  );
};

export default ExecutionMonitorPage;

