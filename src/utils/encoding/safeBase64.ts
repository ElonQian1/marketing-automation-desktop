// src/utils/encoding/safeBase64.ts
// module: shared | layer: utils | role: utility
// summary: 安全的Base64编码工具，支持中文字符

/**
 * 安全的Base64编码函数，支持UTF-8字符（包括中文）
 * 替代原生btoa函数，避免"characters outside of the Latin1 range"错误
 */
export function safeBase64Encode(str: string): string {
  try {
    // 先将字符串转换为UTF-8字节，再编码为Base64
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    console.warn('safeBase64Encode fallback to TextEncoder:', error);
    // 备用方案：使用TextEncoder + 手动Base64编码
    const bytes = new TextEncoder().encode(str);
    return bytesToBase64(bytes);
  }
}

/**
 * 安全的Base64解码函数，支持UTF-8字符（包括中文）
 */
export function safeBase64Decode(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    console.warn('safeBase64Decode fallback to TextDecoder:', error);
    // 备用方案：手动Base64解码 + TextDecoder
    const bytes = base64ToBytes(base64);
    return new TextDecoder().decode(bytes);
  }
}

/**
 * 将字节数组转换为Base64字符串
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    const byte2 = i < bytes.length ? bytes[i++] : 0;
    const byte3 = i < bytes.length ? bytes[i++] : 0;
    
    const bitmap = (byte1 << 16) | (byte2 << 8) | byte3;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += chars.charAt((bitmap >> 6) & 63);
    result += chars.charAt(bitmap & 63);
  }
  
  // 添加填充
  const padding = bytes.length % 3;
  if (padding === 1) {
    result = result.slice(0, -2) + '==';
  } else if (padding === 2) {
    result = result.slice(0, -1) + '=';
  }
  
  return result;
}

/**
 * 将Base64字符串转换为字节数组
 */
export function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const charMap = new Map();
  for (let i = 0; i < chars.length; i++) {
    charMap.set(chars[i], i);
  }
  
  // 移除填充
  const cleanBase64 = base64.replace(/=/g, '');
  const bytes = new Uint8Array(Math.floor(cleanBase64.length * 3 / 4));
  
  let byteIndex = 0;
  for (let i = 0; i < cleanBase64.length; i += 4) {
    const char1 = charMap.get(cleanBase64[i]) || 0;
    const char2 = charMap.get(cleanBase64[i + 1]) || 0;
    const char3 = charMap.get(cleanBase64[i + 2]) || 0;
    const char4 = charMap.get(cleanBase64[i + 3]) || 0;
    
    const bitmap = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;
    
    if (byteIndex < bytes.length) bytes[byteIndex++] = (bitmap >> 16) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = (bitmap >> 8) & 255;
    if (byteIndex < bytes.length) bytes[byteIndex++] = bitmap & 255;
  }
  
  return bytes;
}

/**
 * 生成安全的XML内容Hash（截取前16个字符）
 * 专门用于XML内容的hash生成，避免编码问题
 */
export function generateXmlHash(xmlContent: string): string {
  try {
    return safeBase64Encode(xmlContent).substring(0, 16);
  } catch (error) {
    console.warn('generateXmlHash fallback to simple hash:', error);
    // 简单fallback：使用字符码的简单hash
    let hash = 0;
    for (let i = 0; i < xmlContent.length; i++) {
      const char = xmlContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36).padStart(16, '0').substring(0, 16);
  }
}