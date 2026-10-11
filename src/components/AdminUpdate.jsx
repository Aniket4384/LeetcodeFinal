import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Trash2, ArrowLeft, Loader2, AlertCircle, Save, 
  Edit, FileText, Calendar, Tag 
} from 'lucide-react';
import axiosClient from '../config/axios';
import { updateProblem, setProblems } from '../redux/problemSlice';

const AdminUpdate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { problems } = useSelector((state) => state.problem);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [selectedId, setSelectedId] = useState(id || '');
  const [showForm, setShowForm] = useState(!!id);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    tags: '',
    visibleTestCases: [{ input: '', output: '', explanation: '' }],
    hiddenTestCases: [{ input: '', output: '' }],
    startCode: [{ language: 'c++', initialCode: '' }],
    referenceSolution: [{ language: 'c++', completeCode: '' }]
  });

  const languages = ['c++', 'java', 'javascript'];
  
  const tagOptions = [
    'array', 'linkedList', 'graph', 'dp', 'string', 
    'tree', 'hash-table', 'binary-search', 'stack', 
    'queue', 'heap'
  ];

  // Fetch all problems if not in Redux
  useEffect(() => {
    if (!problems || problems.length === 0) {
      fetchAllProblems();
    }
  }, []);

  // If ID is provided in URL, fetch that problem
  useEffect(() => {
    if (id) {
      setSelectedId(id);
      setShowForm(true);
      fetchProblemById(id);
    }
  }, [id]);

  const fetchAllProblems = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/problem/getAllProblem');
      if (response.data.success) {
        dispatch(setProblems(response.data.problems || []));
      }
    } catch (err) {
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemById = async (problemId) => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await axiosClient.get(`/problem/problemById/${problemId}`);
      
      if (response.data.success) {
        const problem = response.data.problem;
        setForm({
          title: problem.title || '',
          description: problem.description || '',
          difficulty: problem.difficulty || 'easy',
          tags: problem.tags || '',
          visibleTestCases: problem.visibleTestCases?.length > 0 
            ? problem.visibleTestCases 
            : [{ input: '', output: '', explanation: '' }],
          hiddenTestCases: problem.hiddenTestCases?.length > 0 
            ? problem.hiddenTestCases 
            : [{ input: '', output: '' }],
          startCode: problem.startCode?.length > 0 
            ? problem.startCode 
            : [{ language: 'c++', initialCode: '' }],
          referenceSolution: problem.referenceSolution?.length > 0 
            ? problem.referenceSolution 
            : [{ language: 'c++', completeCode: '' }]
        });
        setShowForm(true);
      } else {
        setFetchError('Failed to fetch problem data');
      }
    } catch (err) {
      console.error('Error fetching problem:', err);
      setFetchError(err.response?.data?.message || 'Failed to load problem data');
    } finally {
      setLoading(false);
    }
  };

  const handleProblemSelect = (problemId) => {
    setSelectedId(problemId);
    setShowForm(true);
    fetchProblemById(problemId);
    navigate(`/admin/update/${problemId}`, { replace: true });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleArrayChange = (field, index, subField, value) => {
    const updated = [...form[field]];
    updated[index][subField] = value;
    setForm({ ...form, [field]: updated });
  };

  const addItem = (field, template) => {
    setForm({ ...form, [field]: [...form[field], template] });
  };

  const removeItem = (field, index) => {
    if (form[field].length === 1) return;
    const updated = form[field].filter((_, i) => i !== index);
    setForm({ ...form, [field]: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    setSubmitting(true);

    try {
      if (!form.title.trim()) throw new Error('Title is required');
      if (!form.description.trim()) throw new Error('Description is required');
      if (!form.tags.trim()) throw new Error('Tag is required');

      const validVisible = form.visibleTestCases.filter(tc => 
        tc.input.trim() && tc.output.trim() && tc.explanation.trim()
      );
      if (validVisible.length === 0) {
        throw new Error('At least one visible test case with input, output, and explanation is required');
      }

      const validSolutions = form.referenceSolution.filter(rs => 
        rs.language && rs.completeCode.trim()
      );
      if (validSolutions.length === 0) {
        throw new Error('At least one reference solution with language and code is required');
      }

      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: form.difficulty,
        tags: form.tags.trim(),
        visibleTestCases: validVisible.map(tc => ({
          input: tc.input.trim(),
          output: tc.output.trim(),
          explanation: tc.explanation.trim()
        })),
        hiddenTestCases: form.hiddenTestCases
          .filter(tc => tc.input.trim() && tc.output.trim())
          .map(tc => ({
            input: tc.input.trim(),
            output: tc.output.trim()
          })),
        startCode: form.startCode
          .filter(sc => sc.language && sc.initialCode.trim())
          .map(sc => ({
            language: sc.language,
            initialCode: sc.initialCode.trim()
          })),
        referenceSolution: validSolutions.map(rs => ({
          language: rs.language,
          completeCode: rs.completeCode.trim()
        }))
      };

      const response = await axiosClient.put(`/problem/update/${selectedId}`, data);
      
      if (response.data.success) {
        dispatch(updateProblem(response.data.problem));
        setSuccess('✅ Problem updated successfully!');
        setTimeout(() => {
          setShowForm(false);
          setSelectedId('');
          navigate('/admin/update');
        }, 2000);
      }
    } catch (err) {
      console.error('Error:', err);
      if (err.response) {
        const { data, status } = err.response;
        if (status === 400 && data.message?.includes('reference solution failed')) {
          setError({
            title: '❌ Reference Solution Failed Validation',
            message: `The ${data.error || 'solution'} has errors:`,
            details: [
              data.status ? `Status: ${data.status}` : null,
              data.stderr ? `Error Output: ${data.stderr}` : null,
              data.compile_output ? `Compilation: ${data.compile_output}` : null,
              data.stdout ? `Output: ${data.stdout}` : null,
            ].filter(Boolean),
            suggestion: 'Check your code for syntax errors, missing brackets, or incorrect function signatures.'
          });
        } else {
          setError({
            title: '❌ Error',
            message: data.message || 'Failed to update problem'
          });
        }
      } else {
        setError({
          title: '❌ Error',
          message: err.message || 'An unexpected error occurred'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render error component
  const renderError = () => {
    if (!error) return null;
    return (
      <div className="alert alert-error shadow-lg mb-6">
        <AlertCircle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">{error.title || 'Error'}</h3>
          <div className="text-sm">{error.message}</div>
          {error.details?.map((detail, i) => (
            <p key={i} className="text-sm">• {detail}</p>
          ))}
          {error.suggestion && (
            <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
              <p className="text-sm">💡 {error.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderArrayField = (field, label, fields, template, required = false) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </h3>
        <span className="badge badge-ghost">{form[field].length}</span>
      </div>
      {form[field].map((item, idx) => (
        <div key={idx} className="card bg-base-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">#{idx + 1}</span>
            {form[field].length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(field, idx)}
                className="btn btn-ghost btn-sm text-error hover:bg-error/20"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.key}>
                {f.type === 'select' ? (
                  <select
                    value={item[f.key] || ''}
                    onChange={(e) => handleArrayChange(field, idx, f.key, e.target.value)}
                    className="select select-bordered w-full bg-base-100"
                  >
                    <option value="">Select Language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    placeholder={f.placeholder}
                    value={item[f.key] || ''}
                    onChange={(e) => handleArrayChange(field, idx, f.key, e.target.value)}
                    rows={f.rows || 3}
                    className="textarea textarea-bordered w-full font-mono text-sm bg-base-100"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={item[f.key] || ''}
                    onChange={(e) => handleArrayChange(field, idx, f.key, e.target.value)}
                    className="input input-bordered w-full bg-base-100"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addItem(field, template)}
        className="btn btn-ghost border-2 border-dashed w-full hover:border-primary hover:bg-primary/10"
      >
        <Plus size={16} /> Add {label}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="btn btn-ghost gap-2 mb-6"
        >
          <ArrowLeft size={18} /> Back to Admin
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Update Problem</h1>
            <p className="text-base-content/70 mt-1">
              {showForm ? 'Edit selected problem' : 'Select a problem to update'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-base-content/50">
            <AlertCircle size={16} />
            <span>Supported: C++, Java, JavaScript</span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {renderError()}

        {success && (
          <div className="alert alert-success shadow-lg mb-6">
            <span className="text-xl">✓</span>
            <span>{success}</span>
          </div>
        )}

        {!showForm ? (
          // Problem List View
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Select a Problem to Update</h2>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={40} className="animate-spin text-primary" />
                </div>
              ) : problems?.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-base-content/30 mb-4" />
                  <p className="text-base-content/50">No problems found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {problems?.map((problem) => (
                    <div
                      key={problem._id}
                      onClick={() => handleProblemSelect(problem._id)}
                      className="flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-primary/10 cursor-pointer transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold">{problem.title}</h3>
                          <span className={`badge ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          {problem.tags && (
                            <span className="badge badge-ghost">
                              <Tag size={12} className="inline mr-1" />
                              {problem.tags}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-base-content/50 flex-wrap">
                          <span>
                            <Calendar size={12} className="inline mr-1" />
                            {formatDate(problem.createdAt)}
                          </span>
                          <span>
                            <FileText size={12} className="inline mr-1" />
                            {problem.visibleTestCases?.length || 0} test cases
                          </span>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Update Form View
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Back to list button */}
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedId('');
                navigate('/admin/update');
              }}
              className="btn btn-ghost btn-sm gap-2 mb-2"
            >
              <ArrowLeft size={16} /> Back to Problem List
            </button>

            {/* Basic Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Basic Information</h2>
                
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Title <span className="text-error">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g., Two Sum"
                      className="input input-bordered w-full"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Description <span className="text-error">*</span></span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the problem in detail..."
                      rows="4"
                      className="textarea textarea-bordered w-full"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Difficulty <span className="text-error">*</span></span>
                      </label>
                      <select
                        name="difficulty"
                        value={form.difficulty}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Tag <span className="text-error">*</span></span>
                      </label>
                      <select
                        name="tags"
                        value={form.tags}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                        required
                      >
                        <option value="">Select Tag</option>
                        {tagOptions.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visible Test Cases */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Visible Test Cases</h2>
                <p className="text-sm text-base-content/70 mb-4">These will be shown to users <span className="text-error">*</span></p>
                {renderArrayField(
                  'visibleTestCases',
                  'Test Case',
                  [
                    { key: 'input', placeholder: 'Input (e.g., 4 2 7 11 15 9)', type: 'text' },
                    { key: 'output', placeholder: 'Output (e.g., [0,1])', type: 'text' },
                    { key: 'explanation', placeholder: 'Explanation (e.g., 2 + 7 = 9)', type: 'text' }
                  ],
                  { input: '', output: '', explanation: '' },
                  true
                )}
              </div>
            </div>

            {/* Hidden Test Cases */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Hidden Test Cases</h2>
                <p className="text-sm text-base-content/70 mb-4">Used for evaluation (optional)</p>
                {renderArrayField(
                  'hiddenTestCases',
                  'Hidden Test Case',
                  [
                    { key: 'input', placeholder: 'Input (e.g., 4 1 5 8 12 13)', type: 'text' },
                    { key: 'output', placeholder: 'Output (e.g., [0,3])', type: 'text' }
                  ],
                  { input: '', output: '' }
                )}
              </div>
            </div>

            {/* Start Code */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Start Code</h2>
                <p className="text-sm text-base-content/70 mb-4">Template code given to users (optional)</p>
                {renderArrayField(
                  'startCode',
                  'Start Code Template',
                  [
                    { key: 'language', placeholder: '', type: 'select' },
                    { key: 'initialCode', placeholder: 'function solution() { // Your code here }', type: 'textarea', rows: 3 }
                  ],
                  { language: 'c++', initialCode: '' }
                )}
              </div>
            </div>

            {/* Reference Solution */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Reference Solution</h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Complete working solution. Must pass all test cases. <span className="text-error">*</span>
                </p>

                {renderArrayField(
                  'referenceSolution',
                  'Reference Solution',
                  [
                    { key: 'language', placeholder: '', type: 'select' },
                    { key: 'completeCode', placeholder: '#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};', type: 'textarea', rows: 5 }
                  ],
                  { language: 'c++', completeCode: '' },
                  true
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pb-8">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedId('');
                  navigate('/admin/update');
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {submitting ? 'Updating...' : 'Update Problem'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminUpdate;