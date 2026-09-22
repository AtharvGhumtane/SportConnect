import UserLayout from '@/layout/UserLayout';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import { getAllUsers, getAboutUser } from '@/config/redux/action/authAction';
import { useDispatch, useSelector } from 'react-redux';
import { BASE_URL } from '@/config';
import styles from "./index.module.css";
import { useRouter } from 'next/router';
import Avatar from '@/Components/Avatar';
import { resolveAvatarUrl } from '@/config/imageUtils';

export default function Discoverpage() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
    if (!authState.user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (token) {
        dispatch(getAboutUser({ token }));
      }
    }
  }, []);

  const filteredUsers = authState.all_users?.filter(user => {
    const selfId = authState.user?.userId?._id;
    const selfUsername = authState.user?.userId?.username;
    const isSelf = (selfId && user.userId?._id === selfId) || (selfUsername && user.userId?.username === selfUsername);
    if (isSelf) return false;

    return (
      user.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <h1 className={styles.title}>Discover Profiles</h1>

          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchBar}
          />

          <div  className={styles.allUserProfile}>
            {filteredUsers?.map((user) => (
              <div onClick={() => {
                   router.push(`/view_profile/${user.userId.username}`)
                   }} key={user._id} className={styles.userProfile}>
                <Avatar
                  src={resolveAvatarUrl(user.userId?.profilePicture)}
                  name={user.userId?.name}
                  alt={user.userId?.name || 'Athlete'}
                  size={60}
                  className={styles.profileImage}
                />
                <div className={styles.profileInfo}>
                  <h2>{user.userId?.name}</h2>
                  <p>@{user.userId?.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
