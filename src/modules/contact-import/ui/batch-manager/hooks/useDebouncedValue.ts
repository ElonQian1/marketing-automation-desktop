// src/modules/contact-import/ui/batch-manager/hooks/useDebouncedValue.ts
// module: contact-import | layer: ui | role: module-component
// summary: 模块组件

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
