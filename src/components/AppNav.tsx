"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import { signOutAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type AppNavProps = {
  showAdminLink?: boolean;
};

export function AppNav({ showAdminLink = false }: AppNavProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  const open = menuAnchor !== null;

  useEffect(() => {
    setCanPortal(true);
  }, []);

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <nav>
      <IconButton
        aria-label="Open menu"
        aria-controls={open ? "app-nav-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        size="large"
      >
        <MenuIcon fontSize="large" />
      </IconButton>
      <Menu
        id="app-nav-menu"
        anchorEl={menuAnchor}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiMenuItem-root": {
            fontWeight: 400,
            fontSize: "0.875rem",
            textTransform: "uppercase",
          },
        }}
      >
        <MenuItem component={Link} href="/" onClick={closeMenu}>
          Home
        </MenuItem>
        <MenuItem component={Link} href="/results" onClick={closeMenu}>
          Current Results
        </MenuItem>
        {showAdminLink ? (
          <MenuItem component={Link} href="/admin" onClick={closeMenu}>
            Admin Dashboard
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            closeMenu();
            setConfirmOpen(true);
          }}
        >
          Sign Out
        </MenuItem>
      </Menu>
      {canPortal
        ? createPortal(
            <ConfirmDialog
              open={confirmOpen}
              title="Sign Out?"
              message="You will need to sign in again to score or view results."
              confirmLabel="Sign Out"
              onConfirm={() => {
                setConfirmOpen(false);
                void signOutAction();
              }}
              onCancel={() => setConfirmOpen(false)}
            />,
            document.body,
          )
        : null}
    </nav>
  );
}
