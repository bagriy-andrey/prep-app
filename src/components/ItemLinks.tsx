import type { Item } from "../data/types";
import LinkButton from "./LinkButton";

export default function ItemLinks({ item }: { item: Item }) {
  if (item.links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {item.links.map((link) => (
        <LinkButton key={link.url} link={link} />
      ))}
    </div>
  );
}
