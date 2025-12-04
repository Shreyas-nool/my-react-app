import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { setCredentials } from "../../slices/authSlice";
import { useLoginMutation } from "../../slices/userApiSlice";
import { Lock, Mail } from "lucide-react";

const LoginScreen = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { search } = useLocation();
    const sp = new URLSearchParams(search);
    const redirect = sp.get("redirect") || "/";

    const [login, { isLoading }] = useLoginMutation();
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect, userInfo]);

    const hardcodedUser = {
        email: "admin@example.com",
        password: "123456",
        name: "Admin User",
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (email === hardcodedUser.email && password === hardcodedUser.password) {
            dispatch(setCredentials({ userInfo: hardcodedUser }));
            navigate(redirect);
            return;
        }

        try {
            const response = await login({ email, password }).unwrap();
            dispatch(setCredentials({ ...response }));
            navigate(redirect);
        } catch (error) {
            toast.error(error?.data?.message || "Login failed");
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!", { autoClose: 800 });
    };

    return (
        <section className="min-h-screen flex items-center justify-center relative px-4 sm:px-6">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                className="absolute inset-0 w-full h-full object-cover"
                src="https://sr.9825098250.shop/assets-design/sdkk_login.mp4"
            />

            {/* Overlay with 30% blur */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            {/* Login Card */}
            <div className="relative w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                        Welcome Back
                    </h1>
                    <p className="text-gray-300 mt-2 text-xs sm:text-sm">
                        Sign in to continue to your dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                            <input
                                type="email"
                                id="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                onClick={() => copyToClipboard(hardcodedUser.email)}
                                className="w-full rounded-lg bg-white/20 border border-white/30 py-2.5 pl-10 pr-3 text-gray-100 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm sm:text-base cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                            <input
                                type="password"
                                id="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                onClick={() => copyToClipboard(hardcodedUser.password)}
                                className="w-full rounded-lg bg-white/20 border border-white/30 py-2.5 pl-10 pr-3 text-gray-100 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm sm:text-base cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors duration-300 rounded-lg py-2.5 font-semibold text-white shadow-lg disabled:opacity-70 text-sm sm:text-base"
                    >
                        {isLoading ? "Loading..." : "Sign In"}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-6 text-xs sm:text-sm text-gray-400">
                    <p
                        className="cursor-pointer"
                        onClick={() => {
                            copyToClipboard(`${hardcodedUser.email} / ${hardcodedUser.password}`);
                        }}
                    >
                        Use <span className="text-indigo-300">{hardcodedUser.email}</span> /{" "}
                        <span className="text-indigo-300">{hardcodedUser.password}</span>
                        <br />
                    </p>
                </div>
            </div>
        </section>
    );
};

export default LoginScreen;
