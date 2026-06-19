import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
              return "react-vendor";
            }
            if (id.includes("recharts")) return "charts";
            if (id.includes("react-big-calendar") || id.includes("date-fns")) return "calendar";
            if (id.includes("reactflow") || id.includes("d3-")) return "flow";
            if (id.includes("@dnd-kit")) return "dnd";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
});
