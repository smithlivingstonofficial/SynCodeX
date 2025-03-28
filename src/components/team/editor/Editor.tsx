import { useEffect, useCallback, useRef } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '../../../hooks/useTheme';
import debounce from 'lodash/debounce';
import * as monaco from 'monaco-editor';

interface CursorPosition {
  userId: string;
  line: number;
  column: number;
  userName: string;
}

interface EditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (value: string) => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
  cursors?: CursorPosition[];
  readOnly?: boolean;
}

const Editor = ({
  initialValue = '',
  language = 'javascript',
  onChange,
  onCursorChange,
  cursors = [],
  readOnly = false
}: EditorProps) => {
  const { isDarkMode } = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const debouncedOnChange = useCallback(
    debounce((value: string) => {
      onChange?.(value);
    }, 200),
    [onChange]
  );

  const debouncedCursorChange = useCallback(
    debounce((position: { line: number; column: number }) => {
      onCursorChange?.(position);
    }, 50),
    [onCursorChange]
  );

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      debouncedCursorChange({
        line: position.lineNumber,
        column: position.column
      });
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const newDecorations = cursors.map((cursor) => ({
      range: new monaco.Range(
        cursor.line,
        cursor.column,
        cursor.line,
        cursor.column + 1
      ),
      options: {
        className: 'cursor-decoration',
        hoverMessage: { value: `${cursor.userName}'s cursor` },
        beforeContentClassName: `cursor-${cursor.userId}`,
        marginClassName: `cursor-margin-${cursor.userId}`,
        after: {
          content: `  ${cursor.userName}`,
          inlineClassName: 'cursor-label'
        }
      }
    }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [cursors]);

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
      debouncedCursorChange.cancel();
    };
  }, [debouncedOnChange, debouncedCursorChange]);

  return (
    <div className="w-full h-full">
      <style>
        {`
          .cursor-decoration {
            background-color: #007acc;
            width: 2px !important;
          }
          .cursor-label {
            font-size: 12px;
            color: #007acc;
            margin-left: 4px;
            opacity: 0.8;
          }
        `}
      </style>
      <MonacoEditor
        height="100%"
        width="100%"
        value={initialValue}
        language={language}
        theme={isDarkMode ? 'vs-dark' : 'vs-light'}
        onChange={(value) => debouncedOnChange(value || '')}
        onMount={handleEditorDidMount}
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