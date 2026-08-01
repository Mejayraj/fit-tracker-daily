import { PageTitle } from "@/components/AppLayout";
import Workouts from "./Workouts";
import Exercises from "./Exercises";

export default function Train() {
  return (
    <div className="space-y-8">
      <PageTitle title="Train" />
      <Workouts />
      <div className="h-px bg-border/60" />
      <Exercises />
    </div>
  );
}