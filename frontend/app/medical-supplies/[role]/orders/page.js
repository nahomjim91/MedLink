"use client";
import { useState } from "react";
import { TableCard, StatCard, OrderStatCard } from "../../components/ui/Cards";

const ordersData = [
  {
    id: 1,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Ongoing",
  },
  {
    id: 2,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Cancel",
  },
  {
    id: 3,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Out For delivery",
  },
  {
    id: 4,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Cancel",
  },
  {
    id: 5,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Delivered",
  },
  {
    id: 6,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Ongoing",
  },
  {
    id: 7,
    orderBy: "XYZ",
    orderValue: "$430",
    items: "43 Packets",
    orderNo: "#12345678",
    expectedDelivery: "11/12/22",
    status: "Delivered",
  },
  { id: 8, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Cancel" },
  // { id: 9, orderBy: "XYZ", orderValue: "$430", items: "43 Packets", orderNo: "#12345678", expectedDelivery: "11/12/22", status: "Ongoing" },
];

const ordersColumns = [
  { key: "orderBy", label: "Order By" },
  { key: "orderValue", label: "Order Value" },
  { key: "items", label: "Items" },
  { key: "orderNo", label: "Order No." },
  { key: "expectedDelivery", label: "Expected Delivery" },
  { key: "status", label: "Status" },
];

export default function OrdersPage() {
  const [ordersPage, setOrdersPage] = useState(1);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex gap-4">
        <OrderStatCard title="Total Orders" metrics={[{ value: "37" }]} />
        <OrderStatCard
          title="Total Received"
          metrics={[{ value: "32" }, { value: "$25000" }]}
          subtitle="Revenue"
        />
        <OrderStatCard
          title="Total Cancelled"
          metrics={[{ value: "5" }, { value: "$5000" }]}
          subtitle="Costs"
        />
        <OrderStatCard
          title="Ongoing Orders"
          metrics={[{ value: "5" }, { value: "$5000" }]}
          subtitle="Costs"
        />
      </div>
      <div className="w-full ">
        <TableCard
          title="Orders"
          data={ordersData}
          columns={ordersColumns}
          page={ordersPage}
          totalPages={10}
          onPageChange={setOrdersPage}
          onAddItem={() => handleAction("Add Order")}
          onFilter={() => handleAction("Filter Orders")}
          onDownload={() => handleAction("Order History")}
        />
      </div>
    </div>
  );
}
