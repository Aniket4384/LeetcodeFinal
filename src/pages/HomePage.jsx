import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../config/axios";
import { setProblems } from "../redux/problemSlice";
import { logout } from "../redux/authSlice";

function HomePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { problems } = useSelector((state) => state.problem);

  const [solvedProblems, setSolvedProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [tag, setTag] = useState("All");
  const [status, setStatus] = useState("All");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const allTags = [
    "array",
    "linkedList",
    "graph",
    "dp",
    "string",
    "tree",
    "hash-table",
    "binary-search",
    "stack",
    "queue",
    "heap",
  ];

  // ✅ Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosClient.get("/user/check");
        if (response.data && response.data.user) {
          const userData = response.data.user;
          setIsAdmin(userData.role === "admin");
        }
        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // ✅ Update admin status when user changes
  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === "admin");
    }
  }, [user]);

  useEffect(() => {
    if (!problems || problems.length === 0) {
      const getProblems = async () => {
        try {
          const response = await axiosClient.get("/problem/getAllProblem");
          const problemsData = response.data.problems || [];
          const allProblem = response.data
          dispatch(setProblems(problemsData));
        } catch (error) {
          console.error("Problem error:", error);
          dispatch(setProblems([]));
        }
      };
      getProblems();
    }
  }, [dispatch, problems]);

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

  const isSolved = (problemId) => {
    return solvedProblems.some((id) => {
      if (typeof id === "string") {
        return id === problemId;
      }
      return id._id === problemId;
    });
  };

  const filteredProblems = (problems || []).filter((problem) => {
    const searchMatch = problem.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const difficultyMatch =
      difficulty === "All" ||
      problem.difficulty?.toLowerCase() === difficulty.toLowerCase();

    const tagMatch =
      tag === "All" ||
      (problem.tags && problem.tags.toLowerCase() === tag.toLowerCase());

    const solved = isSolved(problem._id);
    const statusMatch =
      status === "All" ||
      (status === "Solved" && solved) ||
      (status === "Unsolved" && !solved);

    return searchMatch && difficultyMatch && tagMatch && statusMatch;
  });

  const avatar = user?.firstName?.charAt(0).toUpperCase() || "U";

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

  // ✅ Show loading while auth is being checked
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-theme="dark" className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-md px-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">CodeArena</h1>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="btn btn-primary btn-sm"
            >
              Admin Panel
            </button>
          )}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              className="avatar placeholder cursor-pointer"
              role="button"
            >
              <div className="bg-primary text-primary-content w-10 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100 flex items-center justify-center">
                <span className="text-lg font-semibold">{avatar}</span>
              </div>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 z-10"
            >
              <li className="menu-title">
                <span>
                  {user?.firstName} {user?.lastName}
                </span>
              </li>
              <li className="text-sm text-base-content/70 px-4 pb-2 -mt-1">
                {user?.email}
              </li>
              {isAdmin && (
                <li>
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 text-primary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Admin Panel
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-error"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-base-content">Problems</h1>
          <p className="text-base-content/70">
            Practice and improve your coding skills
          </p>
        </div>

        <div className="bg-base-100/50 rounded-xl p-4 mb-6 shadow-sm">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search problems..."
              className="input input-bordered w-full bg-base-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base-content/80 text-sm">
                Difficulty:
              </span>
              <div className="btn-group">
                {["All", "Easy", "Medium", "Hard"].map((level) => (
                  <button
                    key={level}
                    className={`btn btn-sm ${
                      difficulty === level
                        ? level === "Easy"
                          ? "btn-success"
                          : level === "Medium"
                            ? "btn-warning"
                            : level === "Hard"
                              ? "btn-error"
                              : "btn-primary"
                        : "btn-ghost"
                    }`}
                    onClick={() => setDifficulty(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base-content/80 text-sm">
                Tag:
              </span>
              <select
                className="select select-bordered select-sm bg-base-100 w-40"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="All">All</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base-content/80 text-sm">
                Status:
              </span>
              <select
                className="select select-bordered select-sm bg-base-100 w-36"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Solved">Solved</option>
                <option value="Unsolved">Unsolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl shadow-lg overflow-hidden">
          {filteredProblems.length === 0 ? (
            <div className="p-10 text-center text-base-content/50">
              No problems found
            </div>
          ) : (
            filteredProblems.map((problem, index) => (
              <div
                key={problem._id}
                onClick={() => navigate(`/problem/${problem._id}`)}
                className="flex items-center justify-between p-4 border-b border-base-200/50 cursor-pointer hover:bg-base-200/50 transition-colors duration-150"
              >
                <div className="flex items-center gap-4">
                  <span className="text-base-content/40 font-mono text-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium text-base-content">
                    {problem.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="badge badge-ghost badge-sm">
                    {problem.tags}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      problem.difficulty?.toLowerCase() === "easy"
                        ? "text-success"
                        : problem.difficulty?.toLowerCase() === "medium"
                          ? "text-warning"
                          : "text-error"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  {isSolved(problem._id) && (
                    <span className="text-success text-xl font-bold">✓</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
