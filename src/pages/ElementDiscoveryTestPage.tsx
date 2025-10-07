import React, { useState } from 'react';
import { Button, Card, Typography, Space } from 'antd';
import { ElementDiscoveryModal } from '../components/universal-ui/element-selection/element-discovery';

const { Title, Text } = Typography;

// 模拟的XML数据来测试调试功能
const mockXmlData = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2340]">
    <node index="0" text="" resource-id="" class="android.widget.LinearLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2340]">
      <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2280]">
        <node index="0" text="" resource-id="com.xiaohongshu.app:id/fragment_container" class="android.widget.FrameLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2280]">
          <node index="0" text="" resource-id="" class="android.widget.RelativeLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,0][1080,2280]">
            <node index="0" text="" resource-id="com.xiaohongshu.app:id/title_bar" class="android.widget.RelativeLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,90][1080,180]">
              <node index="0" text="联系人" resource-id="com.xiaohongshu.app:id/left_btn" class="android.widget.TextView" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[30,120][120,150]" />
              <node index="1" text="添加联系人" resource-id="com.xiaohongshu.app:id/title" class="android.widget.TextView" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[480,120][600,150]" />
              <node index="2" text="完成" resource-id="com.xiaohongshu.app:id/right_btn" class="android.widget.TextView" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[960,120][1050,150]" />
            </node>
            <node index="1" text="" resource-id="com.xiaohongshu.app:id/content_container" class="android.widget.LinearLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,180][1080,2280]">
              <node index="0" text="" resource-id="" class="android.widget.ScrollView" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="true" focused="false" scrollable="true" long-clickable="false" password="false" selected="false" bounds="[0,180][1080,2280]">
                <node index="0" text="" resource-id="" class="android.widget.LinearLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[0,180][1080,1800]">
                  <node index="0" text="" resource-id="" class="android.widget.LinearLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[40,240][1040,360]">
                    <node index="0" text="姓名" resource-id="" class="android.widget.TextView" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[40,260][120,280]" />
                    <node index="1" text="" resource-id="com.xiaohongshu.app:id/name_input" class="android.widget.EditText" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="true" password="false" selected="false" bounds="[40,300][1040,340]" />
                  </node>
                  <node index="1" text="" resource-id="" class="android.widget.LinearLayout" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[40,380][1040,500]">
                    <node index="0" text="电话" resource-id="" class="android.widget.TextView" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" bounds="[40,400][120,420]" />
                    <node index="1" text="" resource-id="com.xiaohongshu.app:id/phone_input" class="android.widget.EditText" package="com.xiaohongshu.app" content-desc="" checkable="false" checked="false" clickable="true" enabled="true" focusable="true" focused="false" scrollable="false" long-clickable="true" password="false" selected="false" bounds="[40,440][1040,480]" />
                  </node>
                </node>
              </node>
            </node>
          </node>
        </node>
      </node>
    </node>
  </node>
</hierarchy>`;

// 模拟元素数据 
const mockElements = [
  {
    id: 'elem_1',
    element_type: 'button',
    text: '联系人',
    bounds: { left: 30, top: 120, right: 120, bottom: 150 },
    xpath: '//android.widget.TextView[@resource-id="com.xiaohongshu.app:id/left_btn"]',
    resource_id: 'com.xiaohongshu.app:id/left_btn',
    class_name: 'android.widget.TextView',
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  },
  {
    id: 'elem_2', 
    element_type: 'text',
    text: '添加联系人',
    bounds: { left: 480, top: 120, right: 600, bottom: 150 },
    xpath: '//android.widget.TextView[@resource-id="com.xiaohongshu.app:id/title"]',
    resource_id: 'com.xiaohongshu.app:id/title',
    class_name: 'android.widget.TextView',
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  },
  {
    id: 'elem_3',
    element_type: 'button',
    text: '完成',
    bounds: { left: 960, top: 120, right: 1050, bottom: 150 },
    xpath: '//android.widget.TextView[@resource-id="com.xiaohongshu.app:id/right_btn"]',
    resource_id: 'com.xiaohongshu.app:id/right_btn', 
    class_name: 'android.widget.TextView',
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  },
  {
    id: 'elem_4',
    element_type: 'text',
    text: '姓名',
    bounds: { left: 40, top: 260, right: 120, bottom: 280 },
    xpath: '//android.widget.TextView[1]',
    resource_id: '',
    class_name: 'android.widget.TextView',
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  },
  {
    id: 'elem_5',
    element_type: 'input',
    text: '',
    bounds: { left: 40, top: 300, right: 1040, bottom: 340 },
    xpath: '//android.widget.EditText[@resource-id="com.xiaohongshu.app:id/name_input"]',
    resource_id: 'com.xiaohongshu.app:id/name_input',
    class_name: 'android.widget.EditText',
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  },
  {
    id: 'elem_6',
    element_type: 'text',
    text: '电话',
    bounds: { left: 40, top: 400, right: 120, bottom: 420 },
    xpath: '//android.widget.TextView[2]',
    resource_id: '',
    class_name: 'android.widget.TextView', 
    is_clickable: false,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  },
  {
    id: 'elem_7',
    element_type: 'input',
    text: '',
    bounds: { left: 40, top: 440, right: 1040, bottom: 480 },
    xpath: '//android.widget.EditText[@resource-id="com.xiaohongshu.app:id/phone_input"]',
    resource_id: 'com.xiaohongshu.app:id/phone_input',
    class_name: 'android.widget.EditText',
    is_clickable: true,
    is_scrollable: false,
    is_enabled: true,
    is_focused: false,
    checkable: false,
    checked: false,
    selected: false,
    password: false,
    content_desc: ''
  }
];

export const ElementDiscoveryTestPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenModal = () => {
    console.log('🧪 测试：开始打开发现元素模态框');
    console.log('🧪 测试：模拟元素数据', mockElements);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    console.log('🧪 测试：关闭发现元素模态框');
    setModalVisible(false);
  };

  const handleElementSelect = (element: any) => {
    console.log('🧪 测试：选择了元素', element);
    setModalVisible(false);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={2}>🧪 元素发现调试测试页面</Title>
          <Text>
            这个页面用于测试"发现元素"功能的调试日志。
            点击下面的按钮将打开ElementDiscoveryModal，
            并在控制台中显示我们添加的调试信息。
          </Text>
          
          <Button 
            type="primary" 
            size="large"
            onClick={handleOpenModal}
          >
            🔍 测试发现元素功能
          </Button>
          
          <Text type="secondary">
            请打开浏览器开发者工具的控制台查看调试信息：
            <br />
            • 🔍 buildGeneralParentChildRelations: 文本元素统计
            <br />
            • 🏗️ ArchitectureDiagram: 元素统计
            <br />
            • 📊 buildHierarchyTree: 层次构建统计
          </Text>
        </Space>
      </Card>

      <ElementDiscoveryModal
        open={modalVisible}
        allElements={mockElements}
        targetElement={null}
        onClose={handleCloseModal}
        onElementSelect={handleElementSelect}
      />
    </div>
  );
};

export default ElementDiscoveryTestPage;