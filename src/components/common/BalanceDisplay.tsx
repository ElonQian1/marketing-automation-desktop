import React from 'react';
import { Card, Typography, Spin } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface BalanceDisplayProps {
  balance: number;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 余额显示组件 - 使用原生 Ant Design Card
 * 统一的余额显示UI，支持加载状态
 */
export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  isLoading = false,
  className,
  style,
}) => {
  return (
    <Card
      className={className}
      style={{
        backgroundColor: '#f0f9ff',
        borderColor: '#bae6fd',
        ...style,
      }}
      size="small"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <WalletOutlined style={{ color: '#0369a1' }} />
          <Text style={{ color: '#0369a1', fontWeight: 500 }}>当前余额</Text>
        </div>
        {isLoading ? (
          <Spin size="small" />
        ) : (
          <Text 
            strong 
            style={{ 
              color: '#065f46', 
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ¥{balance.toFixed(2)}
          </Text>
        )}
      </div>
    </Card>
  );
};

