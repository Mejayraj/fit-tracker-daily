import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";
import LogExerciseSheet from "@/components/train/LogExerciseSheet";
import { requestLogMeal } from "@/lib/quickActions";

const btnStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
  color: "#39FF14",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

export default function QuickActionBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  const onLogMeal = () => {
    if (pathname === "/food") requestLogMeal(true);
    else {
      requestLogMeal(false);
      navigate("/food");
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: "calc(90px + env(safe-area-inset-bottom))",
          background: "transparent",
          border: "none",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          zIndex: 49,
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(20px)",
          transition:
            "opacity 400ms cubic-bezier(0.34,1.56,0.64,1) 100ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1) 100ms",
        }}
      >
        <button type="button" aria-label="Log Meal" onClick={onLogMeal} style={btnStyle}>
          <UtensilsCrossed className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Log Workout" onClick={() => setWorkoutOpen(true)} style={btnStyle}>
          <Dumbbell className="h-5 w-5" />
        </button>
      </div>
      <LogExerciseSheet
        open={workoutOpen}
        onOpenChange={setWorkoutOpen}
        date={format(new Date(), "yyyy-MM-dd")}
      />
    </>
  );
}
