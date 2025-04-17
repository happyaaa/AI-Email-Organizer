import { LoginForm } from "@/components/auth/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            AI Email Organizer
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Intelligent email management powered by AI
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
