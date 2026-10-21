import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { SignIn } from "@/components/sign-in";

async function loginAction(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }

    throw error;
  }
}

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <section className="w-full max-w-sm space-y-6 rounded border p-6">
      <img src="/images/5acrossbanner.png" alt="5 Across Banner" className="fiveacross-banner justify-self-center" />
        <header className="space-y-2">
          <h1 className="page-header">Sign In</h1>
          <p className="text-sm text-gray-600">
            Judges will be signed in by Awesome Inc prior to their arrival. Admin can access the dashboard and alter competitions and their details.
          </p>
        </header>

        {error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Invalid username or password.
          </p>
        ) : null}

        <SignIn action={loginAction} />
      </section>
    </main>
  );
}
