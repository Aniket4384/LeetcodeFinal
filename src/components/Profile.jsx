import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../config/axios';
import { setProblems } from '../redux/problemSlice';
import { logout } from '../redux/authSlice';
import { Code2, Target, LogOut } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { problems } = useSelector((state) => state.problem);

  const [solvedProblems, setSolvedProblems] = useState([]);

  // Fetch all problems
  useEffect(() => {
    if (!problems || problems.length === 0) {
      const getProblems = async () => {
        try {
          const response = await axiosClient.get("/problem/getAllProblem");
          const problemsData = response.data.problems || [];
          dispatch(setProblems(problemsData));
        } catch (error) {
          console.error("Problem error:", error);
          dispatch(setProblems([]));
        }
      };
      getProblems();
    }
  }, [dispatch, problems]);

  // Fetch solved problems
  useEffect(() => {
    const getSolvedProblems = async () => {
      try {
        if (!user) return;
        const response = await axiosClient.get("/problem/problemSolvedByUser");
        const solved = response.data.problems;
        if (Array.isArray(solved)) {
          setSolvedProblems(solved);
        } else {
          setSolvedProblems([]);
        }
      } catch (error) {
        console.error("Solved problem error:", error);
        setSolvedProblems([]);
      }
    };
    getSolvedProblems();
  }, [user]);

  const totalProblems = problems?.length || 0;
  const solvedCount = solvedProblems?.length || 0;

  const getAvatar = () => {
    if (!user?.firstName) return 'U';
    return user.firstName.charAt(0).toUpperCase();
  };

  const getFullName = () => {
    if (!user?.firstName) return 'User';
    return user.firstName;
  };

  const getUsername = () => {
    if (!user?.emailId) return 'user';
    return user.emailId.split('@')[0];
  };

  const handleLogout = async () => {
    try {
      await axiosClient.post("/user/logout");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Profile Header Card */}
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl overflow-hidden mb-6">

          {/* Cover Banner */}
          <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          {/* Profile Info */}
          <div className="px-6 pt-4 pb-6">

            {/* Avatar Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 -mt-16">

              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl md:text-4xl font-bold border-4 border-slate-800 shadow-2xl">
                  {getAvatar()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-800" />
              </div>

              {/* Logout Button */}
              <div className="flex gap-2 md:mt-16">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            {/* Name & Username */}
            <div className="mt-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {getFullName()}
                </h1>
                {user?.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">@{getUsername()}</p>
            </div>

            {/* Email Display */}
            {user?.emailId && (
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {user.emailId}
              </p>
            )}
          </div>
        </div>

        {/* Stats Cards — Only 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-5 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Code2 className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-500">Solved</span>
            </div>
            <p className="text-3xl font-bold text-white">{solvedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Problems Solved</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-5 hover:border-pink-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-pink-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalProblems}</p>
            <p className="text-xs text-gray-500 mt-1">Total Problems</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;