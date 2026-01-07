import { Link } from "react-router-dom";
import {
    Handbag,
    ChartNoAxesCombined,
    CreditCard,
    BookCheck,
    User,
    CalendarCheck,
    Warehouse,
    Landmark,
    Users,
    BanknoteArrowDown,
    Calculator,
} from "lucide-react";

const tiles = [
    { to: "/sales", label: "Sales", icon: ChartNoAxesCombined },
    { to: "/product", label: "Product", icon: ChartNoAxesCombined },
    { to: "/purchase", label: "Purchase", icon: Handbag },
    { to: "/payment", label: "Payment", icon: CreditCard },
    { to: "/stock", label: "Stock", icon: BookCheck },
    { to: "/ledger", label: "Ledger", icon: Calculator },
    { to: "/expense", label: "Expense", icon: BanknoteArrowDown },
    { to: "/party", label: "Add Party", icon: Users },
    { to: "/banks", label: "Banks", icon: Landmark },
    { to: "/talha", label: "Talha", icon: User },
    { to: "/jr", label: "JR", icon: User },
    { to: "/duedate", label: "Due Date", icon: CalendarCheck },
    { to: "/warehouse", label: "Warehouse", icon: Warehouse },
    { to: "/maladpayment", label: "Malad Payment", icon: Warehouse },
    { to: "/mumbaipayment", label: "Mumbai Payment", icon: Warehouse },
    { to: "/sr", label: "SR", icon: User },
];

const HomeScreen = () => {
    return (
        <section className="w-full min-h-screen bg-[url('/images/bg-img.png')] bg-cover bg-center relative px-4 py-8 sm:px-6 md:px-10">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div className="relative max-w-7xl mx-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-10">
                
                {/* Header */}
                <div className="pt-4 sm:pt-8 text-center sm:text-left">
                    <h1 className="text-white text-center text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-md">
                        Dashboard
                    </h1>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mt-8 sm:mt-10">
                    <div className="flex justify-between items-center bg-white/20 backdrop-blur-md rounded-xl shadow-lg p-4 sm:p-5 border border-green-300/20 transition hover:scale-[1.03] hover:bg-white/30 duration-300">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-green-400 text-xl sm:text-2xl font-semibold">↓</span>
                            <span className="text-green-100 font-medium text-sm sm:text-lg">To Collect</span>
                        </div>
                        <div className="font-bold text-white text-lg sm:text-xl">1,000</div>
                    </div>

                    <div className="flex justify-between items-center bg-white/20 backdrop-blur-md rounded-xl shadow-lg p-4 sm:p-5 border border-red-300/20 transition hover:scale-[1.03] hover:bg-white/30 duration-300">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-red-400 text-xl sm:text-2xl font-semibold">↑</span>
                            <span className="text-red-100 font-medium text-sm sm:text-lg">To Pay</span>
                        </div>
                        <div className="font-bold text-white text-lg sm:text-xl">0</div>
                    </div>
                </div>

                {/* Dashboard Tiles */}
                <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 sm:gap-6">
                    {tiles.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={label}
                            to={to}
                            className="group border border-white/10 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/30 rounded-xl shadow-md sm:shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.05] text-center"
                        >
                            <Icon
                                className="text-orange-300 h-6 w-6 sm:h-8 sm:w-8 group-hover:text-yellow-300 transition-colors duration-300"
                                strokeWidth={2.2}
                            />
                            <h1 className="mt-2 sm:mt-3 text-white font-medium text-sm sm:text-base tracking-tight group-hover:text-yellow-100">
                                {label}
                            </h1>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default HomeScreen;
