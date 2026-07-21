import NavbarComponent from '@/Components/Navbar';
import React from 'react';

export default function UserLayout({ children }) {
  return (
    <div style={{ paddingTop: '60px' }}>
      <NavbarComponent/>
      {children}
    </div>
  );
}

