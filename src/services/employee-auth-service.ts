// src/services/employee-auth-service.ts
// module: application | layer: application | role: service  
// summary: 应用服务

/**
 * 员工认证服务 - 暂时禁用
 * 
 * 注意：该文件因编码损坏已完全禁用 - 架构清理阶段
 * 需要手动重构以恢复员工认证功能
 */

import type { Employee, Permission } from '../types/Auth';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export class EmployeeAuthService {
  constructor() {
    console.warn('EmployeeAuthService is temporarily disabled due to encoding corruption');
  }

  async login(_credentials: unknown): Promise<{ success: boolean; employee?: Employee; token?: string; error?: string }> {
    console.warn('EmployeeAuthService.login is disabled');
    return { 
      success: false, 
      error: 'Authentication service is temporarily disabled' 
    };
  }

  async authenticateEmployee(): Promise<Employee | null> {
    console.warn('EmployeeAuthService is disabled');
    return null;
  }

  async getCurrentEmployee(): Promise<Employee | null> {
    console.warn('EmployeeAuthService is disabled');
    return null;
  }

  async hasPermission(): Promise<boolean> {
    console.warn('EmployeeAuthService is disabled');
    return false;
  }

  async logout(): Promise<void> {
    console.warn('EmployeeAuthService is disabled');
  }

  async verifyToken(token: string): Promise<{ valid: boolean; employee?: Employee }> {
    console.warn('EmployeeAuthService.verifyToken is disabled', token);
    return { valid: false };
  }

  async changePassword(_oldPassword: string, _newPassword: string): Promise<{ success: boolean; error?: string }> {
    console.warn('EmployeeAuthService.changePassword is disabled');
    return { success: false, error: 'Authentication service is temporarily disabled' };
  }

  async getRoles(): Promise<Role[]> {
    console.warn('EmployeeAuthService is disabled');
    return [];
  }

  async getPermissions(): Promise<Permission[]> {
    console.warn('EmployeeAuthService is disabled');
    return [];
  }
}

// 全局实例
export const employeeAuthService = new EmployeeAuthService();
export default employeeAuthService;
