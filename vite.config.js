import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig((env) => {
  const { mode } = env
  return {
    plugins: [
      vue(),
      tailwindcss(),
      ...(mode === 'development' ? [vueDevTools()] : []),
      Components({
        resolvers: [IconsResolver()],
      }),
      Icons({
        compiler: 'vue3',
      }),
    ],
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
