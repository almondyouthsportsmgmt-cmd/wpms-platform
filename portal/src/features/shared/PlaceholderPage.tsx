import { AppCard } from "../../components/common/AppCard";
export function PlaceholderPage({ title }: { title: string }) {
  return <div><div className="page-head"><span className="eyebrow">Whimsical Paws</span><h1>{title}</h1><p>This workspace is ready for the next release.</p></div>
  <AppCard className="empty"><div>🐾</div><h2>{title} is coming next</h2><p>The premium shell is complete. This module will use the same design system, navigation, and responsive layout.</p></AppCard></div>;
}
