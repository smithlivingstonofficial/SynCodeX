import { useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiMeetProps {
  teamName: string;
  teamId: string;
  userName: string;
  onClose: () => void;
}

const JitsiMeet: React.FC<JitsiMeetProps> = ({ teamName, teamId, userName, onClose }) => {
  const roomName = `${teamName.toLowerCase().replace(/\s+/g, '-')}-${teamId}`;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          prejoinPageEnabled: false,
          startWithVideoMuted: false
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'etherpad',
            'sharedvideo',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'select-background',
            'download',
            'help',
            'mute-everyone',
            'security'
          ]
        }}
        userInfo={{
          displayName: userName
        }}
        onApiReady={(externalApi) => {
          externalApi.addEventListeners({
            readyToClose: onClose,
            participantLeft: () => console.log('Participant left'),
            videoConferenceJoined: () => console.log('Local user joined'),
            videoConferenceLeft: () => {
              console.log('Local user left');
              onClose();
            }
          });
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
      />
    </div>
  );
};

export default JitsiMeet;