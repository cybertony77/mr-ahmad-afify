import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Burger, Drawer } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useProfile, useProfilePicture } from '../lib/api/auth';
import { useSubscription } from '../lib/api/subscription';
import { useStudent } from '../lib/api/students';
import { useSystemConfig, useNationalSystem, getCourseFieldLabels } from '../lib/api/system';
import QRCodeModal from './QRCodeModal';
import InstallApp from './InstallApp';
import StudentLinksModal from './StudentLinksModal';
import AppVideosModal from './AppVideosModal';
import apiClient from '../lib/axios';
import Image from 'next/image';
import styles from '../styles/UserMenu.module.css';

function MenuItem({
  icon,
  children,
  onClick,
  danger = false,
  badge,
  expanded,
  end,
  controls,
}) {
  return (
    <button
      type="button"
      className={`${styles.menuItem}${danger ? ` ${styles.danger}` : ''}`}
      onClick={onClick}
      aria-expanded={expanded === undefined ? undefined : expanded}
      aria-controls={controls}
    >
      <span className={styles.iconBox}>
        <Image src={icon} alt="" width={19} height={19} />
      </span>
      <span className={styles.label}>{children}</span>
      {badge !== undefined && badge !== null ? (
        <span className={styles.badge} aria-label={`${badge} pending reviews`}>
          {badge}
        </span>
      ) : null}
      {end}
    </button>
  );
}

function MenuSection({ title, children }) {
  return (
    <section className={styles.menuSection} aria-labelledby={`menu-section-${title.toLowerCase()}`}>
      <h2 id={`menu-section-${title.toLowerCase()}`} className={styles.sectionTitle}>
        {title}
      </h2>
      <div className={styles.menuList}>{children}</div>
    </section>
  );
}

export default function UserMenu() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const isMobileMenu = useMediaQuery('(max-width: 768px)');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showInstallApp, setShowInstallApp] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showAppVideos, setShowAppVideos] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const router = useRouter();
  
  // Use React Query to get user profile data
  const { data: user } = useProfile();
  const { data: profilePictureUrl } = useProfilePicture();
  const { data: subscription } = useSubscription();
  const { data: systemConfig } = useSystemConfig();
  const isNational = useNationalSystem();
  const courseLabels = getCourseFieldLabels(isNational);
  const isScoringEnabled = systemConfig?.scoring_system === true || systemConfig?.scoring_system === 'true';
  const isSubscriptionEnabled = systemConfig?.subscription === true || systemConfig?.subscription === 'true';
  const isMarketingSystemEnabled =
    systemConfig?.marketing_page === true || systemConfig?.marketing_page === 'true';

  const { data: mpVisibility } = useQuery({
    queryKey: ['marketing-page-visibility'],
    queryFn: async () => (await apiClient.get('/api/marketing_page/visibility')).data,
    enabled: Boolean(isMarketingSystemEnabled),
    staleTime: 30_000,
  });

  const { data: publicTestimonialsData } = useQuery({
    queryKey: ['public_testimonials'],
    queryFn: async () => (await apiClient.get('/api/public_testimonials')).data,
    enabled: Boolean(isMarketingSystemEnabled),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });
  const publicTestimonialsPending = publicTestimonialsData?.pendingCount || 0;

  // Fallback user object if data is not available yet
  const userData = user || { name: '', id: '', phone: '', role: '' };

  const showMarketingPageMenu =
    Boolean(isMarketingSystemEnabled) &&
    (mpVisibility?.page_state !== false ||
      userData.role === 'admin' ||
      userData.role === 'developer');
  
  // If user is a student, fetch student data from students collection
  const studentId = userData.role === 'student' && userData.id ? userData.id.toString() : null;
  const { data: studentData } = useStudent(studentId, { enabled: !!studentId });

  // Subscription countdown timer
  const [timeRemaining, setTimeRemaining] = useState(null);
  const hasLoggedOutRef = useRef(false); // Track if we've already called logout

  useEffect(() => {
    const isDeveloper = userData.role === 'developer';
    const isStudent = userData.role === 'student';

    // Don't run subscription timer if subscription system is disabled
    if (!isSubscriptionEnabled) {
      setTimeRemaining(null);
      hasLoggedOutRef.current = false;
      return;
    }

    // Don't show subscription timer for students
    if (isStudent) {
      setTimeRemaining(null);
      hasLoggedOutRef.current = false;
      return;
    }

    // Simple logic: if active = false AND date_of_expiration = null, show expired
    // Otherwise, if date_of_expiration exists, calculate timer
    if (!subscription || (subscription.active === false && !subscription.date_of_expiration)) {
      setTimeRemaining(null);
      hasLoggedOutRef.current = false;
      return;
    }

    // If date_of_expiration exists, calculate timer
    if (!subscription.date_of_expiration) {
      setTimeRemaining(null);
      hasLoggedOutRef.current = false;
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiration = new Date(subscription.date_of_expiration);
      const diff = expiration - now;

      // Calculate time components (use Math.max to ensure non-negative)
      let days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      let hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      let minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      let seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      // Redistribute time: if hours is 00 and days > 0, borrow 1 day to fill hours
      if (hours === 0 && days > 0) {
        days -= 1;
        hours = 24;
      }
      // If minutes is 00 and hours > 0, borrow 1 hour to fill minutes
      if (minutes === 0 && hours > 0) {
        hours -= 1;
        minutes = 60;
      }
      // If seconds is 00 and minutes > 0, borrow 1 minute to fill seconds
      if (seconds === 0 && minutes > 0) {
        minutes -= 1;
        seconds = 60;
      }

      // Update timer with calculated values (always set, even if zero)
      setTimeRemaining({ days, hours, minutes, seconds });

      // Check if all time components are zero (00:00:00:00) or diff <= 0
      // Only auto-logout for non-developers
      if (!isDeveloper && (diff <= 0 || (days === 0 && hours === 0 && minutes === 0 && seconds === 0))) {
        // If timer reaches 00:00:00:00, delete token and redirect to login
        if (!hasLoggedOutRef.current) {
          hasLoggedOutRef.current = true;
          (async () => {
            try {
              await apiClient.post('/api/auth/logout', {}, {
                validateStatus: (status) => status < 500 // Accept 200-499 as success
              }).catch(() => {
                // Ignore errors - continue with redirect even if logout fails
              });
            } catch (err) {
              // Ignore errors - continue with redirect even if logout fails
              if (err.response?.status !== 400 && err.response?.status !== 401) {
                console.error('Error logging out (continuing anyway):', err);
              }
            }
            router.push('/');
          })();
        }
      }
    };

    // Calculate timer immediately
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
      hasLoggedOutRef.current = false; // Reset logout flag when effect cleans up
    };
  }, [subscription, userData.role, router, isSubscriptionEnabled]);

  useEffect(() => {
    if (!opened) setShowOther(false);
  }, [opened]);

  const isStaff =
    userData.role === 'admin' ||
    userData.role === 'developer' ||
    userData.role === 'assistant';

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/');
    }
  };

  const handleManageAssistants = () => {
    router.push('/manage_assistants');
  };

  const handleEditProfile = () => {
    router.push('/edit_my_profile');
  };

  const handleContactDeveloper = () => {
    router.push('/contact_developer');
  };

  const handleSubscriptionDashboard = () => {
    router.push('/subscription_dashboard');
  };

  const handleChangePassword = () => {
    router.push('/student_dashboard/change_password');
  };

  const handleMyQRCode = () => {
    close(); // Close the menu
    setShowQRModal(true);
  };

  const handleInstallApp = () => {
    close(); // Close the menu
    setShowInstallApp(true);
  };

  return (
    <div className={styles.root}>
      <div className={`${styles.burgerWrap} ${opened ? styles.burgerWrapOpen : ''} ${isMobileMenu ? styles.burgerWrapMobile : ''}`}>
        <Burger
          lineSize={isMobileMenu ? 1.75 : 2}
          size={isMobileMenu ? 'md' : 'lg'}
          opened={opened}
          onClick={toggle}
          aria-label="Toggle navigation"
          aria-expanded={opened}
        />
      </div>
      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="min(400px, 80vw)"
        padding="md"
        zIndex={10000}
        overlayProps={{
          backgroundOpacity: 0.34,
          blur: 4,
          color: '#26b5eb',
        }}
        transitionProps={{
          transition: 'slide-left',
          duration: 280,
          timingFunction: 'cubic-bezier(.22, 1, .36, 1)',
        }}
        title="Menu"
        classNames={{
          content: styles.drawerContent,
          header: styles.drawerHeader,
          body: styles.drawerBody,
          title: styles.drawerTitle,
          close: styles.drawerClose,
        }}
      >
          <div className={styles.profileSection}>
            <div className={styles.avatar}>
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureUrl}
                    alt="Profile"
                    width={58}
                    height={58}
                    className={styles.avatarImage}
                    unoptimized
                  />
                ) : (
                  <span className={styles.avatarLetter}>
                    {String(studentData?.name || userData.name || userData.id || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
            </div>
            <div className={styles.profileInfo}>
                {userData.role === 'student' && studentData ? (
                  <>
                    <p className={styles.profileName}>{studentData.name || 'Student'}</p>
                    <p className={styles.profileMeta}>
                      <Image src="/user-circle3.svg" alt="" width={16} height={16} />
                      ID: {studentData.id}
                    </p>
                    {(studentData.course || studentData.grade) && (
                      <p className={styles.profileMeta}>
                        {courseLabels.course}: {studentData.course || studentData.grade}
                      </p>
                    )}
                    {courseLabels.showCourseType && studentData.courseType && (
                      <p className={styles.profileMeta}>Course Type: {studentData.courseType}</p>
                    )}
                    {studentData.main_center && (
                      <p className={styles.profileMeta}>Main Center: {studentData.main_center}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className={styles.profileName}>{userData.name || userData.id}</p>
                    <p className={styles.profileMeta}>
                      <Image src="/user-circle3.svg" alt="" width={16} height={16} />
                      {userData.id ? `Username: ${userData.id}` : 'No Username'}
                    </p>
                  </>
                )}
            </div>
          </div>
          {isSubscriptionEnabled && subscription && userData.role !== 'student' && (
            <div className={styles.subscriptionStatus}>
              {/* Show "Subscription Expired" only if active = false AND date_of_expiration = null */}
              {subscription.active === false && !subscription.date_of_expiration ? (
                <div className={styles.subscriptionExpired}>
                  <Image src="/alert-triangle2.svg" alt="" width={18} height={18} />
                  Subscription Expired
                </div>
              ) : subscription.date_of_expiration && timeRemaining !== null ? (
                <div>
                  <div className={styles.subscriptionLabel}>
                    <Image src="/clock.svg" alt="" width={16} height={16} />
                    Subscription time remaining:
                  </div>
                  <div className={styles.subscriptionTimer}>
                    <span>{String(timeRemaining.days || 0).padStart(2, '0')}</span>
                    <span className={styles.timerUnit}> days : </span>
                    <span>{String(timeRemaining.hours || 0).padStart(2, '0')}</span>
                    <span className={styles.timerUnit}> hours : </span>
                    <span>{String(timeRemaining.minutes || 0).padStart(2, '0')}</span>
                    <span className={styles.timerUnit}> min : </span>
                    <span>{String(timeRemaining.seconds || 0).padStart(2, '0')}</span>
                    <span className={styles.timerUnit}> sec</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {userData.role === 'student' && (
            <MenuSection title="Account">
              <MenuItem icon="/logout.svg" onClick={handleLogout} danger>
                Logout
              </MenuItem>
              <MenuItem
                icon="/user-circle3.svg"
                onClick={() => {
                  close();
                  router.push('/student_dashboard/my_info');
                }}
              >
                My Information
              </MenuItem>
              <MenuItem
                icon="/link.svg"
                onClick={() => {
                  close();
                  setShowLinksModal(true);
                }}
              >
                Social Media Links
              </MenuItem>
              <MenuItem icon="/key2.svg" onClick={handleChangePassword}>
                Change My Password
              </MenuItem>
              <MenuItem icon="/qrcode3.svg" onClick={handleMyQRCode}>
                My Qr Code
              </MenuItem>
            </MenuSection>
          )}
          {userData.role !== 'student' && (
            <>
              <MenuSection title="Account">
                <MenuItem icon="/logout.svg" onClick={handleLogout} danger>
                  Logout
                </MenuItem>
                <MenuItem icon="/user-edit2.svg" onClick={handleEditProfile}>
                  Edit My Profile
                </MenuItem>
                <MenuItem
                  icon="/link.svg"
                  onClick={() => {
                    close();
                    router.push('/dashboard/public_link_generator');
                  }}
                >
                  Public Link Generator
                </MenuItem>
              </MenuSection>
              {isStaff && (
                <MenuSection title="Management">
                {(userData.role === 'admin' || userData.role === 'developer') && (
                  <MenuItem icon="/settings.svg" onClick={handleManageAssistants}>
                    Manage Assistants
                  </MenuItem>
                )}
                <MenuItem
                  icon="/settings2.svg"
                  onClick={() => {
                    close();
                    router.push('/dashboard/manage_online_system');
                  }}
                >
                  Manage Online System
                </MenuItem>
                {showMarketingPageMenu && (
                  <MenuItem
                    icon="/marketing.svg"
                    onClick={() => {
                      close();
                      router.push('/welcome');
                    }}
                  >
                    Manage Marketing Page
                  </MenuItem>
                )}
                {isMarketingSystemEnabled && (
                  <MenuItem
                    icon="/testimonials2.svg"
                    onClick={() => {
                      close();
                      router.push('/dashboard/students_reviews');
                    }}
                    badge={publicTestimonialsPending > 99 ? '99+' : publicTestimonialsPending || undefined}
                  >
                    Manage Students Reviews
                  </MenuItem>
                )}
                {isScoringEnabled && (
                  <MenuItem
                    icon="/star4.svg"
                    onClick={() => {
                      close();
                      router.push('/dashboard/manage_scoring_system');
                    }}
                  >
                    Manage Scoring System
                  </MenuItem>
                )}
                </MenuSection>
              )}
              {isSubscriptionEnabled && userData.role === 'developer' && (
                <MenuSection title="System">
                  <MenuItem icon="/dollar.svg" onClick={handleSubscriptionDashboard}>
                    Subscription Dashboard
                  </MenuItem>
                </MenuSection>
              )}
            </>
          )}
          <MenuSection title="Support">
            {isStaff ? (
              <>
                <MenuItem
                  icon="/other.svg"
                  onClick={() => setShowOther((value) => !value)}
                  expanded={showOther}
                  controls="user-menu-other-items"
                  end={
                    <span className={styles.accordionIndicator} aria-hidden="true">
                      {showOther ? '⌃' : '⌄'}
                    </span>
                  }
                >
                  Other
                </MenuItem>
                {showOther && (
                  <div
                    id="user-menu-other-items"
                    className={styles.subItems}
                    role="region"
                    aria-label="Other menu items"
                  >
                    <MenuItem
                      icon="/message.svg"
                      onClick={() => {
                        close();
                        router.push('/contact_assistants');
                      }}
                    >
                      Contact Assistants
                    </MenuItem>
                    <MenuItem icon="/message2.svg" onClick={handleContactDeveloper}>
                      Contact Developer
                    </MenuItem>
                    <MenuItem
                      icon="/video.svg"
                      onClick={() => {
                        close();
                        setShowAppVideos(true);
                      }}
                    >
                      App Videos
                    </MenuItem>
                    <MenuItem icon="/download.svg" onClick={handleInstallApp}>
                      Install App
                    </MenuItem>
                  </div>
                )}
              </>
            ) : (
              <>
                <MenuItem
                  icon="/message.svg"
                  onClick={() => {
                    close();
                    router.push('/contact_assistants');
                  }}
                >
                  Contact Assistants
                </MenuItem>
                <MenuItem icon="/message2.svg" onClick={handleContactDeveloper}>
                  Contact Developer
                </MenuItem>
                <MenuItem
                  icon="/video.svg"
                  onClick={() => {
                    close();
                    setShowAppVideos(true);
                  }}
                >
                  App Videos
                </MenuItem>
                <MenuItem icon="/download.svg" onClick={handleInstallApp}>
                  Install App
                </MenuItem>
              </>
            )}
          </MenuSection>
      </Drawer>
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
      <InstallApp isOpen={showInstallApp} onClose={() => setShowInstallApp(false)} />
      <StudentLinksModal isOpen={showLinksModal} onClose={() => setShowLinksModal(false)} />
      <AppVideosModal
        isOpen={showAppVideos}
        onClose={() => setShowAppVideos(false)}
        role={userData.role}
      />
    </div>
  );
}