// import { useEffect, useRef, useState } from 'react';
// import Editor from '@monaco-editor/react';
// import { useSidebar } from '../contexts/SidebarContext';
// import { BsTerminal, BsFolder, BsSearch, BsGear, BsCode, BsChevronRight, BsChevronDown, BsFileEarmark, BsPlus, BsFolderPlus, BsArrowClockwise, BsArrowsExpand, BsArrowsCollapse, BsSave } from 'react-icons/bs';
// import { useNavigate } from 'react-router-dom';
// import { getFirestore, collection, addDoc } from 'firebase/firestore';
// import { auth } from '../firebase';
// import { jellyTriangle } from 'ldrs';

// jellyTriangle.register();

// export default function Editor() {
// const { isCollapsed } = useSidebar();
// const navigate = useNavigate();
// const editorRef = useRef(null);
// const [theme, setTheme] = useState('vs-dark');
// const [language, setLanguage] = useState('javascript');
// const [code, setCode] = useState('');
// const [activePanel, setActivePanel] = useState('files');
// const [showTerminal, setShowTerminal] = useState(false);
// const [projectFiles, setProjectFiles] = useState([]);
// const [selectedFile, setSelectedFile] = useState(null);
// const [expandedFolders, setExpandedFolders] = useState(new Set());
// const [showNewFileModal, setShowNewFileModal] = useState(false);
// const [showNewFolderModal, setShowNewFolderModal] = useState(false);
// const [newFileName, setNewFileName] = useState('');
// const [newFolderName, setNewFolderName] = useState('');
// const [currentPath, setCurrentPath] = useState('');
// const [projectTitle, setProjectTitle] = useState('');
// const [projectDescription, setProjectDescription] = useState('');
// const [projectVisibility, setProjectVisibility] = useState('public');
// const [saving, setSaving] = useState(false);
// const [error, setError] = useState(null);

// useEffect(() => {
// if (!auth.currentUser) {
// navigate('/');
// }
// }, [navigate]);

// const handleEditorDidMount = (editor, monaco) => {
// editorRef.current = editor;
    
// editor.updateOptions({
// fontSize: 14,
// fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
// minimap: { enabled: true },
// scrollBeyondLastLine: false,
// renderLineHighlight: 'all',
// lineNumbers: 'on',
// folding: true,
// automaticLayout: true,
// tabSize: 2,
// wordWrap: 'on',
// suggestOnTriggerCharacters: true,
// acceptSuggestionOnCommitCharacter: true,
// quickSuggestions: true,
// renderWhitespace: 'selection',
// bracketPairColorization: { enabled: true },
// guides: {
// bracketPairs: true,
// indentation: true
// }
// });
// };

// const toggleFolder = (folder) => {
// setExpandedFolders(prev => {
// const next = new Set(prev);
// if (next.has(folder)) {
// next.delete(folder);
// } else {
// next.add(folder);
// }
// return next;
// });
// };

// const getFolderStructure = () => {
// const structure = {};
// projectFiles.forEach(file => {
// const parts = file.path.split('/');
// let current = structure;
      
// for (let i = 0; i < parts.length - 1; i++) {
// const part = parts[i];
// if (!current[part]) {
// current[part] = {};
// }
// current = current[part];
// }
      
// const fileName = parts[parts.length - 1];
// current[fileName] = file;
// });
// return structure;
// };

// const renderFileTree = (structure, path = '') => {
// return Object.entries(structure).map(([name, value]) => {
// const fullPath = path ? `${path}/${name}` : name;
// const isFile = 'content' in value;
      
// if (isFile) {
// return (
// <div
// key={fullPath}
// className={`ml-4 py-1 px-2 cursor-pointer hover:bg-gray-800 rounded flex items-center gap-1 ${selectedFile?.path === fullPath ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
// onClick={() => {
// setSelectedFile(value);
// setCode(value.content);
// setLanguage(value.language);
// }}
// >
// <BsFileEarmark size={12} />
// <span className="text-sm">{name}</span>
// </div>
// );
// }
      
// const isExpanded = expandedFolders.has(fullPath);
// return (
// <div key={fullPath}>
// <div
// className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer p-1 rounded hover:bg-gray-800"
// onClick={() => toggleFolder(fullPath)}
// >
// {isExpanded ? <BsChevronDown size={12} /> : <BsChevronRight size={12} />}
// <BsFolder className="text-yellow-500" />
// <span className="text-sm">{name}</span>
// </div>
// {isExpanded && (
// <div className="ml-2">
// {renderFileTree(value, fullPath)}
// </div>
// )}
// </div>
// );
// });
// };

// const handleCreateFile = () => {
// if (!newFileName.trim()) return;
// const newPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;
// const extension = newFileName.split('.').pop()?.toLowerCase() || '';
// const newFile = {
// path: newPath,
// name: newFileName,
// content: '',
// extension,
// folder: currentPath,
// language: getLanguageFromExtension(extension)
// };
// setProjectFiles([...projectFiles, newFile]);
// setSelectedFile(newFile);
// setCode('');
// setLanguage(newFile.language);
// setNewFileName('');
// setShowNewFileModal(false);
// };

// const handleCreateFolder = () => {
// if (!newFolderName.trim()) return;
// const newPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
// setExpandedFolders(new Set([...expandedFolders, newPath]));
// setNewFolderName('');
// setShowNewFolderModal(false);
// };

// const handleSaveProject = async () => {
// if (!auth.currentUser) {
// navigate('/');
// return;
// }

// if (!projectTitle.trim()) {
// setError('Please enter a project title');
// return;
// }

// if (projectFiles.length === 0) {
// setError('Please create at least one file');
// return;
// }

// try {
// setSaving(true);
// setError(null);

// // Create project data structure
// const projectData = {
// title: projectTitle,
// description: projectDescription,
// visibility: projectVisibility,
// userId: auth.currentUser.uid,
// createdAt: new Date().toISOString(),
// updatedAt: new Date().toISOString(),
// files: projectFiles.map(file => ({
// path: file.path,
// content: file.content,
// language: file.language
// })),
// programmingLanguages: [...new Set(projectFiles.map(file => file.language))]
// };

// // Save to Firestore
// const db = getFirestore();
// const projectRef = await addDoc(collection(db, 'projects'), projectData);

// // Navigate to the project view
// navigate(`/project/${projectRef.id}`);
// } catch (error) {
// console.error('Error saving project:', error);
// setError('Failed to save project. Please try again.');
// } finally {
// setSaving(false);
// }
// };

// const getLanguageFromExtension = (ext) => {
// const languageMap = {
// js: 'javascript',
// jsx: 'javascript',
// ts: 'typescript',
// tsx: 'typescript',
// py: 'python',
// java: 'java',
// cpp: 'cpp',
// c: 'c',
// cs: 'csharp',
// html: 'html',
// css: 'css',
// json: 'json',
// md: 'markdown',
// php: 'php',
// rb: 'ruby',
// rs: 'rust',
// go: 'go',
// sql: 'sql',
// xml: 'xml',
// yaml: 'yaml',
// yml: 'yaml'
// };
// return languageMap[ext] || 'plaintext';
// };

// const handleExpandAll = () => {
// const allFolders = new Set();
// projectFiles.forEach(file => {
// const parts = file.path.split('/');
// let currentPath = '';
// for (let i = 0; i < parts.length - 1; i++) {
// currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
// allFolders.add(currentPath);
// }
// });
// setExpandedFolders(allFolders);
// };

// const handleCollapseAll = () => {
// setExpandedFolders(new Set());
// };

// return (
// <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-80'} transition-all duration-300`}>
// {showNewFileModal && (
// <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// <div className="bg-gray-800 p-6 rounded-lg w-96">
// <h3 className="text-white text-lg font-medium mb-4">Create New File</h3>
// <input
// type="text"
// value={newFileName}
// onChange={(e) => setNewFileName(e.target.value)}
// placeholder="Enter file name"
// className="w-full p-2 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
// />
// <div className="flex justify-end gap-2">
// <button
// onClick={() => setShowNewFileModal(false)}
// className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
// >
// Cancel
// </button>
// <button
// onClick={handleCreateFile}
// className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
// >
// Create
// </button>
// </div>
// </div>
//       )}
      
//       {showNewFolderModal && (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//         <div className="bg-gray-800 p-6 rounded-lg w-96">
//           <h3 className="text-white text-lg font-medium mb-4">Create New Folder</h3>
//           <input
//             type="text"
//             value={newFolderName}
//             onChange={(e) => setNewFolderName(e.target.value)}
//             placeholder="Enter folder name"
//             className="w-full p-2 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
//           />
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => setShowNewFolderModal(false)}
//               className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleCreateFolder}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//             >
//               Create
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// {showNewFolderModal && (
// <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// <div className="bg-gray-800 p-6 rounded-lg w-96">
// <h3 className="text-white text-lg font-medium mb-4">Create New Folder</h3>
// <input
// type="text"
// value={newFolderName}
// onChange={(e) => setNewFolderName(e.target.value)}
// placeholder="Enter folder name"
// className="w-full p-2 mb-4 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
// />
// <div className="flex justify-end gap-2">
// <button
// onClick={() => setShowNewFolderModal(false)}
// className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
// >
// Cancel
// </button>
// <button
// onClick={handleCreateFolder}
// className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
// >
// Create
// </button>
// </div>
// </div>
// </div>
// )}

// <div className="flex h-[calc(100vh-4rem)]">
// {/* File Explorer */}
// <div className="w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
// <div className="p-4">
// <div className="flex items-center justify-between mb-4">
// <h2 className="text-white font-semibold">Files</h2>
// <div className="flex items-center gap-2">
// <button
// onClick={() => setShowNewFileModal(true)}
// className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
// title="New File"
// >
// <BsPlus size={18} />
// </button>
// <button
// onClick={() => setShowNewFolderModal(true)}
// className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
// title="New Folder"
// >
// <BsFolderPlus size={18} />
// </button>
// <button
// onClick={handleExpandAll}
// className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
// title="Expand All"
// >
// <BsArrowsExpand size={18} />
// </button>
// <button
// onClick={handleCollapseAll}
// className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
// title="Collapse All"
// >
// <BsArrowsCollapse size={18} />