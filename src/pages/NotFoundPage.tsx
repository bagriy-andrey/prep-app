import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-xl font-semibold">Страница не найдена</h1>
      <Link to="/" className="mt-4 inline-block text-indigo-700 underline dark:text-indigo-300">
        На главную
      </Link>
    </div>
  );
}
