import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BellRing,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Hotel,
  MessageSquare,
  PawPrint,
  RefreshCw,
  Scissors,
  Users,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useAuth } from "../../auth/AuthContext";
import {
  listActivity,
  type ActivityFeedItem,
} from "../../core/live/activityFeedService";
import { liveEventBus } from "../../core/live/eventBus";
import { useAppointments } from "../appointments/useAppointments";
import { useBoarding } from "../boarding/useBoarding";
import { useCustomers } from "../customers/useCustomers";
import { useKennels } from "../kennels/useKennels";
import { useMessages } from "../messages/useMessages";
import {
  listNotificationQueue,
} from "../messages/notifications/notificationQueueService";
import { usePets } from "../pets/usePets";

import "./dashboardLive.css";

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function money(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

function appointmentDateTime(
  date: string,
  time: string,
) {
  return new Date(
    `${date}T${time || "00:00"}:00`,
  );
}

function boardingNights(
  checkInDate: string,
  checkOutDate: string,
) {
  const start = new Date(
    `${checkInDate}T12:00:00`,
  );
  const end = new Date(
    `${checkOutDate}T12:00:00`,
  );

  return Math.max(
    1,
    Math.ceil(
      (end.getTime() - start.getTime()) /
        86_400_000,
    ),
  );
}

function activityIcon(
  item: ActivityFeedItem,
) {
  if (
    item.eventType.startsWith(
      "appointment",
    )
  ) {
    return "✂️";
  }

  if (
    item.eventType.startsWith(
      "boarding",
    )
  ) {
    return "🏠";
  }

  if (
    item.eventType.startsWith(
      "message",
    ) ||
    item.eventType.startsWith(
      "notification",
    )
  ) {
    return "💬";
  }

  if (
    item.eventType.startsWith(
      "payment",
    )
  ) {
    return "💳";
  }

  return "🐾";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
  } = useAppointments();

  const {
    stays,
    loading: boardingLoading,
    error: boardingError,
    refresh: refreshBoarding,
  } = useBoarding();

  const {
    customers,
    loading: customersLoading,
    error: customersError,
    refresh: refreshCustomers,
  } = useCustomers();

  const {
    pets,
    loading: petsLoading,
    error: petsError,
    refresh: refreshPets,
  } = usePets();

  const {
    kennels,
    loading: kennelsLoading,
    error: kennelsError,
    refresh: refreshKennels,
  } = useKennels();

  const {
    threads,
    loading: messagesLoading,
    error: messagesError,
    refresh: refreshMessages,
  } = useMessages();

  const [notifications, setNotifications] =
    useState(
      listNotificationQueue,
    );

  const [activity, setActivity] =
    useState<ActivityFeedItem[]>(
      () => listActivity(8),
    );

  const [refreshing, setRefreshing] =
    useState(false);

  const today = localDateKey();

  const refreshSupplemental =
    useCallback(() => {
      setNotifications(
        listNotificationQueue(),
      );

      setActivity(
        listActivity(8),
      );
    }, []);

  const refreshAll = useCallback(
    async () => {
      setRefreshing(true);

      try {
        await Promise.all([
          refreshAppointments(),
          refreshBoarding(),
          refreshCustomers(),
          refreshPets(),
          refreshKennels(),
          refreshMessages(),
        ]);

        refreshSupplemental();
      } finally {
        setRefreshing(false);
      }
    },
    [
      refreshAppointments,
      refreshBoarding,
      refreshCustomers,
      refreshKennels,
      refreshMessages,
      refreshPets,
      refreshSupplemental,
    ],
  );

  useEffect(() => {
    const unsubscribe =
      liveEventBus.subscribe(
        "*",
        () => {
          void refreshAll();
        },
      );

    function handleQueueUpdate() {
      refreshSupplemental();
    }

    window.addEventListener(
      "wpms:notification-queue-updated",
      handleQueueUpdate,
    );

    window.addEventListener(
      "wpms:activity-feed-updated",
      handleQueueUpdate,
    );

    return () => {
      unsubscribe();

      window.removeEventListener(
        "wpms:notification-queue-updated",
        handleQueueUpdate,
      );

      window.removeEventListener(
        "wpms:activity-feed-updated",
        handleQueueUpdate,
      );
    };
  }, [
    refreshAll,
    refreshSupplemental,
  ]);

  const customerMap = useMemo(
    () =>
      new Map(
        customers.map((customer) => [
          customer.id,
          customer,
        ]),
      ),
    [customers],
  );

  const petMap = useMemo(
    () =>
      new Map(
        pets.map((pet) => [
          pet.id,
          pet,
        ]),
      ),
    [pets],
  );

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.appointmentDate ===
              today &&
            ![
              "Cancelled",
              "No Show",
            ].includes(
              appointment.status,
            ),
        )
        .sort(
          (left, right) =>
            left.startTime.localeCompare(
              right.startTime,
            ),
        ),
    [appointments, today],
  );

  const upcomingAppointments =
    useMemo(
      () =>
        todayAppointments
          .filter(
            (appointment) =>
              appointmentDateTime(
                appointment.appointmentDate,
                appointment.endTime,
              ).getTime() >=
              Date.now() -
                15 * 60_000,
          )
          .slice(0, 6),
      [todayAppointments],
    );

  const activeBoarding = useMemo(
    () =>
      stays.filter(
        (stay) =>
          stay.checkInDate <= today &&
          stay.checkOutDate >= today &&
          ![
            "Checked Out",
            "Cancelled",
          ].includes(stay.status),
      ),
    [stays, today],
  );

  const arrivals = stays.filter(
    (stay) =>
      stay.checkInDate === today &&
      ![
        "Checked Out",
        "Cancelled",
      ].includes(stay.status),
  );

  const departures = stays.filter(
    (stay) =>
      stay.checkOutDate === today &&
      !["Cancelled"].includes(
        stay.status,
      ),
  );

  const readyForPickup =
    todayAppointments.filter(
      (appointment) =>
        appointment.status ===
        "Ready for Pickup",
    ).length;

  const completedToday =
    todayAppointments.filter(
      (appointment) =>
        appointment.status ===
        "Completed",
    ).length;

  const checkedInToday =
    todayAppointments.filter(
      (appointment) =>
        [
          "Checked In",
          "In Service",
          "Ready for Pickup",
        ].includes(
          appointment.status,
        ),
    ).length;

  const appointmentRevenue =
    todayAppointments.reduce(
      (total, appointment) =>
        total +
        (appointment.priceEstimate ??
          0),
      0,
    );

  const boardingRevenue =
    activeBoarding.reduce(
      (total, stay) =>
        total +
        stay.dailyRate *
          boardingNights(
            stay.checkInDate,
            stay.checkOutDate,
          ),
      0,
    );

  const projectedRevenue =
    appointmentRevenue +
    boardingRevenue;

  const unreadMessages =
    threads.reduce(
      (total, thread) =>
        total + thread.unreadCount,
      0,
    );

  const pendingNotifications =
    notifications.filter(
      (item) =>
        item.status === "pending",
    ).length;

  const availableKennels =
    kennels.filter(
      (kennel) =>
        kennel.status === "Available",
    ).length;

  const occupiedKennels =
    kennels.filter(
      (kennel) =>
        [
          "Occupied",
          "Reserved",
        ].includes(kennel.status),
    ).length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.isActive,
    ).length;

  const activePets =
    pets.filter(
      (pet) => pet.isActive,
    ).length;

  const staffLoads = useMemo(() => {
    const counts = new Map<
      string,
      number
    >();

    todayAppointments.forEach(
      (appointment) => {
        const staff =
          appointment.assignedStaff ||
          "Unassigned";

        counts.set(
          staff,
          (counts.get(staff) ?? 0) +
            1,
        );
      },
    );

    return Array.from(
      counts.entries(),
    )
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort(
        (left, right) =>
          right.count - left.count,
      );
  }, [todayAppointments]);

  const loading =
    appointmentsLoading ||
    boardingLoading ||
    customersLoading ||
    petsLoading ||
    kennelsLoading ||
    messagesLoading;

  const errors = [
    appointmentsError,
    boardingError,
    customersError,
    petsError,
    kennelsError,
    messagesError,
  ].filter(Boolean);

  const name =
    user?.user_metadata?.first_name ??
    "Team";

  return (
    <div className="live-dashboard">
      <section className="welcome live-dashboard-welcome">
        <div>
          <span className="eyebrow">
            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
              },
            )}
          </span>

          <h1>
            {greeting()}, {name} 👋
          </h1>

          <p>
            Here is the current activity
            at Whimsical Paws Pet Escape.
          </p>
        </div>

        <div className="quick">
          <AppButton
            variant="secondary"
            disabled={refreshing}
            onClick={() =>
              void refreshAll()
            }
          >
            <RefreshCw size={17} />
            {refreshing
              ? "Refreshing..."
              : "Refresh dashboard"}
          </AppButton>

          <AppButton
            onClick={() =>
              navigate("/appointments")
            }
          >
            + New appointment
          </AppButton>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="form-error">
          {errors.join(" ")}
        </div>
      )}

      {loading && (
        <div className="module-state compact">
          <div className="paw-loader">
            🐾
          </div>
          <p>
            Loading live operations...
          </p>
        </div>
      )}

      <section className="kpis live-dashboard-kpis">
        <Link
          to="/appointments"
          className="dashboard-card-link"
        >
          <AppCard className="kpi">
            <div className="kpi-icon lime">
              <PawPrint size={22} />
            </div>

            <div>
              <span>Pets today</span>
              <strong>
                {
                  new Set(
                    todayAppointments.map(
                      (item) =>
                        item.petId,
                    ),
                  ).size
                }
              </strong>
              <small>
                {checkedInToday} checked in
              </small>
            </div>
          </AppCard>
        </Link>

        <Link
          to="/appointments"
          className="dashboard-card-link"
        >
          <AppCard className="kpi">
            <div className="kpi-icon purple">
              <Scissors size={22} />
            </div>

            <div>
              <span>
                Grooming today
              </span>
              <strong>
                {todayAppointments.length}
              </strong>
              <small>
                {completedToday} completed
              </small>
            </div>
          </AppCard>
        </Link>

        <Link
          to="/boarding"
          className="dashboard-card-link"
        >
          <AppCard className="kpi">
            <div className="kpi-icon blue">
              <Hotel size={22} />
            </div>

            <div>
              <span>
                Boarding guests
              </span>
              <strong>
                {activeBoarding.length}
              </strong>
              <small>
                {departures.length} checking out
              </small>
            </div>
          </AppCard>
        </Link>

        <AppCard className="kpi">
          <div className="kpi-icon green">
            <CircleDollarSign
              size={22}
            />
          </div>

          <div>
            <span>
              Projected revenue
            </span>
            <strong>
              {money(projectedRevenue)}
            </strong>
            <small>
              Grooming and boarding
            </small>
          </div>
        </AppCard>

        <Link
          to="/messages"
          className="dashboard-card-link"
        >
          <AppCard className="kpi">
            <div className="kpi-icon orange">
              <MessageSquare size={22} />
            </div>

            <div>
              <span>
                Unread messages
              </span>
              <strong>
                {unreadMessages}
              </strong>
              <small>
                {pendingNotifications} notices pending
              </small>
            </div>
          </AppCard>
        </Link>

        <Link
          to="/kennels"
          className="dashboard-card-link"
        >
          <AppCard className="kpi">
            <div className="kpi-icon pink">
              <Hotel size={22} />
            </div>

            <div>
              <span>
                Available kennels
              </span>
              <strong>
                {availableKennels}
              </strong>
              <small>
                {occupiedKennels} occupied or reserved
              </small>
            </div>
          </AppCard>
        </Link>
      </section>

      <section className="grid live-dashboard-grid">
        <AppCard className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Today
              </span>
              <h2>
                Upcoming appointments
              </h2>
            </div>

            <button
              type="button"
              className="link-button"
              onClick={() =>
                navigate("/calendar")
              }
            >
              View calendar
              <ChevronRight size={16} />
            </button>
          </div>

          {upcomingAppointments.length ===
          0 ? (
            <div className="dashboard-empty">
              No remaining appointments
              today.
            </div>
          ) : (
            upcomingAppointments.map(
              (appointment) => {
                const pet = petMap.get(
                  appointment.petId,
                );

                return (
                  <button
                    type="button"
                    className="appointment dashboard-appointment"
                    key={appointment.id}
                    onClick={() =>
                      navigate(
                        `/appointments?open=${appointment.id}`,
                      )
                    }
                  >
                    <div className="time">
                      {new Date(
                        `${today}T${appointment.startTime}:00`,
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "numeric",
                          minute: "2-digit",
                        },
                      )}
                    </div>

                    <div className="pet-avatar">
                      {pet?.name?.[0] ??
                        "?"}
                    </div>

                    <div>
                      <strong>
                        {pet?.name ??
                          "Pet unavailable"}
                      </strong>

                      <span>
                        {
                          appointment.serviceName
                        }
                        {appointment.assignedStaff
                          ? ` · ${appointment.assignedStaff}`
                          : ""}
                      </span>
                    </div>

                    <em>
                      {appointment.status}
                    </em>
                  </button>
                );
              },
            )
          )}
        </AppCard>

        <AppCard className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Boarding
              </span>
              <h2>
                Current guests
              </h2>
            </div>

            <Link
              to="/boarding"
              className="link-button"
            >
              View boarding
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="dashboard-live-list">
            {activeBoarding
              .slice(0, 6)
              .map((stay) => {
                const pet = petMap.get(
                  stay.petId,
                );

                return (
                  <div key={stay.id}>
                    <span className="dashboard-list-icon">
                      🐾
                    </span>

                    <span>
                      <strong>
                        {pet?.name ??
                          "Pet unavailable"}
                      </strong>
                      <small>
                        {stay.kennelName ||
                          "Kennel not assigned"}
                      </small>
                    </span>

                    <em>
                      {stay.status}
                    </em>
                  </div>
                );
              })}

            {activeBoarding.length ===
              0 && (
              <div className="dashboard-empty">
                No active boarding guests.
              </div>
            )}
          </div>
        </AppCard>

        <AppCard className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Live feed
              </span>
              <h2>
                Recent activity
              </h2>
            </div>
          </div>

          {activity.length === 0 ? (
            <div className="dashboard-empty">
              Activity will appear as
              modules publish live events.
            </div>
          ) : (
            activity.map((item) => (
              <div
                className="activity"
                key={item.id}
              >
                <div>
                  {activityIcon(item)}
                </div>

                <span>
                  <strong>
                    {item.title}
                  </strong>

                  <small>
                    {item.description ||
                      item.source}
                    {" · "}
                    {new Date(
                      item.occurredAt,
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "numeric",
                        minute: "2-digit",
                      },
                    )}
                  </small>
                </span>
              </div>
            ))
          )}
        </AppCard>

        <AppCard className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Daily operations
              </span>
              <h2>
                Boarding movement
              </h2>
            </div>
          </div>

          <div className="boarding">
            <div>
              <span>Check-ins</span>
              <strong>
                {arrivals.length}
              </strong>
              <small>
                {arrivals[0]
                  ? `Next: ${
                      petMap.get(
                        arrivals[0].petId,
                      )?.name ??
                      "Guest"
                    } at ${
                      arrivals[0].checkInTime
                    }`
                  : "No arrivals scheduled"}
              </small>
            </div>

            <div>
              <span>
                Check-outs
              </span>
              <strong>
                {departures.length}
              </strong>
              <small>
                {
                  departures.filter(
                    (stay) =>
                      stay.status !==
                      "Checked Out",
                  ).length
                }{" "}
                awaiting checkout
              </small>
            </div>
          </div>

          <div className="dashboard-occupancy">
            <div>
              <strong>
                Kennel occupancy
              </strong>
              <span>
                {occupiedKennels} of{" "}
                {kennels.length}
              </span>
            </div>

            <progress
              max={Math.max(
                kennels.length,
                1,
              )}
              value={occupiedKennels}
            />
          </div>
        </AppCard>

        <AppCard className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Staff load
              </span>
              <h2>
                Grooming assignments
              </h2>
            </div>

            <Users size={20} />
          </div>

          <div className="dashboard-live-list">
            {staffLoads
              .slice(0, 8)
              .map((staff) => (
                <div key={staff.name}>
                  <span className="dashboard-list-icon">
                    ✂️
                  </span>

                  <span>
                    <strong>
                      {staff.name}
                    </strong>
                    <small>
                      Today's appointments
                    </small>
                  </span>

                  <em>
                    {staff.count}
                  </em>
                </div>
              ))}

            {staffLoads.length ===
              0 && (
              <div className="dashboard-empty">
                No staff assignments today.
              </div>
            )}
          </div>
        </AppCard>

        <AppCard className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Business records
              </span>
              <h2>
                Customers and pets
              </h2>
            </div>
          </div>

          <div className="dashboard-record-stats">
            <Link to="/customers">
              <Users size={20} />
              <span>
                <strong>
                  {activeCustomers}
                </strong>
                Active customers
              </span>
            </Link>

            <Link to="/pets">
              <PawPrint size={20} />
              <span>
                <strong>
                  {activePets}
                </strong>
                Active pets
              </span>
            </Link>

            <Link to="/messages">
              <BellRing size={20} />
              <span>
                <strong>
                  {pendingNotifications}
                </strong>
                Pending notices
              </span>
            </Link>

            <Link to="/calendar">
              <CalendarClock
                size={20}
              />
              <span>
                <strong>
                  {readyForPickup}
                </strong>
                Ready for pickup
              </span>
            </Link>
          </div>
        </AppCard>
      </section>
    </div>
  );
}
