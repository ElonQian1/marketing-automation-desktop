/**
 * 主题切换器组件
 * 提供主题模式切换的 UI 控件
 */

import React, { useState } from 'react';
import { Switch, Button, Dropdown, Tooltip, Space } from 'antd';
import { 
  SunOutlined, 
  MoonOutlined, 
  SettingOutlined,
  DesktopOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useTheme, useThemeState, useThemeActions } from '../providers/EnhancedThemeProvider';
import type { MenuProps } from 'antd';
import type { ThemeMode } from '../types';

/**
 * 主题切换器属性
 */
export interface ThemeSwitcherProps {
  /** 显示模式 */
  variant?: 'switch' | 'button' | 'dropdown' | 'icon';
  /** 尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onChange?: (mode: ThemeMode) => void;
}

/**
 * Switch 模式的主题切换器
 */
const SwitchThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  size = 'middle',
  showLabel = true,
  disabled,
  onChange,
  variant,
  className,
  style,
  ..._restProps
}) => {
  const { mode } = useThemeState();
  const { toggleMode } = useThemeActions();

  const handleChange = (checked: boolean) => {
    const newMode = checked ? 'dark' : 'light';
    toggleMode();
    onChange?.(newMode);
  };

  return (
    <Space size="small" className={className} style={style}>
      {showLabel && <SunOutlined style={{ color: mode === 'light' ? '#ffa940' : '#8c8c8c' }} />}
      <Switch
        checked={mode === 'dark'}
        onChange={handleChange}
        size={size === 'small' ? 'small' : 'default'}
        disabled={disabled}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
      />
      {showLabel && <MoonOutlined style={{ color: mode === 'dark' ? '#597ef7' : '#8c8c8c' }} />}
    </Space>
  );
};

/**
 * Button 模式的主题切换器
 */
const ButtonThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  size = 'middle',
  showLabel = false,
  disabled,
  onChange,
  variant,
  className,
  style,
  ..._restProps
}) => {
  const { mode } = useThemeState();
  const { toggleMode } = useThemeActions();

  const handleClick = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    toggleMode();
    onChange?.(newMode);
  };

  const icon = mode === 'dark' ? <SunOutlined /> : <MoonOutlined />;
  const text = mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式';

  return (
    <Tooltip title={text}>
      <Button
        type="text"
        size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle'}
        icon={icon}
        disabled={disabled}
        onClick={handleClick}
        className={className}
        style={style}
      >
        {showLabel && (mode === 'dark' ? '亮色' : '暗色')}
      </Button>
    </Tooltip>
  );
};

/**
 * Dropdown 模式的主题切换器
 */
const DropdownThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  size = 'middle',
  disabled,
  onChange,
  variant,
  className,
  style,
  ..._restProps
}) => {
  const { mode } = useThemeState();
  const { setMode, followSystemTheme } = useThemeActions();
  const [open, setOpen] = useState(false);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setOpen(false);
    
    if (key === 'system') {
      followSystemTheme();
    } else {
      const newMode = key as ThemeMode;
      setMode(newMode);
      onChange?.(newMode);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'light',
      label: '亮色模式',
      icon: <SunOutlined />,
    },
    {
      key: 'dark',
      label: '暗色模式',
      icon: <MoonOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'system',
      label: '跟随系统',
      icon: <DesktopOutlined />,
    },
  ];

  const currentIcon = mode === 'dark' ? <MoonOutlined /> : <SunOutlined />;

  return (
    <span className={className} style={style}>
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        trigger={['click']}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <Button
          type="text"
          size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle'}
          icon={currentIcon}
        >
          主题 <SettingOutlined />
        </Button>
      </Dropdown>
    </span>
  );
};

/**
 * Icon 模式的主题切换器
 */
const IconThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  size = 'middle',
  disabled,
  onChange,
  variant,
  className,
  style,
  ..._restProps
}) => {
  const { mode } = useThemeState();
  const { toggleMode } = useThemeActions();

  const handleClick = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    toggleMode();
    onChange?.(newMode);
  };

  const icon = mode === 'dark' ? <SunOutlined /> : <MoonOutlined />;
  const text = mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式';

  return (
    <Tooltip title={text}>
      <Button
        type="text"
        size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'middle'}
        shape="circle"
        icon={icon}
        disabled={disabled}
        onClick={handleClick}
        className={className}
        style={style}
      />
    </Tooltip>
  );
};

/**
 * 主题切换器组件
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  variant = 'switch', 
  ...props 
}) => {
  switch (variant) {
    case 'button':
      return <ButtonThemeSwitcher {...props} />;
    case 'dropdown':
      return <DropdownThemeSwitcher {...props} />;
    case 'icon':
      return <IconThemeSwitcher {...props} />;
    case 'switch':
    default:
      return <SwitchThemeSwitcher {...props} />;
  }
};

/**
 * 主题指示器组件
 * 显示当前主题状态，不提供切换功能
 */
export interface ThemeIndicatorProps {
  /** 显示模式 */
  variant?: 'badge' | 'text' | 'icon';
  /** 尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const ThemeIndicator: React.FC<ThemeIndicatorProps> = ({
  variant = 'badge',
  size = 'middle',
  className,
  style,
}) => {
  const { mode } = useThemeState();

  if (variant === 'icon') {
    const icon = mode === 'dark' ? <MoonOutlined /> : <SunOutlined />;
    return (
      <span className={className} style={style}>
        {icon}
      </span>
    );
  }

  if (variant === 'text') {
    return (
      <span className={className} style={style}>
        {mode === 'dark' ? '暗色模式' : '亮色模式'}
      </span>
    );
  }

  // badge 模式
  const color = mode === 'dark' ? '#597ef7' : '#ffa940';
  const icon = mode === 'dark' ? <MoonOutlined /> : <SunOutlined />;
  
  return (
    <Space size="small" className={className} style={style}>
      <span style={{ color }}>{icon}</span>
      <span>{mode === 'dark' ? '暗色' : '亮色'}</span>
    </Space>
  );
};