import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAboutUser } from '@/config/redux/action/authAction';
import { BASE_URL, clientServer } from '@/config';
import DashboardLayout from '@/layout/DashboardLayout';
import UserLayout from '@/layout/UserLayout';
import styles from './index.module.css';

export default function UpdateProfile() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  // Form states
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    email: ''
  });

  const [profileFormData, setProfileFormData] = useState({
    bio: '',
    currentPosition: '',
    pastWork: [],
    education: []
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  }, [dispatch]);

  useEffect(() => {
    if (authState.user && authState.user.userId) {
      const user = authState.user;
      setUserFormData({
        name: user.userId.name || '',
        username: user.userId.username || '',
        email: user.userId.email || ''
      });

      setProfileFormData({
        bio: user.bio || '',
        currentPosition: user.currentPosition || '',
        pastWork: user.pastWork || [],
        education: user.education || []
      });
    }
  }, [authState.user]);

  const handleUserFormChange = (e) => {
    setUserFormData({
      ...userFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileFormChange = (e) => {
    setProfileFormData({
      ...profileFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleWorkChange = (index, field, value) => {
    const updatedWork = [...profileFormData.pastWork];
    updatedWork[index] = {
      ...updatedWork[index],
      [field]: value
    };
    setProfileFormData({
      ...profileFormData,
      pastWork: updatedWork
    });
  };

  const addWorkExperience = () => {
    setProfileFormData({
      ...profileFormData,
      pastWork: [
        ...profileFormData.pastWork,
        { company: '', position: '', years: '' }
      ]
    });
  };

  const removeWorkExperience = (index) => {
    const updatedWork = profileFormData.pastWork.filter((_, i) => i !== index);
    setProfileFormData({
      ...profileFormData,
      pastWork: updatedWork
    });
  };

  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...profileFormData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    setProfileFormData({
      ...profileFormData,
      education: updatedEducation
    });
  };

  const addEducation = () => {
    setProfileFormData({
      ...profileFormData,
      education: [
        ...profileFormData.education,
        { school: '', degree: '', fieldOfStudy: '' }
      ]
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = profileFormData.education.filter((_, i) => i !== index);
    setProfileFormData({
      ...profileFormData,
      education: updatedEducation
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const updateUserInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/user_update', { token, ...userFormData });
      showMessage('Account basic info updated successfully!', 'success');
      dispatch(getAboutUser({ token }));
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update user info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileData = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await clientServer.post('/update_profile_data', { token, ...profileFormData });
      showMessage('Scouting profile details updated successfully!', 'success');
      dispatch(getAboutUser({ token }));
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfilePicture = async (e) => {
    e.preventDefault();
    if (!profilePicture) {
      showMessage('Please select an image file first', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('token', token);
      formData.append('profilePicture', profilePicture);

      await clientServer.post('/update_profile_picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showMessage('Profile picture updated successfully!', 'success');
      setProfilePicture(null);
      setPreviewUrl(null);
      dispatch(getAboutUser({ token }));
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!authState.user || !authState.user.userId) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}></i>
            <p>Loading athlete profile...</p>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  const user = authState.user;
  const currentAvatarSrc = previewUrl || (
    !user.userId.profilePicture || user.userId.profilePicture === 'default.jpg'
      ? `${BASE_URL}/uploads/default.jpg`
      : `${BASE_URL}/uploads/${user.userId.profilePicture}`
  );

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <h1><i className="fa-solid fa-id-card"></i> Athlete Profile Editor</h1>
            <p>Manage your public scouting profile, achievements, and account details</p>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`${styles.alertMessage} ${styles[messageType]}`}>
              <i className={`fa-solid ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span>{message}</span>
            </div>
          )}

          {/* Profile Picture Header Card */}
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
              <img
                src={currentAvatarSrc}
                alt={user.userId.name}
                className={styles.avatarImage}
                onError={(e) => { e.target.src = `${BASE_URL}/uploads/default.jpg`; }}
              />
            </div>

            <div className={styles.avatarInfo}>
              <h2>{user.userId.name}</h2>
              <p>@{user.userId.username} • Athlete</p>

              <form onSubmit={updateProfilePicture} className={styles.pictureForm}>
                <label className={styles.fileLabel}>
                  <i className="fa-solid fa-camera"></i>
                  <span>{profilePicture ? profilePicture.name : 'Choose Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className={styles.fileInput}
                  />
                </label>

                {profilePicture && (
                  <button type="submit" disabled={loading} className={styles.saveBtn}>
                    <i className="fa-solid fa-upload"></i>
                    <span>{loading ? 'Uploading...' : 'Upload'}</span>
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Basic Account Info */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <i className="fa-solid fa-user"></i> Basic Information
            </h3>

            <form onSubmit={updateUserInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userFormData.name}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userFormData.username}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={userFormData.email}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.saveBtn}>
                <i className="fa-solid fa-save"></i>
                <span>{loading ? 'Saving...' : 'Save Basic Info'}</span>
              </button>
            </form>
          </div>

          {/* Profile Details (Bio & Position) */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>
              <i className="fa-solid fa-medal"></i> Athletic Bio & Position
            </h3>

            <form onSubmit={updateProfileData} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Bio / Quote</label>
                  <textarea
                    name="bio"
                    rows="3"
                    placeholder="Tell coaches and scouts about your play style..."
                    value={profileFormData.bio}
                    onChange={handleProfileFormChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Primary Role / Position</label>
                  <input
                    type="text"
                    name="currentPosition"
                    placeholder="e.g. Point Guard / Striker / Head Coach"
                    value={profileFormData.currentPosition}
                    onChange={handleProfileFormChange}
                  />
                </div>
              </div>

              {/* Past Work / Teams */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', uppercase: true }}>
                  Past Squads & Organizations
                </label>

                {profileFormData.pastWork.map((work, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <h4>Squad #{idx + 1}</h4>
                      <button type="button" onClick={() => removeWorkExperience(idx)} className={styles.removeBtn}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Organization / Team</label>
                        <input
                          type="text"
                          placeholder="e.g. Red Bulls FC"
                          value={work.company || ''}
                          onChange={(e) => handleWorkChange(idx, 'company', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Position / Role</label>
                        <input
                          type="text"
                          placeholder="e.g. Captain / Midfielder"
                          value={work.position || ''}
                          onChange={(e) => handleWorkChange(idx, 'position', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Years Active</label>
                        <input
                          type="text"
                          placeholder="e.g. 2022 - 2024"
                          value={work.years || ''}
                          onChange={(e) => handleWorkChange(idx, 'years', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addWorkExperience} className={styles.addBtn}>
                  <i className="fa-solid fa-plus"></i>
                  <span>Add Squad History</span>
                </button>
              </div>

              {/* Education / Training */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', uppercase: true }}>
                  Sports Academies & Education
                </label>

                {profileFormData.education.map((edu, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <h4>Academy / School #{idx + 1}</h4>
                      <button type="button" onClick={() => removeEducation(idx)} className={styles.removeBtn}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Academy / University</label>
                        <input
                          type="text"
                          placeholder="e.g. National Sports Institute"
                          value={edu.school || ''}
                          onChange={(e) => handleEducationChange(idx, 'school', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Degree / Certificate</label>
                        <input
                          type="text"
                          placeholder="e.g. Certified Athletic Trainer"
                          value={edu.degree || ''}
                          onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addEducation} className={styles.addBtn}>
                  <i className="fa-solid fa-plus"></i>
                  <span>Add Education / Certification</span>
                </button>
              </div>

              <button type="submit" disabled={loading} className={styles.saveBtn} style={{ marginTop: '0.5rem' }}>
                <i className="fa-solid fa-save"></i>
                <span>{loading ? 'Saving...' : 'Save Profile Details'}</span>
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}