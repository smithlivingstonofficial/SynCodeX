import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from '../../firebase';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const Meet = () => {
  const { teamId } = useParams();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !teamId) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: `syncodex-team-${teamId}`,
      width: '100%',
      height: '100%',
      parentNode: document.querySelector('#meet'),
      userInfo: {
        displayName: user.displayName || 'Team Member',
        email: user.email || '',
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'select-background', 'download', 'help', 'mute-everyone',
          'security'
        ],
      },
    };

    const loadJitsiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsiMeet();
      document.body.appendChild(script);
    };

    const initJitsiMeet = () => {
      new window.JitsiMeetExternalAPI(domain, options);
    };

    if (typeof window.JitsiMeetExternalAPI === 'undefined') {
      loadJitsiScript();
    } else {
      initJitsiMeet();
    }

    return () => {
      const jitsiScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
      if (jitsiScript) {
        document.body.removeChild(jitsiScript);
      }
    };
  }, [teamId, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-red-500 dark:text-red-400">Please sign in to join the meeting</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div id="meet" className="w-full h-[calc(100vh-3.5rem)]"></div>
      </div>
    </div>
  );
};

export default Meet;