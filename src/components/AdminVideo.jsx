import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../config/axios';
import { setProblems } from '../redux/problemSlice';
import { 
  Video, Upload, Trash2, ArrowLeft, 
  AlertCircle, CheckCircle, Loader2, X, Tag
} from 'lucide-react';

const AdminVideo = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { problems } = useSelector((state) => state.problem);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => {
    if (!problems || problems.length === 0) {
      fetchProblems();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      const problemsData = data.problems || data || [];
      dispatch(setProblems(problemsData));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch problems. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (problem) => {
    setSelectedProblem(problem);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProblem) return;

    const problemId = selectedProblem._id;
    setDeletingId(problemId);
    setShowDeleteModal(false);

    try {
      const response = await axiosClient.delete(`/video/delete/${problemId}`);
      setSuccess(response.data.message || `Video for "${selectedProblem.title}" deleted successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to delete video';
      setError(errorMessage);
      setTimeout(() => setError(null), 4000);
    } finally {
      setDeletingId(null);
      setSelectedProblem(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Admin
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Video Management</h1>
            <p className="text-gray-400 text-sm">Upload and manage video solutions for problems</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading problems...</p>
            </div>
          </div>
        )}

        {!loading && problems.length === 0 && (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No problems found</h3>
            <p className="text-gray-400 text-sm mb-6">Create a problem first to upload video solutions</p>
            <NavLink
              to="/admin/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <Upload className="w-4 h-4" />
              Create Problem
            </NavLink>
          </div>
        )}

        {!loading && problems.length > 0 && (
          <div className="block lg:hidden space-y-4">
            {problems.map((problem) => (
              <div key={problem._id} className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-4 hover:border-purple-500/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg truncate">{problem.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {problem.tags ? (
                    <span className="inline-flex items-center gap-1 bg-slate-700/50 text-gray-300 px-2.5 py-1 rounded-full text-xs">
                      <Tag className="w-3 h-3" />
                      {problem.tags}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 italic">No tag</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <NavLink
                    to={`/admin/upload/${problem._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </NavLink>
                  <button
                    onClick={() => handleDeleteClick(problem)}
                    disabled={deletingId === problem._id}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {deletingId === problem._id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && problems.length > 0 && (
          <div className="hidden lg:block bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Problem</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {problems.map((problem, index) => (
                    <tr key={problem._id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                          {problem.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {problem.tags ? (
                          <span className="inline-flex items-center gap-1 bg-slate-700/50 text-gray-300 px-2.5 py-1 rounded-full text-xs">
                            <Tag className="w-3 h-3" />
                            {problem.tags}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <NavLink
                            to={`/admin/upload/${problem._id}`}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                          </NavLink>
                          <button
                            onClick={() => handleDeleteClick(problem)}
                            disabled={deletingId === problem._id}
                            className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {deletingId === problem._id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showDeleteModal && selectedProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Video?</h3>
                <p className="text-gray-400 text-sm mb-1">
                  Are you sure you want to delete the video for:
                </p>
                <p className="text-white font-medium bg-slate-700/50 rounded-lg p-3 mb-4 truncate">
                  "{selectedProblem.title}"
                </p>
                <p className="text-red-400 text-xs mb-6 flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  This will delete the video from Cloudinary permanently
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProblem(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideo;