import { StyleSheet } from "@react-pdf/renderer";

export const palette = {
  primary: "#0f5132",
  accent: "#c8a94a",
  text: "#1c1917",
  mute: "#57534e",
  subtle: "#a8a29e",
  divider: "#e7e5e4",
  surface: "#fafaf9",
  surfaceTint: "#f5f5f4",
  highlight: "#fef9c3",
  danger: "#dc2626",
  white: "#ffffff",
} as const;

export const PAGE_PADDING_X = 32;
export const PAGE_PADDING_TOP = 32;
export const PAGE_PADDING_BOTTOM = 70;

export const reportStyles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PADDING_TOP,
    paddingBottom: PAGE_PADDING_BOTTOM,
    paddingLeft: PAGE_PADDING_X,
    paddingRight: PAGE_PADDING_X,
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: palette.text,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.divider,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { width: 44, height: 44, objectFit: "contain", marginRight: 10 },
  headerBadge: {
    width: 5,
    height: 44,
    backgroundColor: palette.accent,
    borderRadius: 2,
    marginRight: 10,
  },
  headerInstitution: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: palette.primary,
    letterSpacing: 0.2,
  },
  headerDept: { fontSize: 11, color: palette.mute, marginTop: 1 },
  headerCnpj: { fontSize: 10, color: palette.subtle, marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  headerReportTitle: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    color: palette.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerEmittedAt: { fontSize: 10, color: palette.mute, marginTop: 2 },
  headerPage: { fontSize: 10, color: palette.mute, marginTop: 2 },

  filtersBox: {
    backgroundColor: palette.surfaceTint,
    padding: 7,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: palette.accent,
  },
  filtersTitle: {
    fontSize: 6.5,
    color: palette.mute,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap" },
  filterItem: { fontSize: 7, color: palette.text, marginRight: 10, marginTop: 2 },
  filterValue: { color: palette.primary, fontFamily: "Helvetica-Bold" },

  table: { borderWidth: 0.5, borderColor: palette.divider },
  th: {
    flexDirection: "row",
    backgroundColor: palette.primary,
    color: palette.white,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    paddingTop: 3,
    paddingBottom: 3,
    fontSize: 7,
    borderTopWidth: 0.25,
    borderTopColor: palette.divider,
  },
  trAlt: { backgroundColor: palette.surface },

  totalsBox: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: palette.highlight,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderLeftWidth: 2,
    borderLeftColor: palette.accent,
  },
  totalItem: { flexDirection: "column" },
  totalLabel: {
    fontSize: 6,
    color: palette.mute,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 1 },

  footer: {
    position: "absolute",
    left: PAGE_PADDING_X,
    right: PAGE_PADDING_X,
    bottom: 18,
    fontSize: 10,
    color: palette.mute,
  },
  footerDivider: {
    borderTopWidth: 0.5,
    borderTopColor: palette.divider,
    marginBottom: 6,
  },
  footerText: { fontSize: 10, color: palette.mute, marginBottom: 2, textAlign: "center" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
});
