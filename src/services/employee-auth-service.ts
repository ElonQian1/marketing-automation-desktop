// src/services/employee-auth-service.ts
// module: application | layer: application | role: service  
// summary: 应用服务

/**
 * 员工认证服务 - 暂时禁用
 * 
 * 注意：该文件因编码损坏已完全禁用 - 架构清理阶段
 * 需要手动重构以恢复员工认证功能
 */

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
}

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
