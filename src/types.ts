export type Role = 'doctor' | 'patient' | 'admin' | 'secretary';

export interface User {
  cedula: string;
  name: string;
  role: Role;
  sedeName?: string;
  specialty?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'called'
  | 'in-attendance'
  | 'attended'
  | 'absent'
  | 'rescheduled';

export interface Appointment {
  id: string;
  patientCedula: string;
  patientName: string;
  scheduledTime: string;
  scheduledDate?: string;
  status: AppointmentStatus;
  ticketNumber: number;
  checkInTime?: number;
  calledAt?: number;
  gpsDistance?: number;
  attendanceStartAt?: number;
  attendanceEndAt?: number;
  rescheduleCount: number;
  doctorCedula?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  reason?: string;
}

export interface SedeConfig {
  name: string;
  address: string;
  lat: number;
  lng: number;
  consultationMinutes: number;
  geofenceRadius: number;
}

export interface DoctorScheduleEntry {
  id: string;
  doctorCedula: string;
  scheduleDate: string; // YYYY-MM-DD
  startHour: string; // HH:MM
  endHour: string; // HH:MM
}

export interface DisabledTimeSlot {
  doctorCedula: string;
  scheduleDate: string; // YYYY-MM-DD
  slotTime: string; // HH:MM
}

export interface AppData {
  users: User[];
  appointments: Appointment[];
  sede: SedeConfig;
  nextTicketNumber: number;
  currentCalledId: string | null;
  countdownEndsAt: number | null;
  attendedCount: number;
  totalConsultationMinutes: number;
  doctorAvailability: DoctorAvailability[];
  doctorSchedule: DoctorScheduleEntry[];
  disabledTimeSlots: DisabledTimeSlot[];
}

export interface DoctorAvailability {
  doctorCedula: string;
  availableDays: number[];
  startHour: string;
  endHour: string;
  dailyCapacity: number;
}

export const COUNTDOWN_SECONDS = 180;
