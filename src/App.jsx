import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import axiosClient from "./config/axios";
import { login, logout } from "./redux/authSlice";
import AdminPage from "./pages/AdminPage";
import AdminCreate from "./components/AdminCreate";
import AdminDelete from "./components/AdminDelete";
import AdminUpdate from "./components/AdminUpdate";
import ProblemPage from "./pages/ProblemPage";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import Profile from "./components/Profile";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading,user } = useSelector((state) => state.auth);
  console.log(user?.role)

  const role = user?.role

  // const role = user.role
  // console.log(role)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosClient.get("/user/check");
        if (response.data && response.data.user) {
          dispatch(login(response.data.user));
        } else {
          dispatch(logout());
        }
      } catch (error) {
        dispatch(logout());
      }
    };

    checkAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
      />
      <Route
        path="/admin"
        element= {role=="admin"?<AdminPage/>: <Navigate to = "/"/>}
      />
      <Route
        path="/admin/create"
        element= {<AdminCreate/>}
      />
      <Route
        path="/admin/delete"
        element= {<AdminDelete/>}
      />
      <Route
        path="/admin/update/:id?"
        element= {<AdminUpdate/>}
      />
       <Route
        path="/admin/video"
        element= {<AdminVideo/>}
      />

       <Route
        path="/admin/upload/:problemId"
        element= {<AdminUpload/>}
      />

      <Route
        path="/problem/:problemId"
        element= {<ProblemPage/>}
      />

      <Route
       path = "/profile"
       element = {<Profile/>}
      />


    </Routes>

    
  );
}

export default App;