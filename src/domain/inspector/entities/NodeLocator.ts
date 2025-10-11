// src/domain/inspector/entities/NodeLocator.ts
// module: domain | layer: domain | role: entity
// summary: 实体定义

export interface NodeLocatorAttributes {
  resourceId?: string;
  text?: string;
  contentDesc?: string;
  className?: string;
  packageName?: string;
}

export interface NodeLocator {
  absoluteXPath?: string;
  predicateXPath?: string;
  attributes?: NodeLocatorAttributes;
  bounds?: string;
}
