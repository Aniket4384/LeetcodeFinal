import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate } from 'react-router';
import axiosClient from "../config/axios";
import ChatAi from "../components/ChatAi";
import Editorial from '../components/Editorials';
import { 
  Play, Send, Code2, FileText, BookOpen, Lightbulb, 
  History, ChevronDown, ChevronUp, CheckCircle, XCircle, 
  Clock, MemoryStick, Terminal, Eye, RotateCcw, AlertTriangle,
  MessageSquare
} from 'lucide-react';

const ProblemPage = () => {
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isTestCasesExpanded, setIsTestCasesExpanded] = useState(true);
  const [codePerLanguage, setCodePerLanguage] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [videoFetched, setVideoFetched] = useState(false);
  const editorRef = useRef(null);
  const { problemId } = useParams();

  const { handleSubmit } = useForm();

  const languages = ['javascript', 'java', 'c++'];

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) {
        setError("Problem ID not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const problemData = response.data.problem || response.data;
        setProblem(problemData);

        const initialCodePerLanguage = {};

        languages.forEach(lang => {
          let template = '';

          if (problemData.startCode && problemData.startCode.length > 0) {
            const matched = problemData.startCode.find(sc => {
              const scLang = sc.language?.toLowerCase();
              if (lang === 'javascript' && (scLang === 'javascript' || scLang === 'js')) return true;
              if (lang === 'java' && scLang === 'java') return true;
              if (lang === 'c++' && (scLang === 'c++' || scLang === 'cpp')) return true;
              return false;
            });

            if (matched && matched.initialCode) {
              template = matched.initialCode;
            }
          }

          if (!template) {
            const fallbackTemplates = {
              javascript: '// Write your solution here\n\nfunction solution() {\n    // Your code here\n    \n}',
              java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
              'c++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}'
            };
            template = fallbackTemplates[lang] || '// Write your code here';
          }

          initialCodePerLanguage[lang] = template;
        });

        setCodePerLanguage(initialCodePerLanguage);
        setCode(initialCodePerLanguage[selectedLanguage] || '');
        setLoading(false);

      } catch (error) {
        if (error.response?.status === 401) {
          setError("Please login to view this problem");
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response?.status === 404) {
          setError("Problem not found");
        } else {
          setError(error.response?.data?.message || "Failed to load problem");
        }
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, navigate]);

  useEffect(() => {
    const fetchVideoMeta = async () => {
      if (activeLeftTab !== 'editorial' || !problemId) return;
      if (videoFetched || loadingVideo) return;

      setLoadingVideo(true);
      setVideoError(null);

      try {
        const response = await axiosClient.get(`/video/meta/${problemId}`);

        if (response.data?.success && response.data?.data) {
          setVideoMeta(response.data.data);
        } else {
          setVideoMeta(null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setVideoMeta(null);
        } else {
          setVideoError('Failed to load video editorial');
        }
      } finally {
        setLoadingVideo(false);
        setVideoFetched(true);
      }
    };

    fetchVideoMeta();
  }, [activeLeftTab, problemId, videoFetched, loadingVideo]);

  useEffect(() => {
    if (problem) {
      const existingCode = codePerLanguage[selectedLanguage];
      if (existingCode) {
        setCode(existingCode);
      } else {
        const fallbackTemplates = {
          javascript: '// Write your solution here\n\nfunction solution() {\n    // Your code here\n    \n}',
          java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
          'c++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}'
        };
        const template = fallbackTemplates[selectedLanguage] || '// Write your code here';
        setCode(template);
        setCodePerLanguage(prev => ({
          ...prev,
          [selectedLanguage]: template
        }));
      }
    }
  }, [selectedLanguage, problem]);

  const handleLanguageChange = (language) => {
    setCodePerLanguage(prev => ({
      ...prev,
      [selectedLanguage]: code
    }));
    setSelectedLanguage(language);
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
    setCodePerLanguage(prev => ({
      ...prev,
      [selectedLanguage]: value || ''
    }));
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleResetCode = () => {
    const templates = codePerLanguage;
    const template = templates[selectedLanguage] || '';
    setCode(template);
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);

      let submissionsData = [];
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.submissions)) {
          submissionsData = response.data.submissions;
        }
      } else if (Array.isArray(response.data)) {
        submissionsData = response.data;
      }

      submissionsData.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      setSubmissions(submissionsData);
    } catch (error) {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setActiveRightTab('testcase');
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setRunResult({
        success: false,
        status: 'Error',
        errorMessage: error.response?.data?.message || 'Internal server error',
        results: []
      });
      setActiveRightTab('testcase');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });

      if (response.data.success) {
        setSubmitResult(response.data.submission);
        fetchSubmissions();
        setActiveRightTab('result');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setSubmitResult({
        status: 'Error',
        errorMessage: error.response?.data?.message || 'Submission failed',
        testCasesPassed: 0,
        testCasesTotal: 0
      });
      setActiveRightTab('result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'c++': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500/20 text-gray-300';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('accepted')) return 'bg-emerald-500/20 text-emerald-400';
    if (statusLower.includes('wrong')) return 'bg-red-500/20 text-red-400';
    if (statusLower.includes('time')) return 'bg-yellow-500/20 text-yellow-400';
    if (statusLower.includes('error')) return 'bg-red-500/20 text-red-400';
    return 'bg-gray-500/20 text-gray-300';
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower.includes('accepted')) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (statusLower.includes('wrong')) return <XCircle className="w-4 h-4 text-red-400" />;
    if (statusLower.includes('time')) return <Clock className="w-4 h-4 text-yellow-400" />;
    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Recent';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md p-6 bg-slate-800/50 rounded-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Problem</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Problem Not Found</h2>
          <p className="text-gray-400">The problem you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100">
      <div className="w-1/2 flex flex-col border-r border-slate-700 bg-slate-900/50">
        <div className="flex items-center border-b border-slate-700 bg-slate-800/50 overflow-x-auto">
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeLeftTab === 'description' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveLeftTab('description')}
          >
            <FileText className="w-4 h-4" />
            Description
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeLeftTab === 'editorial' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveLeftTab('editorial')}
          >
            <BookOpen className="w-4 h-4" />
            Editorial
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeLeftTab === 'solutions' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveLeftTab('solutions')}
          >
            <Lightbulb className="w-4 h-4" />
            Solutions
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeLeftTab === 'chatai' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveLeftTab('chatai')}
          >
            <MessageSquare className="w-4 h-4" />
            Chat AI
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeLeftTab === 'submissions' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => {
              setActiveLeftTab('submissions');
              fetchSubmissions();
            }}
          >
            <History className="w-4 h-4" />
            Submissions
            {submissions.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-slate-700 rounded-full">{submissions.length}</span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeLeftTab === 'description' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <h1 className="text-2xl font-bold">{problem.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                </span>
                {problem.tags && (
                  <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                    {problem.tags}
                  </span>
                )}
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                  {problem.description}
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setIsTestCasesExpanded(!isTestCasesExpanded)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                  <span className="font-medium">Test Cases</span>
                  {isTestCasesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isTestCasesExpanded && (
                  <div className="space-y-4">
                    {problem.visibleTestCases?.map((example, index) => (
                      <div key={index} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                        <h4 className="font-semibold mb-2 text-sm text-gray-300">Example {index + 1}:</h4>
                        <div className="space-y-2 text-sm font-mono">
                          <div><span className="text-gray-400">Input:</span> <code className="bg-slate-700/50 px-2 py-0.5 rounded">{example.input}</code></div>
                          <div><span className="text-gray-400">Output:</span> <code className="bg-slate-700/50 px-2 py-0.5 rounded">{example.output}</code></div>
                          {example.explanation && (
                            <div className="text-gray-400 text-sm font-sans">{example.explanation}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLeftTab === 'editorial' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Editorial</h2>

              {loadingVideo ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 text-sm">Loading editorial...</p>
                </div>
              ) : videoError ? (
                <div className="flex flex-col items-center justify-center py-16 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-red-400 text-sm mb-3">{videoError}</p>
                  <button
                    onClick={() => {
                      setVideoMeta(null);
                      setVideoError(null);
                      setVideoFetched(false);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : videoMeta?.secureUrl ? (
                <Editorial
                  secureUrl={videoMeta.secureUrl}
                  thumbnailUrl={videoMeta.thumbnailUrl}
                  duration={videoMeta.duration}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-800/30 border border-slate-700 rounded-xl">
                  <BookOpen className="w-16 h-16 text-gray-500 mb-4 opacity-50" />
                  <p className="text-gray-400 text-sm">Video editorial coming soon...</p>
                </div>
              )}
            </div>
          )}

          {activeLeftTab === 'solutions' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Solutions</h2>
              <div className="space-y-6">
                {problem.referenceSolution?.map((solution, index) => (
                  <div key={index} className="border border-slate-700 rounded-lg">
                    <div className="bg-slate-800/50 px-4 py-2 rounded-t-lg flex items-center justify-between">
                      <h3 className="font-semibold">{solution.language.toUpperCase()} Solution</h3>
                      <button 
                        onClick={() => {
                          setSelectedLanguage(solution.language);
                          setCode(solution.completeCode);
                          setActiveRightTab('code');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Use this code
                      </button>
                    </div>
                    <div className="p-4">
                      <pre className="bg-slate-800/50 p-4 rounded text-sm overflow-x-auto">
                        <code>{solution.completeCode}</code>
                      </pre>
                    </div>
                  </div>
                )) || <p className="text-gray-500">Solutions will be available after you solve the problem.</p>}
              </div>
            </div>
          )}

          {activeLeftTab === 'chatai' && (
            <ChatAi problem={problem} />
          )}

          {activeLeftTab === 'submissions' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">My Submissions</h2>
              {loadingSubmissions ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No submissions yet</p>
                  <p className="text-sm">Submit your solution to see results here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(sub.status)}
                          <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(sub.status)}`}>
                            {sub.status || 'Pending'}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(sub.createdAt || sub.submittedAt)}</span>
                          <span className="text-xs text-gray-500 bg-slate-700/50 px-2 py-0.5 rounded">
                            {sub.language || 'N/A'}
                          </span>
                        </div>
                        {sub.code && (
                          <button 
                            onClick={() => {
                              if (sub.language) {
                                setSelectedLanguage(sub.language);
                              }
                              setTimeout(() => {
                                setCode(sub.code);
                                setActiveRightTab('code');
                              }, 50);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View Code
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sub.runtime ? `${(sub.runtime / 1000).toFixed(2)}s` : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MemoryStick className="w-3 h-3" /> {sub.memory ? `${sub.memory}KB` : 'N/A'}
                        </span>
                        <span>Passed: {sub.testCasesPassed || 0}/{sub.testCasesTotal || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 flex flex-col bg-slate-900">
        <div className="flex items-center border-b border-slate-700 bg-slate-800/50">
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeRightTab === 'code' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveRightTab('code')}
          >
            <Code2 className="w-4 h-4" />
            Code
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeRightTab === 'testcase' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveRightTab('testcase')}
          >
            <Terminal className="w-4 h-4" />
            Testcase
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
              activeRightTab === 'result' 
                ? 'border-blue-500 text-blue-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveRightTab('result')}
          >
            <CheckCircle className="w-4 h-4" />
            Result
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-2 bg-slate-800/50 border-b border-slate-700">
                <div className="flex gap-1">
                  {['javascript', 'java', 'c++'].map((lang) => (
                    <button
                      key={lang}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        selectedLanguage === lang 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {lang === 'c++' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleResetCode}
                  className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-slate-700 transition-colors"
                  title="Reset Code"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-3 border-t border-slate-700 bg-slate-800/50">
                <div className="text-xs text-gray-500">
                  {code.split('\n').length} lines
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                      isRunning 
                        ? 'bg-slate-600 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    onClick={handleRun}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Run
                      </>
                    )}
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                      isSubmitting 
                        ? 'bg-slate-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleSubmitCode}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Test Results</h3>
              {runResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    runResult.status === 'Accepted' 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {runResult.status === 'Accepted' ? 
                        <CheckCircle className="w-5 h-5 text-emerald-400" /> : 
                        <XCircle className="w-5 h-5 text-red-400" />
                      }
                      <span className={`font-medium ${runResult.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {runResult.status || 'Completed'}
                      </span>
                      <span className="text-sm text-gray-400 ml-4">
                        {runResult.testCasesPassed || 0}/{runResult.testCasesTotal || 0} passed
                      </span>
                    </div>
                    {runResult.errorMessage && (
                      <p className="mt-2 text-sm text-red-400">{runResult.errorMessage}</p>
                    )}
                    {runResult.runtime && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>Runtime: {runResult.runtime ? `${(runResult.runtime / 1000).toFixed(2)}s` : 'N/A'}</span>
                        <span>Memory: {runResult.memory ? `${runResult.memory}KB` : 'N/A'}</span>
                      </div>
                    )}
                  </div>
                  
                  {runResult.results && runResult.results.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-400">Details:</h4>
                      {runResult.results.map((result, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Test #{idx + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              result.status === 'Accepted' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {result.status || 'Running'}
                            </span>
                          </div>
                          {result.stdout && (
                            <div className="mt-1 text-xs text-gray-400">
                              <span className="text-gray-500">Output:</span> {result.stdout}
                            </div>
                          )}
                          {result.stderr && (
                            <div className="mt-1 text-xs text-red-400">
                              <span className="text-gray-500">Error:</span> {result.stderr}
                            </div>
                          )}
                          {result.compile_output && (
                            <div className="mt-1 text-xs text-yellow-400">
                              <span className="text-gray-500">Compile:</span> {result.compile_output}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Terminal className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Click "Run" to test your code with the example test cases</p>
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Submission Result</h3>
              {submitResult ? (
                <div className={`p-4 rounded-lg ${
                  submitResult.status === 'Accepted' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {submitResult.status === 'Accepted' ? 
                      <CheckCircle className="w-6 h-6 text-emerald-400" /> : 
                      <XCircle className="w-6 h-6 text-red-400" />
                    }
                    <div>
                      <h4 className={`font-bold text-lg ${submitResult.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {submitResult.status === 'Accepted' ? '🎉 Accepted' : submitResult.status || 'Error'}
                      </h4>
                      {submitResult.errorMessage && (
                        <p className="mt-1 text-sm text-red-400">{submitResult.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-800/50 p-3 rounded">
                      <p className="text-xs text-gray-500">Test Cases</p>
                      <p className="text-lg font-semibold">
                        {submitResult.testCasesPassed || 0}/{submitResult.testCasesTotal || 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded">
                      <p className="text-xs text-gray-500">Runtime</p>
                      <p className="text-lg font-semibold">
                        {submitResult.runtime ? `${(submitResult.runtime / 1000).toFixed(2)}s` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded">
                      <p className="text-xs text-gray-500">Memory</p>
                      <p className="text-lg font-semibold">
                        {submitResult.memory ? `${submitResult.memory}KB` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Send className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Click "Submit" to submit your solution for evaluation</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;