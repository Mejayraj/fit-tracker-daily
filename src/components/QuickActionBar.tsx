import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";
import LogExerciseSheet from "@/components/train/LogExerciseSheet";
import { requestLogMeal } from "@/lib/quickActions";

const btnStyle: React.CSSProperties = {
  width: "48%",
  height: 40,
  borderRadius: 20,
  background: "rgba(57,255,20,0.12)",
  border: "1px solid rgba(57,255,20,0.25)",
  color: "#39FF14",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
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
          left: 16,
          right: 16,
          bottom: "calc(78px + env(safe-area-inset-bottom))",
          height: 52,
          borderRadius: 26,
          background: "rgba(18,18,18,0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px",
          zIndex: 49,
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(20px)",
          transition:
            "opacity 400ms cubic-bezier(0.34,1.56,0.64,1) 100ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1) 100ms",
        }}
      >
        <button type="button" onClick={onLogMeal} style={btnStyle}>
          <UtensilsCrossed className="h-4 w-4" />
          <span>+ Log Meal</span>
        </button>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />
        <button type="button" onClick={() => setWorkoutOpen(true)} style={btnStyle}>
          <Dumbbell className="h-4 w-4" />
          <span>+ Log Workout</span>
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
