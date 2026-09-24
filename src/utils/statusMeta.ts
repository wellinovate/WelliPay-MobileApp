import { colors } from '../theme/tokens';

export interface StatusMeta { label: string; bg: string; fg: string; dot: string; }

const map: Record<string, StatusMeta> = {
  unpaid:       { label:'Unpaid',        bg:colors.surfaceAlt,  fg:colors.textPrimary, dot:'#9A9A95' },
  overdue:      { label:'Overdue',       bg:colors.warningBg,   fg:colors.warningText, dot:'#CC8800' },
  partly_paid:  { label:'Part paid',     bg:colors.accentLight, fg:colors.accentDark,  dot:colors.accentMid },
  paid:         { label:'Paid',          bg:colors.accentLight, fg:colors.accentDark,  dot:colors.accent },
  void:         { label:'Cancelled',     bg:colors.surfaceAlt,  fg:colors.textTertiary,dot:'#9A9A95' },
  awaiting_hmo: { label:'Waiting HMO',   bg:colors.accentLight, fg:colors.accentDark,  dot:colors.accentMid },
  pending:      { label:'Confirming',    bg:colors.warningBg,   fg:colors.warningText, dot:'#CC8800' },
  failed:       { label:'Not completed', bg:colors.dangerLight, fg:colors.dangerDark,  dot:colors.danger },
  expired:      { label:'Timed out',     bg:colors.surfaceAlt,  fg:colors.textTertiary,dot:'#9A9A95' },
  under_review: { label:'Being checked', bg:colors.accentLight, fg:colors.accentDark,  dot:colors.accentMid },
  successful:   { label:'Successful',    bg:colors.accentLight, fg:colors.accentDark,  dot:colors.accent },
};

export const statusMeta = (status: string): StatusMeta =>
  map[status] || { label:'Unknown', bg:colors.surfaceAlt, fg:colors.textTertiary, dot:'#9A9A95' };
