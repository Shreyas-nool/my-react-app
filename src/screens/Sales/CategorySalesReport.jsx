import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

const CategorySalesReport = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { category, date } = state || {};

  const [productList, setProductList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [partyMap, setPartyMap] = useState({});

  // Fetch party names
  useEffect(() => {
    const partiesRef = ref(db, "parties");
    onValue(partiesRef, (snap) => {
      const data = snap.val() || {};
      const map = {};
      Object.entries(data).forEach(([id, party]) => {
        map[id] = party.name || id;
      });
      setPartyMap(map);
    });
  }, []);

  // Fetch sales data
  useEffect(() => {
    if (!category || !date) return;

    const salesRef = ref(db, "sales");

    const unsub = onValue(salesRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setProductList([]);
        setTableData([]);
        return;
      }

      const selectedDateStr = new Date(date).toISOString().slice(0, 10);
      const productsSet = new Set();
      const tempData = [];

      Object.values(data).forEach((timestampNode) => {
        Object.values(timestampNode).forEach((invoice) => {
          const invoiceDateStr = new Date(invoice.createdAt).toISOString().slice(0, 10);
          if (invoiceDateStr !== selectedDateStr) return;

          const filteredItems = (invoice.items || []).filter(item => item.category === category);
          if (filteredItems.length === 0) return;

          filteredItems.forEach(item => productsSet.add(item.productName));

          // Group items by product & price
          const productGroups = {};
          filteredItems.forEach(item => {
            if (!productGroups[item.productName]) productGroups[item.productName] = {};
            const key = Number(item.pricePerItem); // ensure number
            if (!productGroups[item.productName][key]) productGroups[item.productName][key] = 0;
            productGroups[item.productName][key] += Number(item.box);
          });

          // Determine max rows needed for stacking
          const maxRows = Math.max(
            ...Object.values(productGroups).map(priceMap => Object.keys(priceMap).length)
          );

          for (let i = 0; i < maxRows; i++) {
            const row = {
              invoiceNumber: invoice.invoiceNumber,
              partyName: partyMap[invoice.partyId] || invoice.partyId,
              products: {}
            };

            Object.keys(productGroups).forEach(prod => {
              // sort prices ascending
              const prices = Object.entries(productGroups[prod])
                .sort(([a], [b]) => a - b); 
              row.products[prod] = prices[i] ? `${prices[i][1]} / ${prices[i][0]}` : "-";
            });

            tempData.push(row);
          }
        });
      });

      setProductList(Array.from(productsSet));
      setTableData(tempData);
    });

    return () => unsub();
  }, [category, date, partyMap]);

  // Compute totals per product
  const totals = {};
  productList.forEach(prod => {
    totals[prod] = tableData.reduce((sum, row) => {
      const val = row.products[prod];
      if (val && val !== "-") {
        const box = Number(val.split(" / ")[0]);
        return sum + box;
      }
      return sum;
    }, 0);
  });

  return (
    <div className="max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* Header */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute left-0 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-xl font-semibold">{category}</h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3">Invoice</th>
              <th className="border p-3">Party</th>
              {productList.map((p) => (
                <th key={p} className="border p-3">{p}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={productList.length + 2} className="p-6">
                  No data for selected category and date
                </td>
              </tr>
            ) : (
              <>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-3">
                      <button
                        className="text-blue-600 underline"
                        onClick={() =>
                          navigate("/sales/view-invoice", { state: { invoiceNumber: row.invoiceNumber } })
                        }
                      >
                        {row.invoiceNumber}
                      </button>
                    </td>
                    <td className="border p-3 font-medium">{row.partyName}</td>
                    {productList.map((prod) => (
                      <td key={prod} className="border p-3">{row.products[prod]}</td>
                    ))}
                  </tr>
                ))}

                {/* Totals row */}
                <tr className="bg-gray-200 font-semibold">
                  <td className="border p-3 text-right" colSpan={2}>
                    Total Boxes:
                  </td>
                  {productList.map(prod => (
                    <td key={prod} className="border p-3">{totals[prod]}</td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategorySalesReport;
