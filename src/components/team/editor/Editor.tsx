import { useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '../../../hooks/useTheme';

interface EditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}   

const Editor = ({ initialValue = '', language = 'javascript', onChange, readOnly = false }: EditorProps) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        width="100%"
        value={initialValue}
        language={language}
        theme={isDarkMode ? 'vs-dark' : 'vs-light'}
        onChange={(value) => onChange?.(value || '')}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          readOnly,
          automaticLayout: true,
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
      />
    </div>
  );
};

export default Editor;