"use client";

import { Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { submitFoodMenuAction } from "@/app/actions/food-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FOOD_MENU_DAY_LABELS } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {
  ok: false,
  message: "",
};

type FoodMenuFormProps = {
  disabled?: boolean;
};

const meals = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "snacks", label: "Snacks" },
  { key: "dinner", label: "Dinner" },
] as const;

export function FoodMenuForm({ disabled = false }: FoodMenuFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(submitFoodMenuAction, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok, state.message]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(180px,220px)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="weekStart">Week Starts</Label>
          <Input id="weekStart" name="weekStart" type="date" required disabled={disabled || pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Menu Title</Label>
          <Input
            id="title"
            name="title"
            maxLength={120}
            placeholder="Weekly Food Menu"
            disabled={disabled || pending}
          />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {FOOD_MENU_DAY_LABELS.map((day, dayIndex) => (
          <div key={day} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-sm font-semibold">{day}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {meals.map((meal) => (
                <div key={meal.key} className="space-y-2">
                  <Label htmlFor={`${meal.key}-${dayIndex}`}>{meal.label}</Label>
                  <Textarea
                    id={`${meal.key}-${dayIndex}`}
                    name={`${meal.key}-${dayIndex}`}
                    required
                    minLength={2}
                    maxLength={500}
                    className="min-h-20"
                    placeholder={meal.label}
                    disabled={disabled || pending}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled={disabled || pending}>
          <Send className="size-4" />
          {pending ? "Submitting..." : "Submit Menu"}
        </Button>
        {state.message ? (
          <p
            className={
              state.ok
                ? "text-sm text-emerald-600 dark:text-emerald-300"
                : "text-sm text-rose-600 dark:text-rose-300"
            }
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
