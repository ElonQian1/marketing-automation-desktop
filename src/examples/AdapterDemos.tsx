import React from "react";
import { Space } from "antd";
import { 
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
