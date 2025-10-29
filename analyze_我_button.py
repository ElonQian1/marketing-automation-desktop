import xml.etree.ElementTree as ET

xml_path = r'D:\rust\active-projects\小红书\employeeGUI\debug_xml\ui_dump_e0d909c3_20251029_141909.xml'
root = ET.parse(xml_path).getroot()

# 查找所有text属性包含"我"的节点
nodes = root.findall('.//node')

print("=" * 80)
print("查找底部导航栏'我'按钮:")
print("=" * 80)

for node in nodes:
    text = node.get('text', '')
    content_desc = node.get('content-desc', '')
    resource_id = node.get('resource-id', '')
    bounds = node.get('bounds', '')
    
    # 底部导航栏的"我"按钮
    if text == '我' and '2264' in bounds and '2324' in bounds:
        print(f"\n找到'我'按钮节点:")
        print(f"  text属性: '{text}'")
        print(f"  content-desc属性: '{content_desc}'")
        print(f"  resource-id: {resource_id}")
        print(f"  bounds: {bounds}")
        print(f"  class: {node.get('class')}")
        
        # 查找父节点
        parent_map = {c: p for p in root.iter() for c in p}
        if node in parent_map:
            parent = parent_map[node]
            print(f"\n  父节点信息:")
            print(f"    resource-id: {parent.get('resource-id')}")
            print(f"    content-desc: '{parent.get('content-desc')}'")
            print(f"    bounds: {parent.get('bounds')}")

print("\n" + "=" * 80)
