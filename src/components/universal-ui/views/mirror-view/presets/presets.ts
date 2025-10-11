// src/components/universal-ui/views/mirror-view/presets/presets.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

import type { ScrcpyOptions } from '../../../../../application/services/ScrcpyApplicationService';

export type ScrcpyPreset = {
  id: string;
  name: string;
  options: ScrcpyOptions;
  builtIn?: boolean;
};

export const BUILTIN_PRESETS: ScrcpyPreset[] = [
  {
    id: 'default:smooth',
    name: '流畅优先 (720p/8M/60fps)',
    options: { resolution: '1280', bitrate: '8M', maxFps: 60 },
    builtIn: true,
  },
  {
    id: 'default:clear',
    name: '清晰优先 (1080p/16M/60fps)',
    options: { resolution: '1920', bitrate: '16M', maxFps: 60 },
    builtIn: true,
  },
  {
    id: 'default:power',
    name: '省电优先 (720p/4M/30fps)',
    options: { resolution: '1280', bitrate: '4M', maxFps: 30 },
    builtIn: true,
  },
];
