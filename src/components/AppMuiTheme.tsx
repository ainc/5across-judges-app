"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    background: {
      default: "var(--background)",
      paper: "var(--surface)",
    },
    text: {
      primary: "var(--foreground)",
      secondary: "var(--muted)",
    },
    divider: "var(--border)",
  },
  typography: {
    fontFamily: "var(--font-open-sans), \"Open Sans\", sans-serif",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--surface)",
          color: "var(--foreground)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: "var(--hover)" },
          "&.Mui-selected": { backgroundColor: "var(--hover)" },
          "&.Mui-selected:hover": { backgroundColor: "var(--hover)" },
        },
      },
    },
  },
});

export function AppMuiTheme({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
