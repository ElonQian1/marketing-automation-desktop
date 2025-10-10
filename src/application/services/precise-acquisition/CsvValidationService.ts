/**
 * CSV数据验证服务
 * 
 * 基于统一错误处理和配置管理的CSV数据验证实现
 * 提供CSV文件解析、数据验证、清洗和统计功能
 */

import { 
  ValidationError, 
  DataIntegrityError, 
  BusinessLogicError,
  createErrorContext,
  ErrorHandler 
} from '../shared/ErrorHandlingSystem';
import { 
  validateObjectStructure, 
  sanitizeString, 
  isValidEmail, 
  isValidUrl, 
  isValidPhoneNumber,
  deepClone,
  PerformanceTimer 
} from '../shared/CommonUtils';
import { getConfigManager } from '../shared/ConfigurationManager';
import { IService } from '../shared/DependencyContainer';
import { 
  EntityId, 
  OperationResult, 
  BatchOperationResult, 
  ValidationResult,
  ValidationRule 
} from '../shared/SharedInterfaces';

// ==================== CSV验证相关类型定义 ====================

export interface CsvColumn {
  name: string;
  type: 'string' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'boolean';
  required: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CsvValidationSchema {
  id: string;
  name: string;
  description?: string;
  columns: CsvColumn[];
  strictMode: boolean; // 是否严格模式（不允许额外列）
  delimiter: string;
  encoding: string;
  hasHeader: boolean;
  maxRows?: number;
  allowDuplicates?: boolean;
  uniqueFields?: string[]; // 需要保持唯一的字段
  createdAt: Date;
  updatedAt: Date;
}

export interface CsvValidationOptions {
  schema: CsvValidationSchema;
  skipEmptyRows?: boolean;
  trimWhitespace?: boolean;
  convertTypes?: boolean;
  validateUnique?: boolean;
  maxErrors?: number; // 最大错误数，超过则停止验证
}

export interface CsvRowError {
  rowIndex: number;
  column?: string;
  error: string;
  value?: any;
  severity: 'error' | 'warning';
}

export interface CsvValidationReport {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  emptyRows: number;
  duplicateRows: number;
  errors: CsvRowError[];
  warnings: CsvRowError[];
  statistics: {
    columnStats: Record<string, {
      totalValues: number;
      emptyValues: number;
      uniqueValues: number;
      invalidValues: number;
      dataTypes: Record<string, number>;
    }>;
    dataQuality: {
      completeness: number; // 完整性百分比
      accuracy: number; // 准确性百分比
      consistency: number; // 一致性百分比
    };
  };
  suggestions: string[];
  processedData?: any[];
  validationDuration: number;
}

export interface CsvParseResult {
  success: boolean;
  data: any[];
  headers: string[];
  rowCount: number;
  encoding: string;
  delimiter: string;
  errors: string[];
}

// ==================== CSV验证服务 ====================

export class CsvValidationService implements IService {
  readonly serviceName = 'CsvValidationService';
  
  private errorHandler: ErrorHandler;
  private isInitialized = false;
  private schemas = new Map<string, CsvValidationSchema>();
  private validationCache = new Map<string, CsvValidationReport>();

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
  }

  // ==================== 服务生命周期 ====================

  async initialize(): Promise<void> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      console.log('[CsvValidationService] Initializing CSV validation service...');
      
      // 加载预定义的验证模式
      await this.loadDefaultSchemas();
      
      // 初始化验证缓存（设置最大缓存大小）
      const config = getConfigManager().getPerformanceConfig();
      if (config.cache.enabled) {
        console.log(`[CsvValidationService] Validation cache enabled (max entries: ${config.cache.max_entries})`);
      }
      
      this.isInitialized = true;
      
      const elapsed = timer.stop();
      console.log(`[CsvValidationService] Initialized successfully in ${elapsed}ms`);
      
    } catch (error) {
      const context = createErrorContext('csv_validation', 'initialize');
      throw this.errorHandler.handle(error, context);
    }
  }

  async dispose(): Promise<void> {
    try {
      console.log('[CsvValidationService] Disposing CSV validation service...');
      
      // 清理缓存
      this.validationCache.clear();
      this.schemas.clear();
      
      this.isInitialized = false;
      console.log('[CsvValidationService] Disposed successfully');
      
    } catch (error) {
      console.error('[CsvValidationService] Error during disposal:', error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }
      
      // 检查是否有基础验证模式
      if (this.schemas.size === 0) {
        console.warn('[CsvValidationService] No validation schemas available');
        return false;
      }
      
      // 测试基础验证功能
      const testData = ['name,email', 'test,test@example.com'];
      const testSchema = this.getSchema('user_basic');
      if (testSchema) {
        const result = await this.validateCsvData(testData, { schema: testSchema });
        return result.isValid;
      }
      
      return true;
    } catch (error) {
      console.error('[CsvValidationService] Health check failed:', error);
      return false;
    }
  }

  // ==================== 验证模式管理 ====================

  /**
   * 创建验证模式
   */
  async createSchema(schema: Omit<CsvValidationSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<CsvValidationSchema> {
    try {
      this.ensureInitialized();
      
      // 验证模式数据
      const validation = this.validateSchemaData(schema);
      if (!validation.valid) {
        throw new ValidationError(
          `Invalid schema data: ${validation.errors.map(e => e.message).join(', ')}`,
          'schema_data',
          schema,
          createErrorContext('csv_validation', 'create_schema', { schema, errors: validation.errors })
        );
      }

      // 检查名称唯一性
      const existingSchema = Array.from(this.schemas.values())
        .find(s => s.name.toLowerCase() === schema.name.toLowerCase());
      
      if (existingSchema) {
        throw new BusinessLogicError(
          `Schema with name '${schema.name}' already exists`,
          'schema_name_duplicate',
          createErrorContext('csv_validation', 'create_schema', { schema, existingSchema })
        );
      }

      // 创建新模式
      const now = new Date();
      const newSchema: CsvValidationSchema = {
        ...schema,
        id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };

      this.schemas.set(newSchema.id, newSchema);
      
      console.log(`[CsvValidationService] Created schema '${newSchema.name}' (${newSchema.id})`);
      return deepClone(newSchema);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof BusinessLogicError) {
        throw error;
      }
      
      const context = createErrorContext('csv_validation', 'create_schema', { schema });
      throw this.errorHandler.handle(error, context);
    }
  }

  /**
   * 获取验证模式
   */
  getSchema(id: string): CsvValidationSchema | null {
    try {
      this.ensureInitialized();
      const schema = this.schemas.get(id);
      return schema ? deepClone(schema) : null;
    } catch (error) {
      console.error(`[CsvValidationService] Error getting schema ${id}:`, error);
      return null;
    }
  }

  /**
   * 列出所有验证模式
   */
  listSchemas(): CsvValidationSchema[] {
    try {
      this.ensureInitialized();
      return Array.from(this.schemas.values()).map(schema => deepClone(schema));
    } catch (error) {
      console.error('[CsvValidationService] Error listing schemas:', error);
      return [];
    }
  }

  // ==================== CSV解析功能 ====================

  /**
   * 解析CSV数据
   */
  async parseCsvData(
    csvContent: string | string[], 
    options: {
      delimiter?: string;
      hasHeader?: boolean;
      encoding?: string;
      maxRows?: number;
    } = {}
  ): Promise<CsvParseResult> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      const {
        delimiter = ',',
        hasHeader = true,
        encoding = 'utf-8',
        maxRows = 10000
      } = options;

      // 处理输入数据
      let lines: string[];
      if (Array.isArray(csvContent)) {
        lines = csvContent;
      } else {
        lines = csvContent.split(/\r?\n/).filter(line => line.trim());
      }

      if (lines.length === 0) {
        return {
          success: false,
          data: [],
          headers: [],
          rowCount: 0,
          encoding,
          delimiter,
          errors: ['CSV content is empty']
        };
      }

      // 检查行数限制
      if (lines.length > maxRows) {
        return {
          success: false,
          data: [],
          headers: [],
          rowCount: lines.length,
          encoding,
          delimiter,
          errors: [`CSV has ${lines.length} rows, exceeding maximum limit of ${maxRows}`]
        };
      }

      // 解析标题行
      let headers: string[] = [];
      let dataStartIndex = 0;
      
      if (hasHeader && lines.length > 0) {
        headers = this.parseCsvRow(lines[0], delimiter);
        dataStartIndex = 1;
      } else {
        // 如果没有标题行，生成默认列名
        const firstRow = this.parseCsvRow(lines[0], delimiter);
        headers = firstRow.map((_, index) => `column_${index + 1}`);
      }

      // 解析数据行
      const data: any[] = [];
      const errors: string[] = [];

      for (let i = dataStartIndex; i < lines.length; i++) {
        try {
          const rowData = this.parseCsvRow(lines[i], delimiter);
          
          // 创建对象
          const rowObject: any = {};
          for (let j = 0; j < headers.length; j++) {
            rowObject[headers[j]] = j < rowData.length ? rowData[j] : '';
          }
          
          data.push(rowObject);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const elapsed = timer.stop();
      const success = errors.length === 0;
      
      console.log(`[CsvValidationService] Parsed CSV: ${data.length} rows, ${headers.length} columns in ${elapsed}ms`);

      return {
        success,
        data,
        headers,
        rowCount: data.length,
        encoding,
        delimiter,
        errors
      };

    } catch (error) {
      const context = createErrorContext('csv_validation', 'parse_csv_data', { options });
      throw this.errorHandler.handle(error, context);
    }
  }

  // ==================== CSV验证功能 ====================

  /**
   * 验证CSV数据
   */
  async validateCsvData(
    csvData: string | string[] | any[],
    options: CsvValidationOptions
  ): Promise<CsvValidationReport> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      const {
        schema,
        skipEmptyRows = true,
        trimWhitespace = true,
        convertTypes = true,
        validateUnique = true,
        maxErrors = 1000
      } = options;

      // 生成缓存键
      const cacheKey = this.generateCacheKey(csvData, options);
      const cachedResult = this.validationCache.get(cacheKey);
      if (cachedResult) {
        console.log('[CsvValidationService] Returning cached validation result');
        return deepClone(cachedResult);
      }

      // 解析CSV数据（如果需要）
      let parsedData: any[];
      if (typeof csvData === 'string' || Array.isArray(csvData) && typeof csvData[0] === 'string') {
        const parseResult = await this.parseCsvData(csvData as string | string[], {
          delimiter: schema.delimiter,
          hasHeader: schema.hasHeader,
          encoding: schema.encoding,
          maxRows: schema.maxRows
        });
        
        if (!parseResult.success) {
          const elapsed = timer.stop();
          return {
            isValid: false,
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            emptyRows: 0,
            duplicateRows: 0,
            errors: parseResult.errors.map(error => ({
              rowIndex: -1,
              error,
              severity: 'error' as const
            })),
            warnings: [],
            statistics: {
              columnStats: {},
              dataQuality: { completeness: 0, accuracy: 0, consistency: 0 }
            },
            suggestions: ['Fix CSV parsing errors before validation'],
            validationDuration: elapsed
          };
        }
        
        parsedData = parseResult.data;
      } else {
        parsedData = csvData as any[];
      }

      // 执行验证
      const report = await this.performValidation(parsedData, schema, {
        skipEmptyRows,
        trimWhitespace,
        convertTypes,
        validateUnique,
        maxErrors
      });

      const elapsed = timer.stop();
      report.validationDuration = elapsed;

      // 缓存结果
      const config = getConfigManager().getPerformanceConfig();
      if (config.cache.enabled) {
        this.validationCache.set(cacheKey, deepClone(report));
        
        // 清理过期缓存
        if (this.validationCache.size > config.cache.max_entries) {
          const firstKey = this.validationCache.keys().next().value;
          this.validationCache.delete(firstKey);
        }
      }

      console.log(`[CsvValidationService] Validated ${parsedData.length} rows in ${elapsed}ms`);
      return report;

    } catch (error) {
      if (error instanceof ValidationError || error instanceof DataIntegrityError) {
        throw error;
      }
      
      const context = createErrorContext('csv_validation', 'validate_csv_data', { options });
      throw this.errorHandler.handle(error, context);
    }
  }

  /**
   * 批量验证多个CSV文件
   */
  async validateMultipleCsvFiles(
    files: Array<{ name: string; content: string | string[] }>,
    schema: CsvValidationSchema
  ): Promise<BatchOperationResult<{ fileName: string; report: CsvValidationReport }>> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      const results: Array<{
        item: { fileName: string; report: CsvValidationReport };
        success: boolean;
        error?: string;
      }> = [];

      let successfulCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          const report = await this.validateCsvData(file.content, { schema });
          
          results.push({
            item: { fileName: file.name, report },
            success: report.isValid
          });

          if (report.isValid) {
            successfulCount++;
          } else {
            failedCount++;
            errors.push(`${file.name}: ${report.errors.length} validation errors`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            item: { fileName: file.name, report: {} as CsvValidationReport },
            success: false,
            error: errorMessage
          });
          
          failedCount++;
          errors.push(`${file.name}: ${errorMessage}`);
        }
      }

      const elapsed = timer.stop();
      console.log(`[CsvValidationService] Batch validated ${files.length} files in ${elapsed}ms`);

      return {
        success: failedCount === 0,
        total: files.length,
        successful: successfulCount,
        failed: failedCount,
        results,
        errors
      };

    } catch (error) {
      const context = createErrorContext('csv_validation', 'validate_multiple_csv_files', { fileCount: files.length });
      throw this.errorHandler.handle(error, context);
    }
  }

  // ==================== 数据清洗功能 ====================

  /**
   * 清洗CSV数据
   */
  async cleanCsvData(
    data: any[],
    schema: CsvValidationSchema,
    options: {
      removeInvalidRows?: boolean;
      fillMissingValues?: boolean;
      standardizeFormats?: boolean;
      removeDuplicates?: boolean;
    } = {}
  ): Promise<{
    cleanedData: any[];
    removedRows: number;
    modifiedFields: number;
    duplicatesRemoved: number;
    cleaningReport: string[];
  }> {
    const timer = new PerformanceTimer();
    timer.start();

    try {
      this.ensureInitialized();
      
      const {
        removeInvalidRows = false,
        fillMissingValues = true,
        standardizeFormats = true,
        removeDuplicates = false
      } = options;

      let cleanedData = deepClone(data);
      let removedRows = 0;
      let modifiedFields = 0;
      let duplicatesRemoved = 0;
      const cleaningReport: string[] = [];

      // 1. 移除无效行
      if (removeInvalidRows) {
        const validation = await this.validateCsvData(cleanedData, { schema });
        const invalidRowIndices = new Set(validation.errors.map(error => error.rowIndex));
        
        cleanedData = cleanedData.filter((_, index) => !invalidRowIndices.has(index));
        removedRows = data.length - cleanedData.length;
        
        if (removedRows > 0) {
          cleaningReport.push(`移除 ${removedRows} 个无效行`);
        }
      }

      // 2. 填充缺失值
      if (fillMissingValues) {
        for (const column of schema.columns) {
          if (column.defaultValue !== undefined) {
            for (const row of cleanedData) {
              if (!row[column.name] || row[column.name] === '') {
                row[column.name] = column.defaultValue;
                modifiedFields++;
              }
            }
          }
        }
        
        if (modifiedFields > 0) {
          cleaningReport.push(`填充 ${modifiedFields} 个缺失值`);
        }
      }

      // 3. 标准化格式
      if (standardizeFormats) {
        let formattedFields = 0;
        
        for (const row of cleanedData) {
          for (const column of schema.columns) {
            const value = row[column.name];
            if (value) {
              let formattedValue = value;
              
              switch (column.type) {
                case 'email':
                  formattedValue = value.toString().toLowerCase().trim();
                  break;
                case 'phone':
                  formattedValue = value.toString().replace(/[^\d+]/g, '');
                  break;
                case 'string':
                  formattedValue = sanitizeString(value.toString());
                  break;
                case 'url':
                  formattedValue = value.toString().toLowerCase().trim();
                  if (!formattedValue.startsWith('http')) {
                    formattedValue = 'https://' + formattedValue;
                  }
                  break;
              }
              
              if (formattedValue !== value) {
                row[column.name] = formattedValue;
                formattedFields++;
              }
            }
          }
        }
        
        if (formattedFields > 0) {
          cleaningReport.push(`格式化 ${formattedFields} 个字段`);
        }
      }

      // 4. 移除重复项
      if (removeDuplicates && schema.uniqueFields && schema.uniqueFields.length > 0) {
        const uniqueKeys = new Set<string>();
        const uniqueData: any[] = [];
        
        for (const row of cleanedData) {
          const key = schema.uniqueFields.map(field => row[field]).join('|');
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            uniqueData.push(row);
          } else {
            duplicatesRemoved++;
          }
        }
        
        cleanedData = uniqueData;
        
        if (duplicatesRemoved > 0) {
          cleaningReport.push(`移除 ${duplicatesRemoved} 个重复行`);
        }
      }

      const elapsed = timer.stop();
      console.log(`[CsvValidationService] Cleaned ${data.length} rows in ${elapsed}ms`);

      return {
        cleanedData,
        removedRows,
        modifiedFields,
        duplicatesRemoved,
        cleaningReport
      };

    } catch (error) {
      const context = createErrorContext('csv_validation', 'clean_csv_data', { dataCount: data.length, options });
      throw this.errorHandler.handle(error, context);
    }
  }

  // ==================== 私有辅助方法 ====================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new ValidationError(
        'CsvValidationService is not initialized',
        'service_state',
        'not_initialized',
        createErrorContext('csv_validation', 'ensure_initialized')
      );
    }
  }

  private validateSchemaData(schema: any): ValidationResult {
    const rules = {
      name: { required: true, type: 'string', minLength: 1, maxLength: 50 },
      columns: { required: true, type: 'array', minItems: 1 },
      delimiter: { required: true, type: 'string' },
      encoding: { required: true, type: 'string' },
      hasHeader: { required: true, type: 'boolean' }
    };

    return validateObjectStructure(schema, rules);
  }

  private parseCsvRow(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private async performValidation(
    data: any[],
    schema: CsvValidationSchema,
    options: {
      skipEmptyRows: boolean;
      trimWhitespace: boolean;
      convertTypes: boolean;
      validateUnique: boolean;
      maxErrors: number;
    }
  ): Promise<CsvValidationReport> {
    const errors: CsvRowError[] = [];
    const warnings: CsvRowError[] = [];
    const columnStats: Record<string, any> = {};
    const uniqueValueSets: Record<string, Set<string>> = {};
    
    let validRows = 0;
    let invalidRows = 0;
    let emptyRows = 0;
    let duplicateRows = 0;

    // 初始化列统计
    for (const column of schema.columns) {
      columnStats[column.name] = {
        totalValues: 0,
        emptyValues: 0,
        uniqueValues: new Set(),
        invalidValues: 0,
        dataTypes: {}
      };
      
      if (options.validateUnique && schema.uniqueFields?.includes(column.name)) {
        uniqueValueSets[column.name] = new Set();
      }
    }

    // 验证每一行
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      let rowHasErrors = false;
      let isEmpty = true;

      // 检查是否为空行
      for (const column of schema.columns) {
        const value = row[column.name];
        if (value && value.toString().trim()) {
          isEmpty = false;
          break;
        }
      }

      if (isEmpty) {
        emptyRows++;
        if (options.skipEmptyRows) continue;
      }

      // 验证每个字段
      for (const column of schema.columns) {
        let value = row[column.name];
        const stats = columnStats[column.name];
        stats.totalValues++;

        // 数据清理
        if (options.trimWhitespace && typeof value === 'string') {
          value = value.trim();
          row[column.name] = value;
        }

        // 检查必填字段
        if (column.required && (!value || value === '')) {
          errors.push({
            rowIndex,
            column: column.name,
            error: `Required field '${column.name}' is empty`,
            value,
            severity: 'error'
          });
          stats.emptyValues++;
          stats.invalidValues++;
          rowHasErrors = true;
          continue;
        }

        if (!value || value === '') {
          stats.emptyValues++;
          continue;
        }

        // 类型验证和转换
        const typeValidation = this.validateAndConvertType(value, column, options.convertTypes);
        if (!typeValidation.valid) {
          errors.push({
            rowIndex,
            column: column.name,
            error: typeValidation.error!,
            value,
            severity: 'error'
          });
          stats.invalidValues++;
          rowHasErrors = true;
        } else if (options.convertTypes && typeValidation.convertedValue !== undefined) {
          row[column.name] = typeValidation.convertedValue;
          value = typeValidation.convertedValue;
        }

        // 长度验证
        if (column.minLength && value.toString().length < column.minLength) {
          errors.push({
            rowIndex,
            column: column.name,
            error: `Value too short (minimum: ${column.minLength})`,
            value,
            severity: 'error'
          });
          stats.invalidValues++;
          rowHasErrors = true;
        }

        if (column.maxLength && value.toString().length > column.maxLength) {
          errors.push({
            rowIndex,
            column: column.name,
            error: `Value too long (maximum: ${column.maxLength})`,
            value,
            severity: 'error'
          });
          stats.invalidValues++;
          rowHasErrors = true;
        }

        // 模式验证
        if (column.pattern && !column.pattern.test(value.toString())) {
          errors.push({
            rowIndex,
            column: column.name,
            error: `Value does not match required pattern`,
            value,
            severity: 'error'
          });
          stats.invalidValues++;
          rowHasErrors = true;
        }

        // 唯一性验证
        if (options.validateUnique && schema.uniqueFields?.includes(column.name)) {
          const normalizedValue = value.toString().toLowerCase();
          if (uniqueValueSets[column.name].has(normalizedValue)) {
            errors.push({
              rowIndex,
              column: column.name,
              error: `Duplicate value found`,
              value,
              severity: 'error'
            });
            duplicateRows++;
            rowHasErrors = true;
          } else {
            uniqueValueSets[column.name].add(normalizedValue);
          }
        }

        // 更新统计
        stats.uniqueValues.add(value.toString());
        const dataType = typeof value;
        stats.dataTypes[dataType] = (stats.dataTypes[dataType] || 0) + 1;

        // 检查错误限制
        if (errors.length >= options.maxErrors) {
          warnings.push({
            rowIndex: -1,
            error: `Validation stopped after ${options.maxErrors} errors`,
            severity: 'warning'
          });
          break;
        }
      }

      if (rowHasErrors) {
        invalidRows++;
      } else {
        validRows++;
      }

      if (errors.length >= options.maxErrors) {
        break;
      }
    }

    // 转换统计数据
    const finalColumnStats: Record<string, any> = {};
    for (const [columnName, stats] of Object.entries(columnStats)) {
      finalColumnStats[columnName] = {
        totalValues: stats.totalValues,
        emptyValues: stats.emptyValues,
        uniqueValues: stats.uniqueValues.size,
        invalidValues: stats.invalidValues,
        dataTypes: stats.dataTypes
      };
    }

    // 计算数据质量指标
    const totalFields = data.length * schema.columns.length;
    const totalEmpty = Object.values(finalColumnStats).reduce((sum: number, stats: any) => sum + stats.emptyValues, 0);
    const totalInvalid = Object.values(finalColumnStats).reduce((sum: number, stats: any) => sum + stats.invalidValues, 0);

    const completeness = totalFields > 0 ? ((totalFields - totalEmpty) / totalFields) * 100 : 0;
    const accuracy = totalFields > 0 ? ((totalFields - totalInvalid) / totalFields) * 100 : 0;
    const consistency = duplicateRows === 0 ? 100 : Math.max(0, 100 - (duplicateRows / data.length) * 100);

    // 生成建议
    const suggestions: string[] = [];
    if (emptyRows > 0) {
      suggestions.push(`考虑删除 ${emptyRows} 个空行`);
    }
    if (duplicateRows > 0) {
      suggestions.push(`发现 ${duplicateRows} 个重复行，建议去重`);
    }
    if (completeness < 80) {
      suggestions.push('数据完整性较低，建议补充缺失值');
    }
    if (accuracy < 90) {
      suggestions.push('数据准确性有待提高，请检查格式错误');
    }

    return {
      isValid: errors.length === 0,
      totalRows: data.length,
      validRows,
      invalidRows,
      emptyRows,
      duplicateRows,
      errors,
      warnings,
      statistics: {
        columnStats: finalColumnStats,
        dataQuality: {
          completeness: Math.round(completeness * 100) / 100,
          accuracy: Math.round(accuracy * 100) / 100,
          consistency: Math.round(consistency * 100) / 100
        }
      },
      suggestions,
      processedData: data,
      validationDuration: 0 // Will be set by caller
    };
  }

  private validateAndConvertType(
    value: any,
    column: CsvColumn,
    convertTypes: boolean
  ): { valid: boolean; error?: string; convertedValue?: any } {
    const stringValue = value.toString();

    switch (column.type) {
      case 'string':
        return { valid: true, convertedValue: convertTypes ? stringValue : value };

      case 'number':
        const numValue = parseFloat(stringValue);
        if (isNaN(numValue)) {
          return { valid: false, error: 'Invalid number format' };
        }
        return { valid: true, convertedValue: convertTypes ? numValue : value };

      case 'email':
        const isValid = isValidEmail(stringValue);
        return { 
          valid: isValid, 
          error: isValid ? undefined : 'Invalid email format',
          convertedValue: convertTypes ? stringValue.toLowerCase().trim() : value
        };

      case 'phone':
        const isValidPhone = isValidPhoneNumber(stringValue);
        return { 
          valid: isValidPhone, 
          error: isValidPhone ? undefined : 'Invalid phone number format',
          convertedValue: convertTypes ? stringValue.replace(/[^\d+]/g, '') : value
        };

      case 'url':
        const isValidURL = isValidUrl(stringValue);
        return { 
          valid: isValidURL, 
          error: isValidURL ? undefined : 'Invalid URL format',
          convertedValue: value
        };

      case 'date':
        const dateValue = new Date(stringValue);
        if (isNaN(dateValue.getTime())) {
          return { valid: false, error: 'Invalid date format' };
        }
        return { valid: true, convertedValue: convertTypes ? dateValue : value };

      case 'boolean':
        const lowerValue = stringValue.toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lowerValue)) {
          return { valid: false, error: 'Invalid boolean format' };
        }
        const boolValue = ['true', '1', 'yes'].includes(lowerValue);
        return { valid: true, convertedValue: convertTypes ? boolValue : value };

      default:
        return { valid: true, convertedValue: value };
    }
  }

  private generateCacheKey(csvData: any, options: CsvValidationOptions): string {
    const dataHash = JSON.stringify(csvData).substring(0, 100);
    const optionsHash = JSON.stringify(options.schema.id + options.schema.updatedAt);
    return `${dataHash}-${optionsHash}`;
  }

  private async loadDefaultSchemas(): Promise<void> {
    // 用户基础信息验证模式
    const userBasicSchema: Omit<CsvValidationSchema, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'user_basic',
      description: '用户基础信息验证模式',
      columns: [
        { name: 'name', type: 'string', required: true, maxLength: 50 },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'phone', required: false },
        { name: 'age', type: 'number', required: false }
      ],
      strictMode: false,
      delimiter: ',',
      encoding: 'utf-8',
      hasHeader: true,
      maxRows: 10000,
      allowDuplicates: false,
      uniqueFields: ['email']
    };

    // 联系人导入验证模式
    const contactImportSchema: Omit<CsvValidationSchema, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'contact_import',
      description: '联系人导入验证模式',
      columns: [
        { name: 'name', type: 'string', required: true, maxLength: 100 },
        { name: 'phone', type: 'phone', required: true },
        { name: 'email', type: 'email', required: false },
        { name: 'company', type: 'string', required: false, maxLength: 200 },
        { name: 'position', type: 'string', required: false, maxLength: 100 },
        { name: 'notes', type: 'string', required: false, maxLength: 500 }
      ],
      strictMode: false,
      delimiter: ',',
      encoding: 'utf-8',
      hasHeader: true,
      maxRows: 50000,
      allowDuplicates: false,
      uniqueFields: ['phone']
    };

    try {
      await this.createSchema(userBasicSchema);
      await this.createSchema(contactImportSchema);
    } catch (error) {
      // 忽略重复创建的错误
      console.debug('[CsvValidationService] Default schemas already exist');
    }
  }
}