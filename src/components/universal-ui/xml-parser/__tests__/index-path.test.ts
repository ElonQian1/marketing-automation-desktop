// src/components/universal-ui/xml-parser/__tests__/index-path.test.ts
// module: ui | layer: tests | role: test
// summary: IndexPath 工具函数测试

import { describe, it, expect } from 'vitest';
import {
  buildIndexPath,
  findElementByIndexPath,
  validateIndexPath,
  indexPathToString,
  indexPathFromString,
  areIndexPathsEqual,
} from '../IndexPathBuilder';

describe('IndexPathBuilder', () => {
  // 创建一个简单的测试 XML
  const createTestXML = () => {
    const parser = new DOMParser();
    const xmlString = `
      <hierarchy>
        <node index="0" class="FrameLayout">
          <node index="0" class="LinearLayout">
            <node index="0" class="RecyclerView">
              <node index="5" class="ViewGroup">
                <node index="2" class="TextView" text="目标元素"/>
              </node>
            </node>
          </node>
        </node>
      </hierarchy>
    `;
    return parser.parseFromString(xmlString, 'text/xml');
  };

  describe('buildIndexPath', () => {
    it('应该为根元素返回空数组', () => {
      const xmlDoc = createTestXML();
      const rootElement = xmlDoc.documentElement;
      const path = buildIndexPath(rootElement);
      expect(path).toEqual([]);
    });

    it('应该为深层嵌套元素生成正确的下标链', () => {
      const xmlDoc = createTestXML();
      // 找到 "目标元素" TextView
      const targetElement = xmlDoc.querySelector('node[text="目标元素"]');
      if (!targetElement) throw new Error('未找到目标元素');

      const path = buildIndexPath(targetElement);
      // hierarchy -> node[0] -> node[0] -> node[0] -> node[5] -> node[2]
      // 去掉 hierarchy 本身，路径应该是 [0, 0, 0, 5, 2]
      expect(path).toEqual([0, 0, 0, 5, 2]);
    });
  });

  describe('findElementByIndexPath', () => {
    it('应该能通过空路径找到根元素', () => {
      const xmlDoc = createTestXML();
      const element = findElementByIndexPath(xmlDoc, []);
      expect(element).toBe(xmlDoc.documentElement);
    });

    it('应该能通过下标链找到正确的元素', () => {
      const xmlDoc = createTestXML();
      const element = findElementByIndexPath(xmlDoc, [0, 0, 0, 5, 2]);
      expect(element?.getAttribute('text')).toBe('目标元素');
    });

    it('对于无效路径应该返回 null', () => {
      const xmlDoc = createTestXML();
      const element = findElementByIndexPath(xmlDoc, [0, 0, 0, 99, 99]);
      expect(element).toBeNull();
    });
  });

  describe('validateIndexPath', () => {
    it('对于有效路径应该返回 true', () => {
      const xmlDoc = createTestXML();
      const isValid = validateIndexPath(xmlDoc, [0, 0, 0, 5, 2]);
      expect(isValid).toBe(true);
    });

    it('对于无效路径应该返回 false', () => {
      const xmlDoc = createTestXML();
      const isValid = validateIndexPath(xmlDoc, [0, 0, 0, 99, 99]);
      expect(isValid).toBe(false);
    });
  });

  describe('indexPathToString', () => {
    it('应该将下标链转换为字符串格式', () => {
      const pathString = indexPathToString([0, 0, 0, 5, 2]);
      expect(pathString).toBe('0/0/0/5/2');
    });

    it('应该处理空数组', () => {
      const pathString = indexPathToString([]);
      expect(pathString).toBe('');
    });
  });

  describe('indexPathFromString', () => {
    it('应该从字符串解析下标链', () => {
      const path = indexPathFromString('0/0/0/5/2');
      expect(path).toEqual([0, 0, 0, 5, 2]);
    });

    it('应该处理空字符串', () => {
      const path = indexPathFromString('');
      expect(path).toEqual([]);
    });

    it('应该过滤掉无效的数字', () => {
      const path = indexPathFromString('0/abc/2');
      expect(path).toEqual([0, 2]);
    });
  });

  describe('areIndexPathsEqual', () => {
    it('对于相同的路径应该返回 true', () => {
      const path1 = [0, 0, 0, 5, 2];
      const path2 = [0, 0, 0, 5, 2];
      expect(areIndexPathsEqual(path1, path2)).toBe(true);
    });

    it('对于不同的路径应该返回 false', () => {
      const path1 = [0, 0, 0, 5, 2];
      const path2 = [0, 0, 0, 5, 3];
      expect(areIndexPathsEqual(path1, path2)).toBe(false);
    });

    it('对于长度不同的路径应该返回 false', () => {
      const path1 = [0, 0, 0, 5];
      const path2 = [0, 0, 0, 5, 2];
      expect(areIndexPathsEqual(path1, path2)).toBe(false);
    });
  });

  describe('往返测试', () => {
    it('buildIndexPath 和 findElementByIndexPath 应该互为逆操作', () => {
      const xmlDoc = createTestXML();
      const targetElement = xmlDoc.querySelector('node[text="目标元素"]');
      if (!targetElement) throw new Error('未找到目标元素');

      // 先生成路径
      const path = buildIndexPath(targetElement);
      // 再用路径找回元素
      const foundElement = findElementByIndexPath(xmlDoc, path);

      expect(foundElement).toBe(targetElement);
      expect(foundElement?.getAttribute('text')).toBe('目标元素');
    });
  });
});
