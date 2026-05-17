/**
 * Browser Runtime — agent-browser-cli 服务层
 *
 * 纯函数，不依赖 RuntimeStore，不写 Timeline。
 * 能力层：只提供 open / scanText / screenshot。
 * Timeline 写入由调用方 task flow 负责。
 */

import { invoke } from '@tauri-apps/api/core'

/**
 * 打开浏览器 URL
 *
 * 校验 http/https scheme，调用 agent-browser-cli open。
 */
export async function openUrl(url: string): Promise<void> {
  await invoke('browser_open_url', { url })
}

/**
 * 提取页面文本
 *
 * 调用 agent-browser-cli scan --text-only。
 */
export async function scanText(): Promise<string> {
  return await invoke<string>('browser_scan_text')
}

/**
 * 截图，保存到 temp dir，返回文件路径
 *
 * 调用 agent-browser-cli exec CDP Page.captureScreenshot。
 * 返回路径供 ResultItemProjection placeholder 显示（L0 metadata）。
 */
export async function screenshot(): Promise<string> {
  return await invoke<string>('browser_screenshot')
}
