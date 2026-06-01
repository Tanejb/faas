import InboxList from "../components/InboxList";

export default function NotificationsPage() {
  return (
    <section className="card">
      <h2>Inbox</h2>
      <p className="muted">
        Event updates, reminders, and announcements. Email copies are sent when
        configured on the server.
      </p>
      <InboxList />
    </section>
  );
}
