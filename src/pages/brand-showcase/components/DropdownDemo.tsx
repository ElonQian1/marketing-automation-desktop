// src/pages/brand-showcase/components/DropdownDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * DropdownMenu 组件演示区
 */
import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  User, 
  Settings, 
  LogOut, 
  Edit, 
  Trash2, 
  Copy, 
  Archive,
  Download,
  Share2,
  Heart,
  Star
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuShortcut,
} from '../../../components/ui/dropdown/DropdownMenu';
import { Button } from '../../../components/ui/button/Button';
import { Card } from '../../../components/ui/card/Card';

export const DropdownDemo: React.FC = () => {
  const [checkedBookmarks, setCheckedBookmarks] = useState<string[]>(['favorites']);
  const [selectedView, setSelectedView] = useState<string>('grid');

  return (
    <Card variant="default" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">下拉菜单演示 - DropdownMenu</h3>
      <div className="space-y-6">
        
        {/* 基础下拉菜单 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">基础菜单</h4>
          <div className="flex items-center gap-4 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  用户菜单
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  复制
                  <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  归档
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 复选框菜单 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">复选框菜单</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                书签选项
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>显示书签</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={checkedBookmarks.includes('favorites')}
                onCheckedChange={(checked) => {
                  setCheckedBookmarks(prev => 
                    checked 
                      ? [...prev, 'favorites']
                      : prev.filter(item => item !== 'favorites')
                  );
                }}
              >
                收藏夹
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={checkedBookmarks.includes('recent')}
                onCheckedChange={(checked) => {
                  setCheckedBookmarks(prev => 
                    checked 
                      ? [...prev, 'recent']
                      : prev.filter(item => item !== 'recent')
                  );
                }}
              >
                最近访问
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={checkedBookmarks.includes('shared')}
                onCheckedChange={(checked) => {
                  setCheckedBookmarks(prev => 
                    checked 
                      ? [...prev, 'shared']
                      : prev.filter(item => item !== 'shared')
                  );
                }}
              >
                共享链接
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 单选菜单 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">单选菜单</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">视图: {selectedView === 'grid' ? '网格' : selectedView === 'list' ? '列表' : '卡片'}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>选择视图</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={selectedView} onValueChange={setSelectedView}>
                <DropdownMenuRadioItem value="grid">网格视图</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="list">列表视图</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="card">卡片视图</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 子菜单 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">嵌套子菜单</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                分享菜单
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                下载
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Share2 className="w-4 h-4 mr-2" />
                  分享到...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>微信</DropdownMenuItem>
                  <DropdownMenuItem>QQ</DropdownMenuItem>
                  <DropdownMenuItem>微博</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>复制链接</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Star className="w-4 h-4 mr-2" />
                添加到收藏
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 分组菜单 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">分组菜单</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">操作菜单</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>编辑操作</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑内容
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  复制内容
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>高级操作</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  归档项目
                </DropdownMenuItem>
                <DropdownMenuItem className="text-text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除项目
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};