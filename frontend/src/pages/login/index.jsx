import UserLayout from '@/layout/UserLayout';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from "./style.module.css";
import { loginUser } from '@/config/redux/action/authAction';
import { emptyMessage } from '@/config/redux/reducer/authReducer';
import { clientServer } from '@/config';

export default function LoginComponent() {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const [userLoginMethod, setUserLoginMethod] = useState(true); // default: Login tab
  const [email, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");

  // OTP Signup States
  const [signupStep, setSignupStep] = useState(1); // 1: Info, 2: OTP
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [localFeedback, setLocalFeedback] = useState({ msg: "", type: "" });
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP + New Pass
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState({ msg: "", type: "" });

  useEffect(() => {
    if (authState.loggedIn || localStorage.getItem("token")) {
      router.push("/dashboard");
    }
  }, [authState.loggedIn]);

  useEffect(() => {
    dispatch(emptyMessage());
    setLocalFeedback({ msg: "", type: "" });
    setSignupStep(1);
    setOtpCode("");
  }, [userLoginMethod]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Handle OAuth Callbacks from GitHub redirect URL parameter
  useEffect(() => {
    if (router.query.code) {
      handleGithubCodeExchange(router.query.code);
    }
  }, [router.query.code]);

  const showLocalMsg = (msg, type) => {
    setLocalFeedback({ msg, type });
  };

  // Step 1: Send Registration OTP
  const handleSendSignupOtp = async (e) => {
    e?.preventDefault();
    if (!email || !name || !username || !password) {
      showLocalMsg("Please fill in all registration fields first.", "error");
      return;
    }

    setIsSendingOtp(true);
    showLocalMsg("", "");

    try {
      const res = await clientServer.post("/auth/send_otp", {
        email: email.trim(),
        type: "registration"
      });
      showLocalMsg(res.data.message || "Verification code sent to your email!", "success");
      setSignupStep(2);
      setResendTimer(60);
    } catch (err) {
      showLocalMsg(err.response?.data?.message || "Failed to send verification code", "error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify Registration OTP & Complete Signup
  const handleVerifySignupOtp = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      showLocalMsg("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setIsVerifyingOtp(true);
    showLocalMsg("", "");

    try {
      const res = await clientServer.post("/register", {
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        otp: otpCode.trim()
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        router.push("/dashboard");
      } else {
        showLocalMsg("Registration complete! You can now sign in.", "success");
        setUserLoginMethod(true);
      }
    } catch (err) {
      showLocalMsg(err.response?.data?.message || "OTP verification failed", "error");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Login handler
  const handleLogin = (e) => {
    e?.preventDefault();
    if (!email || !password) {
      showLocalMsg("Please enter your email/username and password", "error");
      return;
    }
    dispatch(loginUser({ email: email.trim(), password }));
  };

  // ── Forgot Password Handlers ──
  const handleSendResetOtp = async (e) => {
    e?.preventDefault();
    if (!resetEmail) {
      setResetFeedback({ msg: "Please enter your registered email", type: "error" });
      return;
    }

    setResetLoading(true);
    setResetFeedback({ msg: "", type: "" });

    try {
      const res = await clientServer.post("/auth/send_otp", {
        email: resetEmail.trim(),
        type: "password_reset"
      });
      setResetFeedback({ msg: res.data.message || "Reset code sent to your email!", type: "success" });
      setResetStep(2);
    } catch (err) {
      setResetFeedback({ msg: err.response?.data?.message || "Failed to send reset code", type: "error" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e?.preventDefault();
    if (!resetOtp || !newPassword) {
      setResetFeedback({ msg: "Please enter both the reset code and your new password", type: "error" });
      return;
    }

    setResetLoading(true);
    setResetFeedback({ msg: "", type: "" });

    try {
      const res = await clientServer.post("/auth/reset_password", {
        email: resetEmail.trim(),
        otp: resetOtp.trim(),
        newPassword
      });

      setResetFeedback({ msg: res.data.message || "Password reset successfully!", type: "success" });
      setTimeout(() => {
        setShowForgotModal(false);
        setResetStep(1);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
        setUserLoginMethod(true);
      }, 1500);
    } catch (err) {
      setResetFeedback({ msg: err.response?.data?.message || "Password reset failed", type: "error" });
    } finally {
      setResetLoading(false);
    }
  };

  // ── OAuth Handlers ──
  const handleGoogleOAuthLogin = async () => {
    // Check if Google GSI SDK is available or prompt ID token
    const dummyIdToken = prompt("Google One-Tap ID Token Authentication:\nEnter your Google ID Token to authenticate (for testing):");
    if (!dummyIdToken) return;

    try {
      showLocalMsg("Verifying Google credentials server-side...", "success");
      const res = await clientServer.post("/auth/google_oauth", { idToken: dummyIdToken });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        router.push("/dashboard");
      }
    } catch (err) {
      showLocalMsg(err.response?.data?.message || "Google authentication failed", "error");
    }
  };

  const handleGithubOAuthLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "demo_github_client_id";
    const redirectUri = window.location.origin + "/login";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  };

  const handleGithubCodeExchange = async (code) => {
    try {
      showLocalMsg("Exchanging GitHub authorization code server-side...", "success");
      const res = await clientServer.post("/auth/github_oauth", { code });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        router.push("/dashboard");
      }
    } catch (err) {
      showLocalMsg(err.response?.data?.message || "GitHub authentication failed", "error");
    }
  };

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.authWrapper}>
          {/* Background Sports Elements */}
          <div className={styles.backgroundElements}>
            <div className={styles.floatingIcon} style={{ top: '10%', left: '10%' }}>
              <i className="fa-solid fa-futbol"></i>
            </div>
            <div className={styles.floatingIcon} style={{ top: '20%', right: '15%' }}>
              <i className="fa-solid fa-basketball-ball"></i>
            </div>
            <div className={styles.floatingIcon} style={{ bottom: '30%', left: '8%' }}>
              <i className="fa-solid fa-tennis-ball"></i>
            </div>
            <div className={styles.floatingIcon} style={{ bottom: '15%', right: '12%' }}>
              <i className="fa-solid fa-trophy"></i>
            </div>
          </div>

          <div className={styles.authCard}>
            {/* Left Side - Form */}
            <div className={styles.authForm}>
              <div className={styles.formHeader}>
                <div className={styles.logoSection}>
                  <div className={styles.logo}>
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                  <h1 className={styles.brandName}>SportConnect</h1>
                </div>
                <h2 className={styles.authTitle}>
                  {userLoginMethod ? "Welcome Back!" : "Join the Game!"}
                </h2>
                <p className={styles.authSubtitle}>
                  {userLoginMethod
                    ? "Sign in to continue your sports journey"
                    : "Create your verified athlete account with Email OTP"
                  }
                </p>
              </div>

              {/* Feedback Message */}
              {(localFeedback.msg || authState.message?.message) && (
                <div className={`${styles.messageAlert} ${localFeedback.type === 'error' || authState.isError ? styles.error : styles.success}`}>
                  <i className={`fa-solid ${localFeedback.type === 'error' || authState.isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                  <span>{localFeedback.msg || authState.message?.message}</span>
                </div>
              )}

              {/* OAuth Social Buttons */}
              <div className={styles.oauthGroup}>
                <button type="button" onClick={handleGoogleOAuthLogin} className={styles.googleBtn}>
                  <i className="fa-brands fa-google"></i>
                  <span>Continue with Google</span>
                </button>

                <button type="button" onClick={handleGithubOAuthLogin} className={styles.githubBtn}>
                  <i className="fa-brands fa-github"></i>
                  <span>Continue with GitHub</span>
                </button>
              </div>

              <div className={styles.divider}>
                <span>or continue with email</span>
              </div>

              {/* Form Fields */}
              <form onSubmit={userLoginMethod ? handleLogin : (signupStep === 1 ? handleSendSignupOtp : handleVerifySignupOtp)} className={styles.formFields}>
                {!userLoginMethod && signupStep === 1 && (
                  <div className={styles.fieldRow}>
                    <div className={styles.inputGroup}>
                      <i className="fa-solid fa-user"></i>
                      <input
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.inputField}
                        type="text"
                        placeholder="Username"
                        value={username}
                        required
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <i className="fa-solid fa-id-card"></i>
                      <input
                        onChange={(e) => setName(e.target.value)}
                        className={styles.inputField}
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        required
                      />
                    </div>
                  </div>
                )}

                {signupStep === 1 && (
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-envelope"></i>
                    <input
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className={styles.inputField}
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      required
                    />
                  </div>
                )}

                {signupStep === 1 && (
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-lock"></i>
                    <input
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.inputField}
                      type="password"
                      placeholder="Password"
                      value={password}
                      required
                    />
                  </div>
                )}

                {/* Signup Step 2: Enter 6-digit OTP */}
                {!userLoginMethod && signupStep === 2 && (
                  <div className={styles.otpSection}>
                    <div className={styles.otpHeader}>
                      <i className="fa-solid fa-shield-halved"></i>
                      <p>Enter the 6-digit verification code sent to <strong>{email}</strong></p>
                    </div>
                    <div className={styles.inputGroup}>
                      <i className="fa-solid fa-key"></i>
                      <input
                        onChange={(e) => setOtpCode(e.target.value)}
                        className={`${styles.inputField} ${styles.otpInput}`}
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={otpCode}
                        autoFocus
                        required
                      />
                    </div>
                    <div className={styles.resendRow}>
                      <button
                        type="button"
                        onClick={handleSendSignupOtp}
                        disabled={resendTimer > 0 || isSendingOtp}
                        className={styles.resendBtn}
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Verification Code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className={styles.backStepBtn}
                      >
                        Change Email
                      </button>
                    </div>
                  </div>
                )}

                {userLoginMethod && (
                  <div className={styles.forgotPassword}>
                    <span onClick={() => setShowForgotModal(true)} className={styles.forgotLink}>
                      Forgot Password?
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.authButton}
                  disabled={isSendingOtp || isVerifyingOtp}
                >
                  <i className={`fa-solid ${userLoginMethod ? 'fa-sign-in-alt' : (signupStep === 1 ? 'fa-paper-plane' : 'fa-check-double')}`}></i>
                  <span>
                    {userLoginMethod
                      ? "Sign In"
                      : (signupStep === 1 ? (isSendingOtp ? "Sending Code..." : "Send Verification Code") : (isVerifyingOtp ? "Verifying..." : "Verify & Complete Signup"))}
                  </span>
                </button>
              </form>
            </div>

            {/* Right Side - Toggle & Branding */}
            <div className={styles.authBranding}>
              <div className={styles.brandingContent}>
                <div className={styles.sportsIcons}>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-futbol"></i>
                  </div>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-basketball-ball"></i>
                  </div>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-tennis-ball"></i>
                  </div>
                  <div className={styles.sportIcon}>
                    <i className="fa-solid fa-dumbbell"></i>
                  </div>
                </div>

                <h3 className={styles.brandingTitle}>
                  {userLoginMethod ? "New to SportConnect?" : "Already a Member?"}
                </h3>
                <p className={styles.brandingText}>
                  {userLoginMethod
                    ? "Join thousands of athletes and start your sports networking journey today!"
                    : "Welcome back! Continue connecting with your sports community."
                  }
                </p>

                <button
                  className={styles.toggleButton}
                  onClick={() => setUserLoginMethod(!userLoginMethod)}
                >
                  <i className={`fa-solid ${userLoginMethod ? 'fa-user-plus' : 'fa-sign-in-alt'}`}></i>
                  <span>{userLoginMethod ? "Sign Up" : "Sign In"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password OTP Modal */}
      {showForgotModal && (
        <div className={styles.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔑 Reset Password via OTP</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowForgotModal(false)}>&times;</button>
            </div>

            {resetFeedback.msg && (
              <div className={`${styles.messageAlert} ${resetFeedback.type === 'error' ? styles.error : styles.success}`}>
                <span>{resetFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={resetStep === 1 ? handleSendResetOtp : handleVerifyResetOtp} className={styles.modalForm}>
              {resetStep === 1 ? (
                <div className={styles.inputGroup}>
                  <i className="fa-solid fa-envelope"></i>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={styles.inputField}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-key"></i>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="Enter 6-digit OTP code"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className={`${styles.inputField} ${styles.otpInput}`}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <i className="fa-solid fa-lock"></i>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.inputField}
                      required
                    />
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowForgotModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading} className={styles.submitBtn}>
                  {resetStep === 1 ? (resetLoading ? "Sending Code..." : "Send Reset Code") : (resetLoading ? "Resetting..." : "Reset Password")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  );
}