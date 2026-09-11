import { QuandaApp } from "@/src/components/QuandaApp";
import { AuthProvider } from "@/src/auth/AuthContext";

export default function Home() {
  return <AuthProvider><QuandaApp /></AuthProvider>;
}
