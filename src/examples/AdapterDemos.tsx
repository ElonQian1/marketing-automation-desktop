// src/examples/AdapterDemos.tsx
// module: shared | layer: examples | role: 示例代码
// summary: 功能演示和使用示例

import React from "react";
import { Space, Input, Form } from "antd";
import { Button } from "../components/ui";
import { 
  TableAdapter,
  DataTableAdapter,
  FormAdapter,
  FormItemAdapter,
  UploadAdapter,
  TreeAdapter,
  DatePickerAdapter,
  RangeDatePickerAdapter,
  DrawerAdapter,
  StepsAdapter,
  CheckboxAdapter,
  CheckboxGroupAdapter,
  RadioAdapter,
  RadioGroupAdapter,
  SwitchAdapter,
  SliderAdapter,
  RangeSliderAdapter,
  InputNumberAdapter,
  SelectAdapter,
  OptionAdapter,
  ModalAdapter,
  TooltipAdapter,
  PopoverAdapter,
  PaginationAdapter,
  NotificationAdapter,
} from "../components/adapters";

export const AdapterDemos: React.FC = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [checkboxValue, setCheckboxValue] = React.useState<string[]>(['A']);
  const [radioValue, setRadioValue] = React.useState('A');
  const [switchValue, setSwitchValue] = React.useState(false);
  const [sliderValue, setSliderValue] = React.useState(30);
  const [rangeValue, setRangeValue] = React.useState<number[]>([20, 50]);
  const [numberValue, setNumberValue] = React.useState<number>(1);
  const [selectValue, setSelectValue] = React.useState<string>();
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleFormSubmit = (values: any) => {
    console.log('Form submitted:', values);
    NotificationAdapter.operationSuccess('表单提交成功', '表单数据已成功提交');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* 基础表单适配器 */}
      <Space direction="horizontal" size="large" wrap>
        <CheckboxAdapter>复选框</CheckboxAdapter>
        <CheckboxGroupAdapter
          options={['A', 'B', 'C', 'D']}
          value={checkboxValue}
          onChange={(values) => setCheckboxValue(values as string[])}
        />
      </Space>

      <Space direction="horizontal" size="large" wrap>
        <RadioAdapter value={1}>单选框</RadioAdapter>
        <RadioGroupAdapter
          options={[
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'C', value: 'C' },
          ]}
          value={radioValue}
          onChange={(e) => setRadioValue(e.target.value)}
        />
      </Space>

      <Space direction="horizontal" size="large" wrap>
        <SwitchAdapter checked={switchValue} onChange={setSwitchValue} />
        <SliderAdapter value={sliderValue} onChange={setSliderValue} />
        <RangeSliderAdapter range value={rangeValue} onChange={(values) => setRangeValue(values)} />
        <InputNumberAdapter
          min={1}
          max={10}
          value={numberValue}
          onChange={(value) => setNumberValue(typeof value === 'number' ? value : 1)}
        />
      </Space>

      {/* 反馈与选择适配器 */}
      <Space direction="horizontal" size="large" wrap>
        <SelectAdapter
          value={selectValue}
          onChange={setSelectValue}
          style={{ width: 200 }}
          options={[
            { value: 'option1', label: '选项1' },
            { value: 'option2', label: '选项2' },
            { value: 'option3', label: '选项3' },
          ]}
        />
        
        <TooltipAdapter title="这是一个提示信息">
          <span>悬停查看提示</span>
        </TooltipAdapter>
        
        <PopoverAdapter
          content={<div>这是弹出框内容<br />支持复杂内容</div>}
          title="弹出框标题"
        >
          <span>点击查看弹出框</span>
        </PopoverAdapter>
        
        <button
          onClick={() => setModalVisible(true)}
          style={{ padding: '4px 8px', cursor: 'pointer' }}
        >
          打开对话框
        </button>
        
        <button
          onClick={() => NotificationAdapter.success({ 
            message: '成功提示', 
            description: '这是一个成功的通知消息' 
          })}
          style={{ padding: '4px 8px', cursor: 'pointer' }}
        >
          成功通知
        </button>
        
        <button
          onClick={() => NotificationAdapter.warning({ 
            message: '警告提示', 
            description: '这是一个警告通知消息' 
          })}
          style={{ padding: '4px 8px', cursor: 'pointer' }}
        >
          警告通知
        </button>
        
        <button
          onClick={() => NotificationAdapter.error({ 
            message: '错误提示', 
            description: '这是一个错误通知消息' 
          })}
          style={{ padding: '4px 8px', cursor: 'pointer' }}
        >
          错误通知
        </button>
        
        <button
          onClick={() => {
            const key = NotificationAdapter.loading({ 
              message: '加载中...', 
              description: '正在处理您的请求' 
            });
            setTimeout(() => {
              NotificationAdapter.close(key);
              NotificationAdapter.operationSuccess('处理完成', '您的请求已成功处理');
            }, 2000);
          }}
          style={{ padding: '4px 8px', cursor: 'pointer' }}
        >
          加载通知
        </button>
        
        <button
          onClick={() => NotificationAdapter.batch([
            { type: 'info', message: '批量通知 1', description: '第一个通知' },
            { type: 'success', message: '批量通知 2', description: '第二个通知' },
            { type: 'warning', message: '批量通知 3', description: '第三个通知' },
          ])}
          style={{ padding: '4px 8px', cursor: 'pointer' }}
        >
          批量通知
        </button>
      </Space>

      <PaginationAdapter
        current={currentPage}
        total={85}
        pageSize={10}
        onChange={setCurrentPage}
      />

      {/* 现有适配器 */}
      <UploadAdapter multiple />

      <DatePickerAdapter />
      <RangeDatePickerAdapter />

      <StepsAdapter current={1} items={[{ title: "Step 1" }, { title: "Step 2" }, { title: "Step 3" }]} />

      <TreeAdapter
        defaultExpandAll
        treeData={[{ title: "Root", key: "0", children: [{ title: "Child", key: "0-0" }] }]}
        height={240}
      />

      {/* Table 适配器演示 */}
      <TableAdapter
        title="数据表格示例"
        description="展示 sticky header、middle 尺寸和底部分页"
        columns={[
          { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
          { title: '年龄', dataIndex: 'age', key: 'age', width: 80 },
          { title: '地址', dataIndex: 'address', key: 'address' },
          { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
          { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
        ]}
        dataSource={[
          { key: '1', name: '张三', age: 32, address: '北京市朝阳区', phone: '138****1234', email: 'zhang@example.com' },
          { key: '2', name: '李四', age: 42, address: '上海市浦东新区', phone: '139****5678', email: 'li@example.com' },
          { key: '3', name: '王五', age: 32, address: '广州市天河区', phone: '137****9012', email: 'wang@example.com' },
          { key: '4', name: '赵六', age: 28, address: '深圳市南山区', phone: '136****3456', email: 'zhao@example.com' },
          { key: '5', name: '孙七', age: 35, address: '杭州市西湖区', phone: '135****7890', email: 'sun@example.com' },
          { key: '6', name: '周八', age: 29, address: '成都市锦江区', phone: '134****2345', email: 'zhou@example.com' },
          { key: '7', name: '吴九', age: 38, address: '武汉市武昌区', phone: '133****6789', email: 'wu@example.com' },
          { key: '8', name: '郑十', age: 31, address: '南京市鼓楼区', phone: '132****0123', email: 'zheng@example.com' },
        ]}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        brandTheme="modern"
        animated={true}
      />

      {/* Form 适配器演示 */}
      <FormAdapter 
        form={form} 
        layout="vertical" 
        onFinish={handleFormSubmit}
        title="表单适配器示例"
        description="展示不同密度模式下的表单布局和交互"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItemAdapter label="用户名" name="username" required>
            <Input placeholder="请输入用户名" />
          </FormItemAdapter>
          
          <FormItemAdapter label="邮箱" name="email" required>
            <Input placeholder="请输入邮箱地址" />
          </FormItemAdapter>
          
          <FormItemAdapter label="电话号码" name="phone">
            <Input placeholder="请输入电话号码" />
          </FormItemAdapter>
          
          <FormItemAdapter label="部门" name="department">
            <SelectAdapter
              placeholder="请选择部门"
              options={[
                { label: '技术部', value: 'tech' },
                { label: '市场部', value: 'market' },
                { label: '人事部', value: 'hr' },
                { label: '财务部', value: 'finance' }
              ]}
            />
          </FormItemAdapter>
        </div>
        
        <FormItemAdapter label="个人简介" name="bio">
          <Input.TextArea rows={4} placeholder="请输入个人简介" />
        </FormItemAdapter>
        
        <FormItemAdapter name="actions">
          <div className="flex gap-3">
            <Button variant="default" type="submit">
              提交表单
            </Button>
            <Button variant="outline" onClick={() => form.resetFields()}>
              重置表单
            </Button>
          </div>
        </FormItemAdapter>
      </FormAdapter>

      <Space>
        <a onClick={() => setOpen(true)}>打开抽屉</a>
      </Space>
      <DrawerAdapter title="示例抽屉" open={open} onClose={() => setOpen(false)}>
        抽屉内容
      </DrawerAdapter>

      <ModalAdapter 
        title="示例对话框" 
        open={modalVisible} 
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      >
        <p>这是对话框的内容</p>
        <p>支持各种复杂的内容展示</p>
      </ModalAdapter>
    </Space>
  );
};

export default AdapterDemos;
