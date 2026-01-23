import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { useProfileMutation } from "../../slices/userApiSlice";
import { setCredentials } from "../../slices/authSlice";

import { db } from "../../firebase";
import { ref, get, set } from "firebase/database";

const ProfileScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [openingBalances, setOpeningBalances] = useState({}); // <-- Track opening balances

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [updateProfile, { isLoading }] = useProfileMutation();

  const DEFAULT_ACCOUNTS = [
    "JR",
    "Talha",
    "SR",
    "Mumbai Payment",
    "Malad Payment",
  ];

  useEffect(() => {
    if (userInfo) {
      setName(userInfo?.name || "");
      setEmail(userInfo?.email || "");
    }
  }, [userInfo]);

  /* ---------- Update Profile ---------- */
  const submitHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await updateProfile({
        name,
        email,
        password,
      }).unwrap();

      dispatch(setCredentials(res));
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  /* ---------- Create Account with Opening Balance ---------- */
  const createAccount = async (accountName, openingBalance = 0) => {
    try {
      if (openingBalance < 0) {
        toast.error("Opening balance cannot be negative");
        return;
      }

      const accountRef = ref(db, `accounts/${accountName}`);
      const snapshot = await get(accountRef);

      if (snapshot.exists()) {
        toast.info(`${accountName} already exists`);
        return;
      }

      await set(accountRef, {
        name: accountName,
        type: "account",
        balance: openingBalance,
        openingBalance: openingBalance,
        createdAt: new Date().toISOString(),
        entries: {
          expenses: {},
        },
      });

      toast.success(`${accountName} account created with balance ${openingBalance}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create account");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Your Profile
        </h1>

        {/* PROFILE FORM */}
        <form onSubmit={submitHandler}>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 border-b border-slate-900/10 pb-12 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-slate-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Update your account information here.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6 md:col-span-2">
              <div className="sm:col-span-full">
                <label className="block text-sm font-medium text-slate-900">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                />
              </div>

              <div className="sm:col-span-full">
                <label className="block text-sm font-medium text-slate-900">
                  Email Address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-900">
                  New Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-900">
                  Confirm Password
                </label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button disabled={isLoading} className="px-6 py-2">
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>

        {/* ADMIN / DEVELOPER OPTIONS */}
        <div className="mt-16 border-t border-slate-900/10 pt-10">
          <h2 className="text-lg font-semibold text-slate-900">
            System Options
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Advanced configuration and management tools.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <button
              onClick={() => navigate("/developer")}
              className="rounded-lg border border-slate-300 p-6 text-left hover:border-indigo-600 hover:bg-indigo-50 transition"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Developer Options
                </h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Debug tools, experimental features, and system settings.
              </p>
            </button>

            <button
              onClick={() => navigate("/admin")}
              className="rounded-lg border border-slate-300 p-6 text-left hover:border-red-600 hover:bg-red-50 transition"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                Admin Panel
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                User management, permissions, and system controls.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
