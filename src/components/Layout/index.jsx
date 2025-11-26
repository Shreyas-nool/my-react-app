import { Outlet } from "react-router-dom";

import Header from "../Header";
import Footer from "../Footer";

const Layout = () => {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-grow">
                <Outlet />
                {/* <HomeScreen /> */}
                {/* <LoginScreen /> */}
            </div>
            <Footer />
        </div>
    );
};

export default Layout;
