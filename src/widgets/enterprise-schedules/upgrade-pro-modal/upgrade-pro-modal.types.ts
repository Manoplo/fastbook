import type { UpgradeProReason } from '../enterprise-schedules.types'

export type UpgradeProModalProps = {
  open: boolean
  reason: UpgradeProReason
  onClose: () => void
}
