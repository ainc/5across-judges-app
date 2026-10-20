export function submitSignOut() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/sign-out";
  document.body.appendChild(form);
  form.submit();
}
