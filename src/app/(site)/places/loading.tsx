import { SectionPanel } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Skeleton } from "@/components/ui/skeleton";
import { PlacesExplorerSkeleton } from "@/components/skeletons/places-skeletons";

export default function PlacesLoading() {
  return (
    <div className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 lg:px-8" aria-busy="true">
      <SectionPanel>
        <Eyebrow>Places</Eyebrow>
        <Skeleton className="mt-2 h-10 w-48 rounded-xl" />

        <div className="mt-6">
          <PlacesExplorerSkeleton />
        </div>
      </SectionPanel>
    </div>
  );
}
