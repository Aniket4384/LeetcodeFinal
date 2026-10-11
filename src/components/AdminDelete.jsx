import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Tag,
} from "lucide-react";
import axiosClient from "../config/axios";
import { setProblems, deleteProblem } from "../redux/problemSlice";

const AdminDelete = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { problems } = useSelector((state) => state.problem);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!problems || problems.length === 0) {
      fetchProblems();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  console.log("Redux problems changed:", problems.length);
}, [problems]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get("/problem/getAllProblem");

      if (response.data.success) {
        const problemsData = response.data.problems || [];
        dispatch(setProblems(problemsData));
      } else {
        setError("Failed to fetch problems");
      }
    } catch (err) {
      console.error("Error fetching problems:", err);
      setError(err.response?.data?.message || "Failed to load problems");
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

    try {
      setDeleting(true);
      setError(null);

      const response = await axiosClient.delete(
        `/problem/delete/${selectedProblem._id}`,
      );

      if (response.data.success) {
        

        console.log(
          "Redux IDs:",
          problems.map((problem) => problem._id),
        );

      
        dispatch(deleteProblem(selectedProblem._id));
  
        setSuccess(`✅ Problem deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedProblem(null);

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting problem:", err);
      setError(err.response?.data?.message || "Failed to delete problem");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedProblem(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Delete Modal Component
  const DeleteModal = () => {
    if (!showDeleteModal || !selectedProblem) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="text-red-600 dark:text-red-400" size={32} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Problem
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-1">
              Are you sure you want to delete this problem?
            </p>

            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 mb-4">
              "{selectedProblem.title}"
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
              ⚠️ This action cannot be undone.
            </p>

            {/* Problem Details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-6 text-left space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Difficulty:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(selectedProblem.difficulty)}`}
                >
                  {selectedProblem.difficulty || "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tag:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedProblem.tags || "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Created:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(selectedProblem.createdAt)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state - only show if actually loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin text-blue-600 mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            Loading problems...
          </p>
        </div>
      </div>
    );
  }

  const problemsList = problems || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition cursor-pointer"
        >
          <ArrowLeft size={18} /> Back to Admin
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Delete Problems
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Remove problems from the platform
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <FileText size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Total: {problemsList.length}
            </span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-red-500 mt-0.5 flex-shrink-0"
                size={20}
              />
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 cursor-pointer"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              <p className="text-green-700 dark:text-green-400">{success}</p>
            </div>
          </div>
        )}

        {/* Problems List */}
        {problemsList.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No problems available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create a new problem from the admin panel
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {problemsList.map((problem) => (
              <div
                key={problem._id}
                className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Problem Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {problem.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Difficulty Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}
                      >
                        {problem.difficulty || "N/A"}
                      </span>

                      {/* Tag */}
                      {problem.tags && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Tag size={12} className="inline mr-1" />
                          {problem.tags}
                        </span>
                      )}

                      {/* Created Date */}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <Calendar size={12} className="inline mr-1" />
                        {formatDate(problem.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteClick(problem)}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal />
    </div>
  );
};

export default AdminDelete;
