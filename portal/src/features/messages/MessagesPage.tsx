import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Archive,
  BellRing,
  Inbox,
  Sparkles,
  MessageCircleMore,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import type { CustomerInput } from "../customers/customerTypes";
import NotificationQueuePanel from "./notifications/NotificationQueuePanel";
import type { NotificationQueueItem } from "./notifications/notificationTypes";
import { useNotificationQueue } from "./notifications/useNotificationQueue";
import { useMessages } from "./useMessages";
import NewLeadsPanel from "./leads/NewLeadsPanel";
import { convertLead } from "./leads/leadService";
import type { MessageLead } from "./leads/leadTypes";
import { useLeads } from "./leads/useLeads";
import { importLeadConversation } from "./messageService";

import "./leads/leads.css";

import "./messagesCenter.css";

type MessagesWorkspace =
  | "inbox"
  | "leads"
  | "notifications";

const format = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export function MessagesPage() {
  const { customers, save: saveCustomer, refresh: refreshCustomers } = useCustomers();
  const { leads, unreadCount: unreadLeadCount, refresh: refreshLeads } = useLeads();

  const {
    threads,
    messages,
    activeThreadId,
    setActiveThreadId,
    loading,
    loadingMessages,
    error,
    refresh,
    send,
    archive,
  } = useMessages();

  const {
    items: notificationItems,
    reload: refreshNotifications,
  } = useNotificationQueue();

  const [workspace, setWorkspace] =
    useState<MessagesWorkspace>("inbox");

  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [newCustomerId, setNewCustomerId] =
    useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

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

  const activeThread =
    threads.find(
      (thread) =>
        thread.id === activeThreadId,
    ) ?? null;

  const activeCustomer = activeThread
    ? customerMap.get(
        activeThread.customerId,
      )
    : customerMap.get(newCustomerId);

  const filtered = useMemo(() => {
    const needle =
      query.trim().toLowerCase();

    return threads.filter((thread) => {
      const customer = customerMap.get(
        thread.customerId,
      );

      return [
        customer?.firstName,
        customer?.lastName,
        customer?.mobilePhone,
        thread.subject,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [customerMap, query, threads]);

  const unread = useMemo(
    () =>
      threads.reduce(
        (total, thread) =>
          total + thread.unreadCount,
        0,
      ),
    [threads],
  );

  const pendingNotifications =
    notificationItems.filter(
      (item) =>
        item.status === "pending",
    ).length;

  const scheduledNotifications =
    notificationItems.filter(
      (item) =>
        item.status === "scheduled",
    ).length;

  function show(message: string) {
    setNotice(message);

    window.setTimeout(
      () => setNotice(""),
      2200,
    );
  }

  async function handleRefresh() {
    if (workspace === "inbox") {
      await refresh();
      return;
    }

    if (workspace === "leads") {
      refreshLeads();
      return;
    }

    refreshNotifications();
  }

  async function deliverNotification(
    item: NotificationQueueItem,
  ) {
    if (!item.customerId) {
      throw new Error(
        "This notice is not connected to a customer.",
      );
    }

    if (
      item.channel === "email" ||
      item.channel === "both"
    ) {
      /*
       * Email delivery will be added when the email provider
       * is connected. SMS delivery continues through the
       * existing Messages service.
       */
      if (item.channel === "email") {
        throw new Error(
          "Email delivery is not connected yet. Choose SMS.",
        );
      }
    }

    await send(
      item.customerId,
      item.message,
    );

    show("Notification sent.");
  }

  async function convertMessageLead(lead: MessageLead, input: CustomerInput) {
    const customer = await saveCustomer(input);
    await importLeadConversation(customer.id, lead);
    convertLead(lead.id, customer.id);
    await Promise.all([refreshCustomers(), refresh(), Promise.resolve(refreshLeads())]);
    setWorkspace("inbox");
    show("Lead converted and conversation moved to Inbox.");
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    const customerId =
      activeThread?.customerId ??
      newCustomerId;

    if (!customerId) {
      show("Select a customer first.");
      return;
    }

    if (!body.trim()) {
      return;
    }

    setSending(true);

    try {
      await send(
        customerId,
        body,
        activeThread?.id,
      );

      setBody("");
      setNewCustomerId("");
      show("Message sent.");
    } catch (caught) {
      show(
        caught instanceof Error
          ? caught.message
          : "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="messages-page messages-center-page">
      <section className="page-toolbar messages-center-toolbar">
        <div className="page-head">
          <span className="eyebrow">
            Client communication
          </span>

          <h1>Messages</h1>

          <p>
            Manage customer conversations and
            queued notifications from one place.
          </p>
        </div>

        <AppButton
          variant="secondary"
          onClick={() =>
            void handleRefresh()
          }
        >
          <RefreshCw size={17} />
          Refresh
        </AppButton>
      </section>

      {notice && (
        <div className="success-notice">
          {notice}
        </div>
      )}

      <section className="message-summary-grid">
        <AppCard className="summary-card">
          <MessageCircleMore size={22} />

          <div>
            <span>
              Open conversations
            </span>

            <strong>
              {threads.length}
            </strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <span className="summary-emoji">
            📩
          </span>

          <div>
            <span>
              Unread messages
            </span>

            <strong>{unread}</strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <Sparkles size={22} />

          <div>
            <span>New leads</span>
            <strong>{leads.length}</strong>
            <small>{unreadLeadCount} unread</small>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <BellRing size={22} />

          <div>
            <span>
              Pending notices
            </span>

            <strong>
              {pendingNotifications}
            </strong>
          </div>
        </AppCard>

        <AppCard className="summary-card">
          <span className="summary-emoji">
            📅
          </span>

          <div>
            <span>
              Scheduled notices
            </span>

            <strong>
              {scheduledNotifications}
            </strong>
          </div>
        </AppCard>
      </section>

      <nav
        className="messages-center-tabs"
        aria-label="Message workspaces"
      >
        <button
          type="button"
          className={
            workspace === "inbox"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setWorkspace("inbox")
          }
        >
          <Inbox size={17} />
          Inbox

          {unread > 0 && (
            <span>{unread}</span>
          )}
        </button>

        <button
          type="button"
          className={workspace === "leads" ? "is-active" : ""}
          onClick={() => setWorkspace("leads")}
        >
          <Sparkles size={17} />
          New Leads
          {unreadLeadCount > 0 && <span>{unreadLeadCount}</span>}
        </button>

        <button
          type="button"
          className={
            workspace ===
            "notifications"
              ? "is-active"
              : ""
          }
          onClick={() =>
            setWorkspace(
              "notifications",
            )
          }
        >
          <BellRing size={17} />
          Notifications

          {pendingNotifications > 0 && (
            <span>
              {pendingNotifications}
            </span>
          )}
        </button>
      </nav>

      {workspace === "leads" ? (
        <NewLeadsPanel onConvert={convertMessageLead} />
      ) : workspace ===
      "notifications" ? (
        <AppCard className="messages-notification-workspace">
          <NotificationQueuePanel
            onDeliver={deliverNotification}
          />
        </AppCard>
      ) : (
        <section className="message-workspace">
          <aside className="message-thread-panel">
            <div className="module-search">
              <Search size={18} />

              <input
                aria-label="Search messages"
                placeholder="Search customer or conversation..."
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
              />
            </div>

            <label className="field new-conversation">
              <span>
                Start new conversation
              </span>

              <select
                value={newCustomerId}
                onChange={(event) => {
                  setNewCustomerId(
                    event.target.value,
                  );

                  setActiveThreadId("");
                }}
              >
                <option value="">
                  Select customer
                </option>

                {customers
                  .filter(
                    (customer) =>
                      customer.isActive,
                  )
                  .map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.firstName}{" "}
                      {customer.lastName}
                    </option>
                  ))}
              </select>
            </label>

            <div className="thread-list">
              {loading && (
                <div className="module-state compact">
                  <div className="paw-loader">
                    🐾
                  </div>
                </div>
              )}

              {!loading && error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              {!loading &&
                filtered.map(
                  (thread) => {
                    const customer =
                      customerMap.get(
                        thread.customerId,
                      );

                    return (
                      <button
                        type="button"
                        key={thread.id}
                        className={`thread-item ${
                          thread.id ===
                          activeThreadId
                            ? "is-active"
                            : ""
                        }`}
                        onClick={() => {
                          setNewCustomerId(
                            "",
                          );

                          setActiveThreadId(
                            thread.id,
                          );
                        }}
                      >
                        <div className="thread-avatar">
                          {(
                            customer
                              ?.firstName?.[0] ??
                            "?"
                          ).toUpperCase()}
                        </div>

                        <div className="thread-copy">
                          <div>
                            <strong>
                              {customer
                                ? `${customer.firstName} ${customer.lastName}`
                                : "Customer"}
                            </strong>

                            <time>
                              {format(
                                thread.lastMessageAt,
                              )}
                            </time>
                          </div>

                          <span>
                            {thread.subject}
                          </span>
                        </div>

                        {thread.unreadCount >
                          0 && (
                          <span className="unread-badge">
                            {
                              thread.unreadCount
                            }
                          </span>
                        )}
                      </button>
                    );
                  },
                )}
            </div>
          </aside>

          <AppCard className="conversation-panel">
            {activeThread ||
            newCustomerId ? (
              <>
                <header className="conversation-head">
                  <div>
                    <span className="eyebrow">
                      Conversation
                    </span>

                    <h2>
                      {activeCustomer
                        ? `${activeCustomer.firstName} ${activeCustomer.lastName}`
                        : "New conversation"}
                    </h2>
                  </div>

                  {activeThread && (
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        void archive(
                          activeThread.id,
                        )
                      }
                      aria-label="Archive conversation"
                    >
                      <Archive size={18} />
                    </button>
                  )}
                </header>

                <div className="conversation-body">
                  {loadingMessages && (
                    <div className="module-state compact">
                      <div className="paw-loader">
                        🐾
                      </div>
                    </div>
                  )}

                  {!loadingMessages &&
                    messages.length ===
                      0 && (
                      <div className="conversation-empty">
                        <span>🐾</span>

                        <h3>
                          Start the
                          conversation
                        </h3>

                        <p>
                          Send the first
                          message to this
                          customer.
                        </p>
                      </div>
                    )}

                  {!loadingMessages &&
                    messages.map(
                      (message) => (
                        <div
                          key={message.id}
                          className={`message-bubble-row ${
                            message.direction ===
                            "Outbound"
                              ? "outbound"
                              : "inbound"
                          }`}
                        >
                          <div className="message-bubble">
                            <p>
                              {message.body}
                            </p>

                            <div>
                              <time>
                                {format(
                                  message.sentAt,
                                )}
                              </time>

                              <span>
                                {
                                  message.status
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                </div>

                <form
                  className="message-composer"
                  onSubmit={submit}
                >
                  <textarea
                    aria-label="Message"
                    placeholder="Type a message..."
                    value={body}
                    onChange={(event) =>
                      setBody(
                        event.target.value,
                      )
                    }
                    rows={3}
                  />

                  <AppButton
                    disabled={
                      sending ||
                      !body.trim()
                    }
                  >
                    <Send size={17} />

                    {sending
                      ? "Sending..."
                      : "Send message"}
                  </AppButton>
                </form>
              </>
            ) : (
              <div className="conversation-empty large">
                <span>💬</span>

                <h3>
                  Select a conversation
                </h3>

                <p>
                  Choose a customer thread
                  or start a new
                  conversation.
                </p>
              </div>
            )}
          </AppCard>
        </section>
      )}
    </div>
  );
}
