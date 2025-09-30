# Theme Architecture (AntD v5 native dark first)

- Primary theme driver: Ant Design v5 `ConfigProvider` with `darkAlgorithm`/`defaultAlgorithm`.
- TokenBridge: Sync AntD tokens to CSS variables, so custom CSS follows native theme.
- CSS variables live on `:root` and switch via `data-theme` attribute.
- Keep custom overrides minimal and shape-focused (radius/spacing/shadows), avoid color hardcoding.

Files:
- ThemeProvider.tsx: wraps App with ConfigProvider, mounts TokenBridge, manages `mode`.
- TokenBridge.tsx: copies AntD tokens into CSS variables (e.g., `--color-text`).
- styles/design-system/antd/*: small modular AntD overrides imported by `antd-theme.css`.
