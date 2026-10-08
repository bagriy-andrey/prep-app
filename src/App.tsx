import { Route, Routes } from "react-router";
import AppShell from "./components/AppShell";
import JournalsPage from "./pages/JournalsPage";
import NotFoundPage from "./pages/NotFoundPage";
import CalendarPage from "./pages/CalendarPage";
import ItemPage from "./pages/ItemPage";
import PlanOverviewPage from "./pages/PlanOverviewPage";
import PlanPage from "./pages/PlanPage";
import PrizesPage from "./pages/PrizesPage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import TodayPage from "./pages/TodayPage";
import TrackerPage from "./pages/TrackerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="overview" element={<PlanOverviewPage />} />
        <Route path="plan/:week" element={<PlanPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="tracker" element={<TrackerPage />} />
        <Route path="tracker/:itemId" element={<ItemPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="prizes" element={<PrizesPage />} />
        <Route path="journals" element={<JournalsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
