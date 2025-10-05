import xml.etree.ElementTree as ET
import sys

def analyze_clickable_elements(xml_file):
    """分析XML文件中的可点击元素"""
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        clickable_elements = []
        
        def find_clickable(node, depth=0):
            if node.get('clickable') == 'true':
                bounds = node.get('bounds', '')
                text = node.get('text', '')
                resource_id = node.get('resource-id', '')
                class_name = node.get('class', '')
                content_desc = node.get('content-desc', '')
                
                element_info = {
                    'depth': depth,
                    'bounds': bounds,
                    'text': text,
                    'resource_id': resource_id,
                    'class': class_name,
                    'content_desc': content_desc,
                    'display_name': text or content_desc or resource_id or f"未知元素({class_name})"
                }
                clickable_elements.append(element_info)
            
            # 递归处理子节点
            for child in node:
                find_clickable(child, depth + 1)
        
        find_clickable(root)
        return clickable_elements
    
    except Exception as e:
        print(f"解析XML时出错: {e}")
        return []

def main():
    if len(sys.argv) != 2:
        print("用法: python analyze_xml.py <xml文件路径>")
        sys.exit(1)
    
    xml_file = sys.argv[1]
    print(f"分析文件: {xml_file}")
    print("=" * 60)
    
    elements = analyze_clickable_elements(xml_file)
    
    if not elements:
        print("未找到可点击元素")
        return
    
    print(f"找到 {len(elements)} 个可点击元素:")
    print()
    
    for i, element in enumerate(elements, 1):
        print(f"{i}. {element['display_name']}")
        print(f"   类型: {element['class']}")
        print(f"   位置: {element['bounds']}")
        if element['resource_id']:
            print(f"   资源ID: {element['resource_id']}")
        if element['content_desc']:
            print(f"   描述: {element['content_desc']}")
        print(f"   层级: {element['depth']}")
        print()

if __name__ == "__main__":
    main()