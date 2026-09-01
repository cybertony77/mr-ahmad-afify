import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function LegacyUserMenu({
  userData,
  studentData,
  profilePictureUrl,
  courseLabels,
  subscription,
  timeRemaining,
  isScoringEnabled,
  isSubscriptionEnabled,
  showMarketingPageMenu,
  isMarketingSystemEnabled,
  publicTestimonialsPending,
  isStaff,
  onLogout,
  onManageAssistants,
  onEditProfile,
  onPublicLinkGenerator,
  onManageOnlineSystem,
  onMarketingPage,
  onStudentsReviews,
  onScoringSystem,
  onContactAssistants,
  onContactDeveloper,
  onSubscriptionDashboard,
  onChangePassword,
  onOpenLinks,
  onOpenQRCode,
  onOpenInstallApp,
  onOpenAppVideos,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const menuRef = useRef(null);
  const otherRef = useRef(null);
  const otherHoverTimer = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 580px)');
    const updateDesktopState = () => {
      setIsDesktop(mediaQuery.matches);
      if (!mediaQuery.matches) setShowOther(false);
    };

    updateDesktopState();
    mediaQuery.addEventListener('change', updateDesktopState);
    return () => mediaQuery.removeEventListener('change', updateDesktopState);
  }, []);

  useEffect(() => {
    if (!open) setShowOther(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (otherHoverTimer.current) clearTimeout(otherHoverTimer.current);
    };
  }, []);

  const openOther = () => {
    if (otherHoverTimer.current) clearTimeout(otherHoverTimer.current);
    setShowOther(true);
  };

  const closeOtherSoon = () => {
    if (otherHoverTimer.current) clearTimeout(otherHoverTimer.current);
    otherHoverTimer.current = setTimeout(() => setShowOther(false), 150);
  };

  const closeMenu = () => setOpen(false);
  const useOtherMenu = isStaff && isDesktop;

  const openLinks = () => {
    closeMenu();
    onOpenLinks();
  };

  const openQRCode = () => {
    closeMenu();
    onOpenQRCode();
  };

  const openInstallApp = () => {
    closeMenu();
    onOpenInstallApp();
  };

  const openAppVideos = () => {
    closeMenu();
    onOpenAppVideos();
  };

  const navigate = (callback) => {
    closeMenu();
    callback();
  };

  return (
    <>
      <div style={{ position: 'relative', marginRight: 32 }} ref={menuRef}>
        <button
          type="button"
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: profilePictureUrl ? 'transparent' : '#e9ecef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: open ? '0 2px 8px rgba(31,168,220,0.15)' : 'none',
            border: open ? '2px solid #1FA8DC' : '2px solid #e9ecef',
            transition: 'box-shadow 0.2s, border 0.2s',
            overflow: 'hidden',
            position: 'relative',
          }}
          onClick={() => setOpen((value) => !value)}
          title={userData.name || userData.id}
          aria-label="Open user menu"
          aria-expanded={open}
        >
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="Profile"
              fill
              style={{ objectFit: 'cover', borderRadius: '50%' }}
              unoptimized
            />
          ) : (
            <span
              style={{
                fontWeight: 700,
                fontSize: 22,
                color: '#1FA8DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              {String(studentData?.name || userData.name || userData.id || 'U')
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: 54,
              right: 25,
              minWidth: 270,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(31,168,220,0.18)',
              border: '1.5px solid #e9ecef',
              zIndex: 10000,
              padding: '0 0 8px 0',
            }}
          >
            <div
              style={{
                padding: '18px 20px 12px 20px',
                borderBottom: '1px solid #e9ecef',
                textAlign: 'left',
                marginBottom: 8,
              }}
            >
              {userData.role === 'student' && studentData ? (
                <>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1FA8DC', marginBottom: 8 }}>
                    {studentData.name || 'Student'}
                  </div>
                  <div style={{ color: '#495057', fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image src="/user-circle3.svg" alt="User" width={18} height={18} />
                    ID: {studentData.id}
                  </div>
                  {(studentData.course || studentData.grade) && (
                    <div style={{ color: '#495057', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                      {courseLabels.course}: {studentData.course || studentData.grade}
                    </div>
                  )}
                  {courseLabels.showCourseType && studentData.courseType && (
                    <div style={{ color: '#495057', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                      Course Type: {studentData.courseType}
                    </div>
                  )}
                  {studentData.main_center && (
                    <div style={{ color: '#495057', fontSize: 15, fontWeight: 600 }}>
                      Main Center: {studentData.main_center}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1FA8DC', marginBottom: 2 }}>
                    {userData.name || userData.id}
                  </div>
                  <div style={{ color: '#495057', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image src="/user-circle3.svg" alt="User" width={18} height={18} />
                    {userData.id ? `Username: ${userData.id}` : 'No Username'}
                  </div>
                </>
              )}
            </div>

            {isSubscriptionEnabled && subscription && userData.role !== 'student' && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #e9ecef', marginBottom: 8 }}>
                {subscription.active === false && !subscription.date_of_expiration ? (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#dc3545', lineHeight: 1.4 }}>
                    <Image src="/alert-triangle2.svg" alt="alert" width={20} height={20} style={{ marginRight: '5px', transform: 'translateY(5px)' }} />
                    Subscription Expired
                  </div>
                ) : subscription.date_of_expiration && timeRemaining !== null ? (
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#495057', lineHeight: 1.4 }}>
                    <div style={{ marginBottom: 4, color: '#313437', fontSize: 15 }}>
                      <Image src="/clock.svg" alt="Clock" width={18} height={18} style={{ marginRight: '5px', transform: 'translateY(3px)' }} />
                      Subscription time remaining:
                    </div>
                    <div style={{ fontFamily: 'Courier New, monospace', letterSpacing: 0.5, fontSize: 15 }}>
                      <span style={{ color: '#1fa8dc', fontSize: 15 }}>{String(timeRemaining.days || 0).padStart(2, '0')}</span>
                      <span style={{ color: '#ed2929', fontSize: 15 }}> days : </span>
                      <span style={{ color: '#1fa8dc', fontSize: 15 }}>{String(timeRemaining.hours || 0).padStart(2, '0')}</span>
                      <span style={{ color: '#ed2929', fontSize: 15 }}> hours : </span>
                      <span style={{ color: '#1fa8dc', fontSize: 15 }}>{String(timeRemaining.minutes || 0).padStart(2, '0')}</span>
                      <span style={{ color: '#ed2929', fontSize: 15 }}> min : </span>
                      <span style={{ color: '#1fa8dc', fontSize: 15 }}>{String(timeRemaining.seconds || 0).padStart(2, '0')}</span>
                      <span style={{ color: '#ed2929', fontSize: 15 }}> sec</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <button type="button" style={menuBtnStyle} onClick={onLogout}>
              <Image src="/logout.svg" alt="Logout" width={20} height={20} style={{ marginRight: '8px' }} />
              Logout
            </button>

            {userData.role === 'student' && (
              <>
                <button type="button" style={menuBtnStyle} onClick={openLinks}>
                  <Image src="/link.svg" alt="Links" width={20} height={20} style={{ marginRight: '8px' }} />
                  Social Media Links
                </button>
                <button type="button" style={menuBtnStyle} onClick={() => navigate(onChangePassword)}>
                  <Image src="/key2.svg" alt="Password" width={20} height={20} style={{ marginRight: '8px' }} />
                  Change My Password
                </button>
                <button type="button" style={menuBtnStyle} onClick={openQRCode}>
                  <Image src="/qrcode3.svg" alt="QR Code" width={20} height={20} style={{ marginRight: '8px' }} />
                  My Qr Code
                </button>
              </>
            )}

            {userData.role !== 'student' && (
              <>
                <button type="button" style={menuBtnStyle} onClick={() => navigate(onEditProfile)}>
                  <Image src="/user-edit2.svg" alt="Edit Profile" width={20} height={20} style={{ marginRight: '8px' }} />
                  Edit My Profile
                </button>
                <button type="button" style={menuBtnStyle} onClick={() => navigate(onPublicLinkGenerator)}>
                  <Image src="/link.svg" alt="Link" width={20} height={20} style={{ marginRight: '8px' }} />
                  Public Link Generator
                </button>
                {(userData.role === 'admin' || userData.role === 'developer') && (
                  <button type="button" style={menuBtnStyle} onClick={() => navigate(onManageAssistants)}>
                    <Image src="/settings.svg" alt="Settings" width={18} height={18} style={{ marginRight: '8px' }} />
                    Manage Assistants
                  </button>
                )}
                {(userData.role === 'admin' || userData.role === 'developer' || userData.role === 'assistant') && (
                  <>
                    <button type="button" style={menuBtnStyle} onClick={() => navigate(onManageOnlineSystem)}>
                      <Image src="/settings2.svg" alt="Settings" width={20} height={20} style={{ marginRight: '8px' }} />
                      Manage Online System
                    </button>
                    {showMarketingPageMenu && (
                      <button type="button" style={menuBtnStyle} onClick={() => navigate(onMarketingPage)}>
                        <Image src="/marketing.svg" alt="Marketing" width={20} height={20} style={{ marginRight: '8px' }} />
                        Manage Marketing Page
                      </button>
                    )}
                    {isMarketingSystemEnabled && (
                      <button type="button" style={{ ...menuBtnStyle, position: 'relative', display: 'flex', alignItems: 'center' }} onClick={() => navigate(onStudentsReviews)}>
                        <Image src="/testimonials2.svg" alt="Students Reviews" width={20} height={20} style={{ marginRight: '8px' }} />
                        Students Reviews
                        {publicTestimonialsPending > 0 && (
                          <span style={{ marginLeft: '8px', minWidth: '20px', height: '20px', borderRadius: '999px', background: '#dc3545', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }} aria-label={`${publicTestimonialsPending} pending reviews`}>
                            {publicTestimonialsPending > 99 ? '99+' : publicTestimonialsPending}
                          </span>
                        )}
                      </button>
                    )}
                    {isScoringEnabled && (
                      <button type="button" style={menuBtnStyle} onClick={() => navigate(onScoringSystem)}>
                        <Image src="/star4.svg" alt="Scoring System" width={20} height={20} style={{ marginRight: '8px' }} />
                        Manage Scoring System
                      </button>
                    )}
                  </>
                )}
                {isSubscriptionEnabled && userData.role === 'developer' && (
                  <button type="button" style={menuBtnStyle} onClick={() => navigate(onSubscriptionDashboard)}>
                    <Image src="/dollar.svg" alt="Dollar" width={20} height={20} style={{ marginRight: '8px' }} />
                    Subscription Dashboard
                  </button>
                )}
              </>
            )}

            {useOtherMenu ? (
              <div ref={otherRef} style={{ position: 'relative' }} onMouseEnter={openOther} onMouseLeave={closeOtherSoon}>
                <button type="button" style={menuBtnStyle} onClick={() => setShowOther((value) => !value)}>
                  <Image src="/other.svg" alt="Other" width={20} height={20} style={{ marginRight: '8px' }} />
                  Other
                </button>
                {showOther && (
                  <div style={subMenuStyle}>
                    <button type="button" style={menuBtnStyle} onClick={() => navigate(onContactAssistants)}>
                      <Image src="/message.svg" alt="Contact Assistants" width={20} height={20} style={{ marginRight: '8px' }} />
                      Contact Assistants
                    </button>
                    <button type="button" style={menuBtnStyle} onClick={() => navigate(onContactDeveloper)}>
                      <Image src="/message2.svg" alt="Message" width={20} height={20} style={{ marginRight: '8px' }} />
                      Contact Developer
                    </button>
                    <button type="button" style={menuBtnStyle} onClick={openAppVideos}>
                      <Image src="/video.svg" alt="App Videos" width={20} height={20} style={{ marginRight: '8px' }} />
                      App Videos
                    </button>
                    <button type="button" style={menuBtnStyle} onClick={openInstallApp}>
                      <Image src="/download.svg" alt="Download" width={20} height={20} style={{ marginRight: '8px' }} />
                      Install App
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button type="button" style={menuBtnStyle} onClick={() => navigate(onContactAssistants)}>
                  <Image src="/message.svg" alt="Contact Assistants" width={20} height={20} style={{ marginRight: '8px' }} />
                  Contact Assistants
                </button>
                <button type="button" style={menuBtnStyle} onClick={() => navigate(onContactDeveloper)}>
                  <Image src="/message2.svg" alt="Message" width={20} height={20} style={{ marginRight: '8px' }} />
                  Contact Developer
                </button>
                <button type="button" style={menuBtnStyle} onClick={openAppVideos}>
                  <Image src="/video.svg" alt="App Videos" width={20} height={20} style={{ marginRight: '8px' }} />
                  App Videos
                </button>
                <button type="button" style={menuBtnStyle} onClick={openInstallApp}>
                  <Image src="/download.svg" alt="Download" width={20} height={20} style={{ marginRight: '8px' }} />
                  Install App
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {children}
    </>
  );
}

const menuBtnStyle = {
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#1FA8DC',
  fontWeight: 700,
  fontSize: 16,
  padding: '10px 20px',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 8,
  transition: 'background 0.15s',
  marginBottom: 2,
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
};

const subMenuStyle = {
  position: 'absolute',
  bottom: 0,
  top: 'auto',
  right: '100%',
  marginRight: 10,
  minWidth: 230,
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 8px 32px rgba(31,168,220,0.18)',
  border: '1.5px solid #e9ecef',
  zIndex: 10001,
  padding: '8px 0',
};
