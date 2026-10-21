"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "var(--font-open-sans), \"Open Sans\", sans-serif",
  },
});

export function AppMuiTheme({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
