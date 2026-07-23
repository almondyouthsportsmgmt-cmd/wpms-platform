import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
export function MainLayout() {
  const [open, setOpen] = useState(false);
  return <div className="shell">
    <Sidebar open={open} onClose={() => setOpen(false)} />
    <div className="main">
      <TopBar onMenu={() => setOpen(true)} />
      <main className="content"><Outlet/></main>
    </div>
  </div>;
}
