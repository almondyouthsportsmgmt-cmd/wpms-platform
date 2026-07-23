import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, PawPrint } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AppButton } from "../../components/common/AppButton";

export function LoginPage() {
  const { user, signIn, isDemo } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email,setEmail] = useState("owner@whimsicalpaws.com");
  const [password,setPassword] = useState("demo1234");
  const [show,setShow] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await signIn(email,password);
      nav((location.state as {from?:string}|null)?.from ?? "/", {replace:true});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally { setBusy(false); }
  }

  return <div className="login">
    <section className="login-visual">
      <div className="login-brand"><div className="logo-orb"><PawPrint size={42}/></div><div><strong>Whimsical Paws</strong><span>Pet Escape</span></div></div>
      <div className="hero-copy"><span className="eyebrow">A happier way to run your pet business</span><h1>Every pet. Every stay. Every detail.</h1><p>Grooming, boarding, customers, pets, payments, and communication — all in one friendly workspace.</p></div>
      <div className="paw p1">🐾</div><div className="paw p2">🐾</div>
    </section>
    <section className="login-panel">
      <form className="login-card" onSubmit={submit}>
        <div className="login-heading"><div className="mini-logo">🐾</div><h2>Welcome back</h2><p>Sign in to open today’s command center.</p></div>
        {isDemo && <div className="demo-note">Supabase is not configured. Any email and password will open demo mode.</div>}
        {error && <div className="error">{error}</div>}
        <label className="field"><span>Email address</span><div className="input-shell"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div></label>
        <label className="field"><span>Password</span><div className="input-shell"><LockKeyhole size={18}/><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required /><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <div className="login-options"><label><input type="checkbox" defaultChecked/> Remember me</label><button type="button" className="link-button">Forgot password?</button></div>
        <AppButton className="login-submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</AppButton>
      </form>
    </section>
  </div>;
}
