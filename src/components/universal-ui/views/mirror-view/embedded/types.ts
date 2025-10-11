// src/components/universal-ui/views/mirror-view/embedded/types.ts
// module: ui | layer: ui | role: component
// summary: UI 组件

export type WsScrcpyConfig = {
  /** ws-scrcpy server url, e.g., ws://127.0.0.1:8000/device/<id> */
  url: string;
  /** optional token or headers if needed in future */
  token?: string;
};

export type DecodedVideoFrame = VideoFrame;

export type PlayerStatus =
  | { state: 'idle' }
  | { state: 'connecting' }
  | { state: 'connected' }
  | { state: 'error'; error: string };
