import React from "react";
import { Space } from "antd";
import { 
  UploadAdapter,
  TreeAdapter,
  DatePickerAdapter,
  RangeDatePickerAdapter,
  DrawerAdapter,
  StepsAdapter,
} from "@/components/adapters";

export const AdapterDemos: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
    </Space>
  );
};

export default AdapterDemos;
