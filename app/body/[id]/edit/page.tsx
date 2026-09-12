import { redirect } from "next/navigation";

import { updateBodyCompositionSnapshot } from "@/app/actions/body-composition";
import { requireUser } from "@/lib/auth";
import { getSnapshotById } from "@/services/body-composition";

export default async function EditBodySnapshotPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const snapshot = await getSnapshotById(user.id, params.id);

  if (!snapshot) {
    redirect("/body");
  }

  const leanMap = Object.fromEntries(snapshot.leanSegments.map((segment) => [segment.segment, segment.value]));
  const fatMap = Object.fromEntries(snapshot.fatSegments.map((segment) => [segment.segment, segment.value]));

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Body composition</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Edit snapshot</h1>
      </div>

      <form action={updateBodyCompositionSnapshot.bind(null, snapshot.id)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date" name="date" type="date" defaultValue={new Date(snapshot.date).toISOString().slice(0, 10)} required />
          <Field label="Weight (kg)" name="weightKg" type="number" step="0.1" defaultValue={snapshot.weightKg} required />
          <Field label="Height (cm)" name="heightCm" type="number" step="0.1" defaultValue={snapshot.heightCm ?? ""} />
          <Field label="BMI" name="bmi" type="number" step="0.1" defaultValue={snapshot.bmi ?? ""} />
          <Field label="SMM" name="smm" type="number" step="0.1" defaultValue={snapshot.smm ?? ""} />
          <Field label="BFM" name="bfm" type="number" step="0.1" defaultValue={snapshot.bfm ?? ""} />
          <Field label="PBF (%)" name="pbf" type="number" step="0.1" defaultValue={snapshot.pbf ?? ""} />
          <Field label="Waist-Hip Ratio" name="waistHipRatio" type="number" step="0.01" defaultValue={snapshot.waistHipRatio ?? ""} />
          <Field label="Visceral Fat" name="visceralFatLevel" type="number" step="0.1" defaultValue={snapshot.visceralFatLevel ?? ""} />
          <Field label="Fat Free Mass" name="fatFreeMass" type="number" step="0.1" defaultValue={snapshot.fatFreeMass ?? ""} />
          <Field label="BMR" name="bmr" type="number" step="0.1" defaultValue={snapshot.bmr ?? ""} />
          <Field label="Obesity Degree" name="obesityDegree" type="number" step="0.1" defaultValue={snapshot.obesityDegree ?? ""} />
          <Field label="SMI" name="smi" type="number" step="0.1" defaultValue={snapshot.smi ?? ""} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">Segment lean analysis</label>
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <FieldInline label="Left arm" name="segmentLean.leftArm" defaultValue={leanMap.leftArm ?? 0} />
              <FieldInline label="Right arm" name="segmentLean.rightArm" defaultValue={leanMap.rightArm ?? 0} />
              <FieldInline label="Left leg" name="segmentLean.leftLeg" defaultValue={leanMap.leftLeg ?? 0} />
              <FieldInline label="Right leg" name="segmentLean.rightLeg" defaultValue={leanMap.rightLeg ?? 0} />
              <FieldInline label="Trunk" name="segmentLean.trunk" defaultValue={leanMap.trunk ?? 0} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">Segment fat analysis</label>
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <FieldInline label="Left arm" name="segmentFat.leftArm" defaultValue={fatMap.leftArm ?? 0} />
              <FieldInline label="Right arm" name="segmentFat.rightArm" defaultValue={fatMap.rightArm ?? 0} />
              <FieldInline label="Left leg" name="segmentFat.leftLeg" defaultValue={fatMap.leftLeg ?? 0} />
              <FieldInline label="Right leg" name="segmentFat.rightLeg" defaultValue={fatMap.rightLeg ?? 0} />
              <FieldInline label="Trunk" name="segmentFat.trunk" defaultValue={fatMap.trunk ?? 0} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Measurement source" name="measurementSource" type="text" defaultValue={snapshot.measurementSource ?? ""} />
          <Field label="Notes" name="notes" type="text" defaultValue={snapshot.notes ?? ""} />
        </div>

        <button type="submit" className="rounded-xl bg-sky-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-sky-400">
          Save changes
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-sky-500"
      />
    </div>
  );
}

function FieldInline({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <div className="grid grid-cols-[1fr_110px] items-center gap-3 text-sm text-slate-300">
      <span>{label}</span>
      <input
        name={name}
        type="number"
        step="0.1"
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white outline-none transition focus:border-sky-500"
      />
    </div>
  );
}
