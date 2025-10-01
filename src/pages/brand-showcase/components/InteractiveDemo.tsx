/**
 * 交互组件演示区 - Tooltip & Dialog
 */
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../../../components/ui/button/Button';
import { Card } from '../../../components/ui/card/Card';
import { TagPill } from '../../../components/ui/TagPill';
import { Input } from '../../../components/ui/forms/Input';
import { Select } from '../../../components/ui/forms/Select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../../components/ui/dialog/Dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../../../components/ui/tooltip/Tooltip';

export const InteractiveDemo: React.FC = () => {
  return (
    <Card variant="default" className="p-6">
      <h3 className="text-lg font-semibold text-text-1 mb-4">交互组件演示 - Tooltip & Dialog</h3>
      <div className="space-y-6">
        {/* Tooltip演示 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">工具提示 (Tooltip)</h4>
          <TooltipProvider>
            <div className="flex items-center gap-4 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">悬停查看提示</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这是一个基于Design Tokens的现代化工具提示</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TagPill variant="brand">带提示的标签</TagPill>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>品牌渐变标签与玻璃态提示的完美结合</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>设置按钮</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Dialog演示 */}
        <div>
          <h4 className="text-sm font-medium text-text-2 mb-3">对话框 (Dialog)</h4>
          <div className="flex items-center gap-4 flex-wrap">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">打开对话框</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>品牌化对话框</DialogTitle>
                  <DialogDescription>
                    这是一个使用Design Tokens的现代化对话框，具有玻璃态背景和品牌化发光效果。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right text-text-1">姓名</label>
                    <Input id="name" placeholder="请输入姓名" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="role" className="text-right text-text-1">角色</label>
                    <Select placeholder="选择角色" className="col-span-3" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline">取消</Button>
                  <Button variant="default">确认</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">小尺寸对话框</Button>
              </DialogTrigger>
              <DialogContent size="sm">
                <DialogHeader>
                  <DialogTitle>确认操作</DialogTitle>
                  <DialogDescription>
                    确定要执行此操作吗？此操作无法撤销。
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost">取消</Button>
                  <Button variant="destructive">确认删除</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">大尺寸对话框</Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>详细信息</DialogTitle>
                  <DialogDescription>
                    展示大尺寸对话框的布局和内容组织方式。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-1 mb-2">基本信息</label>
                      <div className="space-y-3">
                        <Input placeholder="姓名" />
                        <Input placeholder="邮箱" />
                        <Select placeholder="部门" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-1 mb-2">标签</label>
                      <div className="flex flex-wrap gap-2">
                        <TagPill variant="brand">管理员</TagPill>
                        <TagPill variant="success">活跃</TagPill>
                        <TagPill variant="outline">营销部</TagPill>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Card>
  );
};