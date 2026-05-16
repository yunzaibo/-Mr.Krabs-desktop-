import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'
// 注释：这是 Vitest 配置文件，用于配置 Vitest 测试环境
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: [fileURLToPath(new URL('./src/test/vitest-setup.ts', import.meta.url))],
      exclude: [...configDefaults.exclude, 'e2e/**', 'tests/e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      retry: process.env.CI ? 2 : 0,
    },
  }),
)
