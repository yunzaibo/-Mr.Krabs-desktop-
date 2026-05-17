// Browser Runtime — agent-browser-cli 集成
//
// POC: 3 个 Tauri command，调用 agent-browser-cli HTTP API (localhost:18767)。
// 能力层，不是策略层。不写 Timeline，不管理 Asset 生命周期。

use std::time::Duration;
use tauri::Manager;

const BROWSER_CLI_BASE: &str = "http://localhost:18767";
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// 校验 URL scheme，只允许 http/https
fn validate_url(url: &str) -> Result<(), String> {
    if url.starts_with("file://")
        || url.starts_with("javascript:")
        || url.starts_with("data:")
    {
        return Err(format!(
            "Blocked URL scheme: {}",
            url.split(':').next().unwrap_or("")
        ));
    }
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("URL must start with http:// or https://".into());
    }
    Ok(())
}

/// 打开浏览器 URL
///
/// 调用 agent-browser-cli: POST /open { url }
#[tauri::command]
pub async fn browser_open_url(url: String) -> Result<(), String> {
    validate_url(&url)?;

    let client = reqwest::Client::new();
    let body = serde_json::json!({ "url": url });

    let resp = client
        .post(format!("{}/open", BROWSER_CLI_BASE))
        .header("Content-Type", "application/json")
        .timeout(DEFAULT_TIMEOUT)
        .body(body.to_string())
        .send()
        .await
        .map_err(|e| format!("browser open failed: {}", e))?;

    let status = resp.status().as_u16();
    if status >= 400 {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("browser open HTTP {}: {}", status, text));
    }

    Ok(())
}

/// 提取页面文本
///
/// 调用 agent-browser-cli: GET /scan?text-only=true
#[tauri::command]
pub async fn browser_scan_text() -> Result<String, String> {
    let client = reqwest::Client::new();

    let resp = client
        .get(format!("{}/scan?text-only=true", BROWSER_CLI_BASE))
        .timeout(DEFAULT_TIMEOUT)
        .send()
        .await
        .map_err(|e| format!("browser scan failed: {}", e))?;

    let status = resp.status().as_u16();
    if status >= 400 {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("browser scan HTTP {}: {}", status, text));
    }

    let text = resp
        .text()
        .await
        .map_err(|e| format!("browser scan read failed: {}", e))?;

    Ok(text)
}

/// 截图，保存到 temp dir，返回文件路径
///
/// 调用 agent-browser-cli: POST /exec { cmd: "cdp", method: "Page.captureScreenshot", params: { format: "png" } }
/// 返回 base64 → decode → 写入 temp file → 返回路径
#[tauri::command]
pub async fn browser_screenshot(app: tauri::AppHandle) -> Result<String, String> {
    use base64::Engine as _;

    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "cmd": "cdp",
        "method": "Page.captureScreenshot",
        "params": { "format": "png" }
    });

    let resp = client
        .post(format!("{}/exec", BROWSER_CLI_BASE))
        .header("Content-Type", "application/json")
        .timeout(DEFAULT_TIMEOUT)
        .body(body.to_string())
        .send()
        .await
        .map_err(|e| format!("browser screenshot failed: {}", e))?;

    let status = resp.status().as_u16();
    if status >= 400 {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("browser screenshot HTTP {}: {}", status, text));
    }

    // agent-browser-cli exec 返回 JSON: { "result": "<base64>" }
    let resp_json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("browser screenshot parse failed: {}", e))?;

    let base64_data = resp_json
        .get("result")
        .and_then(|v| v.as_str())
        .ok_or("browser screenshot: no result in response")?;

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|e| format!("browser screenshot base64 decode failed: {}", e))?;

    // 写入 temp dir
    let temp_dir = app
        .path()
        .temp_dir()
        .map_err(|e| format!("failed to get temp dir: {}", e))?;

    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("failed to create temp dir: {}", e))?;

    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let filename = format!("browser-screenshot-{}.png", ts);
    let file_path = temp_dir.join(&filename);

    std::fs::write(&file_path, &bytes)
        .map_err(|e| format!("failed to write screenshot: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}
