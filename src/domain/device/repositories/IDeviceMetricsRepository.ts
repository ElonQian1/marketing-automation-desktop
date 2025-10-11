// src/domain/device/repositories/IDeviceMetricsRepository.ts
// module: domain | layer: domain | role: repository
// summary: 仓储定义

export interface IDeviceMetricsRepository {
  queryDeviceContactCount(deviceId: string): Promise<number>;
}
