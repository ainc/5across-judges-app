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
        className="dark-button w-full rounded border border-black bg-gray-900 px-4 py-2 text-white"
      >
        Sign In
      </button>
    </form>
  );
}
