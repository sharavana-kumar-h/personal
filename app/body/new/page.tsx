import { createBodyCompositionSnapshot } from "@/app/actions/body-composition";

export default function NewBodySnapshotPage() {
  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Body composition</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Add snapshot</h1>
      </div>

      <form action={createBodyCompositionSnapshot} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date" name="date" type="date" required />
          <Field label="Weight (kg)" name="weightKg" type="number" step="0.1" required />
          <Field label="Height (cm)" name="heightCm" type="number" step="0.1" />
          <Field label="BMI" name="bmi" type="number" step="0.1" />
          <Field label="SMM" name="smm" type="number" step="0.1" />
          <Field label="BFM" name="bfm" type="number" step="0.1" />
          <Field label="PBF (%)" name="pbf" type="number" step="0.1" />
          <Field label="Waist-Hip Ratio" name="waistHipRatio" type="number" step="0.01" />
          <Field label="Visceral Fat" name="visceralFatLevel" type="number" step="0.1" />
          <Field label="Fat Free Mass" name="fatFreeMass" type="number" step="0.1" />
          <Field label="BMR" name="bmr" type="number" step="0.1" />
          <Field label="Obesity Degree" name="obesityDegree" type="number" step="0.1" />
          <Field label="SMI" name="smi" type="number" step="0.1" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">Segment lean analysis</label>
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <FieldInline label="Left arm" name="segmentLean.leftArm" />
              <FieldInline label="Right arm" name="segmentLean.rightArm" />
              <FieldInline label="Left leg" name="segmentLean.leftLeg" />
              <FieldInline label="Right leg" name="segmentLean.rightLeg" />
              <FieldInline label="Trunk" name="segmentLean.trunk" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">Segment fat analysis</label>
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <FieldInline label="Left arm" name="segmentFat.leftArm" />
              <FieldInline label="Right arm" name="segmentFat.rightArm" />
              <FieldInline label="Left leg" name="segmentFat.leftLeg" />
              <FieldInline label="Right leg" name="segmentFat.rightLeg" />
              <FieldInline label="Trunk" name="segmentFat.trunk" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Measurement source" name="measurementSource" type="text" />
          <Field label="Notes" name="notes" type="text" />
        </div>

        <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-400">
          Save snapshot
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  step,
}: {
  label: string;
  name: string;
  type?: string;
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
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-emerald-500"
      />
    </div>
  );
}

function FieldInline({ label, name }: { label: string; name: string }) {
  return (
    <div className="grid grid-cols-[1fr_110px] items-center gap-3 text-sm text-slate-300">
      <span>{label}</span>
      <input
        name={name}
        type="number"
        step="0.1"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white outline-none transition focus:border-emerald-500"
      />
    </div>
  );
}
