"use client";
import { useState } from "react";
import {TableCard, StatCard } from "../../components/ui/Cards";
import { BookMinus } from "lucide-react";

const icons = {
  categories: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
</svg>`,

  // Top Product Icon - star with product box
  topProduct: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"></path>
  <rect x="8" y="10" width="8" height="8" rx="1" stroke-dasharray="2"></rect>
</svg>`,

  // Top Selling Icon - upward trending chart with dollar sign
  topSelling: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 12L18 8L15 11L9 5L2 12"></path>
  <path d="M9 5L9 19"></path>
  <circle cx="9" cy="19" r="2"></circle>
  <path d="M14.5 14.5C14.5 12 16.5 11 16.5 11C16.5 11 18.5 12 18.5 14.5C18.5 17 16.5 18 16.5 18C16.5 18 14.5 17 14.5 14.5Z"></path>
  <path d="M16.5 13V16"></path>
  <path d="M15 14.5H18"></path>
</svg>`,

  // Low Stock Icon - depleted inventory with warning
  lowStock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 20H20"></path>
  <rect x="5" y="14" width="4" height="6"></rect>
  <rect x="15" y="16" width="4" height="4"></rect>
  <rect x="10" y="12" width="4" height="8"></rect>
  <path d="M12 7V9"></path>
  <path d="M12 3V5"></path>
</svg>`,
};

const productsData = [
  { id: 1, name: "Maggi", buyingPrice: "$430", quantity: "43 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "In- stock" },
  { id: 2, name: "Bru", buyingPrice: "$257", quantity: "22 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "Out of stock" },
  { id: 3, name: "Red Bull", buyingPrice: "$405", quantity: "36 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "In- stock" },
  { id: 4, name: "Bourn Vita", buyingPrice: "$502", quantity: "14 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "Out of stock" },
  { id: 5, name: "Horlicks", buyingPrice: "$530", quantity: "5 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "In- stock" },
  { id: 6, name: "Harpic", buyingPrice: "$605", quantity: "10 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "Out of stock" },
  { id: 7, name: "Ariel", buyingPrice: "$408", quantity: "23 Packets", stockLevel: "12 Packets", closestExpiry: "11/12/22", availability: "Out of stock" },
];

const ordersData = [
  { id: 1, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Ongoing" },
  { id: 2, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Cancel" },
  { id: 3, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Out For delivery" },
  { id: 4, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Cancel" },
  { id: 5, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Delivered" },
  { id: 6, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Ongoing" },
  { id: 7, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Delivered" },
  // { id: 8, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Cancel" },
  // { id: 9, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Ongoing" },
];

const productsColumns = [
  { key: 'name', label: 'Products' },
  { key: 'buyingPrice', label: 'Buying Price' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'stockLevel', label: 'Stock Level' },
  { key: 'closestExpiry', label: 'Closest Expiry' },
  { key: 'availability', label: 'Availability' },
];

const ordersColumns = [
  { key: 'orderBy', label: 'Order By' },
  { key: 'orderValue', label: 'Order Value' },
  { key: 'items', label: 'Items' },
  { key: 'orderNo', label: 'Order No.' },
  { key: 'expectedDelivery', label: 'Expected Delivery' },
  { key: 'status', label: 'Status' },
];

export default function InventoryPage() {
  const [ordersPage, setOrdersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);


  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex gap-4">
        <StatCard
          title="Categories"
          metrics={[
            { value: "Drugs", label: "" },
            { value: "Equipment", label: "" },
            { value: "15", label: "" },
            { value: "12", label: "" },
          ]}
          // icon={<BookMinus />}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.categories }}
              className="text-primary"
            />
          }
          subtitle="Last 7 days"
        />

        <StatCard
          title="Total Products"
          metrics={[
            { value: "150", label: "Last 7 days" },
            { value: "$254", label: "Revenue" },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.topProduct }}
              className="text-primary"
            />
          }
        />

        <StatCard
          title="Top Selling"
          metrics={[
            { value: "150", label: "Last 7 days" },
            { value: "$254", label: "Cost" },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.topSelling }}
              className="text-primary"
            />
          }
        />

        <StatCard
          title="Low Stocks"
          metrics={[
            { value: "12", label: "Ordered" },
            { value: "3", label: "Not in stock" },
          ]}
          icon={
            <div
              dangerouslySetInnerHTML={{ __html: icons.lowStock }}
              className="text-primary"
            />
          }
        />
      </div>
      <div className="w-full ">
      {/* <TableCard 
          title="Orders"
          data={ordersData}
          columns={ordersColumns}
          page={ordersPage}
          totalPages={10}
          onPageChange={setOrdersPage}
          onAddItem={() => handleAction('Add Order')}
          onFilter={() => handleAction('Filter Orders')}
          onDownload={() => handleAction('Order History')}
        /> */}
         <TableCard 
          title="Products"
          data={productsData}
          columns={productsColumns}
          page={productsPage}
          totalPages={10}
          onPageChange={setProductsPage}
          onAddItem={() => handleAction('Add Product')}
          onFilter={() => handleAction('Filter Products')}
          onDownload={() => handleAction('Download Products')}
        />
        {/* add product card */}
      </div>
    </div>
  );
}
