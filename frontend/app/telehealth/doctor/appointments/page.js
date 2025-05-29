"use client";

import { useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DOCTOR_APPOINTMENTS,
  GET_DOCTOR_AVAILABLE_SLOTS,
} from "../../api/graphql/queries";
import {
  Create_Available_Slot,
  REMOVE_AVAILABLE_SLOT,
  UPDATE_APPOINTMENT,
} from "../../api/graphql/mutations";
import { useAuth } from "../../hooks/useAuth";

const localizer = momentLocalizer(moment);

const viewTabs = [
  { label: "Month", value: Views.MONTH },
  { label: "Week", value: Views.WEEK },
  { label: "Day", value: Views.DAY },
];

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [slot, setSlot] = useState({
    date: "",
    from: "10:30",
    to: "11:30",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("appointments"); // "appointments" or "slots"
  //   console.log("User:", user);

  // Fetch both appointments and available slots
  const {
    data: appointmentsData,
    loading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery(GET_DOCTOR_APPOINTMENTS, {
    variables: { doctorId: user?.id },
    skip: !user?.id,
  });

  const {
    data: slotsData,
    loading: slotsLoading,
    refetch: refetchSlots,
  } = useQuery(GET_DOCTOR_AVAILABLE_SLOTS, {
    variables: { doctorId: user?.id },
    skip: !user?.id,
  });

  const [addSlot, { loading: adding }] = useMutation(Create_Available_Slot, {
    onCompleted: () => {
      setSuccess(true);
      setSlot({ date: "", from: "", to: "" });
      refetchSlots();
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    },
  });

  const [removeSlot] = useMutation(REMOVE_AVAILABLE_SLOT, {
    onCompleted: () => {
      refetchSlots();
    },
  });

  const [updateAppointment] = useMutation(UPDATE_APPOINTMENT, {
    onCompleted: () => {
      refetchAppointments();
    },
  });

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!slot.date || !slot.from || !slot.to) return;
    console.log(
      "Adding slot:",
      "startTime: ",
      new Date(`${slot.date}T${slot.from}`),
      "endTime: ",
      new Date(`${slot.date}T${slot.to}`)
    );

    try {
      await addSlot({
        variables: {
          input: {
            startTime: new Date(`${slot.date}T${slot.from}`),
            endTime: new Date(`${slot.date}T${slot.to}`),
          },
        },
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRemoveSlot = async (slotId) => {
    if (!confirm("Are you sure you want to remove this slot?")) return;

    try {
      await removeSlot({
        variables: { slotId },
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdateAppointment = async (appointmentId, status) => {
    try {
      await updateAppointment({
        variables: {
          id: appointmentId,
          input: { status },
        },
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Combine appointments and slots for the calendar
  const events = [
    ...(appointmentsData?.doctorAppointments?.map((appointment) => ({
      id: appointment.appointmentId,
      title: `Appointment with ${appointment.patientName}`,
      start: new Date(appointment.scheduledStartTime),
      end: new Date(appointment.scheduledEndTime),
      resource: appointment,
      type: "appointment",
    })) || []),
    ...(slotsData?.doctorAvailableSlots?.map((slot) => ({
      id: slot.slotId,
      title: "Available Slot",
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      resource: slot,
      type: "slot",
    })) || []),
  ];

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">
            Appointments & Available Slots
          </h1>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 rounded ${
                activeTab === "appointments"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("slots")}
              className={`px-4 py-2 rounded ${
                activeTab === "slots" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Available Slots
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            {viewTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}
                className={`px-4 py-2 rounded ${
                  view === tab.value ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={(event) => {
              if (event.type === "slot") {
                handleRemoveSlot(event.resource.slotId);
              } else if (event.type === "appointment") {
                // Show appointment details and actions
                const status = prompt(
                  "Update appointment status (CONFIRMED/CANCELLED/COMPLETED):",
                  event.resource.status
                );
                if (status) {
                  handleUpdateAppointment(event.resource.appointmentId, status);
                }
              }
            }}
            popup
          />
        </div>
      </div>

      {activeTab === "slots" && (
        <div className="w-80 bg-white rounded-xl m-6 shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Slot</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Slot added successfully!
            </div>
          )}
          <form className="flex flex-col gap-4" onSubmit={handleAddSlot}>
            <div>
              <label className="text-sm">Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full"
                value={slot.date}
                onChange={(e) => setSlot({ ...slot, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm">From</label>
              <input
                type="time"
                className="border rounded px-3 py-2 w-full"
                value={slot.from}
                onChange={(e) => setSlot({ ...slot, from: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm">To</label>
              <input
                type="time"
                className="border rounded px-3 py-2 w-full"
                value={slot.to}
                onChange={(e) => setSlot({ ...slot, to: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={adding}
            >
              {adding ? "Adding..." : "Add Slot"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
