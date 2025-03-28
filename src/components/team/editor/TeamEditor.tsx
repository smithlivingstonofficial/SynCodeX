import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../shared/Navbar';
import Sidebar from '../../shared/Sidebar';
import Editor from './Editor';

const TeamEditor = () => {
  const { teamId } = useParams();
  const [code, setCode] = useState('');

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="h-[calc(100vh-3.5rem)]">
          <Editor
            initialValue={code}
            onChange={handleCodeChange}
            language="javascript"
          />
        </div>
      </div>
    </div>
  );
};

export default TeamEditor;