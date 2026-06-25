import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const generateExcelReport = (
  metrics: any, 
  chartData: any, 
  productPerformance: any, 
  lowStockProducts: any[], 
  topCustomers: any[], 
  paymentModeData: any, 
  inventoryValue: number, 
  inventoryMovements: any[], 
  bills: any[], 
  categoryData: any,
  profile: any,
  inventory?: any[]
) => {
  const wb = XLSX.utils.book_new();

  // Helper to auto-fit columns for pristine layout
  const fitColumns = (ws: XLSX.WorkSheet, rows: any[][]) => {
    const colWidths = rows.reduce((widths, row) => {
      row.forEach((cell, i) => {
        const val = cell !== null && cell !== undefined ? String(cell) : "";
        widths[i] = Math.max(widths[i] || 12, val.length + 3);
      });
      return widths;
    }, [] as number[]);
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
  };

  const getSafeDateString = (dateInput: any) => {
    if (!dateInput) return "N/A";
    try {
      return format(new Date(dateInput), "dd MMM yyyy, hh:mm a");
    } catch(e) {
      return String(dateInput);
    }
  };

  const getSafeSimpleDate = (dateInput: any) => {
    if (!dateInput) return "N/A";
    try {
      return format(new Date(dateInput), "dd MMM yyyy");
    } catch(e) {
      return String(dateInput);
    }
  };

  // Pre-index collections for optimized O(1) constant time lookups.
  // This transitions Excel generation from an O(N^2) quadratic nested scan down to a single-pass O(N) linear scan,
  // resolving the browser freeze, memory spike, and system UI hang issues on users' laptops.
  const inventoryByName = new Map<string, any>();
  (inventory || []).forEach(item => {
    if (item.name) {
      inventoryByName.set(item.name.toLowerCase(), item);
    }
  });

  const billsByPhone = new Map<string, any[]>();
  const billsByName = new Map<string, any[]>();
  (bills || []).forEach(b => {
    const phone = b.customerDetails?.phone;
    if (phone) {
      if (!billsByPhone.has(phone)) billsByPhone.set(phone, []);
      billsByPhone.get(phone)!.push(b);
    }
    const name = b.customerDetails?.name;
    if (name) {
      if (!billsByName.has(name)) billsByName.set(name, []);
      billsByName.get(name)!.push(b);
    }
  });

  // 1. SHEET 1: Core Executive Metrics (Always Present)
  const summaryRows = [
    ["EXECUTIVE MANAGEMENT KPI REPORT", ""],
    ["Generated On", format(new Date(), "dd MMM yyyy, hh:mm a")],
    [],
    ["[A] BUSINESS PROFILE DETAILS", ""],
    ["Shop / Business Name", profile?.shopName || profile?.businessName || "My Business"],
    ["Proprietor Name", profile?.ownerName || "N/A"],
    ["Primary Contact", profile?.phone || "N/A"],
    ["Alternate Contact", profile?.alternatePhone || "N/A"],
    ["Registered Address", profile?.address || "N/A"],
    ["GST Registration Number (GSTIN)", profile?.gstNumber || "Not Provided"],
    ["UPI Payments ID Address", profile?.upiId || "Not Provided"],
    [],
    ["[B] AGGREGATE FINANCIAL PERFORMANCE METRICS", ""],
    ["Gross Revenue (Sales Volume)", metrics?.totalRevenue || 0],
    ["Operating Profit Worth", metrics?.totalProfit || 0],
    ["Relative Margin Efficiency (%)", metrics?.profitMargin !== undefined ? `${metrics.profitMargin.toFixed(2)}%` : "0%"],
    ["Total Invoice Count", metrics?.totalInvoices || 0],
    ["Consolidated Dues / Outstanding Credit Bills", bills?.reduce((acc: number, b: any) => acc + (b.balanceAmount || 0), 0) || 0],
    ["Unique Active Client base", metrics?.totalCustomers || 0],
    ["Average Billing Ticket Value", Math.floor(metrics?.averageBillValue || 0)],
    ["Bulk Stock Assets Current Valuation (Cost)", inventoryValue || 0]
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  fitColumns(ws1, summaryRows);
  XLSX.utils.book_append_sheet(wb, ws1, "Executive Metrics");

  // 2. SHEET 2: Invoice Ledger Register (Conditional: Only if bills exist)
  if (bills && bills.length > 0) {
    const invoiceRows = [
      [
        "Invoice Number", "Created Date", "Payment Status", "Customer Name", 
        "Customer Phone", "Customer Address", "Customer GSTIN", "Subtotal Amount (₹)", 
        "Discounts Deducted (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", 
        "Combined Tax / GST amount (₹)", "Invoice Grand Total (₹)", "Paid Amount Recd (₹)", 
        "Remaining Outstanding Balance (₹)", "Settlement Mode"
      ]
    ];
    bills.forEach((bill: any) => {
      const combinedGst = (bill.cgstAmount || 0) + (bill.sgstAmount || 0) + (bill.igstAmount || 0) + (bill.gstAmount || 0);
      invoiceRows.push([
        bill.invoiceNumber || bill.billId || "N/A",
        getSafeSimpleDate(bill.createdAt || bill.invoiceDate),
        bill.paymentStatus || "N/A",
        bill.customerDetails?.name || "Walk-in Customer",
        bill.customerDetails?.phone || "N/A",
        bill.customerDetails?.address || "N/A",
        bill.customerDetails?.gstNumber || "N/A",
        bill.subTotal || bill.totalAmount || 0,
        bill.discountAmount || 0,
        bill.cgstAmount || 0,
        bill.sgstAmount || 0,
        bill.igstAmount || 0,
        combinedGst,
        bill.totalAmount || 0,
        bill.paidAmount !== undefined ? bill.paidAmount : (bill.totalAmount || 0),
        bill.balanceAmount !== undefined ? bill.balanceAmount : 0,
        bill.paymentMode || "CASH"
      ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(invoiceRows);
    fitColumns(ws2, invoiceRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Invoice Ledger");
  }

  // 3. SHEET 3: Merchandise Sales Summary (Conditional: Only if product performance records exist)
  if (productPerformance && productPerformance.length > 0) {
    const productRows = [
      [
        "Product Name", "Category Group", "SKU Designation", "HSN Protocol", 
        "Aggregated Quantity Sold", "Units Of Measure", "Average Selling Price (₹)", 
        "Consolidated Sale Value (₹)", "Est. Stock Cost (₹)", "Generated Profit Quotient (₹)"
      ]
    ];
    productPerformance.forEach((prod: any) => {
      const refItem = prod.name ? inventoryByName.get(prod.name.toLowerCase()) : undefined;
      const estCost = (refItem?.purchasePrice || prod.price * 0.7) * (prod.qty ?? prod.quantity ?? 1);
      const profit = (prod.revenue || 0) - estCost;

      productRows.push([
        prod.name || "N/A",
        refItem?.category || "Uncategorized",
        refItem?.sku || "N/A",
        refItem?.hsn || "N/A",
        prod.qty ?? prod.quantity ?? 0,
        refItem?.unit || "pcs",
        Math.floor((prod.revenue || 0) / (prod.qty ?? prod.quantity ?? 1)),
        prod.revenue || 0,
        estCost,
        profit
      ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(productRows);
    fitColumns(ws3, productRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Merchandise Sales");
  }

  // 4. SHEET 4: Client Accounts Directory (Conditional: Only if top customers database elements exist)
  if (topCustomers && topCustomers.length > 0) {
    const customerRows = [
      [
        "Client / Customer Name", "Contact Mobile", "Billing Address", 
        "GSTIN Protocol", "Aggregate Invoices Generated", "Gross Receipts Volume (₹)", 
        "Settled Cash Book Payments (₹)", "Credit Outstanding Dues (₹)"
      ]
    ];
    topCustomers.forEach((cust: any) => {
      const billsByPh = cust.phone ? (billsByPhone.get(cust.phone) || []) : [];
      const billsByNm = cust.name ? (billsByName.get(cust.name) || []) : [];
      
      // Combine list without duplicates
      const clientBillsSet = new Set([...billsByPh, ...billsByNm]);
      const clientBills = Array.from(clientBillsSet);

      const matchBill = clientBills[0];
      const outstandingDues = clientBills.reduce((acc: number, cur) => acc + (cur.balanceAmount || 0), 0);
      const totalPaid = clientBills.reduce((acc: number, cur) => acc + (cur.paidAmount || 0), 0);

      customerRows.push([
        cust.name || "Walk-in Customer",
        cust.phone || matchBill?.customerDetails?.phone || "N/A",
        matchBill?.customerDetails?.address || "N/A",
        matchBill?.customerDetails?.gstNumber || "N/A",
        cust.count ?? clientBills.length ?? 1,
        cust.revenue || 0,
        totalPaid,
        outstandingDues
      ]);
    });
    const ws4 = XLSX.utils.aoa_to_sheet(customerRows);
    fitColumns(ws4, customerRows);
    XLSX.utils.book_append_sheet(wb, ws4, "Client Accounts");
  }

  // 5. SHEET 5: Live Catalogue & Warehouse Catalog (Conditional: Only if catalog exists)
  const activeStockList = inventory || [];
  if (activeStockList.length > 0) {
    const inventoryRows = [
      [
        "Product Name", "Category Group", "SKU Identifier", "HSN Protocol", 
        "Unit of Measure (UoM)", "Purchase Cost (₹)", "Supplier Base Retail (₹)", 
        "Warehouse Stock Quantity", "Safety Alert Threshold", "Under-stock Danger Alert Status", 
        "Merchandise Supplier Name"
      ]
    ];
    activeStockList.forEach((item: any) => {
      const minAlertLimit = Number(item.minStockAlert ?? item.minStock ?? 5);
      const isCritical = Number(item.quantity ?? item.stock ?? 0) <= minAlertLimit;

      inventoryRows.push([
        item.name || "N/A",
        item.category || "Uncategorized",
        item.sku || "N/A",
        item.hsn || "N/A",
        item.unit || "pcs",
        item.purchasePrice || 0,
        item.sellingPrice || 0,
        item.quantity ?? item.stock ?? 0,
        minAlertLimit,
        isCritical ? "CRITICAL (Low Stock)" : "STABLE",
        item.supplierName || "N/A"
      ]);
    });
    const ws5 = XLSX.utils.aoa_to_sheet(inventoryRows);
    fitColumns(ws5, inventoryRows);
    XLSX.utils.book_append_sheet(wb, ws5, "Live Stock Catalog");
  }

  // 6. SHEET 6: System Ledger Movements log (Conditional: Only if ledger operations logged)
  if (inventoryMovements && inventoryMovements.length > 0) {
    const ledgerRows = [
      [
        "Movement Action Date", "Product Name", "SKU Designation", 
        "Ledger Action Code (IN / OUT)", "Delta Quantity", "Action Descriptor", 
        "Verification Context / Reason", "Reference ID"
      ]
    ];
    inventoryMovements.forEach((mov: any) => {
      ledgerRows.push([
        getSafeDateString(mov.date),
        mov.productName || "N/A",
        mov.sku || "N/A",
        mov.type || "N/A",
        mov.quantityChange ?? mov.quantity ?? 0,
        mov.actionType || "N/A",
        mov.reason || "N/A",
        mov.referenceId || "N/A"
      ]);
    });
    const ws6 = XLSX.utils.aoa_to_sheet(ledgerRows);
    fitColumns(ws6, ledgerRows);
    XLSX.utils.book_append_sheet(wb, ws6, "Stock Ledger movements");
  }

  // 7. SHEET 7: Category Mix Analysis (Conditional: Only if classification categories exist)
  if (categoryData && categoryData.length > 0) {
    const catRows = [
      ["Category Name / Sector", "Total Turnovers Volume Generated (₹)", "Acre Allocation share (%)"]
    ];
    const totalCatRevenue = categoryData.reduce((acc: number, d: any) => acc + d.value, 0) || 1;
    categoryData.forEach((cat: any) => {
      catRows.push([
        cat.name || "N/A",
        cat.value || 0,
        `${((cat.value / totalCatRevenue) * 100).toFixed(2)}%`
      ]);
    });
    const ws7 = XLSX.utils.aoa_to_sheet(catRows);
    fitColumns(ws7, catRows);
    XLSX.utils.book_append_sheet(wb, ws7, "Category Distribution");
  }

  // 8. SHEET 8: Payment Modes Breakdown (Conditional: Only if transactions processed)
  const isPaymentValid = paymentModeData && paymentModeData.some((d: any) => d.value > 0);
  if (isPaymentValid) {
    const paymentRows = [
      ["Settlement Channels", "Total Receipts Settled Volume (₹)", "Distribution share (%)"]
    ];
    const targetPayments = paymentModeData.filter((d: any) => d.value > 0);
    const totalPaymentsVolume = targetPayments.reduce((acc: number, d: any) => acc + d.value, 0) || 1;
    targetPayments.forEach((pay: any) => {
      paymentRows.push([
        pay.name || "N/A",
        pay.value || 0,
        `${((pay.value / totalPaymentsVolume) * 100).toFixed(2)}%`
      ]);
    });
    const ws8 = XLSX.utils.aoa_to_sheet(paymentRows);
    fitColumns(ws8, paymentRows);
    XLSX.utils.book_append_sheet(wb, ws8, "Payment Realizations");
  }

  // Writing output file
  const filePrefix = profile?.shopName 
    ? profile.shopName.replace(/[^a-zA-Z0-9]/g, "_") 
    : "SmartVyapar";
  const fileName = `${filePrefix}_OperationalLedger_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
};
