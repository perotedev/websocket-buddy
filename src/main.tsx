import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA Service Worker registration is handled automatically by vite-plugin-pwa
// with registerType: "autoUpdate" configuration

createRoot(document.getElementById("root")!).render(<App />);
