import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ArrowLeft, Triangle, Octagon, Circle } from "lucide-react";

const floatingShape = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 0.4, y: -30 },
  transition: {
    duration: 4,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut",
  },
};

const ErrorScreen = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-white to-slate-100">
      <Header />

      {/* Floating geometric shapes */}
      <motion.div
        {...floatingShape}
        className="absolute top-20 left-10 text-indigo-200"
      >
        <Triangle size={70} />
      </motion.div>

      <motion.div
        {...floatingShape}
        transition={{ ...floatingShape.transition, duration: 5 }}
        className="absolute bottom-20 right-10 text-indigo-200 rotate-12"
      >
        <Octagon size={80} />
      </motion.div>

      <motion.div
        {...floatingShape}
        transition={{ ...floatingShape.transition, duration: 3 }}
        className="absolute top-1/3 right-1/3 text-indigo-100"
      >
        <Circle size={60} />
      </motion.div>

      <div className="relative grid flex-grow place-items-center px-6 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Pulsing + floating 404 */}
          <motion.h1
            animate={{
              scale: [1, 1.06, 1],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-[80px] sm:text-[120px] font-extrabold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-xl"
          >
            404
          </motion.h1>

          {/* Title */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-4 text-3xl sm:text-5xl font-bold text-slate-900"
          >
            Oops! Page Not Found
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-4 text-base text-slate-600"
          >
            The page you're looking for doesn’t exist or may have moved.
          </motion.p>

          {/* Interactive card with tilt effect */}
          <motion.div
            whileHover={{
              scale: 1.04,
              rotate: 1.5,
            }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mt-10 inline-block"
          >
            <Link
              to="/"
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:bg-indigo-500"
            >
              <ArrowLeft
                size={18}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
              Go Back Home
            </Link>

            {/* Animated underline */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mx-auto mt-3 h-[2px] w-full bg-indigo-500/60"
            ></motion.div>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ErrorScreen;
