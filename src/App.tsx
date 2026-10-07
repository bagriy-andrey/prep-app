import { Route, Routes } from "react-router";
import AppShell from "./components/AppShell";
import NotFoundPage from "./pages/NotFoundPage";
import PlanPage from "./pages/PlanPage";
import PrizesPage from "./pages/PrizesPage";
import TodayPage from "./pages/TodayPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="plan/:week" element={<PlanPage />} />
        <Route path="prizes" element={<PrizesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
