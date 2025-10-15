// src/components/step-cards/modern-step-card-styles.ts
// module: step-cards | layer: ui | role: 现代化步骤卡片样式系统
// summary: 提供统一的样式配置和主题适配

export const modernStepCardStyles = {
  // 基础卡片样式
  card: {
    base: {
      position: 'relative' as const,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      minHeight: '80px',
      transition: 'all var(--duration-normal) var(--ease-out)',
      cursor: 'grab' as const
    },
    
    dragging: {
      cursor: 'grabbing' as const,
      opacity: 0.8,
      boxShadow: 'var(--shadow-brand-lg)',
      transform: 'rotate(2deg)'
    },
    
    hover: {
      borderColor: 'var(--brand-400)',
      boxShadow: 'var(--shadow-interactive-hover)',
      transform: 'translateY(-1px)'
    },
    
    disabled: {
      opacity: 0.6,
      background: 'var(--bg-secondary)',
      borderColor: 'var(--border-secondary)'
    }
  },

  // 拖拽指示器
  dragHandle: {
    position: 'absolute' as const,
    left: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '20px',
    background: 'var(--text-3)',
    borderRadius: '2px',
    opacity: 0.5,
    cursor: 'grab' as const,
    
    hover: {
      opacity: 0.8,
      background: 'var(--brand-400)'
    }
  },

  // 步骤编号
  stepNumber: {
    enabled: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'var(--brand-gradient-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '13px',
      fontWeight: '600' as const,
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(110, 139, 255, 0.3)'
    },
    
    disabled: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-3)',
      fontSize: '13px',
      fontWeight: '600' as const,
      flexShrink: 0
    }
  },

  // 状态配置
  statusConfigs: {
    completed: {
      color: 'var(--success)',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      icon: '✓',
      text: '已完成'
    },
    running: {
      color: 'var(--info)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: '▶',
      text: '执行中'
    },
    error: {
      color: 'var(--error)',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: '✗',
      text: '执行失败'
    },
    ready: {
      color: 'var(--brand-400)',
      bgColor: 'rgba(110, 139, 255, 0.1)',
      icon: '◉',
      text: '智能分析就绪'
    },
    analyzing: {
      color: 'var(--warning)',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      icon: '🔍',
      text: '正在分析'
    },
    idle: {
      color: 'var(--text-3)',
      bgColor: 'var(--bg-secondary)',
      icon: '○',
      text: '待执行'
    }
  },

  // 操作按钮
  actionButton: {
    base: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer' as const,
      padding: '6px',
      borderRadius: '6px',
      fontSize: '14px',
      transition: 'all var(--duration-fast)',
      color: 'var(--text-2)'
    },
    
    hover: {
      background: 'var(--bg-secondary)',
      color: 'var(--text-1)'
    },
    
    delete: {
      hover: {
        background: 'rgba(239, 68, 68, 0.1)',
        color: 'var(--error)'
      }
    },
    
    toggle: {
      enabled: {
        color: 'var(--success)'
      },
      disabled: {
        color: 'var(--text-3)'
      }
    }
  },

  // 布局
  layout: {
    content: {
      marginLeft: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    },
    
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    
    titleArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1
    },
    
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    
    statusBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px'
    },
    
    details: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '13px',
      color: 'var(--text-3)'
    }
  },

  // 动画效果
  animations: {
    slideIn: {
      animation: 'slideInUp 0.3s var(--ease-out) forwards'
    },
    
    slideOut: {
      animation: 'slideOutDown 0.2s var(--ease-in) forwards'
    },
    
    pulse: {
      animation: 'pulse 2s infinite'
    }
  }
};

// CSS 动画关键帧
export const modernStepCardKeyframes = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOutDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

// 实用工具函数
export const stepCardUtils = {
  // 获取状态配置
  getStatusConfig: (status: string) => {
    return modernStepCardStyles.statusConfigs[status as keyof typeof modernStepCardStyles.statusConfigs] 
      || modernStepCardStyles.statusConfigs.idle;
  },

  // 生成组合样式
  combineStyles: (...styles: React.CSSProperties[]) => {
    return Object.assign({}, ...styles);
  },

  // 获取卡片样式
  getCardStyle: (isDragging: boolean, isDisabled: boolean) => {
    const baseStyle = modernStepCardStyles.card.base;
    if (isDragging) {
      return stepCardUtils.combineStyles(baseStyle, modernStepCardStyles.card.dragging);
    }
    if (isDisabled) {
      return stepCardUtils.combineStyles(baseStyle, modernStepCardStyles.card.disabled);
    }
    return baseStyle;
  }
};