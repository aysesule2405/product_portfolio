import { Hero } from "@/components/home/Hero";
import { SelectedWork } from "@/components/home/SelectedWork";
import { FieldMapSection } from "@/components/home/FieldMapSection";
import { VisualPracticeBridge } from "@/components/home/VisualPracticeBridge";
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
      <SelectedWork hiringId={hiring} />
      <FieldMapSection initialHiring={hiring} />
      <VisualPracticeBridge />
      <CommunitySection />
      <ContactSection />
    </>
  );
}
