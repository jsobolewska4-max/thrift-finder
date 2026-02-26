import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <main className="flex w-full max-w-xl flex-col items-center">
        {/* Logo / Title */}
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-neutral-900">
          Thrift Finder
        </h1>
        <p className="mb-8 text-center text-base text-neutral-500">
          Find second-hand fashion at the best price
        </p>

        {/* Search */}
        <SearchBar />

        {/* Platform logos */}
        <div className="mt-10 flex items-center gap-6">
          <span className="text-xs text-neutral-400">Searching across</span>
          <div className="flex gap-4 text-xs font-medium text-neutral-500">
            <span>Poshmark</span>
            <span>Depop</span>
            <span>The RealReal</span>
            <span>ThredUp</span>
          </div>
        </div>
      </main>
    </div>
  );
}
