import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import HomeScreen from "./screens/Home";
import Layout from "./components/Layout";
import ErrorScreen from "./screens/Error";
import Product from "./screens/product/ProductList";
import ProductList from "./screens/product/ProductList";
import AddProduct from "./screens/product/AddProduct";
import Party from "./screens/Party";
import AddParty from "./screens/Party/AddParty";
import Banks from "./screens/Bank";
import AddBank from "./screens/Bank/AddBank";
import WareHouse from "./screens/warehouse";
import AddWarehouse from "./screens/warehouse/AddWarehouse";
import StockScreen from "./screens/Stock";
import TransferStock from "./screens/warehouse/TransferStock";
import ExpenseScreen from "./screens/Expense";
import AddReduce from "./screens/Expense/AddReduce";
import CreateSales from "./screens/Sales/CreateSales";
import SalesScreen from "./screens/Sales/index.jsx";
import SalesList from "./screens/Sales/";
import PrintMultipleInvoices from "./screens/Sales/PrintMultipleInvoices";

import AddStockScreen from "./screens/Stock/AddStock";
import store from "./store";
import LoginScreen from "./screens/Login";
import PrivateRoute from "./components/PrivateRoute";
import ProfileScreen from "./screens/Profile";
import Ledger from "./screens/ledger";
import AddLedger from "./screens/ledger/AddLedger";
import Purchase from "./screens/Purchase/Purchase";
import AddPurchase from "./screens/Purchase/AddPurchase";
import EditPurchase from "./screens/Purchase/EditPurchase";
import PaymentScreen from "./screens/Payments/PaymentScreen";
import AddPayment from "./screens/Payments/AddPayment";

import ViewInvoice from "./screens/Sales/ViewInvoice";

// Bank
import TalhaBankPayments from "./screens/talha/index.jsx"; // ✅ import Talha page

import SrBankPayments from "./screens/SR/index.jsx";

import JrBankPayments from "./screens/JR/index.jsx";

import WarehouseDetails from "./screens/warehouse/WarehouseDetails";


// ✅ FULLY FIXED ROUTER
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginScreen />,
    errorElement: <ErrorScreen />,
  },

  // Protected Routes
  {
    path: "/",
    element: <PrivateRoute />,
    errorElement: <ErrorScreen />, // <== GLOBAL ERROR SCREEN HERE
    children: [
      {
        path: "/",
        element: <Layout />,
        errorElement: <ErrorScreen />, // <== CHILD ERRORS ALSO USE SAME SCREEN
        children: [
          { path: "/", element: <HomeScreen /> },

          // Product
          { path: "/product", element: <Product /> },
          { path: "/product/products", element: <ProductList /> },
          { path: "/product/add-product", element: <AddProduct /> },

          // Party
          { path: "/party", element: <Party /> },
          { path: "/party/add-party", element: <AddParty /> },

          // Bank
          { path: "/banks", element: <Banks /> },
          { path: "/banks/add-bank", element: <AddBank /> },

          // Warehouse
          { path: "/warehouse", element: <WareHouse /> },
          { path: "/warehouse/add-warehouse", element: <AddWarehouse /> },
          { path: "/warehouse/transfer-stock", element: <TransferStock /> },

          // Stock
          { path: "/stock", element: <StockScreen /> },
          { path: "/stock/create-stock", element: <AddStockScreen /> },

          // Expense
          { path: "/expense", element: <ExpenseScreen /> },
          { path: "/expense/create-expense", element: <AddReduce /> },

          // Sales
          { path: "/sales", element: <SalesScreen /> },
          { path: "/sales/create-sales", element: <CreateSales /> },
          { path: "/sales/list", element: <SalesList /> },
          { path: "/sales/print-multiple", element: <PrintMultipleInvoices /> },
          { path: "/sales/view-invoice", element: <ViewInvoice /> },

          // Payments
          { path: "/payment", element: <PaymentScreen /> },
          { path: "/payment/add", element: <AddPayment /> },

          // Profile
          { path: "/profile", element: <ProfileScreen /> },

          // Ledger
          { path: "/ledger", element: <Ledger /> },
          { path: "/ledger/add", element: <AddLedger /> },

          // Purchase
          { path: "/purchase", element: <Purchase /> },
          { path: "/purchase/add", element: <AddPurchase /> },
          { path: "/purchase/edit/:id", element: <EditPurchase /> },

          // Banks
          { path: "/banks", element: <Banks /> },
          { path: "/banks/add-bank", element: <AddBank /> },

          // Talha Bank Payments
          { path: "/talha", element: <TalhaBankPayments /> },

          //SR Bank Payments
          { path: "/sr", element: <SrBankPayments /> },

          //JR Bank Payments
          { path: "/jr", element: <JrBankPayments /> },

          { path: "/warehouse/:id", element: <WarehouseDetails />},

        ],
      },
    ],
  },

  // 404 - Catch All
  {
    path: "*",
    element: <ErrorScreen />, // <== ALWAYS SHOW YOUR CUSTOM ERROR PAGE
  },
]);

const App = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <ToastContainer position="bottom-right" hideProgressBar autoClose={5000} />
    </Provider>
  );
};

export default App;
