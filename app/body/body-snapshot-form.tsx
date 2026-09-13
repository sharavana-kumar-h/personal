"use client";

import { useActionState, useState } from "react";

import { createBodyCompositionSnapshot } from "@/app/actions/body-composition";
import type { BodyCompositionFormState } from "@/app/actions/body-composition";
import { calculateBmi, calculateBmr } from "@/lib/body-composition";

const initialState: BodyCompositionFormState = {};

const segmentFields = [
  ["leftArm", "Left arm / hand"],
  ["rightArm", "Right arm / hand"],
  ["leftLeg", "Left leg"],
  ["rightLeg", "Right leg"],
  ["trunk", "Middle / trunk"],
] as const;

export default function BodySnapshotForm() {
  const [state, formAction, pending] = useActionState(createBodyCompositionSnapshot, initialState);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("other");
  const [bmi, setBmi] = useState("");
  const [bmr, setBmr] = useState("");

  const calculatedBmi = weight && height ? calculateBmi(Number(weight), Number(height)) : null;
  const calculatedBmr = weight && height && age ? calculateBmr({ weightKg: Number(weight), heightCm: Number(height), age: Number(age), gender }) : null;

  return (
    <form action={formAction} className="space-y-8">
      {state.message ? <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{state.message}</div> : null}

      <Section title="Basic information" description="Record the date and core measurements. Weight and date are required.">
        <Field label="Date" name="date" type="date" required error={state.fieldErrors?.date?.[0]} />
        <Field label="Weight (kg)" name="weightKg" type="number" step="0.1" required value={weight} onChange={setWeight} error={state.fieldErrors?.weightKg?.[0]} />
        <Field label="Height (cm)" name="heightCm" type="number" step="0.1" value={height} onChange={setHeight} error={state.fieldErrors?.heightCm?.[0]} />
        <Field label="Age" name="age" type="number" min="10" max="120" value={age} onChange={setAge} error={state.fieldErrors?.age?.[0]} />
        <label className="space-y-2 text-sm text-slate-200">Gender for BMR calculation<select name="gender" value={gender} onChange={(event) => setGender(event.target.value as typeof gender)} className={inputClass}><option value="other">Other / unspecified</option><option value="male">Male</option><option value="female">Female</option></select></label>
        <Field label="BMI" name="bmi" type="number" step="0.01" value={bmi} onChange={setBmi} hint={bmi ? "User-entered value will be stored." : calculatedBmi ? `Calculated preview: ${calculatedBmi}` : "Enter weight and height to calculate."} error={state.fieldErrors?.bmi?.[0]} />
      </Section>

      <Section title="Body composition" description="Enter measured values from your device or assessment. Leave unavailable values blank.">
        <Field label="Skeletal Muscle Mass (SMM)" name="smm" type="number" step="0.1" error={state.fieldErrors?.smm?.[0]} />
        <Field label="Body Fat Mass (BFM)" name="bfm" type="number" step="0.1" error={state.fieldErrors?.bfm?.[0]} />
        <Field label="Percentage Body Fat (PBF)" name="pbf" type="number" step="0.1" error={state.fieldErrors?.pbf?.[0]} />
        <Field label="Waist-Hip Ratio" name="waistHipRatio" type="number" step="0.01" error={state.fieldErrors?.waistHipRatio?.[0]} />
        <Field label="Visceral Fat Level" name="visceralFatLevel" type="number" step="0.1" error={state.fieldErrors?.visceralFatLevel?.[0]} />
        <Field label="Fat Free Mass" name="fatFreeMass" type="number" step="0.1" error={state.fieldErrors?.fatFreeMass?.[0]} />
        <Field label="BMR" name="bmr" type="number" step="1" value={bmr} onChange={setBmr} hint={bmr ? "User-entered value will be stored." : calculatedBmr ? `Calculated preview: ${calculatedBmr}` : "Enter weight, height, age, and gender to calculate."} error={state.fieldErrors?.bmr?.[0]} />
        <Field label="Obesity Degree" name="obesityDegree" type="number" step="0.1" error={state.fieldErrors?.obesityDegree?.[0]} />
        <Field label="SMI" name="smi" type="number" step="0.1" error={state.fieldErrors?.smi?.[0]} />
      </Section>

      <SegmentSection title="Segment lean analysis" prefix="segmentLean" errors={state.fieldErrors} />
      <SegmentSection title="Segment fat analysis" prefix="segmentFat" errors={state.fieldErrors} />

      <Section title="Measurement details" description="Keep provenance with the historical snapshot.">
        <Field label="Measurement source / device" name="measurementSource" type="text" error={state.fieldErrors?.measurementSource?.[0]} />
        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">Notes<textarea name="notes" rows={4} maxLength={2000} className={inputClass} />{state.fieldErrors?.notes?.[0] ? <ErrorText>{state.fieldErrors.notes[0]}</ErrorText> : null}</label>
      </Section>

      <div className="flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Calculated BMI/BMR are stored only when their fields are left blank.</p><button type="submit" disabled={pending} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving..." : "Save snapshot"}</button></div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-4"><div><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-slate-400">{description}</p></div><div className="grid gap-4 md:grid-cols-2">{children}</div></section>;
}

function SegmentSection({ title, prefix, errors }: { title: string; prefix: "segmentLean" | "segmentFat"; errors?: Record<string, string[]> }) {
  return <Section title={title} description="Optional values, stored as part of this snapshot."><div className="grid gap-3 md:col-span-2 md:grid-cols-2">{segmentFields.map(([key, label]) => <Field key={key} label={label} name={`${prefix}.${key}`} type="number" step="0.1" error={errors?.[`${prefix}.${key}`]?.[0]} />)}</div></Section>;
}

function Field({ label, name, type, step, min, max, required, value, onChange, hint, error }: { label: string; name: string; type: string; step?: string; min?: string; max?: string; required?: boolean; value?: string; onChange?: (value: string) => void; hint?: string; error?: string }) {
  return <label className="space-y-2 text-sm text-slate-200"><span className="block">{label}{required ? <span className="text-rose-300"> *</span> : null}</span><input name={name} type={type} step={step} min={min} max={max} required={required} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className={inputClass} />{hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}{error ? <ErrorText>{error}</ErrorText> : null}</label>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span role="alert" className="block text-xs text-rose-300">{children}</span>;
}

const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-emerald-500";
