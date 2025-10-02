export interface PopoverActionTokens {
  gap: number;            // 间距（px）
  fontSize: number;       // 字号（px）
  buttonMinWidth: number; // 按钮最小宽度（px）
  rowWrap: boolean;       // 是否换行
}

export const defaultPopoverActionTokens: PopoverActionTokens = {
  gap: 4,
  fontSize: 11,
  buttonMinWidth: 0,
  rowWrap: true,
};
