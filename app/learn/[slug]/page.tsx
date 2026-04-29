import { notFound } from "next/navigation";
import { Shell } from "@/components/shell/shell";
import { LessonStepper } from "@/components/learn/lesson-stepper";
import { getLesson, LESSONS } from "@/lib/learn/lessons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

/** /learn/[slug] — interactive lesson walk-through. */
export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) {
    notFound();
  }

  return (
    <Shell>
      <LessonStepper lesson={lesson} />
    </Shell>
  );
}
