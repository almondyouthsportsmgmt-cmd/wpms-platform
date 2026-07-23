import { CalendarClock, ChevronRight, CircleDollarSign, Hotel, MessageSquare, PawPrint, Scissors, Users } from "lucide-react";
import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";
import { useAuth } from "../../auth/AuthContext";

const kpis = [
  ["Pets today","23","5 checked in",PawPrint,"lime"],
  ["Grooming today","18","7 completed",Scissors,"purple"],
  ["Boarding guests","11","3 checking out",Hotel,"blue"],
  ["Revenue today","$1,245","+12% vs yesterday",CircleDollarSign,"green"],
  ["Unread messages","7","2 need replies",MessageSquare,"orange"],
  ["Staff working","5","All stations covered",Users,"pink"],
] as const;

const appts = [
  ["8:00","Bella","Full Groom · Ashley","Checked in"],
  ["8:30","Max","Bath & Brush · Jordan","Bath"],
  ["9:00","Charlie","Nail Trim · Lisa","Scheduled"],
  ["9:30","Daisy","De-shed Package · Ashley","Scheduled"],
];

export function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.first_name ?? "Lisa";
  return <div>
    <section className="welcome">
      <div><span className="eyebrow">Thursday, July 16</span><h1>Good afternoon, {name} 👋</h1><p>Here’s what’s happening at Whimsical Paws today.</p></div>
      <div className="quick"><AppButton variant="secondary">Check in pet</AppButton><AppButton>+ New appointment</AppButton></div>
    </section>

    <section className="kpis">
      {kpis.map(([label,value,note,Icon,tone]) => <AppCard className="kpi" key={label}>
        <div className={`kpi-icon ${tone}`}><Icon size={22}/></div>
        <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
      </AppCard>)}
    </section>

    <section className="grid">
      <AppCard className="panel">
        <div className="panel-head"><div><span className="eyebrow">Today</span><h2>Upcoming appointments</h2></div><button className="link-button">View calendar <ChevronRight size={16}/></button></div>
        <div>{appts.map(([time,pet,desc,status]) => <div className="appointment" key={time+pet}><div className="time">{time}</div><div className="pet-avatar">{pet[0]}</div><div><strong>{pet}</strong><span>{desc}</span></div><em>{status}</em></div>)}</div>
      </AppCard>

      <AppCard className="panel spotlight">
        <div className="panel-head"><div><span className="eyebrow">Pet spotlight</span><h2>Today’s featured guest</h2></div></div>
        <div className="spotlight-main"><div className="dog">🐕</div><div><h3>Bella</h3><p>Golden Retriever · 4 years old</p><b>🎂 Birthday tomorrow</b></div></div>
        <dl><div><dt>Owner</dt><dd>Sarah Miller</dd></div><div><dt>Preferred groomer</dt><dd>Ashley</dd></div><div><dt>Favorite shampoo</dt><dd>Oatmeal Lavender</dd></div></dl>
      </AppCard>

      <AppCard className="panel">
        <div className="panel-head"><div><span className="eyebrow">Live feed</span><h2>Recent activity</h2></div></div>
        {[
          ["🐶","Bella checked in","Full Groom · 8:02 AM"],
          ["📷","Cooper boarding photo sent","Client update · 8:16 AM"],
          ["🛁","Max moved to Bath","Grooming workflow · 8:28 AM"],
          ["💳","Payment received","$85.00 from Sarah Miller"],
        ].map(([icon,title,meta]) => <div className="activity" key={title}><div>{icon}</div><span><strong>{title}</strong><small>{meta}</small></span></div>)}
      </AppCard>

      <AppCard className="panel">
        <div className="panel-head"><div><span className="eyebrow">Boarding</span><h2>Today’s movement</h2></div></div>
        <div className="boarding"><div><span>Check-ins</span><strong>5</strong><small>Next: Cooper at 2:00 PM</small></div><div><span>Check-outs</span><strong>4</strong><small>2 awaiting pickup</small></div></div>
        <div className="weather"><span>☀️</span><div><strong>Panama City · 82°</strong><small>Great afternoon for outdoor playtime.</small></div><CalendarClock size={20}/></div>
      </AppCard>
    </section>
  </div>;
}
