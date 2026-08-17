import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchUserById,
  fetchReputationHistory,
  confirmSubscriptionPayment,
  createSubscriptionCheckout,
  downloadInvoiceUrl,
  fetchSubscriptionDashboard,
  followUser,
  fetchUserSessions,
  revokeUserSession,
  trustUserSession,
} from "../api";
import { useLanguage } from "../contexts/LanguageContext";

const planColors = {
  free: "#6c757d",
  bronze: "#cd7f32",
  silver: "#8b95a1",
  gold: "#d4af37",
};

const planTheme = {
  free: {
    accent: "#6c757d",
    bg: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
    icon: "🆓",
    badge: "Free",
  },
  bronze: {
    accent: "#a96b2a",
    bg: "linear-gradient(135deg, #fff3e6 0%, #f2d0a8 100%)",
    icon: "🥉",
    badge: "Bronze",
  },
  silver: {
    accent: "#8e9aa7",
    bg: "linear-gradient(135deg, #f5f7fa 0%, #dfe4ea 100%)",
    icon: "🥈",
    badge: "Silver",
  },
  gold: {
    accent: "#d4af37",
    bg: "linear-gradient(135deg, #fffbe6 0%, #f3e0a8 100%)",
    icon: "🥇",
    badge: "Gold",
  },
};

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [loadingSession, setLoadingSession] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [sessions, setSessions] = useState([]);

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch user data
      const { data: userData } = await fetchUserById(id);
      setUser(userData);

      // Check if current user is following this user
      if (currentUser?._id) {
        setIsFollowing(userData.followers?.includes(currentUser._id) || false);
      }

      // Fetch reputation history
      try {
        const historyData = await fetchReputationHistory(id);
        setHistory(historyData.data || []);
      } catch (histErr) {
        console.log("Reputation history error:", histErr);
        setHistory([]);
      }

      // Fetch subscription/billing data
      try {
        const { data: billingData } = await fetchSubscriptionDashboard(id);
        setBilling(billingData);
      } catch (billingErr) {
        console.log("Billing data error:", billingErr);
        setBilling(null);
      }

      if (currentUser?._id && (currentUser._id === id || currentUser.role === "admin")) {
        try {
          const { data: sessionData } = await fetchUserSessions(id);
          setSessions(sessionData.sessions || []);
        } catch (sessionErr) {
          console.log("Session data error:", sessionErr);
          setSessions([]);
        }
      }
    } catch (err) {
      console.error("Error loading user:", err);
      setError(err.response?.data?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?._id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleFollow = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      const response = await followUser(currentUser._id, id);
      setIsFollowing(response.data.following);
      
      // Update followers count
      setUser(prev => ({
        ...prev,
        followers: response.data.following
          ? [...(prev?.followers || []), currentUser._id]
          : (prev?.followers || []).filter(fid => fid !== currentUser._id)
      }));
    } catch (err) {
      console.error("Follow error:", err);
      setError("Failed to follow/unfollow user");
    }
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const upgradePlan = async (planId) => {
    try {
      setLoadingPlan(planId);
      setNotice("");
      const { data: checkoutData } = await createSubscriptionCheckout({
        userId: id,
        planId,
        provider: "razorpay",
        billingDetails: {
          name: user.name,
          email: user.email,
        },
      });

      if (checkoutData.checkout.testMode) {
        await confirmSubscriptionPayment({
          paymentId: checkoutData.checkout.paymentId,
          providerPaymentId: `local_${checkoutData.checkout.orderId}`,
          signature: "local-test-signature",
          orderId: checkoutData.checkout.orderId,
        });

        setNotice(`${checkoutData.checkout.plan.name} plan activated successfully.`);
        await loadUser();
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const options = {
        key: checkoutData.checkout.razorpayKey,
        amount: checkoutData.checkout.amount * 100,
        currency: checkoutData.checkout.currency,
        name: "NexStack",
        description: `${checkoutData.checkout.plan.name} Membership`,
        order_id: checkoutData.checkout.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#0A95FF",
        },
        handler: async function (response) {
          try {
            await confirmSubscriptionPayment({
              paymentId: checkoutData.checkout.paymentId,
              providerPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              orderId: response.razorpay_order_id,
            });

            setNotice(`${checkoutData.checkout.plan.name} plan activated successfully.`);
            await loadUser();
          } catch (err) {
            setNotice(err.response?.data?.message || "Unable to verify Razorpay payment.");
          }
        },
        modal: {
          ondismiss: () => {
            setNotice("Payment cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setNotice("Unable to complete the upgrade right now. Please try again.");
    } finally {
      setLoadingPlan("");
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      setLoadingSession(sessionId);
      await revokeUserSession(sessionId);
      setNotice("Session revoked successfully.");
      const { data: sessionData } = await fetchUserSessions(id);
      setSessions(sessionData.sessions || []);
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to revoke session.");
    } finally {
      setLoadingSession("");
    }
  };

  const handleTrustSession = async (sessionId) => {
    try {
      setLoadingSession(sessionId);
      await trustUserSession(sessionId);
      setNotice("Device marked as trusted.");
      const { data: sessionData } = await fetchUserSessions(id);
      setSessions(sessionData.sessions || []);
    } catch (err) {
      setNotice(err.response?.data?.message || "Failed to trust session.");
    } finally {
      setLoadingSession("");
    }
  };

  const getBadge = (reputation = 0) => {
    if (reputation >= 1000)
      return {
        name: "Diamond Member",
        emoji: "💎",
        color: "#00BCD4",
      };

    if (reputation >= 500)
      return {
        name: "Gold Member",
        emoji: "🥇",
        color: "#FFD700",
      };

    if (reputation >= 100)
      return {
        name: "Silver Member",
        emoji: "🥈",
        color: "#9E9E9E",
      };

    return {
      name: "Bronze Member",
      emoji: "🥉",
      color: "#CD7F32",
    };
  };

  if (loading) {
    return <h2 style={{ padding: 40 }}>{t('loadingQuestions') || 'Loading...'}</h2>;
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "red" }}>❌ {error}</h2>
        <button onClick={() => navigate("/")}>{t('home') || 'Go Home'}</button>
      </div>
    );
  }

  if (!user) {
    return <h2 style={{ padding: 40 }}>{t('userNotFound') || 'User not found'}</h2>;
  }

  const badge = getBadge(user.reputation);
  const currentPlan = billing?.subscription?.plan || "free";
  const isOwnProfile = currentUser?._id === user._id;

  return (
    <div style={{ maxWidth: "1100px", margin: "40px auto", padding: 30 }}>
      {/* Profile Section */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 30, textAlign: "center", background: "#fff" }}>
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff&size=128`}
          alt="avatar"
          style={{ borderRadius: "50%", width: 120, height: 120 }}
        />

        <h1>{user.name}</h1>
        {user.premiumBadge && (
          <span style={{ background: planColors[currentPlan], color: "#fff", padding: "6px 14px", borderRadius: 20, fontWeight: 700 }}>
            {user.premiumBadge} Member
          </span>
        )}
        <p>{user.email}</p>
        
        {isOwnProfile && (
          <button
            onClick={() => navigate("/edit-profile")}
            style={{
              marginTop: 15,
              background: "#28a745",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✏️ {t('editProfile')}
          </button>
        )}

        {/* Follow/Unfollow Button for other users */}
        {!isOwnProfile && currentUser?._id && (
          <button
            onClick={handleFollow}
            style={{
              marginTop: 15,
              padding: "10px 30px",
              background: isFollowing ? "#dc3545" : "#0A95FF",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {isFollowing ? (t('unfollow') || 'Unfollow') : (t('follow') || 'Follow')}
          </button>
        )}

        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "#f8f9fa",
            borderRadius: 10,
          }}
        >
          <h2>⭐ {t('reputation') || 'Reputation'} : {user.reputation || 0}</h2>

          <h3 style={{ color: badge.color }}>
            {badge.emoji} {badge.name}
          </h3>
        </div>

        <hr />
        <h3>{t('about')}</h3>
        <p>{user.about || "No bio added yet."}</p>

        <hr />

        <h3>{t('skills')}</h3>
        {user.tags?.length ? user.tags.map((tag) => (
          <span key={tag} style={{ background: "#0d6efd", color: "#fff", padding: "6px 12px", borderRadius: 20, marginRight: 10, display: "inline-block", marginBottom: 5 }}>
            {tag}
          </span>
        )) : <p>No skills added.</p>}

        <hr />
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div><h2>{user.followers?.length || 0}</h2><p>{t('followers') || 'Followers'}</p></div>
          <div><h2>{user.following?.length || 0}</h2><p>{t('following') || 'Following'}</p></div>
        </div>

        <hr />

        {isOwnProfile && (
          <section style={{ textAlign: "left", marginTop: 16 }}>
            <h3>🔐 {t('activeSessions') || 'Active Sessions'}</h3>
            {notice && <p style={{ color: notice.includes("Failed") ? "#dc3545" : "#198754", fontWeight: 700 }}>{notice}</p>}
            {sessions.length === 0 ? (
              <p>No active sessions recorded.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.sessionId} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <strong>{session.browser} • {session.os}</strong>
                    <span style={{ color: session.isTrusted ? "#198754" : "#6c757d" }}>{session.isTrusted ? "Trusted" : "Untrusted"}</span>
                  </div>
                  <p style={{ margin: "8px 0" }}>
                    <strong>Device:</strong> {session.deviceType} <br />
                    <strong>IP:</strong> {session.ipAddress || "Unknown"} <br />
                    <strong>Location:</strong> {session.location || "Unknown"} <br />
                    <strong>Last seen:</strong> {new Date(session.lastSeenAt).toLocaleString()} <br />
                    <strong>Status:</strong> {session.status}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {!session.isTrusted && (
                      <button disabled={loadingSession === session.sessionId} onClick={() => handleTrustSession(session.sessionId)} style={{ background: "#198754", color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                        {loadingSession === session.sessionId ? "Working..." : (t('trustDevice') || 'Trust device')}
                      </button>
                    )}
                    <button disabled={loadingSession === session.sessionId} onClick={() => handleRevokeSession(session.sessionId)} style={{ background: "#dc3545", color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                      {loadingSession === session.sessionId ? "Working..." : (t('revokeSession') || 'Revoke session')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        <hr />

        <h3>📜 {t('reputationHistory') || 'Reputation History'}</h3>
        {history.length === 0 ? (
          <p>No reputation history yet.</p>
        ) : (
          history.map((item, index) => (
            <div
              key={item._id || index}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
                textAlign: "left",
              }}
            >
              <h4>{item.action || item.type || "Reputation Update"}</h4>

              <p>
                <strong>Points :</strong>{" "}
                <span
                  style={{
                    color: (item.points || item.amount || 0) >= 0
                      ? "green"
                      : "red",
                    fontWeight: "bold",
                  }}
                >
                  {(item.points || item.amount || 0) >= 0 ? "+" : ""}
                  {item.points || item.amount || 0}
                </span>
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {item.reason || item.description || "No reason provided"}
              </p>

              {item.sender && (
                <p>
                  <strong>Sender:</strong>{" "}
                  {typeof item.sender === 'object' ? item.sender.name : item.sender}
                </p>
              )}

              {item.receiver && (
                <p>
                  <strong>Receiver:</strong>{" "}
                  {typeof item.receiver === 'object' ? item.receiver.name : item.receiver}
                </p>
              )}

              <small>
                {new Date(
                  item.createdAt || item.timestamp || Date.now()
                ).toLocaleString()}
              </small>
            </div>
          ))
        )}

        <hr />

        {!isOwnProfile && (
          <button
            onClick={() =>
              navigate(`/transfer-reputation/${user._id}`)
            }
            style={{
              background: "#0A95FF",
              color: "#fff",
              border: "none",
              padding: "14px 28px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 16,
              margin: "10px 0",
            }}
          >
            ⭐ {t('transferReputation') || 'Transfer Reputation'}
          </button>
        )}

        <hr />

        <p>
          {t('joinedOn') || 'Joined on'}{" "}
          {user.joinedOn 
            ? new Date(user.joinedOn).toLocaleDateString()
            : "Recently"}
        </p>
      </div>

      {/* Subscription & Billing Dashboard */}
      {billing && (
        <section
          style={{
            marginTop: 24,
            borderRadius: 24,
            padding: 28,
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
            boxShadow: "0 18px 45px rgba(10, 149, 255, 0.12)",
            border: "1px solid #e8f2ff",
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 28, color: "#102a43" }}>{t('subscriptionBilling') || 'Subscription & Billing Dashboard'}</h2>
              <p style={{ margin: "6px 0 0", color: "#5b6b7a", fontSize: 15 }}>Manage your package, billing details, renewals, and invoices in one place.</p>
            </div>
            <span style={{ padding: "8px 12px", borderRadius: 999, background: "#eef7ff", color: "#0a95ff", fontWeight: 700, fontSize: 13, border: "1px solid #dceeff" }}>
              Demo Payment Mode
            </span>
          </div>

          {notice && (
            <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 12, background: notice.includes("Unable") ? "#fff3f3" : "#f1fff7", color: notice.includes("Unable") ? "#b42318" : "#197b3b", border: `1px solid ${notice.includes("Unable") ? "#f7c3c0" : "#b8e6c4"}`, fontWeight: 600 }}>
              {notice}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 18, marginBottom: 24 }}>
            <div style={{ borderRadius: 20, padding: 22, background: billing.activePlan?.id ? planTheme[billing.activePlan.id]?.bg || "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)" : "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", border: `1px solid ${billing.activePlan?.id ? planColors[billing.activePlan.id] || "#dfe4ea" : "#dfe4ea"}`, boxShadow: "0 12px 28px rgba(15, 23, 42, 0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, color: "#64748b", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1.1 }}>Active Subscription</p>
                  <h3 style={{ margin: "6px 0 0", fontSize: 26, color: "#102a43" }}>{billing.activePlan?.name || "Free"}</h3>
                </div>
                <span style={{ padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.8)", color: billing.activePlan?.id ? planColors[billing.activePlan.id] : "#6c757d", border: `1px solid ${billing.activePlan?.id ? planColors[billing.activePlan.id] : "#dfe4ea"}`, fontWeight: 800 }}>
                  {billing.activePlan?.id ? planTheme[billing.activePlan.id]?.badge || billing.activePlan.name : "Free"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 18 }}>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.65)" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{t('status') || 'Status'}</div>
                  <div style={{ marginTop: 4, fontWeight: 800, color: "#102a43" }}>{billing.subscription?.status || "Active"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.65)" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{t('renewalDate') || 'Renewal Date'}</div>
                  <div style={{ marginTop: 4, fontWeight: 800, color: "#102a43" }}>{billing.subscription?.renewalDate ? new Date(billing.subscription.renewalDate).toLocaleDateString() : "N/A"}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.65)" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{t('questionLimit') || 'Question Limit'}</div>
                  <div style={{ marginTop: 4, fontWeight: 800, color: "#102a43" }}>{billing.activePlan?.questionLimitPerDay === -1 ? (t('unlimited') || 'Unlimited') : `${billing.activePlan?.questionLimitPerDay || 0}/day`}</div>
                </div>
              </div>

              <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(15, 23, 42, 0.05)" }}>
                <div style={{ fontWeight: 800, color: "#102a43", marginBottom: 8 }}>Current Benefits</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#55677a", lineHeight: 1.7 }}>
                  {billing.activePlan?.features?.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </div>
            </div>

            <div style={{ borderRadius: 20, padding: 22, background: "linear-gradient(135deg, #0a95ff 0%, #1263c8 100%)", color: "#fff", boxShadow: "0 14px 30px rgba(10, 149, 255, 0.22)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.1, opacity: 0.9 }}>Upgrade Options</div>
              <h3 style={{ margin: "8px 0 12px", fontSize: 22 }}>Unlock more value</h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>Choose a premium membership to increase your daily posting limit and unlock extra features.</p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 14px", color: "#102a43", fontSize: 22 }}>{t('upgradeMembership') || 'Membership Plans'}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {billing.plans && Object.values(billing.plans).map((plan) => {
                const theme = planTheme[plan.id] || planTheme.free;
                return (
                  <article
                    key={plan.id}
                    style={{
                      borderRadius: 18,
                      padding: 18,
                      background: theme.bg,
                      border: `1px solid ${planColors[plan.id] || "#dfe4ea"}`,
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      transform: "translateY(0)",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 14px 30px rgba(15, 23, 42, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.08)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, fontSize: 20, color: "#102a43" }}>{plan.name}</h4>
                      <span style={{ fontSize: 22 }}>{theme.icon}</span>
                    </div>
                    <div style={{ margin: "12px 0 10px", fontSize: 30, fontWeight: 900, color: "#102a43" }}>{plan.price ? `₹${plan.price}/month` : "Free"}</div>
                    <ul style={{ paddingLeft: 18, margin: "10px 0 16px", color: "#45556b", lineHeight: 1.6 }}>
                      {plan.features?.map((feature) => <li key={feature}>{feature}</li>)}
                    </ul>
                    {plan.id !== "free" && (
                      <button
                        disabled={currentPlan === plan.id || loadingPlan === plan.id}
                        onClick={() => upgradePlan(plan.id)}
                        style={{
                          width: "100%",
                          background: currentPlan === plan.id ? "#6c757d" : "linear-gradient(135deg, #0a95ff 0%, #1263c8 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: 999,
                          cursor: currentPlan === plan.id || loadingPlan === plan.id ? "not-allowed" : "pointer",
                          opacity: currentPlan === plan.id || loadingPlan === plan.id ? 0.75 : 1,
                          fontWeight: 700,
                          transition: "transform 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!currentPlan === plan.id && loadingPlan !== plan.id) e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {currentPlan === plan.id ? `✅ ${t('active') || 'Active'}` : loadingPlan === plan.id ? `⏳ ${t('processing') || 'Processing...'}` : `${t('upgradeTo') || 'Upgrade to'} ${plan.name}`}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <h3 style={{ margin: "0 0 14px", color: "#102a43", fontSize: 22 }}>{t('paymentHistory') || 'Payment History & Invoices'}</h3>
            {billing.payments?.length ? (
              <div style={{ borderRadius: 18, border: "1px solid #e8f2ff", background: "#fff", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fbff" }}>
                        <th style={{ padding: "12px 14px", textAlign: "left", color: "#5b6b7a" }}>{t('plan') || 'Plan'}</th>
                        <th style={{ padding: "12px 14px", textAlign: "left", color: "#5b6b7a" }}>{t('amount') || 'Amount'}</th>
                        <th style={{ padding: "12px 14px", textAlign: "left", color: "#5b6b7a" }}>{t('status') || 'Status'}</th>
                        <th style={{ padding: "12px 14px", textAlign: "left", color: "#5b6b7a" }}>{t('invoice') || 'Invoice'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billing.payments.map((payment) => (
                        <tr key={payment._id} style={{ borderTop: "1px solid #eef4fa" }}>
                          <td style={{ padding: "12px 14px", color: "#102a43", fontWeight: 600 }}>{payment.plan}</td>
                          <td style={{ padding: "12px 14px", color: "#102a43" }}>₹{payment.amount}</td>
                          <td style={{ padding: "12px 14px" }}><span style={{ padding: "6px 10px", borderRadius: 999, background: payment.status === "paid" ? "#e7f8ed" : "#fff7e6", color: payment.status === "paid" ? "#197b3b" : "#9a5b00", fontWeight: 700 }}>{payment.status}</span></td>
                          <td style={{ padding: "12px 14px" }}>
                            {payment.invoice ? (
                              <a href={downloadInvoiceUrl(id, payment._id)} style={{ color: "#0a95ff", fontWeight: 700, textDecoration: "none" }}>📄 {t('downloadInvoice') || 'Download invoice'}</a>
                            ) : (t('pending') || 'Pending')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 18, padding: 24, textAlign: "center", border: "1px dashed #cfe2ff", background: "linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%)" }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>💳</div>
                <h4 style={{ margin: "0 0 8px", color: "#102a43", fontSize: 20 }}>No payments yet</h4>
                <p style={{ margin: 0, color: "#5b6b7a", lineHeight: 1.6 }}>Upgrade to a premium plan to start your billing history and keep your invoices handy.</p>
              </div>
            )}
          </div>

          {billing.payments?.some((payment) => payment.invoice) && (
            <div style={{ marginTop: 26 }}>
              <h3 style={{ margin: "0 0 14px", color: "#102a43", fontSize: 22 }}>Invoices</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {billing.payments.filter((payment) => payment.invoice).map((payment) => (
                  <div key={payment._id} style={{ borderRadius: 18, padding: 18, border: "1px solid #e8f2ff", background: "#fff", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ fontWeight: 800, color: "#102a43" }}>{payment.invoice?.invoiceNumber || "Invoice"}</div>
                      <span style={{ padding: "6px 10px", borderRadius: 999, background: "#eef7ff", color: "#0a95ff", fontSize: 12, fontWeight: 700 }}>{payment.plan}</span>
                    </div>
                    <div style={{ marginTop: 10, color: "#5b6b7a", lineHeight: 1.7 }}>
                      <div><strong>Amount:</strong> ₹{payment.amount}</div>
                      <div><strong>Date:</strong> {payment.invoice?.issuedAt ? new Date(payment.invoice.issuedAt).toLocaleDateString() : "N/A"}</div>
                      <div><strong>Status:</strong> {payment.status}</div>
                    </div>
                    <a href={downloadInvoiceUrl(id, payment._id)} style={{ display: "inline-block", marginTop: 12, padding: "10px 14px", borderRadius: 999, background: "linear-gradient(135deg, #0a95ff 0%, #1263c8 100%)", color: "#fff", textDecoration: "none", fontWeight: 700 }}>
                      Download Invoice
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Profile;