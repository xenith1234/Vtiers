import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");
setBaseUrl(base ? base : undefined);

setAuthTokenGetter(() => localStorage.getItem("vt_token"));

createRoot(document.getElementById("root")!).render(<App />);
