import {
  CalendarDays,
  Dog,
  Home,
  DollarSign,
  Clock3,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react";

import { AppCard } from "../../components/common/AppCard";
import { AppButton } from "../../components/common/AppButton";

import "./operationsDashboard.css";

export default function OperationsDashboard() {
  return (
    <div className="operations-dashboard">

      <div className="operations-header">

        <div>

          <span className="eyebrow">
            Daily Operations
          </span>

          <h1>
            Whimsical Paws Pet Escape
          </h1>

          <p>
            Shop Operations Dashboard
          </p>

        </div>

        <AppButton>
          Refresh Dashboard
        </AppButton>

      </div>

      <section className="operations-summary">

        <AppCard>

          <CalendarDays size={28} />

          <strong>18</strong>

          <span>
            Grooming Appointments
          </span>

        </AppCard>

        <AppCard>

          <Home size={28} />

          <strong>27 / 32</strong>

          <span>
            Boarding Occupancy
          </span>

        </AppCard>

        <AppCard>

          <DollarSign size={28} />

          <strong>$2,185</strong>

          <span>
            Expected Revenue
          </span>

        </AppCard>

        <AppCard>

          <Clock3 size={28} />

          <strong>4</strong>

          <span>
            Check-ins Due
          </span>

        </AppCard>

        <AppCard>

          <CheckCircle2 size={28} />

          <strong>7</strong>

          <span>
            Ready for Pickup
          </span>

        </AppCard>

      </section>

      <div className="operations-layout">

        <AppCard className="operations-panel">

          <h2>
            Today's Groomers
          </h2>

          <table className="operations-table">

            <thead>

              <tr>

                <th>Staff</th>

                <th>Pets</th>

                <th>Status</th>

              </tr>

            </thead>

            <tbody>

              <tr>

                <td>Ashley</td>

                <td>7</td>

                <td>Busy</td>

              </tr>

              <tr>

                <td>Jordan</td>

                <td>5</td>

                <td>Busy</td>

              </tr>

              <tr>

                <td>Lisa</td>

                <td>6</td>

                <td>Available</td>

              </tr>

            </tbody>

          </table>

        </AppCard>

        <AppCard className="operations-panel">

          <h2>
            Boarding
          </h2>

          <div className="dashboard-list">

            <div>

              <Dog size={18}/>

              Bella

              <small>
                Suite A4
              </small>

            </div>

            <div>

              <Dog size={18}/>

              Charlie

              <small>
                Suite B1
              </small>

            </div>

            <div>

              <Dog size={18}/>

              Daisy

              <small>
                Suite C2
              </small>

            </div>

          </div>

        </AppCard>

      </div>

      <div className="operations-layout">

        <AppCard className="operations-panel">

          <h2>
            Upcoming Appointments
          </h2>

          <div className="dashboard-list">

            <div>

              9:00 AM

              <span>

                Bella

              </span>

            </div>

            <div>

              9:30 AM

              <span>

                Charlie

              </span>

            </div>

            <div>

              10:00 AM

              <span>

                Daisy

              </span>

            </div>

          </div>

        </AppCard>

        <AppCard className="operations-panel">

          <h2>
            Alerts
          </h2>

          <div className="dashboard-alert">

            <AlertTriangle
              size={18}
            />

            Rabies expires tomorrow for Bella.

          </div>

          <div className="dashboard-alert">

            <MessageSquare
              size={18}
            />

            3 unread customer messages.

          </div>

          <div className="dashboard-alert">

            <TrendingUp
              size={18}
            />

            Revenue is 18% above yesterday.

          </div>

        </AppCard>

      </div>

      <div className="operations-layout">

        <AppCard className="operations-panel">

          <h2>
            Staff Clocked In
          </h2>

          <div className="dashboard-list">

            <div>

              <Users size={18}/>

              Ashley

            </div>

            <div>

              <Users size={18}/>

              Jordan

            </div>

            <div>

              <Users size={18}/>

              Lisa

            </div>

          </div>

        </AppCard>

        <AppCard className="operations-panel">

          <h2>
            Daily KPI
          </h2>

          <table className="operations-table">

            <tbody>

              <tr>

                <td>Average Ticket</td>

                <td>$82.44</td>

              </tr>

              <tr>

                <td>Retail Sales</td>

                <td>$345</td>

              </tr>

              <tr>

                <td>Boarding Revenue</td>

                <td>$680</td>

              </tr>

              <tr>

                <td>Grooming Revenue</td>

                <td>$1,505</td>

              </tr>

            </tbody>

          </table>

        </AppCard>

      </div>

    </div>
  );
}