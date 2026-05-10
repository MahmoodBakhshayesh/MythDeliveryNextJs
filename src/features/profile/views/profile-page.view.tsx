"use client";



import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Separator } from "@/components/ui/separator";

import { Skeleton } from "@/components/ui/skeleton";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { ProfilePageViewModel } from "@/features/profile/controllers/profile-page.controller";

import { getApiBaseUrl } from "@/lib/env";



export function ProfilePageView({

  viewState,

  actions,

  pending,

}: ProfilePageViewModel) {

  const t = useTranslations("UiProfile");

  const tc = useTranslations("Common");

  const { profile, isLoading } = viewState;



  if (isLoading || !profile) {

    return (

      <div className="space-y-4">

        <Skeleton className="h-10 w-48" />

        <Skeleton className="h-64 w-full max-w-lg" />

      </div>

    );

  }



  const avatarSrc = profile.avatarUrl?.startsWith("http")

    ? profile.avatarUrl

    : profile.avatarUrl

      ? `${getApiBaseUrl()}${profile.avatarUrl}`

      : undefined;



  return (

    <div className="mx-auto flex max-w-lg flex-col gap-8">

      <div>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">

          {t("title")}

        </h1>

        <p className="text-muted-foreground mt-1 text-sm">

          <code className="rounded bg-muted px-1">{t("subtitleApi")}</code>

        </p>

      </div>



      <Card>

        <CardHeader>

          <CardTitle>{t("accountTitle")}</CardTitle>

          <CardDescription>

            {profile.userName} · {profile.email ?? "—"}{" "}

            {profile.emailConfirmed ? t("verified") : t("notVerified")}

          </CardDescription>

        </CardHeader>

        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">

          <Avatar className="size-20">

            <AvatarImage src={avatarSrc} alt="" />

            <AvatarFallback>

              {profile.userName.slice(0, 2).toUpperCase()}

            </AvatarFallback>

          </Avatar>

          <div className="flex flex-wrap gap-2">

            <label

              className={cn(

                buttonVariants({ variant: "outline", size: "sm" }),

                "cursor-pointer",

              )}

            >

              {t("upload")}

              <input

                type="file"

                accept="image/*"

                className="sr-only"

                onChange={(e) => {

                  const f = e.target.files?.[0];

                  if (f) actions.uploadAvatarFile(f);

                  e.target.value = "";

                }}

              />

            </label>

            <Button

              variant="ghost"

              size="sm"

              disabled={!profile.avatarUrl || pending.clearAvatar}

              onClick={() => actions.clearAvatar()}

            >

              {t("remove")}

            </Button>

          </div>

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          <CardTitle>{t("detailsTitle")}</CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">

            <Label htmlFor="dn">{t("displayName")}</Label>

            <Input

              id="dn"

              value={viewState.displayName}

              onChange={(e) => actions.setDisplayName(e.target.value)}

            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="ph">{tc("phone")}</Label>

            <Input

              id="ph"

              value={viewState.phone}

              onChange={(e) => actions.setPhone(e.target.value)}

            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="bio">{t("bio")}</Label>

            <Textarea

              id="bio"

              rows={4}

              value={viewState.bio}

              onChange={(e) => actions.setBio(e.target.value)}

            />

          </div>

          <Button

            disabled={pending.saveProfile}

            onClick={() => actions.saveProfile()}

          >

            {t("saveProfile")}

          </Button>

        </CardContent>

      </Card>



      <Card>

        <CardHeader>

          <CardTitle>{t("passwordTitle")}</CardTitle>

          <CardDescription>{t("passwordHint")}</CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">

            <Label htmlFor="cur">{t("current")}</Label>

            <Input

              id="cur"

              type="password"

              value={viewState.passwordCurrent}

              onChange={(e) => actions.setPasswordCurrent(e.target.value)}

              autoComplete="current-password"

            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="n1">{t("newPassword")}</Label>

            <Input

              id="n1"

              type="password"

              value={viewState.passwordNew}

              onChange={(e) => actions.setPasswordNew(e.target.value)}

              autoComplete="new-password"

            />

          </div>

          <div className="space-y-2">

            <Label htmlFor="n2">{t("confirmNew")}</Label>

            <Input

              id="n2"

              type="password"

              value={viewState.passwordConfirm}

              onChange={(e) => actions.setPasswordConfirm(e.target.value)}

              autoComplete="new-password"

            />

          </div>

          <Button

            variant="secondary"

            disabled={pending.password}

            onClick={() => actions.changePassword()}

          >

            {t("changePassword")}

          </Button>

        </CardContent>

      </Card>



      <Separator />

      <p className="text-muted-foreground text-xs">

        {t("rolesPrefix")} {profile.roles?.join(", ") || "—"}

      </p>

    </div>

  );

}

