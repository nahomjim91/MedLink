"use client";

import { useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ALL_DOCTORS,
  GET_AVAILABLE_SLOTS_BY_DATE,
} from "../../api/graphql/queries";
import { CREATE_APPOINTMENT } from "../../api/graphql/mutations";

const localizer = momentLocalizer(moment);

const viewTabs = [
  { label: "Month", value: Views.MONTH },
  { label: "Week", value: Views.WEEK },
  { label: "Day", value: Views.DAY },
];

export default function PatientAppointmentsPage() {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data: doctorsData, loading: doctorsLoading } =
    useQuery(GET_ALL_DOCTORS);
  const { data: slotsData, loading: slotsLoading } = useQuery(
    GET_AVAILABLE_SLOTS_BY_DATE,
    {
      variables: {
        doctorId: selectedDoctor,
        date: date.toISOString(),
      },
      skip: !selectedDoctor,
    }
  );

  const [createAppointment, { loading: creating }] = useMutation(
    CREATE_APPOINTMENT,
    {
      onCompleted: () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      },
      onError: (err) => {
        setError(err.message);
        setTimeout(() => setError(""), 3000);
      },
    }
  );

  const handleBookAppointment = async (slot) => {
    if (!selectedDoctor) {
      setError("Please select a doctor first");
      return;
    }

    try {
      const doctor = doctorsData.allDoctors.find(
        (d) => d.doctorId === selectedDoctor
      );
      await createAppointment({
        variables: {
          input: {
            doctorId: selectedDoctor,
            doctorName: doctor.displayName,
            scheduledStartTime: new Date(slot.startTime),
            scheduledEndTime: new Date(slot.endTime),
          },
        },
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const events =
    slotsData?.availableSlotsByDate?.map((slot) => ({
      id: slot.slotId,
      title: "Available Slot",
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      resource: slot,
    })) || [];

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Book an Appointment</h1>
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
            onSelectEvent={(event) => handleBookAppointment(event.resource)}
            popup
          />
        </div>
      </div>

      <div className="w-80 bg-white rounded-xl m-6 shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Select Doctor</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Appointment booked successfully!
          </div>
        )}
        <select
          className="border rounded px-3 py-2 w-full mb-4"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          disabled={doctorsLoading}
        >
          <option value="">Select a doctor</option>
          {doctorsData?.allDoctors?.map((doctor) => (
            <option key={doctor.doctorId} value={doctor.doctorId}>
              {doctor.displayName} - {doctor.specialization}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-600">
          Select a doctor to view their available slots. Click on a slot to book
          an appointment.
        </p>
      </div>
    </div>
  );
}
