import { useState } from 'react';
import {
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  CheckCircle2,
  MapPin,
  Navigation,
  Loader2,
  AlertTriangle,
  User,
  CreditCard,
  Bell,
  Timer,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNow, formatCountdown } from '@/hooks/useNow';
import { COUNTDOWN_SECONDS } from '@/types';
import type { User as AppUser, Appointment } from '@/types';

interface MyAppointmentsProps {
  user: AppUser;
  onCheckedIn: () => void;
}

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} de ${MONTH_LABELS[m - 1]} de ${y}`;
}

function formatTime12h(time24: string): string {
  if (!time24 || time24 === '--:--') return time24;
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function MyAppointments({ user, onCheckedIn }: MyAppointmentsProps) {
  const { data, getMyScheduledAppointments, getMyAppointment, getQueuePosition, checkIn } = useApp();
  const { checkLocation, simulateNear, result, loading: geoLoading } = useGeolocation(
    data.sede.lat,
    data.sede.lng,
    data.sede.geofenceRadius,
  );
  const now = useNow(1000);
  const [checkInBusy, setCheckInBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  const scheduledAppts = getMyScheduledAppointments(user.cedula);
  const activeAppt = getMyAppointment(user.cedula);
  const position = activeAppt ? getQueuePosition(user.cedula) : -1;

  const geoOk = result.status === 'success' || result.status === 'simulated';

  const isCalled = activeAppt?.status === 'called';
  const countdownRemaining = isCalled && data.countdownEndsAt
    ? Math.max(0, Math.floor((data.countdownEndsAt - now) / 1000))
    : 0;

  // If patient has already checked in, show waiting screen content inline
  const hasCheckedIn = activeAppt && (activeAppt.status === 'checked-in' || activeAppt.status === 'called' || activeAppt.status === 'in-attendance' || activeAppt.status === 'rescheduled');

  const handleCheckIn = async () => {
    if (!geoOk || result.distance === null) {
      setFormError('Debes verificar tu ubicación primero.');
      return;
    }
    setCheckInBusy(true);
    const apt = await checkIn(user.cedula, user.name, result.distance);
    setCheckInBusy(false);
    if (apt) {
      onCheckedIn();
    } else {
      setFormError('No se pudo registrar el check-in. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] px-4 py-5 max-w-md mx-auto space-y-4">
      {/* Called alert — if patient was called */}
      {isCalled && (
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 shadow-xl shadow-red-200 text-white text-center animate-bounce-in">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-ring" />
            <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold mb-1">¡Has sido llamado!</h2>
          <p className="text-white/90 text-sm mb-4">Presentáte en el cubículo de atención</p>
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-2xl px-5 py-3 mb-3">
            <Timer className="w-7 h-7" />
            <span className="text-4xl font-extrabold font-mono tracking-tight">
              {formatCountdown(countdownRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Active queue status — if checked in */}
      {hasCheckedIn && activeAppt && (
        <div className={`rounded-3xl p-6 shadow-lg transition-all animate-slide-up ${
          activeAppt.status === 'in-attendance'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            : activeAppt.status === 'called'
              ? 'bg-white text-slate-800 border border-slate-100'
              : activeAppt.status === 'rescheduled'
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${activeAppt.status === 'called' ? 'text-slate-500' : 'text-white/70'}`}>
                Tu número de turno
              </p>
              <div className="text-5xl font-extrabold tracking-tight mt-1">
                #{String(activeAppt.ticketNumber).padStart(2, '0')}
              </div>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              activeAppt.status === 'called' ? 'bg-sky-50' : 'bg-white/20'
            }`}>
              {activeAppt.status === 'in-attendance' ? (
                <Stethoscope className="w-7 h-7" />
              ) : (
                <Clock className={`w-7 h-7 ${activeAppt.status === 'called' ? 'text-sky-600' : ''}`} />
              )}
            </div>
          </div>
          <div className={`h-px ${activeAppt.status === 'called' ? 'bg-slate-100' : 'bg-white/20'} mb-4`} />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${activeAppt.status === 'called' ? 'text-slate-500' : 'text-white/80'}`}>
                Estado
              </span>
              <span className={`font-bold ${activeAppt.status === 'called' ? 'text-slate-800' : ''}`}>
                {activeAppt.status === 'checked-in' && 'En fila de espera'}
                {activeAppt.status === 'called' && '¡Llamado!'}
                {activeAppt.status === 'in-attendance' && 'En consulta'}
                {activeAppt.status === 'rescheduled' && 'Reagendado'}
              </span>
            </div>
            {(activeAppt.status === 'checked-in' || activeAppt.status === 'rescheduled') && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">
                    Posición en fila
                  </span>
                  <span className="font-bold">
                    {position >= 0 ? `#${position + 1}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">
                    Pacientes antes que tú
                  </span>
                  <span className="font-bold text-lg">
                    {position >= 0 ? position : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scheduled appointments — visible BEFORE check-in */}
      {scheduledAppts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            Mis Citas Programadas
          </h2>
          {scheduledAppts.map((apt) => (
            <AppointmentDetailCard key={apt.id} apt={apt} users={data.users} />
          ))}
        </div>
      )}

      {/* Check-in section — always visible when patient has a scheduled appointment and hasn't checked in */}
      {scheduledAppts.some((a) => a.status === 'scheduled') && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            Realizar Check-in
          </h2>
          <p className="text-sm text-slate-500">
            Cuando te encuentres físicamente en el centro de salud, verifica tu ubicación y confirma tu llegada.
          </p>

          {/* Sede info */}
          <div className="bg-sky-50 rounded-xl p-3 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{data.sede.name}</p>
              <p className="text-sm text-slate-500">{data.sede.address}</p>
              <p className="text-xs text-sky-600 mt-1">
                Zona de check-in: {data.sede.geofenceRadius}m a la redonda
              </p>
            </div>
          </div>

          {!showCheckInForm ? (
            <button
              onClick={() => setShowCheckInForm(true)}
              className="w-full bg-emerald-500 text-white font-semibold py-3.5 rounded-xl
                         hover:bg-emerald-600 active:scale-[0.98] transition-all
                         flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
            >
              <CheckCircle2 className="w-5 h-5" />
              Realizar Check-in / Confirmar Asistencia
            </button>
          ) : (
            <div className="space-y-3 animate-slide-up">
              {/* GPS verification */}
              <button
                onClick={checkLocation}
                disabled={geoLoading}
                className="w-full bg-sky-600 text-white font-semibold py-3.5 rounded-xl
                           hover:bg-sky-700 active:scale-[0.98] transition-all
                           disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
              >
                {geoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
                {geoLoading ? 'Verificando...' : 'Verificar Ubicación por GPS'}
              </button>

              <button
                onClick={simulateNear}
                className="w-full text-sm text-sky-600 py-2 rounded-lg hover:bg-sky-50 transition-colors"
              >
                O simular ubicación cerca de la sede
              </button>

              {result.status !== 'idle' && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2.5 animate-slide-up ${
                    geoOk
                      ? 'bg-emerald-50 text-emerald-800'
                      : result.status === 'too-far'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {geoOk ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{result.message}</p>
                </div>
              )}

              {formError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {formError}
                </p>
              )}

              <button
                onClick={handleCheckIn}
                disabled={!geoOk || checkInBusy}
                className="w-full bg-emerald-500 text-white font-semibold py-3.5 rounded-xl
                           hover:bg-emerald-600 active:scale-[0.98] transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
              >
                {checkInBusy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Confirmar mi llegada
              </button>
            </div>
          )}
        </div>
      )}

      {/* No appointments state */}
      {scheduledAppts.length === 0 && !hasCheckedIn && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center animate-slide-up">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tienes citas programadas</p>
          <p className="text-sm text-slate-400 mt-1">
            Acércate a secretaría para agendar tu próxima consulta.
          </p>
        </div>
      )}

      {/* Sede info at bottom */}
      <div className="bg-sky-50 rounded-2xl p-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-700">{data.sede.name}</p>
          <p className="text-xs text-slate-500">{data.sede.address}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Appointment Detail Card — shows full appointment info
// before and after check-in
// ============================================================
interface AppointmentDetailCardProps {
  apt: Appointment;
  users: import('@/types').User[];
}

function AppointmentDetailCard({ apt, users }: AppointmentDetailCardProps) {
  // Try to find the doctor from the users list
  // The appointment might have doctor info enriched, or we infer from users
  const doctor = users.find((u) => u.role === 'doctor' && u.name === apt.doctorName);
  const doctorName = apt.doctorName || doctor?.name || 'Médico por asignar';
  const doctorSpecialty = apt.doctorSpecialty || doctor?.specialty || 'Médico General';

  const statusLabel = apt.status === 'scheduled'
    ? 'Programada - Pendiente de llegada / Check-in'
    : apt.status === 'checked-in'
      ? 'Check-in realizado - En fila de espera'
      : apt.status === 'rescheduled'
        ? 'Reagendado - Pendiente de llegada'
        : apt.status === 'called'
          ? '¡Llamado! - Presentarse en cubículo'
          : apt.status === 'in-attendance'
            ? 'En consulta'
            : apt.status;

  const statusColor = apt.status === 'scheduled'
    ? 'bg-amber-50 text-amber-700'
    : apt.status === 'checked-in'
      ? 'bg-sky-50 text-sky-700'
      : apt.status === 'rescheduled'
        ? 'bg-orange-50 text-orange-700'
        : apt.status === 'called'
          ? 'bg-red-50 text-red-700'
          : apt.status === 'in-attendance'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-600';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up space-y-4">
      {/* Doctor info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-6 h-6 text-sky-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{doctorName}</p>
          <p className="text-sm text-sky-600">{doctorSpecialty}</p>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Date and time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Fecha</p>
            <p className="text-sm font-semibold text-slate-800">
              {apt.scheduledDate ? formatDateDisplay(apt.scheduledDate) : 'Por confirmar'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Hora</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatTime12h(apt.scheduledTime)}
            </p>
            <p className="text-[10px] text-slate-400">Intervalo de 30 min</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      {apt.reason && (
        <>
          <div className="h-px bg-slate-100" />
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Motivo de la consulta</p>
              <p className="text-sm font-medium text-slate-700">{apt.reason}</p>
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-slate-100" />

      {/* Status and ticket */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Paciente</p>
            <p className="text-sm font-semibold text-slate-800">{apt.patientName}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> CC: {apt.patientCedula}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Turno</p>
          <p className="text-lg font-bold text-sky-600">#{String(apt.ticketNumber).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${statusColor}`}>
        {statusLabel}
      </div>

      {/* Arrival notice */}
      <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-amber-800">
          Se sugiere llegar con 30 minutos de anticipación a su cita.
        </p>
      </div>
    </div>
  );
}
