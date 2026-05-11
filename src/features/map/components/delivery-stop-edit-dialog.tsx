"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DeliveryStopResponseDto,
  UpdateDeliveryStopBody,
} from "@/features/map/domain/planning-map.types";
import { deliveryStopToUpdateBody } from "@/features/map/lib/delivery-stop-update-body";

export type DeliveryStopEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stop: DeliveryStopResponseDto | null;
  defaultServiceDate?: string | null;
  onSave: (body: UpdateDeliveryStopBody) => Promise<void>;
  saving?: boolean;
};

export function DeliveryStopEditDialog({
  open,
  onOpenChange,
  stop,
  defaultServiceDate,
  onSave,
  saving,
}: DeliveryStopEditDialogProps) {
  const t = useTranslations("UiRouteEdit");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!open || !stop) return;
    setRecipientName(stop.recipientName ?? "");
    setPhone(stop.phone ?? "");
    setAddressLine1(stop.addressLine1 ?? "");
    setCity(stop.city ?? "");
    setRegion(stop.region ?? "");
    setPostalCode(stop.postalCode ?? "");
    setCountry(stop.country ?? "");
    setLatitude(String(stop.latitude));
    setLongitude(String(stop.longitude));
    setServiceDate(stop.serviceDate ?? defaultServiceDate ?? "");
    setNotes(stop.notes ?? "");
    setOrderId(stop.orderId ?? "");
  }, [open, stop, defaultServiceDate]);

  const handleSubmit = async () => {
    if (!stop) return;
    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    const merged: DeliveryStopResponseDto = {
      ...stop,
      recipientName,
      phone: phone.trim() || null,
      addressLine1: addressLine1.trim() || null,
      city: city.trim() || null,
      region: region.trim() || null,
      postalCode: postalCode.trim() || null,
      country: country.trim() || null,
      latitude: lat,
      longitude: lng,
      serviceDate: serviceDate.trim() || null,
      notes: notes.trim() || null,
      orderId: orderId.trim() || null,
    };
    try {
      await onSave(deliveryStopToUpdateBody(merged));
      onOpenChange(false);
    } catch {
      /* error surfaced by caller */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editStopDialogTitle")}</DialogTitle>
          <DialogDescription>{t("editStopDialogDesc")}</DialogDescription>
        </DialogHeader>
        {stop ? (
          <div className="grid gap-3 py-1">
            <div className="space-y-2">
              <Label htmlFor="es-name">{t("editStopRecipient")}</Label>
              <Input
                id="es-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-phone">{t("editStopPhone")}</Label>
              <Input
                id="es-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-addr">{t("editStopAddress")}</Label>
              <Input
                id="es-addr"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                autoComplete="street-address"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="es-city">{t("editStopCity")}</Label>
                <Input
                  id="es-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="es-region">{t("editStopRegion")}</Label>
                <Input
                  id="es-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="es-postal">{t("editStopPostal")}</Label>
                <Input
                  id="es-postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="es-country">{t("editStopCountry")}</Label>
                <Input
                  id="es-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="es-lat">{t("editStopLat")}</Label>
                <Input
                  id="es-lat"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="es-lng">{t("editStopLng")}</Label>
                <Input
                  id="es-lng"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-svc">{t("editStopServiceDate")}</Label>
              <Input
                id="es-svc"
                type="date"
                value={serviceDate ? serviceDate.slice(0, 10) : ""}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-order">{t("editStopOrderId")}</Label>
              <Input
                id="es-order"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-notes">{t("editStopNotes")}</Label>
              <Input
                id="es-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("editStopCancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!stop || saving}
          >
            {saving ? t("applying") : t("editStopSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
