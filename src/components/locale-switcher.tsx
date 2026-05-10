"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useUiLocale } from "@/providers/locale-ui-provider";

const LOCALES = ["en", "fa"] as const;

export function LocaleSwitcher({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Common");
  const { locale, setLocale } = useUiLocale();

  return (
    <div className={className}>
      <Select
        value={locale}
        onValueChange={(next) => {
          if (next === "en" || next === "fa") setLocale(next);
        }}
      >
        <SelectTrigger aria-label={t("language")}>
          <SelectValue placeholder={t("language")} />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc === "fa" ? t("persian") : t("english")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
