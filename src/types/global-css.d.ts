// src/types/global-css.d.ts
// module: shared | layer: types | role: 类型声明
// summary: TypeScript类型定义文件

// Allow importing global CSS files (side-effect imports)
declare module '*.css' {
	const content: string;
	export default content;
}
