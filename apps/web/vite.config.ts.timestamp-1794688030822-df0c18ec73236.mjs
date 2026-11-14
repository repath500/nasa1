// vite.config.ts
import { defineConfig } from "file:///Users/repathkhan/.t3/projects/nasa1/node_modules/.pnpm/vite@6.0.15_@types+node@22.9.4_jiti@2.7.0_lightningcss@1.29.2/node_modules/vite/dist/node/index.js";
import react from "file:///Users/repathkhan/.t3/projects/nasa1/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@6.0.15_@types+node@22.9.4_jiti@2.7.0_lightningcss@1.29.2_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///Users/repathkhan/.t3/projects/nasa1/node_modules/.pnpm/@tailwindcss+vite@4.0.17_vite@6.0.15_@types+node@22.9.4_jiti@2.7.0_lightningcss@1.29.2_/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8787" } }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcmVwYXRoa2hhbi8udDMvcHJvamVjdHMvbmFzYTEvYXBwcy93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yZXBhdGhraGFuLy50My9wcm9qZWN0cy9uYXNhMS9hcHBzL3dlYi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcmVwYXRoa2hhbi8udDMvcHJvamVjdHMvbmFzYTEvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHNlcnZlcjogeyBwb3J0OiA1MTczLCBwcm94eTogeyAnL2FwaSc6ICdodHRwOi8vMTI3LjAuMC4xOjg3ODcnIH0gfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5VCxTQUFTLG9CQUFvQjtBQUN0VixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxRQUFRLEVBQUUsTUFBTSxNQUFNLE9BQU8sRUFBRSxRQUFRLHdCQUF3QixFQUFFO0FBQ25FLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
