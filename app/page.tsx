import { QuandaApp } from "@/src/components/QuandaApp";

export default function Home() {
  return <QuandaApp demoMode={!process.env.GEMINI_API_KEY} />;
}
