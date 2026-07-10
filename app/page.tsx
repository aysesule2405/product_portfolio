import { Hero } from "@/components/home/Hero";
import { FieldMapSection } from "@/components/home/FieldMapSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { AICraftSection } from "@/components/home/AICraftSection";
import { CommunitySection } from "@/components/home/CommunitySection";
import { ContactSection } from "@/components/home/ContactSection";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ hiring?: string }>;
}) {
  const { hiring } = await searchParams;

  return (
    <>
      <Hero />
      <FieldMapSection initialHiring={hiring} />
      <ProcessSection />
      <AICraftSection />
      <CommunitySection />
      <ContactSection />
    </>
  );
}
