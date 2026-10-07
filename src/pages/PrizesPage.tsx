import PrizeCard from "../components/PrizeCard";
import { plan } from "../data/plan";

export default function PrizesPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Призы</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plan.weeks.map((week) => (
          <PrizeCard key={week.n} week={week} />
        ))}
      </ul>
    </>
  );
}
