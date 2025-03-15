import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useSidebar } from '../contexts/SidebarContext';
import { BsTerminal, BsFolder, BsSearch, BsGear, BsCode, BsChevronRight, BsChevronDown, BsFileEarmark } from 'react-icons/bs';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import JSZip from 'jszip';
import { jellyTriangle } from 'ldrs';

jellyTriangle.register();

export default function CodeEditor() {
  const { isCollapsed } = useSidebar();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [theme, setTheme] = useState('vs-dark');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Loading project...');
  const [activePanel, setActivePanel] = useState('files');
  const [showTerminal, setShowTerminal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadProjectFiles(projectId);
    }
  }, [projectId]);

  const loadProjectFiles = async (projectId) => {
    try {
      const db = getFirestore();
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        if (projectData.sourceCodeUrl) {
          const response = await fetch(projectData.sourceCodeUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch source code');
          }
          
          const zipBlob = await response.blob();
          const zip = new JSZip();
          const contents = await zip.loadAsync(zipBlob);
          
          const files = [];
          for (const [path, file] of Object.entries(contents.files)) {
            if (!file.dir) {
              try {
                const content = await file.async('text');
                const pathParts = path.split('/');
                const fileName = pathParts.pop();
                const extension = fileName.split('.').pop()?.toLowerCase();
                
                files.push({
                  path,
                  name: fileName,
                  content,
                  extension,
                  folder: pathParts.join('/'),
                  language: getLanguageFromExtension(extension)
                });
              } catch (error) {
                console.error(`Error loading file ${path}:`, error);
              }
            }
          }
          
          setProjectFiles(files);
          if (files.length > 0) {
            const mainFile = files.find(f => 
              ['index.js', 'index.jsx', 'index.ts', 'index.tsx', 'main.js', 'main.jsx', 'app.js', 'app.jsx']
              .includes(f.name.toLowerCase())
            ) || files[0];
            
            setSelectedFile(mainFile);
            setCode(mainFile.content);
            setLanguage(mainFile.language);
          }
          setIsReadOnly(true);
        } else {
          setError('No source code available for this project');
        }
      } else {
        setError('Project not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Error loading project files');
      setCode('// Error loading project files');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFromExtension = (ext) => {
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      php: 'php',
      rb: 'ruby',
      rs: 'rust',
      go: 'go',
      sql: 'sql',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml'
    };
    return languageMap[ext] || 'plaintext';
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      lineNumbers: 'on',
      folding: true,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      quickSuggestions: true,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      readOnly: isReadOnly
    });
  };

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const getFolderStructure = () => {
    const structure = {};
    projectFiles.forEach(file => {
      const parts = file.path.split('/');
      let current = structure;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      const fileName = parts[parts.length - 1];
      current[fileName] = file;
    });
    return structure;
  };

  const renderFileTree = (structure, path = '') => {
    return Object.entries(structure).map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFile = 'content' in value;
      
      if (isFile) {
        return (
          <div
            key={fullPath}
            className={`ml-4 py-1 px-2 cursor-pointer hover:bg-gray-800 rounded flex items-center gap-1 ${selectedFile?.path === fullPath ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            onClick={() => {
              setSelectedFile(value);
              setCode(value.content);
              setLanguage(value.language);
            }}
          >
            <BsFileEarmark size={12} />
            <span className="text-sm">{name}</span>
          </div>
        );
      }
      
      const isExpanded = expandedFolders.has(fullPath);
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer p-1 rounded hover:bg-gray-800"
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? <BsChevronDown size={12} /> : <BsChevronRight size={12} />}
            <BsFolder className="text-yellow-500" />
            <span className="text-sm">{name}</span>
          </div>
          {isExpanded && (
            <div className="ml-2">
              {renderFileTree(value, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const SidePanel = () => (
    <div className="w-64 bg-gray-900 border-r border-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-white font-medium">
          {activePanel === 'files' ? 'Explorer' :
           activePanel === 'search' ? 'Search' : 'Settings'}
        </h2>
        {isReadOnly && (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            Read Only
          </span>
        )}
      </div>
      <div className="p-4">
        {activePanel === 'files' && (
          <div className="text-gray-400">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <span className="text-sm">Loading files...</span>
              </div>
            ) : (
              renderFileTree(getFolderStructure())
            )}
          </div>
        )}
      </div>
    </div>
  );

  const ActivityBar = () => (
    <div className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
      <button
        onClick={() => setActivePanel('files')}
        className={`p-2 rounded ${activePanel === 'files' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
      >
        <BsFolder size={20} />
      </button>
      <button
        onClick={() => setActivePanel('search')}
        className={`p-2 rounded ${activePanel === 'search' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
      >
        <BsSearch size={20} />
      </button>
      <button
        onClick={() => setActivePanel('settings')}
        className={`p-2 rounded ${activePanel === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
      >
        <BsGear size={20} />
      </button>
    </div>
  );

  const Terminal = () => (
    <div className="h-64 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-400">
          <BsTerminal />
          <span>Terminal</span>
        </div>
        <button
          onClick={() => setShowTerminal(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="p-4 text-gray-400 font-mono">
        <span className="text-green-500">$</span> _
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'md:pl-20' : 'md:pl-80'} flex items-center justify-center transition-all duration-300`}>
        <l-jelly-triangle
          size="40"
          speed="1.75"
          color="white"
        ></l-jelly-triangle>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-80'} transition-all duration-300`}>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* File Explorer */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Files</h2>
            </div>
            {error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : projectFiles.length === 0 ? (
              <div className="text-gray-400 text-sm">No files available</div>
            ) : (
              <div className="space-y-1">
                {renderFileTree(getFolderStructure())}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            theme={theme}
            language={language}
            value={code}
            options={{
              readOnly: isReadOnly,
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on'
            }}
            onMount={handleEditorDidMount}
          />
        </div>
      </div>
    </div>
  );
}