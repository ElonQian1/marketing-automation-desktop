/**
 * Tooltip 演示组件 - 展示工具提示的各种用法
 * 
 * 展示内容：
 * - 基础 SimpleTooltip 用法
 * - 不同方向的 Tooltip
 * - InfoTooltip 信息提示
 * - 可编程控制的 useTooltip
 */

import React from "react";
import { HelpCircle, Info, Settings, User } from "lucide-react";
import { Button, SimpleTooltip, InfoTooltip, useTooltip, TooltipProvider } from "../../../components/ui";

const TooltipDemo: React.FC = () => {
  const { 
    open: programmaticOpen, 
    setOpen: setProgrammaticOpen
  } = useTooltip();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h4 className="text-base font-medium text-text-1 mb-3">基础用法</h4>
          <div className="flex flex-wrap gap-4">
            <SimpleTooltip content="这是一个基础的工具提示">
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                悬停查看提示
              </Button>
            </SimpleTooltip>

            <SimpleTooltip content="设置面板" side="top">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </SimpleTooltip>

            <SimpleTooltip content="用户资料" side="bottom">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </SimpleTooltip>
          </div>
        </div>

        <div>
          <h4 className="text-base font-medium text-text-1 mb-3">不同方向</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SimpleTooltip content="顶部提示" side="top">
              <Button variant="outline" size="sm" className="w-full">
                Top
              </Button>
            </SimpleTooltip>
            <SimpleTooltip content="右侧提示" side="right">
              <Button variant="outline" size="sm" className="w-full">
                Right
              </Button>
            </SimpleTooltip>
            <SimpleTooltip content="底部提示" side="bottom">
              <Button variant="outline" size="sm" className="w-full">
                Bottom
              </Button>
            </SimpleTooltip>
            <SimpleTooltip content="左侧提示" side="left">
              <Button variant="outline" size="sm" className="w-full">
                Left
              </Button>
            </SimpleTooltip>
          </div>
        </div>

        <div>
          <h4 className="text-base font-medium text-text-1 mb-3">信息提示组件</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span>API 调用限制</span>
              <InfoTooltip content="这是一个重要的功能说明，帮助用户理解如何使用此功能。" />
            </div>

            <div className="flex items-center gap-2">
              <span>设备状态说明</span>
              <InfoTooltip content="设备连接状态会实时更新，绿色表示在线，灰色表示离线。" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-base font-medium text-text-1 mb-3">可编程控制</h4>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProgrammaticOpen(true)}
            >
              显示提示
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProgrammaticOpen(false)}
            >
              隐藏提示
            </Button>
          </div>
          
          {programmaticOpen && (
            <div className="mt-2 p-3 bg-brand/10 border border-brand/20 rounded-lg">
              <Info className="w-4 h-4 inline mr-2 text-brand" />
              <span className="text-text-1">通过编程方式控制的提示内容</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-base font-medium text-text-1 mb-3">复杂内容</h4>
          <SimpleTooltip
            content={
              <div className="space-y-2">
                <div className="font-medium">高级功能</div>
                <div className="text-xs text-text-3">
                  • 支持多行文本<br/>
                  • 支持富文本格式<br/>
                  • 自动换行处理
                </div>
              </div>
            }
            side="top"
          >
            <Button variant="solid" size="sm">
              查看详细功能
            </Button>
          </SimpleTooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TooltipDemo;