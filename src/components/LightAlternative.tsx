export default function LightAlternative({ text }: { text: string }) {
  return (
    <aside className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <strong className="font-semibold">Если устал.</strong> {text.replace(/^Устал:\s*/, "")}
    </aside>
  );
}
