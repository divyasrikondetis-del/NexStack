import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { deletePost, fetchAdminDashboard, fetchAdminReports, fetchAdminSecurityLogs, reviewAdminReport, setUserSuspension } from "../api";
import { useLanguage } from "../contexts/LanguageContext";
import "./Admin.css";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export default function Admin() {
  const { t } = useLanguage();
  const [user, setUser] = useState(getStoredUser);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const STAT_LABELS = {
    totalUsers: t("totalUsers") || "Total users",
    totalPosts: t("totalPosts") || "Total posts",
    totalReports: t("totalReports") || "Open reports",
    activeUsers: t("activeUsers") || "Active users (30 days)",
    suspendedUsers: t("suspendedUsers") || "Suspended users",
  };

  const load = async () => {
    if (!user?._id) return;

    try {
      const [statsResponse, reportsResponse, logsResponse] = await Promise.all([
        fetchAdminDashboard(user._id),
        fetchAdminReports(user._id),
        fetchAdminSecurityLogs(user._id),
      ]);
      setStats(statsResponse.data);
      setReports(reportsResponse.data || []);
      setSecurityLogs(logsResponse.data?.sessions || []);
    } catch (error) {
      setNotice(error.response?.data?.message || t("couldNotLoadModeration") || "Could not load the moderation dashboard.");
    }
  };

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("userUpdated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("userUpdated", syncUser);
    };
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      load();
    }
  }, [user?._id, user?.role]);

  if (!user || user.role !== "admin") return <Navigate to="/" replace />;

  const act = async (report, action, duration) => {
    setBusyId(report.reportId);
    try {
      if (action === "approve" || action === "dismiss") {
        await reviewAdminReport(report.postId, user._id, report.reportId, action);
      }
      if (action === "delete") {
        await deletePost(report.postId, user._id, true);
      }
      if (action === "suspend") {
        const reason =
          window.prompt(
            t("suspensionReason") || "Suspension reason",
            `${t("reportsAgainst") || "Reports against this account"}: ${report.reason}`
          ) || (t("communityGuidelineViolation") || "Community guideline violation");
        await setUserSuspension(report.author?._id, user._id, duration, reason);
      }
      setNotice(t("moderationActionCompleted") || "Moderation action completed.");
      await load();
    } catch (error) {
      setNotice(error.response?.data?.message || (t("moderationActionFailed") || "Moderation action failed."));
    } finally {
      setBusyId("");
    }
  };


  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <h1>{t("adminDashboard") || "Admin Dashboard"}</h1>
          <p>{t("monitorCommunity") || "Monitor community health and review reported content."}</p>
        </div>
      </div>

      {notice && <div className="admin-notice">{notice}</div>}

      <section className="admin-stats">
        {stats ? (
          Object.entries(STAT_LABELS).map(([key, label]) => (
            <div className="stat-card" key={key}>
              <span>{label}</span>
              <strong>{stats[key] ?? 0}</strong>
            </div>
          ))
        ) : (
          <p>{t("loadingDashboard") || "Loading dashboard…"}</p>
        )}
      </section>

      <section className="report-management">
        <h2>{t("reportManagement") || "Report Management"}</h2>
        {reports.length === 0 ? (
          <p className="empty-reports">{t("noOpenReports") || "No open reports."}</p>
        ) : (
          reports.map((report) => (
            <article key={report.reportId} className="report-card">
              <div className="report-content">
                <p className="reported-post">{report.content}</p>
                <dl>
                  <div>
                    <dt>{t("author") || "Author"}</dt>
                    <dd>{report.author?.name || "Unknown"}</dd>
                  </div>
                  <div>
                    <dt>{t("reporter") || "Reporter"}</dt>
                    <dd>{report.reporter?.name || "Unknown"}</dd>
                  </div>
                  <div>
                    <dt>{t("reason") || "Reason"}</dt>
                    <dd>{report.reason}</dd>
                  </div>
                  <div>
                    <dt>{t("reports") || "Reports"}</dt>
                    <dd>{report.reportCount}</dd>
                  </div>
                  <div>
                    <dt>{t("created") || "Created"}</dt>
                    <dd>{new Date(report.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
              <div className="report-actions">
                <button disabled={busyId === report.reportId} onClick={() => act(report, "approve")}>
                  {t("approveReport") || "Approve report"}
                </button>
                <button disabled={busyId === report.reportId} onClick={() => act(report, "dismiss")}>
                  {t("dismissReport") || "Dismiss report"}
                </button>
                <button
                  className="danger"
                  disabled={busyId === report.reportId}
                  onClick={() => act(report, "delete")}
                >
                  {t("deletePost") || "Delete post"}
                </button>
                <select
                  defaultValue="7d"
                  aria-label={t("suspensionDuration") || "Suspension duration"}
                  onChange={(event) => act(report, "suspend", event.target.value)}
                  disabled={busyId === report.reportId}
                >
                  <option value="">{t("suspendUser") || "Suspend user…"}</option>
                  <option value="1d">{t("suspend1Day") || "Suspend 1 day"}</option>
                  <option value="7d">{t("suspend7Days") || "Suspend 7 days"}</option>
                  <option value="30d">{t("suspend30Days") || "Suspend 30 days"}</option>
                  <option value="permanent">{t("suspendPermanently") || "Suspend permanently"}</option>
                </select>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="report-management">
        <h2>{t("securityActivityLogs") || "Security Activity Logs"}</h2>
        {securityLogs.length === 0 ? (
          <p className="empty-reports">{t("noSecurityLogs") || "No security activity recorded."}</p>
        ) : (
          <div className="security-logs">
            {securityLogs.map((log) => {
              const logUser =
                typeof log.userId === "object" && log.userId !== null
                  ? log.userId.name || log.userId.email || "Unknown user"
                  : log.userId || "Unknown user";

              return (
                <article key={log._id} className="log-entry">
                  <p>
                    <strong>{logUser}</strong> - {log.action}
                  </p>
                  <small>{new Date(log.timestamp || log.createdAt).toLocaleString()}</small>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
