const Footer = () => {
    return (
        <footer className="w-full bg-slate-200">
            <div className="mx-auto max-w-7xl px-3 h-12 flex items-center py-6 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-slate-700 sm:text-left">
                    Copyright {new Date().getFullYear()}{" "}
                    <span className="text-md font-semibold text-blue-600 hover:cursor-pointer">
                        SR Enterprises.
                    </span>
                    All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
