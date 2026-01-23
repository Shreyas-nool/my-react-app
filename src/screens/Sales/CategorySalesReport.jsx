import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

/* =======================
   Numeric Helpers
======================= */
const round2 = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const toNum = (v) => Number(v) || 0;
const format2 = (n) => Number(n).toFixed(2);

const CategorySalesReport = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ SAFE STATE ACCESS
  const category = location.state?.category || null;
  const date = location.state?.date || null;

  const [productList, setProductList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [partyMap, setPartyMap] = useState({});

  /* =======================
     FETCH PARTY NAMES
  ======================= */
  useEffect(() => {
    const partiesRef = ref(db, "parties");

    const unsub = onValue(partiesRef, (snap) => {
      const data = snap.val() || {};
      const map = {};

      Object.entries(data).forEach(([id, party]) => {
        map[id] = party?.name || id;
      });

      setPartyMap(map);
    });

    return () => unsub();
  }, []);

  /* =======================
     FETCH SALES DATA
  ======================= */
  useEffect(() => {
    if (!category || !date) return;

    const salesRef = ref(db, "sales");

    const unsub = onValue(salesRef, (snap) => {
      const data = snap.val() || {};

      const productsSet = new Set();
      const tempData = [];

      Object.values(data).forEach((timeNode) => {
        Object.values(timeNode).forEach((invoice) => {
          if (!invoice?.items || !invoice.createdAt) return;

          // Match date from createdAt
          const invoiceDate = invoice.createdAt.split("T")[0];
          if (invoiceDate !== date) return;

          const filteredItems = invoice.items.filter(
            (item) => item.category === category
          );

          if (filteredItems.length === 0) return;

          filteredItems.forEach((item) =>
            productsSet.add(item.productName)
          );

          const productGroups = {};

          filteredItems.forEach((item) => {
            const prod = item.productName;
            const price = toNum(item.pricePerItem);
            const box = toNum(item.box);

            if (!productGroups[prod]) productGroups[prod] = {};
            if (!productGroups[prod][price]) productGroups[prod][price] = 0;

            productGroups[prod][price] += box;
          });

          const maxRows = Math.max(
            ...Object.values(productGroups).map(
              (priceMap) => Object.keys(priceMap).length
            )
          );

          for (let i = 0; i < maxRows; i++) {
            const row = {
              invoiceNumber: invoice.invoiceNumber,
              partyName: partyMap[invoice.partyId] || invoice.partyId,
              products: {},
            };

            Object.keys(productGroups).forEach((prod) => {
              const prices = Object.entries(productGroups[prod]).sort(
                ([a], [b]) => a - b
              );

              row.products[prod] = prices[i]
                ? {
                    box: toNum(prices[i][1]),
                    price: toNum(prices[i][0]),
                    display: `${prices[i][1]} / ${format2(prices[i][0])}`,
                  }
                : null;
            });

            tempData.push(row);
          }
        });
      });

      setProductList([...productsSet]);
      setTableData(tempData);
    });

    return () => unsub();
  }, [category, date, partyMap]);

  /* =======================
     TOTALS
  ======================= */
  const totals = {};
  productList.forEach((prod) => {
    totals[prod] = round2(
      tableData.reduce((sum, row) => {
        const cell = row.products[prod];
        return sum + (cell ? toNum(cell.box) : 0);
      }, 0)
    );
  });

  /* =======================
     GUARD UI (VERY IMPORTANT)
  ======================= */
  if (!category || !date) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">
          Missing report data
        </h2>
        <p className="text-gray-600">
          Please open this report from the Sales page.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <div className="max-w-7xl mx-auto mt-10 p-4 space-y-4">
      {/* HEADER */}
      <div className="relative border-b pb-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute left-0 h-9 w-9 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-xl font-semibold">
          {category}
        </h1>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3">Invoice</th>
              <th className="border p-3">Party</th>
              {productList.map((p) => (
                <th key={p} className="border p-3">
                  {p}
                </th>
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
                          navigate("/sales/view-invoice", {
                            state: { invoiceNumber: row.invoiceNumber },
                          })
                        }
                      >
                        {row.invoiceNumber}
                      </button>
                    </td>

                    <td className="border p-3 font-medium">
                      {row.partyName}
                    </td>

                    {productList.map((prod) => (
                      <td key={prod} className="border p-3">
                        {row.products[prod]?.display || "-"}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* TOTALS */}
                <tr className="bg-gray-200 font-semibold">
                  <td colSpan={2} className="border p-3 text-right">
                    Total Boxes
                  </td>
                  {productList.map((prod) => (
                    <td key={prod} className="border p-3">
                      {totals[prod]}
                    </td>
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
