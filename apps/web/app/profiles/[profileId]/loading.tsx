export default function LoadingProfilePage() {
  return (
    <main className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 py-8">
      <section className="grid animate-pulse gap-6 rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,248,239,0.96),rgba(255,242,230,0.9))] p-6 shadow-[0_16px_60px_rgba(87,48,24,0.09)] lg:grid-cols-[1.18fr_0.82fr] lg:p-8">
        <div className="grid gap-4">
          <div className="h-8 w-40 rounded-full bg-white/70" />
          <div className="h-20 max-w-[36rem] rounded-[24px] bg-white/72" />
          <div className="h-28 max-w-[44rem] rounded-[24px] bg-white/72" />
          <div className="flex flex-wrap gap-3">
            <div className="h-12 w-36 rounded-full bg-white/72" />
            <div className="h-12 w-40 rounded-full bg-white/72" />
            <div className="h-12 w-36 rounded-full bg-white/72" />
          </div>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-28 rounded-[22px] bg-white/72" />
            <div className="h-28 rounded-[22px] bg-white/72" />
            <div className="h-28 rounded-[22px] bg-white/72" />
            <div className="h-28 rounded-[22px] bg-white/72" />
          </div>
          <div className="h-48 rounded-[22px] bg-white/72" />
        </div>
      </section>

      <section className="h-20 animate-pulse rounded-[24px] border border-[color:var(--line)] bg-[rgba(255,248,239,0.78)] p-2 shadow-[0_16px_40px_rgba(87,48,24,0.06)] backdrop-blur-[18px]" />

      <section className="grid animate-pulse gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-4">
          <div className="h-64 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
          <div className="h-64 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
          <div className="h-72 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
        </div>
        <div className="grid gap-4">
          <div className="h-56 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
          <div className="h-56 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
          <div className="h-64 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
          <div className="h-56 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)]" />
        </div>
      </section>
    </main>
  );
}
