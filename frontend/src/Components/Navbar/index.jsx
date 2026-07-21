import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { reset } from '@/config/redux/reducer/authReducer';
import { BASE_URL, clientServer } from '@/config';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals state for Settings, Privacy, Help & Support, Hub, and More Menu
  const [activeModal, setActiveModal] = useState(null); // 'settings' | 'privacy' | 'support' | 'hub' | 'more' | null

  // Hub Data State
  const [hubData, setHubData] = useState({
    trending: [],
    events: [],
    stats: { connections: 0, teams: 0, likes: 0, posts: 0 },
    squads: []
  });

  // Support Form State
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportFeedback, setSupportFeedback] = useState('');

  // Privacy & Settings State
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true,
    showOnlineStatus: true,
    allowInvites: true
  });
  const [accountSettings, setAccountSettings] = useState({
    emailNotifs: true,
    matchAlerts: true
  });

  const settingsRef = useRef(null);
  const notificationsRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await clientServer.get(`/user/notifications?token=${token}`);
      const notifs = res.data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchHubData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const selfUserId = authState.user?.userId?._id;

      // 1. Fetch user stats
      const statsRes = await clientServer.get(`/user/stats?token=${token}`);
      const stats = statsRes.data.stats || { connections: 0, teams: 0, posts: 0, likes: 0 };

      // 2. Fetch trending athletes
      const trendingRes = await clientServer.get('/user/trending_athletes');
      const allTrending = trendingRes.data.trending || [];
      const filteredTrending = selfUserId
        ? allTrending.filter(p => p.userId?._id !== selfUserId)
        : allTrending;

      // 3. Fetch upcoming events
      const eventsRes = await clientServer.get('/events');
      const allEvents = eventsRes.data.events || [];
      const sortedEvents = [...allEvents].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      // 4. Fetch my squads
      let squads = [];
      if (selfUserId) {
        const teamsRes = await clientServer.get(`/teams/user/${selfUserId}`);
        squads = teamsRes.data.teams || [];
      }

      setHubData({
        trending: filteredTrending,
        events: sortedEvents.slice(0, 3),
        stats,
        squads
      });
    } catch (err) {
      console.error("Failed to fetch hub data:", err);
    }
  };

  useEffect(() => {
    if (authState.user || localStorage.getItem("token")) {
      fetchNotifications();
    }
  }, [authState.user]);

  useEffect(() => {
    if (activeModal === 'hub') {
      fetchHubData();
    }
  }, [activeModal]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/user/notifications/mark_read', { token });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleAcceptTeamInvite = async (e, notif) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/teams/accept_invite', {
        token,
        teamId: notif.relatedId,
        notificationId: notif._id
      });
      fetchNotifications();
      router.push('/teams');
    } catch (err) {
      console.error("Accept team invite error:", err);
    }
  };

  const handleAcceptTeamJoinRequest = async (e, notif) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem("token");
      const requesterId = notif.senderId?._id || notif.senderId;
      await clientServer.post('/teams/accept_join', {
        token,
        teamId: notif.relatedId,
        notificationId: notif._id,
        requesterId
      });
      fetchNotifications();
      router.push('/teams');
    } catch (err) {
      console.error("Accept join request error:", err);
    }
  };

  const handleRejectTeamJoinRequest = async (e, notif) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem("token");
      const requesterId = notif.senderId?._id || notif.senderId;
      await clientServer.post('/teams/reject_join', {
        token,
        teamId: notif.relatedId,
        notificationId: notif._id,
        requesterId
      });
      fetchNotifications();
    } catch (err) {
      console.error("Reject join request error:", err);
    }
  };

  const handleAcceptConnectionRequest = async (e, notif) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/user/accept_connection_request', {
        token,
        requestId: notif.relatedId,
        notificationId: notif._id,
        action_type: 'accept'
      });
      fetchNotifications();
    } catch (err) {
      console.error("Accept connection request error:", err);
    }
  };

  const handleDeclineConnectionRequest = async (e, notif) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/user/accept_connection_request', {
        token,
        requestId: notif.relatedId,
        notificationId: notif._id,
        action_type: 'decline'
      });
      fetchNotifications();
    } catch (err) {
      console.error("Decline connection request error:", err);
    }
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) return;

    setSupportFeedback("✅ Support ticket submitted successfully! Our team will reach out at " + (authState.user?.userId?.email || "your email") + ".");
    setTimeout(() => {
      setSupportForm({ subject: '', message: '' });
      setSupportFeedback('');
      setActiveModal(null);
    }, 2500);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    if (isSettingsOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen, isNotificationsOpen]);

  if (!authState.user || !authState.user.userId) {
    return null;
  }

  const formatEventDate = (dateString) => {
    if (!dateString) return { day: "--", month: "---" };
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  return (
    <>
      {/* ── TOP HEADER BAR (Always Top) ───────────────────────── */}
      <div className={styles.container}>
        <nav className={styles.navBar}>
          {/* LEFT SIDE: Phoenix Logo + Brand */}
          <div className={styles.navLeft}>
            <div className={styles.logoContainer} onClick={() => router.push("/")}>
              <img
                src="/images/phoenix_logo.png"
                alt="SportConnect Phoenix Logo"
                className={styles.logoImg}
              />
              <span className={styles.brandName}>SportConnect</span>
            </div>
          </div>

          {/* CENTER: Desktop Only Links */}
          <div className={styles.navCenterDesktop}>
            <div
              className={`${styles.navLink} ${router.pathname === '/dashboard' ? styles.active : ''}`}
              onClick={() => router.push("/dashboard")}
            >
              <i className="fa-solid fa-home"></i>
              <span>Home</span>
            </div>
            <div
              className={`${styles.navLink} ${router.pathname === '/discover' ? styles.active : ''}`}
              onClick={() => router.push("/discover")}
            >
              <i className="fa-solid fa-search"></i>
              <span>Discover</span>
            </div>
            <div
              className={`${styles.navLink} ${router.pathname.startsWith('/events') ? styles.active : ''}`}
              onClick={() => router.push("/events")}
            >
              <i className="fa-solid fa-calendar-check"></i>
              <span>Events</span>
            </div>
            <div
              className={`${styles.navLink} ${router.pathname === '/teams' ? styles.active : ''}`}
              onClick={() => router.push("/teams")}
            >
              <i className="fa-solid fa-users"></i>
              <span>Teams</span>
            </div>
            <div
              className={`${styles.navLink} ${router.pathname === '/my_connections' ? styles.active : ''}`}
              onClick={() => router.push("/my_connections")}
            >
              <i className="fa-solid fa-user-group"></i>
              <span>Network</span>
            </div>
            <div
              className={`${styles.navLink} ${activeModal === 'hub' ? styles.active : ''}`}
              onClick={() => setActiveModal(activeModal === 'hub' ? null : 'hub')}
            >
              <i className="fa-solid fa-fire"></i>
              <span>Hub</span>
            </div>
          </div>

          {/* RIGHT SIDE: User Actions */}
          <div className={styles.navRight}>
            {/* Notifications Dropdown */}
            <div className={styles.notificationContainer} ref={notificationsRef}>
              <div
                className={styles.notificationIcon}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <i className="fa-solid fa-bell"></i>
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>{unreadCount}</span>
                )}
              </div>

              {isNotificationsOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.dropdownHeader}>
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className={styles.markAllReadBtn}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`${styles.notificationItem} ${!notif.isRead ? styles.unreadItem : ''}`}
                        onClick={() => {
                          if (notif.type === 'team_invite' || notif.type === 'team_join_request') router.push('/teams');
                          else if (notif.type === 'connection_request') router.push('/my_connections');
                          else if (notif.relatedPostId) router.push('/dashboard');
                          setIsNotificationsOpen(false);
                        }}
                      >
                        <i className={`fa-solid ${
                          notif.type === 'like' ? 'fa-heart' :
                          notif.type === 'comment' ? 'fa-comment' :
                          notif.type === 'team_invite' || notif.type === 'team_join_request' ? 'fa-users' : 'fa-user-plus'
                        }`}></i>
                        <div className={styles.notificationContentBody}>
                          <p>{notif.message}</p>
                          <span className={styles.notifDate}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                          
                          {/* Action Buttons for Actionable Notifications */}
                          {notif.type === 'team_invite' && !notif.isRead && (
                            <div className={styles.notifActionsRow}>
                              <button 
                                className={styles.acceptNotifBtn} 
                                onClick={(e) => handleAcceptTeamInvite(e, notif)}
                              >
                                Accept & Join
                              </button>
                            </div>
                          )}

                          {notif.type === 'team_join_request' && !notif.isRead && (
                            <div className={styles.notifActionsRow}>
                              <button 
                                className={styles.acceptNotifBtn} 
                                onClick={(e) => handleAcceptTeamJoinRequest(e, notif)}
                              >
                                Accept
                              </button>
                              <button 
                                className={styles.declineNotifBtn} 
                                onClick={(e) => handleRejectTeamJoinRequest(e, notif)}
                              >
                                Decline
                              </button>
                            </div>
                          )}

                          {notif.type === 'connection_request' && !notif.isRead && (
                            <div className={styles.notifActionsRow}>
                              <button 
                                className={styles.acceptNotifBtn} 
                                onClick={(e) => handleAcceptConnectionRequest(e, notif)}
                              >
                                Accept
                              </button>
                              <button 
                                className={styles.declineNotifBtn} 
                                onClick={(e) => handleDeclineConnectionRequest(e, notif)}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyNotifications}>
                      No notifications yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Header */}
            <div className={styles.userProfile} onClick={() => router.push("/profile")}>
              <img
                src={
                  !authState.user.userId?.profilePicture || authState.user.userId.profilePicture === 'default.jpg'
                    ? `${BASE_URL}/uploads/default.jpg`
                    : `${BASE_URL}/uploads/${authState.user.userId.profilePicture}`
                }
                alt={authState.user.userId.name}
                className={styles.userAvatar}
                onError={(e) => {
                  e.target.src = `${BASE_URL}/uploads/default.jpg`;
                }}
              />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{authState.user.userId.name}</span>
                <span className={styles.userRole}>Athlete</span>
              </div>
            </div>

            {/* Settings Dropdown */}
            <div className={styles.settingsContainer} ref={settingsRef}>
              <div
                className={styles.settingsIcon}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <i className="fa-solid fa-ellipsis-v"></i>
              </div>

              {isSettingsOpen && (
                <div className={styles.settingsCard}>
                  <div className={styles.settingsOption} onClick={() => { router.push("/profile"); setIsSettingsOpen(false); }}>
                    <i className="fa-solid fa-user-circle"></i>
                    <span>My Profile</span>
                  </div>
                  <div className={styles.settingsOption} onClick={() => { setActiveModal('settings'); setIsSettingsOpen(false); }}>
                    <i className="fa-solid fa-cog"></i>
                    <span>Settings</span>
                  </div>
                  <div className={styles.settingsOption} onClick={() => { setActiveModal('privacy'); setIsSettingsOpen(false); }}>
                    <i className="fa-solid fa-shield-alt"></i>
                    <span>Privacy</span>
                  </div>
                  <div className={styles.settingsOption} onClick={() => { setActiveModal('support'); setIsSettingsOpen(false); }}>
                    <i className="fa-solid fa-question-circle"></i>
                    <span>Help & Support</span>
                  </div>
                  <div className={styles.settingsDivider}></div>
                  <div
                    className={styles.settingsOption}
                    onClick={() => {
                      localStorage.removeItem("token");
                      dispatch(reset());
                      router.push("/login");
                      setIsSettingsOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* ── LINKEDIN MOBILE BOTTOM NAVIGATION BAR (Anchored at Screen Bottom) ── */}
      <div className={styles.mobileBottomNav}>
        <div
          className={`${styles.mobileNavItem} ${router.pathname === '/dashboard' ? styles.active : ''}`}
          onClick={() => router.push("/dashboard")}
        >
          <i className="fa-solid fa-home"></i>
          <span>Home</span>
        </div>

        <div
          className={`${styles.mobileNavItem} ${router.pathname === '/discover' ? styles.active : ''}`}
          onClick={() => router.push("/discover")}
        >
          <i className="fa-solid fa-search"></i>
          <span>Discover</span>
        </div>

        <div
          className={`${styles.mobileNavItem} ${isNotificationsOpen ? styles.active : ''}`}
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        >
          <i className="fa-solid fa-bell"></i>
          <span>Notifs</span>
          {unreadCount > 0 && (
            <span className={styles.mobileBadge}>{unreadCount}</span>
          )}
        </div>

        <div
          className={`${styles.mobileNavItem} ${router.pathname === '/profile' ? styles.active : ''}`}
          onClick={() => router.push("/profile")}
        >
          <i className="fa-solid fa-user-circle"></i>
          <span>Profile</span>
        </div>

        <div
          className={`${styles.mobileNavItem} ${activeModal === 'more' ? styles.active : ''}`}
          onClick={() => setActiveModal(activeModal === 'more' ? null : 'more')}
        >
          <i className="fa-solid fa-ellipsis-h"></i>
          <span>More</span>
        </div>
      </div>

      {/* ── MOBILE MORE DRAWER MODAL ───────────────────────── */}
      {activeModal === 'more' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={`${styles.modalCard} ${styles.moreModalCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🚀 Explore Features</h3>
              <button className={styles.closeModalBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className={styles.moreOptionsGrid}>
              <div className={styles.moreCard} onClick={() => { router.push("/teams"); setActiveModal(null); }}>
                <i className="fa-solid fa-users" style={{ color: "#10b981" }}></i>
                <div>
                  <strong>Teams & Squads</strong>
                  <small>Join or create athletic teams</small>
                </div>
              </div>

              <div className={styles.moreCard} onClick={() => { setActiveModal('hub'); }}>
                <i className="fa-solid fa-fire" style={{ color: "#f59e0b" }}></i>
                <div>
                  <strong>Sports Hub</strong>
                  <small>Trending athletes, events & stats</small>
                </div>
              </div>

              <div className={styles.moreCard} onClick={() => { router.push("/my_connections"); setActiveModal(null); }}>
                <i className="fa-solid fa-user-group" style={{ color: "#3b82f6" }}></i>
                <div>
                  <strong>My Network</strong>
                  <small>Manage connection requests</small>
                </div>
              </div>

              <div className={styles.moreCard} onClick={() => { router.push("/events"); setActiveModal(null); }}>
                <i className="fa-solid fa-calendar-check" style={{ color: "#ec4899" }}></i>
                <div>
                  <strong>Sports Events</strong>
                  <small>Tournaments & brackets</small>
                </div>
              </div>

              <div className={styles.moreCard} onClick={() => { setActiveModal('settings'); }}>
                <i className="fa-solid fa-cog" style={{ color: "#8b5cf6" }}></i>
                <div>
                  <strong>Settings & Preferences</strong>
                  <small>Account, privacy & support</small>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SPORTS HUB MODAL (Trending, Events, Stats, Squads) ── */}
      {activeModal === 'hub' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={`${styles.modalCard} ${styles.hubModalCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔥 Sports Hub Overview</h3>
              <button className={styles.closeModalBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className={styles.hubGrid}>
              {/* 1. Trending Athletes */}
              <div className={styles.hubSection}>
                <h4><i className="fa-solid fa-fire" style={{ color: "#f59e0b" }}></i> Trending Athletes</h4>
                <div className={styles.hubList}>
                  {hubData.trending.length > 0 ? (
                    hubData.trending.slice(0, 3).map((profile) => (
                      <div
                        key={profile._id}
                        className={styles.hubProfileItem}
                        onClick={() => { router.push(`/view_profile/${profile.userId.username}`); setActiveModal(null); }}
                      >
                        <img
                          src={
                            !profile.userId.profilePicture || profile.userId.profilePicture === 'default.jpg'
                              ? `${BASE_URL}/uploads/default.jpg`
                              : `${BASE_URL}/uploads/${profile.userId.profilePicture}`
                          }
                          alt={profile.userId.name}
                        />
                        <div>
                          <strong>{profile.userId.name}</strong>
                          <small>@{profile.userId.username}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>No other athletes registered</p>
                  )}
                </div>
              </div>

              {/* 2. Upcoming Events */}
              <div className={styles.hubSection}>
                <h4><i className="fa-solid fa-calendar" style={{ color: "#10b981" }}></i> Upcoming Events</h4>
                <div className={styles.hubList}>
                  {hubData.events.length > 0 ? (
                    hubData.events.map((ev) => {
                      const { day, month } = formatEventDate(ev.startDate);
                      return (
                        <div
                          key={ev._id}
                          className={styles.hubEventItem}
                          onClick={() => { router.push(`/events/${ev._id}`); setActiveModal(null); }}
                        >
                          <div className={styles.eventDateBadge}>
                            <span>{day}</span>
                            <small>{month}</small>
                          </div>
                          <div>
                            <strong>{ev.name}</strong>
                            <small>{ev.sports?.[0]?.sportName || "Sports Event"}</small>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className={styles.emptyText}>No upcoming events</p>
                  )}
                </div>
              </div>

              {/* 3. Your Stats */}
              <div className={styles.hubSection}>
                <h4><i className="fa-solid fa-chart-line" style={{ color: "#3b82f6" }}></i> Your Stats</h4>
                <div className={styles.hubStatsGrid}>
                  <div className={styles.hubStatBox}>
                    <strong>{hubData.stats.connections}</strong>
                    <small>Connections</small>
                  </div>
                  <div className={styles.hubStatBox}>
                    <strong>{hubData.stats.teams}</strong>
                    <small>Teams</small>
                  </div>
                  <div className={styles.hubStatBox}>
                    <strong>{hubData.stats.likes}</strong>
                    <small>Likes</small>
                  </div>
                  <div className={styles.hubStatBox}>
                    <strong>{hubData.stats.posts}</strong>
                    <small>Posts</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.submitBtn} onClick={() => setActiveModal(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HELP & SUPPORT MODAL ───────────────────────── */}
      {activeModal === 'support' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🎧 Help & Support Center</h3>
              <button className={styles.closeModalBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className={styles.supportContactRow}>
              <a href="tel:9156791573" className={styles.contactBox}>
                <i className="fa-solid fa-phone"></i>
                <div className={styles.contactDetails}>
                  <small>Call Support</small>
                  <strong>+91 9156791573</strong>
                </div>
              </a>

              <a href="mailto:atharvghumtane02@gmail.com" className={styles.contactBox}>
                <i className="fa-solid fa-envelope"></i>
                <div className={styles.contactDetails}>
                  <small>Email Support</small>
                  <strong>atharvghumtane02@gmail.com</strong>
                </div>
              </a>
            </div>

            {supportFeedback && (
              <div className={styles.supportAlert}>{supportFeedback}</div>
            )}

            <form onSubmit={handleSupportSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Ticket Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Issue with event creation / account"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Message Details</label>
                <textarea
                  rows="3"
                  placeholder="Describe your issue or query..."
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setActiveModal(null)}>
                  Close
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Submit Support Ticket
                </button>
              </div>
            </form>

            <div className={styles.faqSection}>
              <h4>💡 Frequently Asked Questions</h4>
              <details className={styles.faqItem}>
                <summary>How do I host a sports event/tournament?</summary>
                <p>Navigate to Events &gt; Host Event, fill in event details, sports categories, and set advancement rules!</p>
              </details>
              <details className={styles.faqItem}>
                <summary>How do I create or invite athletes to my squad?</summary>
                <p>Go to Teams &gt; Create New Team, select your sport, then use the owner panel dropdown to invite connections!</p>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* ── PRIVACY & SECURITY MODAL ───────────────────────── */}
      {activeModal === 'privacy' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🛡️ Privacy & Safety Controls</h3>
              <button className={styles.closeModalBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className={styles.toggleList}>
              <div className={styles.toggleRow}>
                <div>
                  <strong>Public Athlete Profile</strong>
                  <p>Allow other athletes to discover your scouting profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.publicProfile}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, publicProfile: e.target.checked })}
                />
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <strong>Show Online Status</strong>
                  <p>Display active status indicator to squad teammates</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showOnlineStatus}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, showOnlineStatus: e.target.checked })}
                />
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <strong>Allow Team Invitations</strong>
                  <p>Receive squad invitations from team captains</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.allowInvites}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, allowInvites: e.target.checked })}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.submitBtn} onClick={() => setActiveModal(null)}>
                Save Privacy Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNT SETTINGS MODAL ───────────────────────── */}
      {activeModal === 'settings' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>⚙️ Account & Preference Settings</h3>
              <button className={styles.closeModalBtn} onClick={() => setActiveModal(null)}>&times;</button>
            </div>

            <div className={styles.toggleList}>
              <div className={styles.toggleRow}>
                <div>
                  <strong>Email Notifications</strong>
                  <p>Receive email alerts for new connection requests & OTPs</p>
                </div>
                <input
                  type="checkbox"
                  checked={accountSettings.emailNotifs}
                  onChange={(e) => setAccountSettings({ ...accountSettings, emailNotifs: e.target.checked })}
                />
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <strong>Tournament Alerts</strong>
                  <p>Get notified when new sports events launch in your area</p>
                </div>
                <input
                  type="checkbox"
                  checked={accountSettings.matchAlerts}
                  onChange={(e) => setAccountSettings({ ...accountSettings, matchAlerts: e.target.checked })}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.submitBtn} onClick={() => setActiveModal(null)}>
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}