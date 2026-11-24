type SignInProps = {
  action: (formData: FormData) => Promise<void>;
};

export function SignIn({ action }: SignInProps) {
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span>Username:</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Password:</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded border-0 px-4 py-2 text-black"
        style={{ backgroundColor: "#EC3641", color: "#000000" }}
      >
        Sign In
      </button>
    </form>
  );
}
