import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createUser, loginUser, verifyLoginOtp, forgotPassword } from "../api";
import { useLanguage } from "../contexts/LanguageContext";

function Auth({ defaultMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [isLogin, setIsLogin] = useState(defaultMode !== "signup");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [pendingSessionId, setPendingSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isOtpFlow = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user"));

    if (
      currentUser && 
      currentUser._id && 
      !isOtpFlow.current && 
      !hasRedirected.current &&
      (location.pathname === '/login' || location.pathname === '/signup')
    ) {
      hasRedirected.current = true;
      navigate(`/profile/${currentUser._id}`, { replace: true });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    isOtpFlow.current = awaitingOtp;
  }, [awaitingOtp]);

  useEffect(() => {
    setIsLogin(defaultMode !== "signup");
    setShowForgotPassword(false);
    hasRedirected.current = false;
  }, [defaultMode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const normalizedEmail = String(formData.email || "").trim().toLowerCase();
      const normalizedName = String(formData.name || "").trim();

      if (!normalizedEmail) {
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        const response = await loginUser({
          email: normalizedEmail,
          password: formData.password,
        });

        console.log("Login Response:", response.data);

        // ✅ Check for OTP requirement
        if (response.data.requiresOtp) {
          setAwaitingOtp(true);
          setTempEmail(normalizedEmail);
          setPendingSessionId(response.data.sessionId || "");
          let otpMessage = response.data.message || "OTP sent to your email.";
          if (response.data.otpCode) {
            otpMessage += ` Your OTP code is ${response.data.otpCode}`;
          }
          setSuccess(otpMessage);
          setIsLoading(false);
          return;
        }

        // ✅ Handle successful login - FIXED
        if (response.status === 200 || response.status === 202) {
          const userData = response.data;
          
          // Store user data
          localStorage.setItem("user", JSON.stringify(userData));
          
          // Store token if exists
          if (userData.token) {
            localStorage.setItem("token", userData.token);
          }
          
          // Force navbar update
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent('userUpdated', { 
            detail: { user: userData }
          }));
          
          setSuccess("Login successful!");
          
          setTimeout(() => {
            navigate(`/profile/${userData._id}`, { replace: true });
          }, 500);
        } else {
          setError(response.data.message || "Invalid response from server");
        }
      } else {
        // ✅ REGISTER
        const response = await createUser({
          name: normalizedName,
          email: normalizedEmail,
          password: formData.password,
        });

        if (response.status === 200 || response.status === 201) {
          const userData = response.data;
          
          localStorage.setItem("user", JSON.stringify(userData));
          if (userData.token) {
            localStorage.setItem("token", userData.token);
          }
          
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent('userUpdated', { 
            detail: { user: userData }
          }));
          
          setSuccess("Account created successfully!");
          
          setTimeout(() => {
            navigate(`/profile/${userData._id}`, { replace: true });
          }, 500);
        } else {
          setError(response.data.message || "Invalid response from server");
        }
      }
    } catch (err) {
      console.error("Auth Error:", err);
      
      // ✅ Better error handling
      let errorMessage = "Something went wrong";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Wrong password. Please try again.";
      } else if (err.response?.status === 404) {
        errorMessage = "User not found. Please sign up first.";
      } else if (err.response?.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (err.code === "ERR_NETWORK") {
        errorMessage = "Cannot connect to server. Is it running?";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const rawOtp = String(otpCode || "");
      const digitsOnlyOtp = rawOtp.replace(/\D/g, "").slice(0, 6);

      if (!digitsOnlyOtp || digitsOnlyOtp.length !== 6) {
        setError("Please enter the 6-digit OTP code from email.");
        setIsLoading(false);
        return;
      }

      const response = await verifyLoginOtp({
        email: tempEmail,
        otpCode: digitsOnlyOtp,
        sessionId: pendingSessionId,
      });

      console.log("OTP Response:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));
        
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent('userUpdated', { 
          detail: { user: response.data }
        }));
        
        setSuccess("✅ OTP verified successfully! Redirecting...");
        
        setAwaitingOtp(false);
        setOtpCode("");

        setTimeout(() => {
          navigate(`/profile/${response.data._id}`, { replace: true });
        }, 500);
      } else {
        setError("OTP verification failed - no token received");
      }
    } catch (err) {
      console.error("OTP Error:", err);
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const normalizedIdentifier = String(formData.email || "").trim();
      if (!normalizedIdentifier) {
        setError("Please enter your registered email address or phone number.");
        setIsLoading(false);
        return;
      }

      const { data } = await forgotPassword({ identifier: normalizedIdentifier });
      let message = data.message || "Password reset request completed.";

      if (data.temporaryPassword) {
        message += ` Your temporary password is: ${data.temporaryPassword}`;
      }

      setSuccess(message);
      setFormData({ ...formData, email: "" });
    } catch (err) {
      console.error("Forgot Password Error:", err);
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (currentUser && currentUser._id && !isOtpFlow.current) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "40px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "fadeInUp 0.5s ease",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#2d3748",
              margin: "0 0 8px 0",
            }}
          >
            {showForgotPassword ? "Reset Password" : 
             awaitingOtp ? "Verify OTP" : 
             isLogin ? "Welcome Back!" : "Create Account"}
          </h1>
          <p
            style={{
              color: "#718096",
              fontSize: "14px",
              margin: "0",
            }}
          >
            {showForgotPassword ? "We'll send you a reset link" :
             awaitingOtp ? `Enter the code sent to ${tempEmail}` :
             isLogin ? "Sign in to continue" : "Join our community today"}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fed7d7",
              color: "#c53030",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              border: "1px solid #feb2b2",
            }}
          >
            ❌ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#c6f6d5",
              color: "#276749",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              border: "1px solid #9ae6b4",
            }}
          >
            ✅ {success}
          </div>
        )}

        {awaitingOtp && (
          <form onSubmit={handleOtpVerify}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#2d3748",
                  fontSize: "14px",
                }}
              >
                {t("oneTimePassword")}
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                disabled={isLoading}
                maxLength="6"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "20px",
                  textAlign: "center",
                  letterSpacing: "8px",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#718096",
                  marginTop: "8px",
                }}
              >
                Enter the 6-digit code sent to {tempEmail}
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.target.style.transform = "translateY(0)";
              }}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAwaitingOtp(false);
                setError("");
                setSuccess("");
                setOtpCode("");
                setPendingSessionId("");
              }}
              style={{
                width: "100%",
                marginTop: "12px",
                color: "#667eea",
                padding: "10px",
                fontSize: "14px",
                fontWeight: "500",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.color = "#764ba2"}
              onMouseLeave={(e) => e.target.style.color = "#667eea"}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {showForgotPassword && !awaitingOtp && (
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#2d3748",
                  fontSize: "14px",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Enter your email"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "15px",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "transform 0.2s",
              }}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setError("");
                setSuccess("");
              }}
              style={{
                width: "100%",
                marginTop: "12px",
                color: "#667eea",
                padding: "10px",
                fontSize: "14px",
                fontWeight: "500",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {!awaitingOtp && !showForgotPassword && (
          <>
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#2d3748",
                      fontSize: "14px",
                    }}
                  >
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    disabled={isLoading}
                    placeholder="Full name"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "15px",
                      transition: "border-color 0.2s",
                      outline: "none",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              )}

              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#2d3748",
                    fontSize: "14px",
                  }}
                >
                  {t("email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "15px",
                    transition: "border-color 0.2s",
                    outline: "none",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#2d3748",
                    fontSize: "14px",
                  }}
                >
                  {t("password")}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "15px",
                    transition: "border-color 0.2s",
                    outline: "none",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                }}
              >
                {isLoading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}
              </button>

              {isLogin && (
                <div
                  style={{
                    textAlign: "right",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/forgot-password");
                      setError("");
                      setSuccess("");
                    }}
                    style={{
                      color: "#667eea",
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.color = "#764ba2"}
                    onMouseLeave={(e) => e.target.style.color = "#667eea"}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>

            <div
              style={{
                marginTop: "24px",
                textAlign: "center",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "24px",
              }}
            >
              <p
                style={{
                  color: "#718096",
                  fontSize: "15px",
                  margin: "0",
                }}
              >
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  onClick={() => {
                    const nextPath = isLogin ? "/signup" : "/login";
                    setError("");
                    setSuccess("");
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                    });
                    navigate(nextPath);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#667eea",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px",
                    marginLeft: "6px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.color = "#764ba2"}
                  onMouseLeave={(e) => e.target.style.color = "#667eea"}
                >
                  {isLogin ? "Sign Up" : "Log In"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Auth;