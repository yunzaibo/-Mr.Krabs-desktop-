import { describe, it, expect } from 'vitest'

/**
 * PLN-023A: Result Items Rendering P1 — Unit tests
 *
 * Tests for inferLanguage() and wrapAsCodeBlock() helper functions
 * extracted from ContextDetailPanel.vue.
 */

// ── inferLanguage ────────────────────────────────────

function inferLanguage(title: string): string {
  const ext = title.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    py: 'python', ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', rs: 'rust',
    go: 'go', json: 'json', md: 'markdown',
    html: 'html', css: 'css', sh: 'bash',
  }
  return map[ext] ?? ''
}

describe('inferLanguage', () => {
  it('推断 Python', () => expect(inferLanguage('output.py')).toBe('python'))
  it('推断 TypeScript', () => expect(inferLanguage('app.ts')).toBe('typescript'))
  it('推断 TSX', () => expect(inferLanguage('Component.tsx')).toBe('typescript'))
  it('推断 JavaScript', () => expect(inferLanguage('index.js')).toBe('javascript'))
  it('推断 JSX', () => expect(inferLanguage('App.jsx')).toBe('javascript'))
  it('推断 Rust', () => expect(inferLanguage('main.rs')).toBe('rust'))
  it('推断 Go', () => expect(inferLanguage('server.go')).toBe('go'))
  it('推断 JSON', () => expect(inferLanguage('config.json')).toBe('json'))
  it('推断 Markdown', () => expect(inferLanguage('readme.md')).toBe('markdown'))
  it('推断 HTML', () => expect(inferLanguage('index.html')).toBe('html'))
  it('推断 CSS', () => expect(inferLanguage('style.css')).toBe('css'))
  it('推断 Bash', () => expect(inferLanguage('deploy.sh')).toBe('bash'))
  it('未知扩展名返回空字符串', () => expect(inferLanguage('file.xyz')).toBe(''))
  it('无扩展名返回空字符串', () => expect(inferLanguage('Makefile')).toBe(''))
  it('大小写不敏感', () => expect(inferLanguage('APP.PY')).toBe('python'))
  it('多点文件名正确推断', () => expect(inferLanguage('app.test.ts')).toBe('typescript'))
})

// ── wrapAsCodeBlock ──────────────────────────────────

function wrapAsCodeBlock(code: string, title: string): string {
  if (/^```/.test(code.trim())) return code
  const lang = inferLanguage(title)
  const fenced = '```' + lang + '\n' + code + '\n```'
  if (fenced.length > 2000) {
    return fenced.slice(0, 2000) + '\n// ... truncated'
  }
  return fenced
}

describe('wrapAsCodeBlock', () => {
  it('纯代码文本包装为 fenced code block', () => {
    const result = wrapAsCodeBlock('console.log("hello")', 'app.js')
    expect(result).toBe('```javascript\nconsole.log("hello")\n```')
  })

  it('已含 ``` 的内容不嵌套', () => {
    const input = '```python\nprint("hi")\n```'
    const result = wrapAsCodeBlock(input, 'script.py')
    expect(result).toBe(input)
  })

  it('已含 ``` 但前面有空格也不嵌套', () => {
    const input = '  ```rust\nfn main() {}\n```'
    const result = wrapAsCodeBlock(input, 'main.rs')
    expect(result).toBe(input)
  })

  it('未知扩展名生成无语言标记的 code block', () => {
    const result = wrapAsCodeBlock('some content', 'data.xyz')
    expect(result).toBe('```\nsome content\n```')
  })

  it('超长内容截断到约 2000 字符', () => {
    const longCode = 'x'.repeat(3000)
    const result = wrapAsCodeBlock(longCode, 'big.py')
    // fenced.slice(0, 2000) + '\n// ... truncated' ≈ 2017 chars
    expect(result.length).toBeLessThanOrEqual(2020)
    expect(result).toContain('// ... truncated')
    expect(result).toContain('```python')
  })

  it('刚好 2000 字符不截断', () => {
    // '```python\n' + code + '\n```' = 10 + code.length + 4
    // 要让总长 <= 2000, code.length <= 1986
    const code = 'a'.repeat(1986)
    const result = wrapAsCodeBlock(code, 'test.py')
    expect(result).not.toContain('// ... truncated')
    expect(result).toContain('```python')
  })

  it('首行是空行的 fenced code 不嵌套', () => {
    const input = '```\n\ncontent\n```'
    const result = wrapAsCodeBlock(input, 'test.txt')
    expect(result).toBe(input)
  })
})
