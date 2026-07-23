import { BarChart3, Bot, CalendarDays, CalendarRange, CreditCard, Home, Hotel, MessageSquare, Package, PawPrint, Scissors, Settings, ShieldCheck, Smartphone, Users, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  ["/","Dashboard",Home],["/calendar","Calendar",CalendarDays],["/appointments","Appointments",CalendarRange],
  ["/grooming","Grooming",Scissors],["/boarding","Boarding",Hotel],["/pets","Pets",PawPrint],
  ["/customers","Customers",Users],["/messages","Messages",MessageSquare],["/payments","Payments",CreditCard],
  ["/employees","Employees",ShieldCheck],["/inventory","Inventory",Package],["/reports","Reports",BarChart3],
  ["/settings","Settings",Settings],["/client-portal","Client Portal",Smartphone],["/ai-receptionist","AI Receptionist",Bot]
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <>
    <button className={`backdrop ${open ? "show" : ""}`} onClick={onClose} aria-label="Close navigation" />
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">🐾</div>
        <div><strong>Whimsical Paws</strong><span>Pet Escape</span></div>
        <button className="mobile-close" onClick={onClose}><X size={20}/></button>
      </div>
      <nav>
        {items.map(([to,label,Icon]) => (
          <NavLink key={to} to={to} end={to==="/"} onClick={onClose}
            className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={19}/><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="shop-status"><span className="dot"/><div><strong>Shop open</strong><span>7:30 AM – 6:00 PM</span></div></div>
    </aside>
  </>;
}
