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
import Purchase from "./screens/Purchase/Purchase";
import EditPurchase from "./screens/Purchase/EditPurchase";
import PaymentScreen from "./screens/Payments/PaymentScreen";
import AddPayment from "./screens/Payments/AddPayment";

import ViewInvoice from "./screens/Sales/ViewInvoice";

// Bank
import TalhaBankPayments from "./screens/talha/index.jsx"; // ✅ import Talha page

import SrBankPayments from "./screens/SR/index.jsx";

import JrBankPayments from "./screens/JR/index.jsx";

import WarehouseDetails from "./screens/warehouse/WarehouseDetails.jsx";

import PartyLedgerScreen from "./screens/ledger/PartyLedgerScreen";

import DueDateScreen from "./screens/dueDate/DueDateScreen";

import AddPurchase from "./screens/talha/AddPurchase";
import TransferMoney from "./screens/talha/TransferMoney.jsx";

import JrTransferMoney from "./screens/JR/JrTransferMoney";

import SrAddReduceMoney from "./screens/SR/SrAddReduceMoney";
import SrTransferMoney from "./screens/SR/SrTransferMoney";

import BankDetails from "./screens/Bank/Bankdetails";

import MumbaiPayment from "./screens/MumbaiPayment";
import MaladPayment from "./screens/MaladPayment"

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
          { path: "/banks/:bankId", element: <BankDetails />},

          // Warehouse
          { path: "/warehouse", element: <WareHouse /> },
          { path: "/warehouse/add-warehouse", element: <AddWarehouse /> },
          { path: "/warehouse/transfer-stock", element: <TransferStock /> },
          { path: "/warehouse/:id", element: <WarehouseDetails />},

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
          { path: "/ledger/:id", element: <PartyLedgerScreen /> },

          // Purchase
          { path: "/purchase", element: <Purchase /> },
          { path: "/purchase/add", element: <AddPurchase /> },
          { path: "/purchase/edit/:id", element: <EditPurchase /> },

          // Banks
          { path: "/banks", element: <Banks /> },
          { path: "/banks/add-bank", element: <AddBank /> },

          // Talha Bank Payments
          { path: "/talha", element: <TalhaBankPayments /> },
          // Add/Reduce Money for Talha
          { path: "/talha/add-purchase", element: <AddPurchase  /> },
          { path: "/talha/transfer-money", element: <TransferMoney /> },

          //SR Bank Payments
          { path: "/sr", element: <SrBankPayments /> },
          { path: "/sr/add-reduce-money", element: <SrAddReduceMoney />},
          { path: "/sr/transfer-money", element: <SrTransferMoney />},

          //JR Bank Payments
          { path: "/jr", element: <JrBankPayments /> },
          { path: "/jr/transfer", element: <JrTransferMoney />},

          //Due date
          { path: "/duedate", element: <DueDateScreen />},

          //Mumbai Payment
          {path:"/mumbaipayment", element:<MumbaiPayment />},

          //Malad Payment
          {path:"/maladpayment", element:<MaladPayment />},

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
