import classNames from 'classnames'
import { AddIcon } from '@components/icons/add-icon'
import { CloseIcon } from '@components/icons/close-icon'
import type { DayScheduleDraft, ScheduleSlotDraft } from '../enterprise-schedules.types'
import {
  WEEK_DAY_LABELS,
  createDefaultSlot,
  formatSlotRange,
  periodLabelForSlot,
} from '../enterprise-schedules.utils'
import type { WeeklyScheduleEditorProps } from './weekly-schedule-editor.types'
import './weekly-schedule-editor.css'

export function WeeklyScheduleEditor({
  days,
  isSaving,
  errorMessage,
  onChange,
  onSave,
  onCopyWeekdays,
}: WeeklyScheduleEditorProps) {
  function updateDay(dayOfWeek: number, updater: (day: DayScheduleDraft) => DayScheduleDraft) {
    onChange(days.map((day) => (day.dayOfWeek === dayOfWeek ? updater(day) : day)))
  }

  function toggleDay(dayOfWeek: number, open: boolean) {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      open,
      slots: open ? (day.slots.length > 0 ? day.slots : [createDefaultSlot()]) : [],
    }))
  }

  function addSlot(dayOfWeek: number) {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      open: true,
      slots: [...day.slots, createDefaultSlot()],
    }))
  }

  function removeSlot(dayOfWeek: number, localId: string) {
    updateDay(dayOfWeek, (day) => {
      const slots = day.slots.filter((slot) => slot.localId !== localId)
      return {
        ...day,
        slots,
        open: slots.length > 0 ? day.open : false,
      }
    })
  }

  function updateSlot(
    dayOfWeek: number,
    localId: string,
    patch: Partial<Pick<ScheduleSlotDraft, 'startTime' | 'endTime'>>,
  ) {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      slots: day.slots.map((slot) =>
        slot.localId === localId ? { ...slot, ...patch } : slot,
      ),
    }))
  }

  return (
    <section className="weekly-schedule-editor" aria-labelledby="weekly-schedule-title">
      <header className="weekly-schedule-editor__header">
        <div>
          <h2 id="weekly-schedule-title" className="weekly-schedule-editor__title">
            Días de la semana y huecos horarios
          </h2>
          <p className="weekly-schedule-editor__subtitle">
            Define cuándo está abierto tu negocio. Los huecos de reserva se calculan con la
            duración de cada servicio.
          </p>
        </div>
        <button
          type="button"
          className="weekly-schedule-editor__copy"
          onClick={onCopyWeekdays}
        >
          Copiar L–V a todos
        </button>
      </header>

      <ul className="weekly-schedule-editor__days">
        {days.map((day) => (
          <li
            key={day.dayOfWeek}
            className={classNames('weekly-schedule-editor__day', {
              'weekly-schedule-editor__day--closed': !day.open,
            })}
          >
            <div className="weekly-schedule-editor__day-top">
              <label className="weekly-schedule-editor__toggle">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(event) => {
                    toggleDay(day.dayOfWeek, event.target.checked)
                  }}
                />
                <span className="weekly-schedule-editor__toggle-ui" aria-hidden="true" />
                <span className="weekly-schedule-editor__day-name">
                  {WEEK_DAY_LABELS[day.dayOfWeek]}
                </span>
              </label>

              {day.open ? (
                <div className="weekly-schedule-editor__day-meta">
                  <span className="weekly-schedule-editor__slot-count">
                    {day.slots.length}{' '}
                    {day.slots.length === 1 ? 'tramo definido' : 'tramos definidos'}
                  </span>
                  <button
                    type="button"
                    className="weekly-schedule-editor__add-slot"
                    onClick={() => {
                      addSlot(day.dayOfWeek)
                    }}
                  >
                    <AddIcon className="weekly-schedule-editor__add-slot-icon" />
                    Añadir tramo
                  </button>
                </div>
              ) : (
                <span className="weekly-schedule-editor__closed-label">Cerrado todo el día</span>
              )}
            </div>

            {day.open ? (
              <ul className="weekly-schedule-editor__slots">
                {day.slots.map((slot) => (
                  <li key={slot.localId} className="weekly-schedule-editor__slot">
                    <span className="weekly-schedule-editor__slot-period">
                      {periodLabelForSlot(slot.startTime)}
                    </span>
                    <div className="weekly-schedule-editor__slot-times">
                      <label className="weekly-schedule-editor__time-field">
                        <span className="visually-hidden">Inicio</span>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(event) => {
                            updateSlot(day.dayOfWeek, slot.localId, {
                              startTime: event.target.value,
                            })
                          }}
                        />
                      </label>
                      <span aria-hidden="true">—</span>
                      <label className="weekly-schedule-editor__time-field">
                        <span className="visually-hidden">Fin</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(event) => {
                            updateSlot(day.dayOfWeek, slot.localId, {
                              endTime: event.target.value,
                            })
                          }}
                        />
                      </label>
                    </div>
                    <span className="weekly-schedule-editor__slot-preview">
                      {formatSlotRange(slot.startTime, slot.endTime)}
                    </span>
                    <button
                      type="button"
                      className="weekly-schedule-editor__remove-slot"
                      aria-label="Eliminar tramo"
                      onClick={() => {
                        removeSlot(day.dayOfWeek, slot.localId)
                      }}
                    >
                      <CloseIcon className="weekly-schedule-editor__remove-slot-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      <footer className="weekly-schedule-editor__footer">
        <p className="weekly-schedule-editor__hint">
          Los cambios de disponibilidad son efectivos al guardar.
        </p>
        {errorMessage ? (
          <p className="weekly-schedule-editor__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          className="weekly-schedule-editor__save"
          disabled={isSaving}
          onClick={onSave}
        >
          {isSaving ? 'Guardando…' : 'Guardar horarios'}
        </button>
      </footer>
    </section>
  )
}
