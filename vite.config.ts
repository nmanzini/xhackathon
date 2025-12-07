import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { exec } from "child_process";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "volume-control",
      configureServer(server) {
        server.middlewares.use("/api/set-volume-max", (_req, res) => {
          exec("osascript -e 'set volume input volume 100'", (error) => {
            if (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            } else {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            }
          });
        });
      },
    },
  ],
});
