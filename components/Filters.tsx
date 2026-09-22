"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LOCALITIES, LISTING_TYPES } from "@/lib/types";

export default function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`/browse?${p.toString()}`);
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 mb-6">
      <div>
        <label className="block text-[13.5px] font-medium mb-1">Locality</label>
        <select
          className="field-input w-full px-2.5 py-2 text-[15px]"
          defaultValue={params.get("loc") ?? ""}
          onChange={(e) => update("loc", e.target.value)}
        >
          <option value="">Anywhere near DU</option>
          {LOCALITIES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[13.5px] font-medium mb-1">Type</label>
        <select
          className="field-input w-full px-2.5 py-2 text-[15px]"
          defaultValue={params.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="">Any type</option>
          {LISTING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[13.5px] font-medium mb-1">Rent up to</label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 12000"
          className="field-input w-full px-2.5 py-2 text-[15px]"
          defaultValue={params.get("max") ?? ""}
          onBlur={(e) => update("max", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[13.5px] font-medium mb-1">I need it by</label>
        <input
          type="date"
          className="field-input w-full px-2.5 py-2 text-[15px]"
          defaultValue={params.get("by") ?? ""}
          onChange={(e) => update("by", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[13.5px] font-medium mb-1">Sort</label>
        <select
          className="field-input w-full px-2.5 py-2 text-[15px]"
          defaultValue={params.get("sort") ?? "soon"}
          onChange={(e) => update("sort", e.target.value)}
        >
          <option value="soon">Leaving soonest</option>
          <option value="cheap">Cheapest rent</option>
          <option value="new">Recently posted</option>
        </select>
      </div>
    </div>
  );
}
