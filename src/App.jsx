/* =========================================================
   REACT ROUTER + REDUX SETUP
   ========================================================= */
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";

/* Toast notifications */
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* =========================================================
   CORE SCREENS & LAYOUT
   ========================================================= */
import HomeScreen from "./screens/Home";          // Dashboard / Home page
import Layout from "./components/Layout";          // Common layout (navbar, sidebar)
import ErrorScreen from "./screens/Error";          // Global error / 404 screen
import LoginScreen from "./screens/Login";          // Login page
import PrivateRoute from "./components/PrivateRoute"; // Auth guard (protect routes)
import ProfileScreen from "./screens/Profile";      // User profile page

/* =========================================================
   PRODUCT MODULE
   ========================================================= */
import Product from "./screens/product/ProductList";
import ProductList from "./screens/product/ProductList";
import AddProduct from "./screens/product/AddProduct";

/* =========================================================
   PARTY MODULE
   ========================================================= */
import Party from "./screens/Party";
import AddParty from "./screens/Party/AddParty";

/* =========================================================
   BANK MODULE
   ========================================================= */
import Banks from "./screens/Bank";                 // Bank list
import AddBank from "./screens/Bank/AddBank";       // Add bank
import BankDetails from "./screens/Bank/Bankdetails"; // Individual bank ledger

/* =========================================================
   WAREHOUSE MODULE
   ========================================================= */
import WareHouse from "./screens/warehouse";
import AddWarehouse from "./screens/warehouse/AddWarehouse";
import WarehouseDetails from "./screens/warehouse/WarehouseDetails.jsx";
import TransferStock from "./screens/warehouse/TransferStock";

/* =========================================================
   STOCK MODULE
   ========================================================= */
import StockScreen from "./screens/Stock";           // Stock list
import AddStockScreen from "./screens/Stock/AddStock"; // Add stock entry

/* =========================================================
   EXPENSE MODULE
   ========================================================= */
import ExpenseScreen from "./screens/Expense";
import AddReduce from "./screens/Expense/AddReduce";

/* =========================================================
   SALES MODULE
   ========================================================= */
import SalesScreen from "./screens/Sales/index.jsx";
import CreateSales from "./screens/Sales/CreateSales";
import SalesList from "./screens/Sales/";
import PrintMultipleInvoices from "./screens/Sales/PrintMultipleInvoices";
import ViewInvoice from "./screens/Sales/ViewInvoice";
import SalesReport from "./screens/Sales/SalesReport";
import CategorySalesReport from "./screens/Sales/CategorySalesReport";

/* =========================================================
   PURCHASE MODULE
   ========================================================= */
import Purchase from "./screens/Purchase/Purchase";
import EditPurchase from "./screens/Purchase/EditPurchase";
import AddPurchase from "./screens/talha/AddPurchase";

/* =========================================================
   PAYMENTS MODULE
   ========================================================= */
import PaymentScreen from "./screens/Payments/PaymentScreen";
import AddPayment from "./screens/Payments/AddPayment";

/* =========================================================
   LEDGER MODULE
   ========================================================= */
import Ledger from "./screens/ledger";
import PartyLedgerScreen from "./screens/ledger/PartyLedgerScreen";

/* =========================================================
   BANK PAYMENT SCREENS (Talha / SR / JR)
   ========================================================= */
import TalhaBankPayments from "./screens/talha/index.jsx";
import TransferMoney from "./screens/talha/TransferMoney.jsx";

import SrBankPayments from "./screens/SR/index.jsx";
import SrAddReduceMoney from "./screens/SR/SrAddReduceMoney";
import SrTransferMoney from "./screens/SR/SrTransferMoney";

import JrBankPayments from "./screens/JR/index.jsx";
import JrTransferMoney from "./screens/JR/JrTransferMoney";

/* =========================================================
   OTHER SCREENS
   ========================================================= */
import DueDateScreen from "./screens/dueDate/DueDateScreen";
import MumbaiPayment from "./screens/MumbaiPayment";
import MaladPayment from "./screens/MaladPayment";

/* =========================================================
   REDUX STORE
   ========================================================= */
import store from "./store";

/* =========================================================
   ROUTER CONFIGURATION
   ========================================================= */
const router = createBrowserRouter([
  /* ---------- PUBLIC ROUTE ---------- */
  {
    path: "/login",
    element: <LoginScreen />,        // Login does NOT require authentication
    errorElement: <ErrorScreen />,
  },

  /* ---------- PROTECTED ROUTES ---------- */
  {
    path: "/",
    element: <PrivateRoute />,       // Blocks access if user not logged in
    errorElement: <ErrorScreen />,
    children: [
      {
        path: "/",
        element: <Layout />,         // Layout wraps all inner pages
        errorElement: <ErrorScreen />,
        children: [
          { path: "/", element: <HomeScreen /> },

          /* ---------- PRODUCT ---------- */
          { path: "/product", element: <Product /> },
          { path: "/product/products", element: <ProductList /> },
          { path: "/product/add-product", element: <AddProduct /> },

          /* ---------- PARTY ---------- */
          { path: "/party", element: <Party /> },
          { path: "/party/add-party", element: <AddParty /> },

          /* ---------- BANK ---------- */
          { path: "/banks", element: <Banks /> },
          { path: "/banks/add-bank", element: <AddBank /> },
          { path: "/banks/:bankId", element: <BankDetails /> },

          /* ---------- WAREHOUSE ---------- */
          { path: "/warehouse", element: <WareHouse /> },
          { path: "/warehouse/add-warehouse", element: <AddWarehouse /> },
          { path: "/warehouse/transfer-stock", element: <TransferStock /> },
          { path: "/warehouse/:id", element: <WarehouseDetails /> },

          /* ---------- STOCK ---------- */
          { path: "/stock", element: <StockScreen /> },
          { path: "/stock/create-stock", element: <AddStockScreen /> },

          /* ---------- EXPENSE ---------- */
          { path: "/expense", element: <ExpenseScreen /> },
          { path: "/expense/create-expense", element: <AddReduce /> },

          /* ---------- SALES ---------- */
          { path: "/sales", element: <SalesScreen /> },
          { path: "/sales/create-sales", element: <CreateSales /> },
          { path: "/sales/list", element: <SalesList /> },
          { path: "/sales/print-multiple", element: <PrintMultipleInvoices /> },
          { path: "/sales/view-invoice", element: <ViewInvoice /> },
          { path: "/sales/report", element: <SalesReport /> },
          { path: "/sales/report/category", element: <CategorySalesReport /> },

          /* ---------- PAYMENTS ---------- */
          { path: "/payment", element: <PaymentScreen /> },
          { path: "/payment/add", element: <AddPayment /> },

          /* ---------- PROFILE ---------- */
          { path: "/profile", element: <ProfileScreen /> },

          /* ---------- LEDGER ---------- */
          { path: "/ledger", element: <Ledger /> },
          { path: "/ledger/:id", element: <PartyLedgerScreen /> },

          /* ---------- PURCHASE ---------- */
          { path: "/purchase", element: <Purchase /> },
          { path: "/purchase/add", element: <AddPurchase /> },
          { path: "/purchase/edit/:id", element: <EditPurchase /> },

          /* ---------- BANK PAYMENTS ---------- */
          { path: "/talha", element: <TalhaBankPayments /> },
          { path: "/talha/add-purchase", element: <AddPurchase /> },
          { path: "/talha/transfer-money", element: <TransferMoney /> },

          { path: "/sr", element: <SrBankPayments /> },
          { path: "/sr/add-reduce-money", element: <SrAddReduceMoney /> },
          { path: "/sr/transfer-money", element: <SrTransferMoney /> },

          { path: "/jr", element: <JrBankPayments /> },
          { path: "/jr/transfer", element: <JrTransferMoney /> },

          /* ---------- OTHER ---------- */
          { path: "/duedate", element: <DueDateScreen /> },
          { path: "/mumbaipayment", element: <MumbaiPayment /> },
          { path: "/maladpayment", element: <MaladPayment /> },
        ],
      },
    ],
  },

  /* ---------- 404 FALLBACK ---------- */
  {
    path: "*",
    element: <ErrorScreen />, // Any unknown route
  },
]);

/* =========================================================
   APP ROOT
   ========================================================= */
const App = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <ToastContainer position="bottom-right" hideProgressBar autoClose={5000} />
    </Provider>
  );
};

export default App;
