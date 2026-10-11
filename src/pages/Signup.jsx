import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import axiosClient from '../config/axios';
import { login } from '../redux/authSlice';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    emailId: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    const { firstName, emailId, password } = formData;
    if (!firstName.trim()) return 'First name is required';
    if (!emailId.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(emailId)) return 'Please enter a valid email address';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axiosClient.post('/user/register', formData);
      
      const userData = response.data.user;
      
     
      dispatch(login(userData));

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 409) {
          setError('User already exists with this email');
        } else if (status === 400) {
          setError(data.message || 'Validation error');
        } else {
          setError(data.message || 'Registration failed. Please try again.');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center justify-center">
            Create Account
          </h2>
          <p className="text-center text-sm text-base-content/70 mb-4">
            Join us today
          </p>

          {error && (
            <div className="alert alert-error shadow-lg mb-4">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success shadow-lg mb-4">
              <span>Registration successful! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="input input-bordered w-full"
                disabled={loading || success}
                required
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleChange}
                placeholder="Enter your email"
                className="input input-bordered w-full"
                disabled={loading || success}
                required
              />
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password (min 6 characters)"
                  className="input input-bordered w-full pr-10"
                  disabled={loading || success}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || success}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full cursor-pointer ${loading ? 'loading' : ''}`}
              disabled={loading || success}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <div className="divider">OR</div>
          <p className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary cursor-pointer">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;