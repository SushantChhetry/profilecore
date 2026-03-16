export default function LoadingRunPage() {
  return (
    <main className="mx-auto w-[min(1120px,calc(100%-32px))] py-8">
      <section className="grid gap-6">
        <div className="grid gap-6 rounded-[28px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,248,239,0.94),rgba(255,241,228,0.86))] p-6 shadow-[0_16px_60px_rgba(87,48,24,0.08)] md:p-8">
          <div className="h-9 w-44 animate-pulse rounded-full bg-white/60" />
          <div className="grid gap-3">
            <div className="h-16 w-full max-w-[38rem] animate-pulse rounded-[20px] bg-white/60" />
            <div className="h-6 w-full max-w-[44rem] animate-pulse rounded-full bg-white/50" />
          </div>
          <div className="grid gap-4 rounded-[20px] border border-[color:var(--line)] bg-white/70 p-[18px]">
            <div className="h-8 w-40 animate-pulse rounded-full bg-[rgba(35,27,24,0.08)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[rgba(35,27,24,0.08)]" />
            <div className="h-5 w-full max-w-[24rem] animate-pulse rounded-full bg-[rgba(35,27,24,0.08)]" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="grid gap-4 rounded-[24px] border border-[color:var(--line)] bg-[var(--panel)] p-6 backdrop-blur-[18px]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-[20px] border border-[color:var(--line)] bg-white/55 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-white" />
                  <div className="grid gap-2">
                    <div className="h-4 w-44 animate-pulse rounded-full bg-white" />
                    <div className="h-3 w-24 animate-pulse rounded-full bg-white/80" />
                  </div>
                </div>
                <div className="h-4 w-full max-w-[30rem] animate-pulse rounded-full bg-white/80" />
              </div>
            ))}
          </section>
          <aside className="grid gap-4">
            <div className="h-32 animate-pulse rounded-[20px] border border-[color:var(--line)] bg-white/70" />
            <div className="h-32 animate-pulse rounded-[20px] border border-[color:var(--line)] bg-white/70" />
          </aside>
        </div>
      </section>
    </main>
  );
}
