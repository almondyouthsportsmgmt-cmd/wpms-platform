import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AppButton } from "../common/AppButton";
export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user, signOut, isDemo } = useAuth();
  const name = user?.user_metadata?.first_name ?? user?.email?.split("@")[0] ?? "Owner";
  return <header className="topbar">
    <button className="menu-button" onClick={onMenu}><Menu size={22}/></button>
    <div className="search"><Search size={18}/><input placeholder="Search pets, customers, appointments..." /><kbd>Ctrl K</kbd></div>
    <div className="top-actions">
      {isDemo && <span className="demo-pill">Demo mode</span>}
      <button className="icon-button"><Bell size={20}/><span className="notif"/></button>
      <div className="user"><div className="avatar">{name[0]?.toUpperCase()}</div><div><strong>{name}</strong><span>Owner</span></div></div>
      <AppButton variant="ghost" onClick={() => void signOut()}>Sign out</AppButton>
    </div>
  </header>;
}
