// src/types/confirm-channel.ts
// module: shared | layer: types | role: type-constraint
// summary: 单一确认通道类型约束 - 防止 onQuickCreate 和 onConfirm 同时传入

/**
 * 确认回调函数类型
 * 
 * 返回值语义（用户约定）：
 * - `true | void | undefined` ⇒ 成功并关闭弹层
 * - `false` ⇒ 成功但**保持弹层开启**（需要用户补充信息）
 * - `throw Error` ⇒ 失败，不关闭弹层，展示错误提示
 * 
 * @example
 * ```ts
 * // 成功并关闭
 * const handleConfirm: ConfirmFn = async () => {
 *   await saveData();
 *   return true; // 或不返回
 * };
 * 
 * // 成功但保持开启（需要补充信息）
 * const handlePartial: ConfirmFn = async () => {
 *   await partialSave();
 *   return false; // 保持弹层，提示用户补充
 * };
 * 
 * // 失败不关闭
 * const handleFail: ConfirmFn = async () => {
 *   const result = await validate();
 *   if (!result.ok) throw new Error(result.message); // 不关闭，显示错误
 * };
 * ```
 */
export type ConfirmFn = () => Promise<boolean | void>;

/**
 * 确认通道 XOR 约束
 * 
 * 编译期保证只能传入以下之一：
 * - onQuickCreate: 快速创建步骤（智能分析路径）
 * - onConfirm: 传统确认（向后兼容）
 * 
 * @example
 * ```ts
 * // ✅ 正确：只传 onQuickCreate
 * <Component onQuickCreate={handleQuick} />
 * 
 * // ✅ 正确：只传 onConfirm
 * <Component onConfirm={handleConfirm} />
 * 
 * // ❌ 错误：同时传入两个会导致 TS 编译错误
 * <Component onQuickCreate={handleQuick} onConfirm={handleConfirm} />
 * ```
 */

export type ConfirmQuick = {
  onQuickCreate: ConfirmFn;
  onConfirm?: never;
};

export type ConfirmLegacy = {
  onQuickCreate?: never;
  onConfirm: ConfirmFn;
};

/**
 * 确认通道联合类型
 * 使用 XOR 模式确保单一确认渠道
 */
export type ConfirmChannel = ConfirmQuick | ConfirmLegacy;

/**
 * 运行期兜底工具：提取有效的确认回调
 * 
 * @param props - 包含 ConfirmChannel 的 props
 * @returns 有效的确认回调函数
 * 
 * @remarks
 * - 开发环境下若同时提供两个回调会发出警告
 * - 优先使用 onQuickCreate（快速路径）
 * - 降级到 onConfirm（向后兼容）
 * 
 * @example
 * ```ts
 * const MyComponent = (props: MyProps & ConfirmChannel) => {
 *   const effectiveConfirm = useEffectiveConfirm(props);
 *   
 *   const handleSubmit = async () => {
 *     if (!effectiveConfirm) return;
 *     const shouldClose = await effectiveConfirm();
 *     if (shouldClose !== false) closeModal();
 *   };
 * };
 * ```
 */
export function useEffectiveConfirm<T extends ConfirmChannel | Partial<ConfirmQuick & ConfirmLegacy>>(
  props: T
): ConfirmFn | undefined {
  const quickCreate = (props as Partial<ConfirmQuick>).onQuickCreate;
  const confirm = (props as Partial<ConfirmLegacy>).onConfirm;
  const both = !!quickCreate && !!confirm;
  
  if (both && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[ConfirmChannel] ⚠️ 同时提供了 onQuickCreate 和 onConfirm，将只使用 onQuickCreate。' +
      '\n请移除其中一个以符合单一确认通道原则。'
    );
  }
  
  return quickCreate ?? confirm;
}
