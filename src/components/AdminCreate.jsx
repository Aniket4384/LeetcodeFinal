import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { Plus, Trash2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import axiosClient from '../config/axios';
import { addProblem } from '../redux/problemSlice';

const AdminCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
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

  // Supported languages (must match backend getId() function)
  const languages = ['c++', 'java', 'javascript'];
  
  // Tag options (single select)
  const tagOptions = [
    'array', 'linkedList', 'graph', 'dp', 'string', 
    'tree', 'hash-table', 'binary-search', 'stack', 
    'queue', 'heap'
  ];

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

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      difficulty: 'easy',
      tags: '',
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: [{ language: 'c++', initialCode: '' }],
      referenceSolution: [{ language: 'c++', completeCode: '' }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!form.title.trim()) {
        throw new Error('Title is required');
      }
      if (!form.description.trim()) {
        throw new Error('Description is required');
      }
      if (!form.tags.trim()) {
        throw new Error('Tag is required');
      }

      // Validate visible test cases
      const validVisible = form.visibleTestCases.filter(tc => 
        tc.input.trim() && tc.output.trim() && tc.explanation.trim()
      );
      if (validVisible.length === 0) {
        throw new Error('At least one visible test case with input, output, and explanation is required');
      }

      // Validate reference solutions
      const validSolutions = form.referenceSolution.filter(rs => 
        rs.language && rs.completeCode.trim()
      );
      if (validSolutions.length === 0) {
        throw new Error('At least one reference solution with language and code is required');
      }

      // Prepare data for API - tags as STRING, not array
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

      const response = await axiosClient.post('/problem/create', data);
      
      if (response.data.success) {
        // Add problem to Redux store
        dispatch(addProblem(response.data.problem));
        setSuccess('✅ Problem created successfully!');
        resetForm();
      }
    } catch (err) {
      console.error('Error:', err);
      
      if (err.response) {
        const { data, status } = err.response;
        
        if (status === 400 && data.message && data.message.includes('reference solution failed')) {
          setError({
            title: '❌ Reference Solution Failed Validation',
            message: `The ${data.error || 'solution'} has errors:`,
            details: [
              data.status ? `Status: ${data.status}` : null,
              data.stderr ? `Error Output: ${data.stderr}` : null,
              data.compile_output ? `Compilation: ${data.compile_output}` : null,
              data.stdout ? `Output: ${data.stdout}` : null,
              data.time ? `Time: ${data.time}s` : null,
              data.memory ? `Memory: ${data.memory}KB` : null
            ].filter(Boolean),
            suggestion: 'Check your code for syntax errors, missing brackets, or incorrect function signatures.',
            raw: data
          });
        } 
        else if (status === 400) {
          setError({
            title: '❌ Validation Error',
            message: data.message || 'Please check your input',
            details: data.error ? [data.error] : [],
            raw: data
          });
        } 
        else if (status === 401) {
          setError({
            title: '⛔ Unauthorized',
            message: 'Please login as admin to create problems'
          });
        } 
        else if (status >= 500) {
          setError({
            title: '⚠️ Server Error',
            message: 'Something went wrong on the server. Please try again.',
            details: [data.message || 'Internal server error']
          });
        } 
        else {
          setError({
            title: '❌ Error',
            message: data.message || 'Failed to create problem',
            details: [data.error || 'Unknown error']
          });
        }
      } else if (err.request) {
        setError({
          title: '🌐 Connection Error',
          message: 'Unable to reach the server. Please check your connection.'
        });
      } else {
        setError({
          title: '❌ Error',
          message: err.message || 'An unexpected error occurred'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render error component
  const renderError = () => {
    if (!error) return null;

    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">
              {error.title || 'Error'}
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-2">
              {error.message}
            </p>
            
            {error.details && error.details.length > 0 && (
              <div className="mt-2 space-y-1">
                {error.details.map((detail, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-300">
                    • {detail}
                  </p>
                ))}
              </div>
            )}

            {error.suggestion && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  💡 {error.suggestion}
                </p>
              </div>
            )}

            {error.raw && (
              <details className="mt-3">
                <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                  View technical details
                </summary>
                <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(error.raw, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderArrayField = (field, label, fields, template, required = false) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{form[field].length}</span>
      </div>
      {form[field].map((item, idx) => (
        <div key={idx} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              #{idx + 1}
            </span>
            {form[field].length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(field, idx)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"
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
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
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
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-mono text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={item[f.key] || ''}
                    onChange={(e) => handleArrayChange(field, idx, f.key, e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
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
        className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
      >
        <Plus size={16} /> Add {label}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition cursor-pointer"
        >
          <ArrowLeft size={18} /> Back to Admin
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Problem</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new coding problem to the platform</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <AlertCircle size={16} />
            <span>Supported: C++, Java, JavaScript</span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {renderError()}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-green-500 text-xl">✓</div>
              <p className="text-green-700 dark:text-green-400">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Two Sum"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the problem in detail..."
                  rows="4"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Difficulty <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Tag <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
                    required
                  >
                    <option value="">Select Tag</option>
                    {tagOptions.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select one tag only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visible Test Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Visible Test Cases</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">These will be shown to users <span className="text-red-500">*</span></p>
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

          {/* Hidden Test Cases */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Hidden Test Cases</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Used for evaluation (optional)</p>
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

          {/* Start Code */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Start Code</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Template code given to users (optional)</p>
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

          {/* Reference Solution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Reference Solution</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Complete working solution. Must pass all test cases. <span className="text-red-500">*</span>
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

          {/* Submit */}
          <div className="flex gap-4 pb-8">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {loading ? 'Creating...' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreate;