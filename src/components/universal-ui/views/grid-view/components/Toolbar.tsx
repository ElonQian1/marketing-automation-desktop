/**
 * GridElementView 顶部工具栏组件
 * 包含导入/导出XML、搜索、解析等功能
 */

import React from 'react';
import { 
  getSearchHistory, 
  addSearchHistory, 
  getFavoriteSearches, 
  toggleFavoriteSearch, 
  clearSearchHistory 
} from '../history';
import { downloadText } from '../exporters';
import styles from '../GridElementView.module.css';

interface ToolbarProps {
  xmlText: string;
  setXmlText: (text: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  onParse: (xmlToUse?: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  locateFirstMatch: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  searchRef: React.RefObject<HTMLInputElement>;
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  favSearch: string[];
  setFavSearch: (fav: string[]) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  xmlText,
  setXmlText,
  filter,
  setFilter,
  onParse,
  onExpandAll,
  onCollapseAll,
  locateFirstMatch,
  fileRef,
  searchRef,
  searchHistory,
  setSearchHistory,
  favSearch,
  setFavSearch,
}) => {
  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setXmlText(String(reader.result));
    reader.readAsText(file);
  };

  const loadDemo = () => {
    const demo = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" package="com.ss.android.ugc.aweme" content-desc="" checkable="false" checked="false" clickable="false" enabled="true" focusable="false" focused="false" scrollable="false" long-clickable="false" password="false" selected="false" visible-to-user="true" bounds="[0,0][1080,2400]">
    <node class="android.view.ViewGroup" bounds="[0,220][1080,2400]">
      <node class="android.widget.TextView" text="推荐" bounds="[80,240][200,300]"/>
      <node class="android.widget.TextView" text="关注" bounds="[220,240][340,300]"/>
      <node class="androidx.recyclerview.widget.RecyclerView" bounds="[0,320][1080,2400]">
        <node class="android.view.ViewGroup" bounds="[0,320][1080,800]">
          <node class="android.widget.TextView" text="用户A" bounds="[24,340][180,390]"/>
          <node class="android.widget.Button" text="关注" resource-id="com.ss.android.ugc.aweme:id/btn_follow" clickable="true" enabled="true" bounds="[900,600][1040,680]"/>
        </node>
        <node class="android.view.ViewGroup" bounds="[0,820][1080,1300]">
          <node class="android.widget.TextView" text="用户B" bounds="[24,840][180,890]"/>
          <node class="android.widget.Button" text="关注" resource-id="com.ss.android.ugc.aweme:id/btn_follow" clickable="true" enabled="true" bounds="[900,1100][1040,1180]"/>
        </node>
      </node>
    </node>
  </node>
</hierarchy>`;
    setXmlText(demo);
  };

  const handlePasteXML = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt && txt.trim()) {
        setXmlText(txt);
      } else {
        alert("剪贴板为空");
      }
    } catch (err) {
      alert("无法读取剪贴板，请检查浏览器/应用权限");
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-xl font-bold">ADB XML 可视化检查器</div>
      
      <div className={`${styles.toolbar}`}>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
            }}
          />
          <button
            className={styles.btn}
            onClick={() => fileRef.current?.click()}
          >
            导入 XML 文件
          </button>
          <button className={styles.btn} onClick={loadDemo}>
            填充示例
          </button>
          <button
            className={styles.btn}
            onClick={() =>
              downloadText(xmlText, "current.xml", "application/xml")
            }
          >
            导出当前 XML
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              list="grid-search-history"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜索：resource-id/text/content-desc/class"
              className={styles.input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  locateFirstMatch();
                  addSearchHistory(filter);
                  setSearchHistory(getSearchHistory());
                }
              }}
              ref={searchRef}
            />
            <datalist id="grid-search-history">
              {favSearch.map((s, i) => (
                <option key={`fav-${i}`} value={s} />
              ))}
              {searchHistory
                .filter((s) => !favSearch.includes(s))
                .map((s, i) => (
                  <option key={`h-${i}`} value={s} />
                ))}
            </datalist>
          </div>
          <button
            className={styles.btn}
            title="收藏/取消收藏当前搜索"
            onClick={() => {
              toggleFavoriteSearch(filter);
              setFavSearch(getFavoriteSearches());
            }}
          >
            {favSearch.includes(filter.trim()) ? "★" : "☆"}
          </button>
          <button
            className={styles.btn}
            title="清空搜索历史"
            onClick={() => {
              clearSearchHistory();
              setSearchHistory([]);
            }}
          >
            清空历史
          </button>
          <button className={styles.btn} onClick={handlePasteXML}>
            粘贴 XML
          </button>
          <button className={styles.btn} onClick={() => onParse()}>
            解析 XML
          </button>
          <button className={styles.btn} onClick={onExpandAll}>
            展开全部
          </button>
          <button className={styles.btn} onClick={onCollapseAll}>
            折叠全部
          </button>
        </div>
      </div>
    </div>
  );
};