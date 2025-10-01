
/**
 * Form 适配器 - AntD 表单组件的品牌化包装器
 * 
 * 职责：
 * 1. 通过容器样式和配置统一 AntD Form 的外观
 * 2. 不覆写 AntD Form 内部样式，仅通过 ConfigProvider 和外层容器
 * 3. 提供统一的表单布局、验证、提交等交互模式
 * 4. 集成设计令牌系统，确保品牌一致性
 * 
 * 使用方式：
 * <FormAdapter
 *   form={form}
 *   onFinish={handleSubmit}
 *   brandTheme="modern"
 * >
 *   <FormItemAdapter name="username" label="用户名">
 *     <Input />
 *   </FormItemAdapter>
 * </FormAdapter>
 */

import React from "react";
import { Form, ConfigProvider, theme, type FormProps } from "antd";
import { motion } from "framer-motion";
import { cn } from "../../ui/utils";
import { fadeVariants, slideVariants } from "../../ui/motion";
import { Button } from "../../ui/button/Button";

/**
 * 表单适配器的扩展属性
 */
export interface FormAdapterProps extends Omit<FormProps, 'title' | 'children'> {
  /** 品牌主题变体 */
  brandTheme?: "default" | "modern" | "minimal" | "compact";
  /** 是否启用入场动画 */
  animated?: boolean;
  /** 动画方向 */
  animationDirection?: "fade" | "slideUp" | "slideDown";
  /** 容器类名 */
  containerClassName?: string;
  /** 表单标题（适配器级别，区别于AntD原生title） */
  title?: React.ReactNode;
  /** 表单描述 */
  description?: React.ReactNode;
  /** 表单子元素 */
  children?: React.ReactNode;
  /** 是否显示品牌化的提交按钮 */
  showBrandedSubmit?: boolean;
  /** 提交按钮文本 */
  submitText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 取消按钮点击事件 */
  onCancel?: () => void;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 表单操作区域的自定义内容 */
  actions?: React.ReactNode;
  /** 是否加载中状态 */
  loading?: boolean;
}

/**
 * 品牌化表单主题配置
 */
const getBrandedFormTheme = (brandTheme: string) => {
  const baseTheme = {
    algorithm: [theme.darkAlgorithm],
    token: {
      // 从 CSS 变量读取品牌色彩
      colorPrimary: 'var(--brand)',
      colorBgContainer: 'var(--bg-elevated)',
      colorText: 'var(--text-1)',
      colorTextSecondary: 'var(--text-2)',
      colorBorder: 'var(--border-primary)',
      borderRadius: 12, // 使用固定值，对应 --radius: 12px
      
      // 现代化字体
      fontFamily: 'var(--font-family)',
      fontSize: 16, // 使用固定值
    },
    components: {
      Form: {
        // 统一的表单样式，不覆盖内部实现
        labelColor: 'var(--text-1)',
        labelRequiredMarkColor: 'var(--status-error)',
        itemMarginBottom: 24, // 对应 --space-6: 24px
        verticalLabelPadding: '0 0 8px', // 对应 --space-2: 8px
        
        // 品牌化的输入框样式
        controlHeight: 48,
        controlHeightSM: 40,
        controlHeightLG: 56,
      },
      Input: {
        borderRadius: 12, // 对应 --radius: 12px
        colorBgContainer: 'var(--bg-input)',
        colorBorder: 'var(--border-primary)',
        colorText: 'var(--text-1)',
        paddingInline: 16, // 对应 --space-4: 16px
      },
      Select: {
        borderRadius: 12, // 对应 --radius: 12px
        colorBgContainer: 'var(--bg-input)',
        colorBorder: 'var(--border-primary)',
        optionSelectedBg: 'var(--bg-secondary)',
      },
      DatePicker: {
        borderRadius: 12, // 对应 --radius: 12px
        colorBgContainer: 'var(--bg-input)',
        colorBorder: 'var(--border-primary)',
      },
    },
  };

  // 根据主题变体调整样式
  switch (brandTheme) {
    case "modern":
      return {
        ...baseTheme,
        token: {
          ...baseTheme.token,
          // 更强的阴影效果
          boxShadow: 'var(--shadow-lg)',
          // 更大的圆角
          borderRadius: 16, // 对应 --radius-lg: 16px
        },
        components: {
          ...baseTheme.components,
          Form: {
            ...baseTheme.components.Form,
            itemMarginBottom: 32, // 对应 --space-8: 32px
          },
        },
      };
      
    case "compact":
      return {
        ...baseTheme,
        components: {
          ...baseTheme.components,
          Form: {
            ...baseTheme.components.Form,
            itemMarginBottom: 16, // 对应 --space-4: 16px
            controlHeight: 40,
            controlHeightSM: 32,
            controlHeightLG: 48,
          },
        },
      };
      
    case "minimal":
      return {
        ...baseTheme,
        token: {
          ...baseTheme.token,
          // 移除阴影
          boxShadow: 'none',
          // 更细的边框
          lineWidth: 1,
        },
      };
      
    default:
      return baseTheme;
  }
};

/**
 * Form 适配器组件
 */
export const FormAdapter: React.FC<FormAdapterProps> = ({
  brandTheme = "default",
  animated = true,
  animationDirection = "slideUp",
  containerClassName,
  title,
  description,
  showBrandedSubmit = true,
  submitText = "提交",
  cancelText = "取消",
  onCancel,
  showCancel = false,
  actions,
  loading = false,
  className,
  children,
  ...formProps
}) => {
  // 获取品牌化主题配置
  const brandedTheme = getBrandedFormTheme(brandTheme);
  
  // 选择动画变体
  const getAnimationVariant = () => {
    switch (animationDirection) {
      case "slideUp":
        return slideVariants.fromBottom;
      case "slideDown":
        return slideVariants.fromTop;
      case "fade":
      default:
        return fadeVariants;
    }
  };

  // 表单内容
  const formContent = (
    <ConfigProvider theme={brandedTheme}>
      <Form
        {...formProps}
        className={cn(
          // 品牌化容器样式 - 不覆盖 antd 内部
          "brand-form-container",
          className
        )}
        layout={formProps.layout || "vertical"}
      >
        {children}
        
        {/* 品牌化的操作区域 */}
        {(showBrandedSubmit || showCancel || actions) && (
          <Form.Item className="mb-0 mt-8">
            <div className="flex gap-3 justify-end">
              {/* 自定义操作 */}
              {actions}
              
              {/* 取消按钮 */}
              {showCancel && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              )}
              
              {/* 提交按钮 */}
              {showBrandedSubmit && (
                <Button
                  variant="default"
                  size="default"
                  type="submit"
                  loading={loading}
                  className="min-w-[100px]"
                >
                  {submitText}
                </Button>
              )}
            </div>
          </Form.Item>
        )}
      </Form>
    </ConfigProvider>
  );

  // 容器组件
  const FormContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className={cn(
        // 统一的容器样式
        "bg-background-elevated rounded-lg border border-border-primary shadow-sm overflow-hidden",
        // 品牌化间距
        brandTheme === "minimal" ? "p-6" : "p-8",
        containerClassName
      )}
    >
      {/* 表单头部信息 */}
      {(title || description) && (
        <div className="mb-8">
          {title && (
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-text-muted">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* 表单内容 */}
      {children}
    </div>
  );

  // 如果启用动画，包装 motion 组件
  if (animated) {
    return (
      <motion.div
        variants={getAnimationVariant()}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <FormContainer>
          {formContent}
        </FormContainer>
      </motion.div>
    );
  }

  return (
    <FormContainer>
      {formContent}
    </FormContainer>
  );
};

/**
 * FormItem 适配器 - 预配置的表单项
 */
export const FormItemAdapter: React.FC<{
  name: string;
  label?: React.ReactNode;
  required?: boolean;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ className, ...props }) => (
  <Form.Item
    {...props}
    className={cn(
      // 品牌化的表单项样式
      "brand-form-item",
      className
    )}
  />
);

/**
 * 对话框表单适配器 - 适用于模态框中的表单
 */
export const DialogFormAdapter: React.FC<FormAdapterProps> = (props) => (
  <FormAdapter
    brandTheme="compact"
    animated={false}
    showBrandedSubmit={true}
    showCancel={true}
    {...props}
  />
);

/**
 * 步骤表单适配器 - 适用于多步骤表单场景
 */
export const StepFormAdapter: React.FC<FormAdapterProps> = (props) => (
  <FormAdapter
    brandTheme="modern"
    animated={true}
    animationDirection="slideUp"
    showBrandedSubmit={false} // 步骤表单通常有自己的导航按钮
    {...props}
  />
);