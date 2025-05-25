//  downloadOrderReceipt function for your React component
export const downloadOrderReceipt = (data, otherUserData, user) => {
  if (!data?.order) return;

  const order = data.order;
  const otherUser = otherUserData?.msUserById;
  const isCurrentUserBuyer = order.buyerId === user.userId;
  const currentDate = new Date().toLocaleDateString();
  const totalQuantity = allBatchItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const avgUnitPrice = order.totalCost / totalQuantity;

  // Create a new window for PDF generation
  const printWindow = window.open("", "_blank");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Inventory Receipt - ${order.orderId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.5; 
      color: #2c3e50; 
      background: #f8fafc;
      padding: 20px;
    }
    
    .receipt-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    /* Header Section - Using teal colors to match your UI */
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 15px;
    }
    
    .header .order-meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      font-size: 14px;
      opacity: 0.8;
    }
    
    /* Quick Stats Bar */
    .stats-bar {
      background: #374151;
      color: white;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      text-align: center;
    }
    
    .stat-item h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
      margin-bottom: 5px;
    }
    
    .stat-item .value {
      font-size: 20px;
      font-weight: bold;
    }
    
    /* Main Content */
    .content {
      padding: 30px;
    }
    
    /* Section Headers */
    .section {
      margin-bottom: 30px;
    }
    
    .section-header {
      background: #f0fdfa;
      padding: 12px 20px;
      margin: 0 -30px 20px -30px;
      border-left: 4px solid #0d9488;
    }
    
    .section-header h2 {
      color: #2c3e50;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    /* Order & Participant Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .info-card {
      background: #f8fafc;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 20px;
    }
    
    .info-card h3 {
      color: #2c3e50;
      font-size: 16px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #0d9488;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 600;
      color: #5a6c7d;
      font-size: 14px;
    }
    
    .info-value {
      color: #2c3e50;
      font-weight: 500;
    }
    
    /* Status Badges */
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-confirmed, .status-completed, .status-paid, .status-received {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    
    .status-cancelled, .status-failed {
      background: #fecaca;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
    
    .status-delivered {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    
    /* Inventory Table */
    .inventory-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .inventory-table thead {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: white;
    }
    
    .inventory-table th {
      padding: 15px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .inventory-table td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 14px;
      vertical-align: middle;
    }
    
    .inventory-table tbody tr:hover {
      background: #f0fdfa;
    }
    
    .inventory-table tbody tr:nth-child(even) {
      background: #fdfdfd;
    }
    
    .batch-id {
      font-family: 'Courier New', monospace;
      background: #f0fdfa;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      color: #0f766e;
    }
    
    .expiry-date {
      font-weight: 500;
      color: #dc2626;
    }
    
    .quantity {
      text-align: center;
      font-weight: 600;
      color: #059669;
    }
    
    .price {
      text-align: right;
      font-weight: 500;
      font-family: 'Courier New', monospace;
    }
    
    /* Total Row */
    .total-row {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important;
      color: white !important;
      font-weight: 700;
    }
    
    .total-row td {
      border-bottom: none !important;
      font-size: 16px;
    }
    
    /* Compliance Section */
    .compliance-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .compliance-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f0fdfa;
      border-radius: 6px;
      border-left: 3px solid #10b981;
    }
    
    .compliance-icon {
      width: 20px;
      height: 20px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    }
    
    /* Footer */
    .footer {
      background: #374151;
      color: white;
      padding: 25px 30px;
      text-align: center;
      margin-top: 30px;
    }
    
    .footer p {
      font-size: 13px;
      opacity: 0.8;
      margin-bottom: 5px;
    }
    
    .footer .company-info {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #4b5563;
    }
    
    /* Print Styles */
    @media print {
      body { background: white; padding: 0; }
      .receipt-container { box-shadow: none; }
      .header { background: #0d9488 !important; -webkit-print-color-adjust: exact; }
      .stats-bar { background: #374151 !important; -webkit-print-color-adjust: exact; }
      .total-row { background: #0d9488 !important; -webkit-print-color-adjust: exact; }
      .footer { background: #374151 !important; -webkit-print-color-adjust: exact; }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .info-grid { grid-template-columns: 1fr; }
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .compliance-grid { grid-template-columns: 1fr; }
      .header .order-meta { flex-direction: column; gap: 10px; }
      .inventory-table { font-size: 12px; }
      .inventory-table th, .inventory-table td { padding: 8px 6px; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header Section -->
    <div class="header">
      <h1>📋 INVENTORY RECEIPT</h1>
      <div class="subtitle">Purchase Order Documentation</div>
      <div class="order-meta">
        <span>Order ID: #${order.orderId}</span>
        <span>•</span>
        <span>Generated: ${currentDate}</span>
        <span>•</span>
        <span>Type: ${
          isCurrentUserBuyer ? "PURCHASE ORDER" : "SALES ORDER"
        }</span>
      </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="stats-bar">
      <div class="stat-item">
        <h4>Total Items</h4>
        <div class="value">${order.items.length}</div>
      </div>
      <div class="stat-item">
        <h4>Total Quantity</h4>
        <div class="value">${totalQuantity.toLocaleString()}</div>
      </div>
      <div class="stat-item">
        <h4>Total Value</h4>
        <div class="value">$${order.totalCost.toFixed(2)}</div>
      </div>
      <div class="stat-item">
        <h4>Avg Unit Price</h4>
        <div class="value">$${avgUnitPrice.toFixed(2)}</div>
      </div>
    </div>

    <div class="content">
      <!-- Order Information -->
      <div class="section">
        <div class="section-header">
          <h2>📋 Order & Transaction Details</h2>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>Order Information</h3>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="status-badge status-${order.status.toLowerCase()}">${order.status.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Status:</span>
              <span class="status-badge status-${order.paymentStatus.toLowerCase()}">${order.paymentStatus.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span class="info-value">${new Date(
                order.orderDate
              ).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">#${
                order.transactionId || "TXN" + order.orderId
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Received Date:</span>
              <span class="info-value">${
                order.pickupConfirmedDate
                  ? new Date(order.pickupConfirmedDate).toLocaleDateString()
                  : "Pending"
              }</span>
            </div>
          </div>

          <div class="info-card">
            <h3>🏢 ${isCurrentUserBuyer ? "Supplier" : "Buyer"} Details</h3>
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span class="info-value">${
                otherUser?.companyName ||
                (isCurrentUserBuyer
                  ? order.sellerCompanyName
                  : order.buyerCompanyName) ||
                "N/A"
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact Person:</span>
              <span class="info-value">${
                isCurrentUserBuyer ? order.sellerName : order.buyerName
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${otherUser?.email || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">License Status:</span>
              <span class="info-value">${
                otherUser?.businessLicenseUrl ? "✓ Verified" : "Not Available"
              }</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Details -->
      <div class="section">
        <div class="section-header">
          <h2>📦 Inventory Items ${
            isCurrentUserBuyer ? "Received" : "Sold"
          }</h2>
        </div>
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Batch/Lot #</th>
              <th>Manufacturer</th>
              <th>Expiry Date</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${allBatchItems
              .map(
                (item) => `
            <tr>
              <td><strong>${
                item.productName
              }</strong><br><small>Batch Item</small></td>
              <td><span class="batch-id">#${item.batchId}</span></td>
              <td>N/A</td>
              <td><span class="expiry-date">${
                item.expiryDate
                  ? new Date(item.expiryDate).toLocaleDateString()
                  : "N/A"
              }</span></td>
              <td class="quantity">${item.quantity}</td>
              <td class="price">$${item.unitPrice.toFixed(2)}</td>
              <td class="price">$${item.subtotal.toFixed(2)}</td>
            </tr>
            `
              )
              .join("")}
            <tr class="total-row">
              <td colspan="4"><strong>TOTAL INVENTORY ${
                isCurrentUserBuyer ? "RECEIVED" : "SOLD"
              }</strong></td>
              <td class="quantity"><strong>${totalQuantity.toLocaleString()}</strong></td>
              <td class="price"><strong>—</strong></td>
              <td class="price"><strong>$${order.totalCost.toFixed(
                2
              )}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Compliance & Verification -->
      <div class="section">
        <div class="section-header">
          <h2>✅ Compliance & Verification</h2>
        </div>
        <div class="compliance-grid">
          <div class="compliance-item">
            <div class="compliance-icon">✓</div>
            <div>
              <strong>FDA License</strong><br>
              <small>${
                otherUser?.efdaLicenseUrl
                  ? "Verified & Current"
                  : "Not Available"
              }</small>
            </div>
          </div>
          <div class="compliance-item">
            <div class="compliance-icon">✓</div>
            <div>
              <strong>Business License</strong><br>
              <small>${
                otherUser?.businessLicenseUrl
                  ? "Valid License on File"
                  : "Not Available"
              }</small>
            </div>
          </div>
          <div class="compliance-item">
            <div class="compliance-icon">✓</div>
            <div>
              <strong>Order Verified</strong><br>
              <small>Transaction Completed</small>
            </div>
          </div>
          <div class="compliance-item">
            <div class="compliance-icon">✓</div>
            <div>
              <strong>Quality Assurance</strong><br>
              <small>All items verified</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Inventory Receipt Confirmation</strong></p>
      <p>This document serves as proof of goods ${
        isCurrentUserBuyer ? "received" : "sold"
      } and payment processed.</p>
      <p>All items have been verified against the original purchase order.</p>
      <div class="company-info">
        <p>Generated by MedLink Medical Supply and Management System | For support: support@medlink.com | © 2025</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};
