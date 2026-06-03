import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedDatabase } from "./lib/db";

seedDatabase().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
