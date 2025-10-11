// src/pages/brand-showcase/components/DialogDemo.tsx
// module: ui | layer: ui | role: component
// summary: UI 组件

/**
 * Dialog 演示组件 - 展示对话框的各种用法
 * 
 * 展示内容：
 * - 基础对话框
 * - 确认对话框
 * - 表单对话框
 * - 不同尺寸的对话框
 * - 无关闭按钮的对话框
 */

import React, { useState } from "react";
import { AlertTriangle, Plus, Save, Trash2, UserPlus } from "lucide-react";
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../../../components/ui";

const DialogDemo: React.FC = () => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const handleDeleteConfirm = () => {
    // 模拟删除操作
    console.log("删除操作已确认");
    setIsDeleteOpen(false);
  };

  const handleUserSubmit = () => {
    // 模拟提交操作
    console.log("用户名:", userName);
    setUserName("");
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-medium text-text-1 mb-3">基础对话框</h4>
        <div className="flex flex-wrap gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                打开基础对话框
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>基础对话框</DialogTitle>
                <DialogDescription>
                  这是一个基础的对话框示例。您可以在这里放置任何内容。
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-text-2">
                  对话框内容区域可以包含文本、表单、列表或任何其他组件。
                  它具有响应式设计，会自动适应不同的屏幕尺寸。
                </p>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    取消
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button variant="solid" size="sm">
                    确定
                  </Button>
                </DialogTrigger>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                创建项目
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>创建新项目</DialogTitle>
                <DialogDescription>
                  输入项目信息以创建新的项目。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    项目名称
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-border-primary rounded-lg 
                             bg-background-elevated text-text-1
                             focus:outline-none focus:ring-2 focus:ring-brand/50"
                    placeholder="请输入项目名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    描述
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-border-primary rounded-lg 
                             bg-background-elevated text-text-1 resize-none
                             focus:outline-none focus:ring-2 focus:ring-brand/50"
                    rows={3}
                    placeholder="请输入项目描述（可选）"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    取消
                  </Button>
                </DialogTrigger>
                <Button variant="solid" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-text-1 mb-3">确认对话框</h4>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="soft" 
            tone="danger" 
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除项目
          </Button>

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent size="sm">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error/10 
                                flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-error" />
                  </div>
                  <div>
                    <DialogTitle>删除确认</DialogTitle>
                    <DialogDescription>
                      此操作无法撤销。确定要删除该项目吗？
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-2">
                <p className="text-text-3 text-sm">
                  删除后，该项目的所有数据和配置都将永久丢失。
                </p>
              </div>
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  variant="solid" 
                  tone="danger" 
                  size="sm"
                  onClick={handleDeleteConfirm}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  确认删除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-text-1 mb-3">表单对话框</h4>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            添加用户
          </Button>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新用户</DialogTitle>
                <DialogDescription>
                  填写用户信息以添加到系统中。
                </DialogDescription>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUserSubmit();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-1 mb-2">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3 py-2 border border-border-primary rounded-lg 
                               bg-background-elevated text-text-1
                               focus:outline-none focus:ring-2 focus:ring-brand/50"
                      placeholder="请输入姓名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-1 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-border-primary rounded-lg 
                               bg-background-elevated text-text-1
                               focus:outline-none focus:ring-2 focus:ring-brand/50"
                      placeholder="请输入邮箱"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-1 mb-2">
                    角色
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-border-primary rounded-lg 
                             bg-background-elevated text-text-1
                             focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                    <option value="moderator">版主</option>
                  </select>
                </div>

                <DialogFooter>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsFormOpen(false);
                      setUserName("");
                    }}
                  >
                    取消
                  </Button>
                  <Button 
                    type="submit"
                    variant="solid" 
                    size="sm"
                    disabled={!userName.trim()}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    添加用户
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <h4 className="text-base font-medium text-text-1 mb-3">不同尺寸</h4>
        <div className="flex flex-wrap gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                小对话框 (sm)
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>小尺寸对话框</DialogTitle>
                <DialogDescription>
                  适合简单的确认或信息展示。
                </DialogDescription>
              </DialogHeader>
              <p className="py-4 text-text-2">
                这是一个小尺寸的对话框，适合显示简短的信息或简单的操作。
              </p>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                标准对话框 (md)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>标准对话框</DialogTitle>
                <DialogDescription>
                  默认尺寸，适合大部分使用场景。
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-text-2">
                <p className="mb-3">
                  这是标准尺寸的对话框，适合大多数使用场景。
                </p>
                <p>
                  可以包含适量的内容，如表单、列表或其他交互元素。
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                大对话框 (lg)
              </Button>
            </DialogTrigger>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>大尺寸对话框</DialogTitle>
                <DialogDescription>
                  适合复杂的内容或需要更多空间的场景。
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-text-2">
                <p className="mb-4">
                  这是大尺寸的对话框，适合需要更多显示空间的场景。
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <h5 className="font-medium text-text-1 mb-2">功能特性</h5>
                    <ul className="text-sm text-text-3 space-y-1">
                      <li>• 响应式设计</li>
                      <li>• 自动焦点管理</li>
                      <li>• 键盘导航支持</li>
                      <li>• 无障碍访问</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-background-secondary rounded-lg">
                    <h5 className="font-medium text-text-1 mb-2">使用场景</h5>
                    <ul className="text-sm text-text-3 space-y-1">
                      <li>• 复杂表单</li>
                      <li>• 数据展示</li>
                      <li>• 多步向导</li>
                      <li>• 详细信息</li>
                    </ul>
                  </div>
                </div>
                <p>
                  大对话框提供了充足的空间来展示复杂的内容或交互。
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default DialogDemo;