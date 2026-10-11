import axios from "axios";

const axiosClient = axios.create({
    // baseURL: "http://localhost:3000",
    baseURL: "https://backend-1-55n9.onrender.com",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosClient;