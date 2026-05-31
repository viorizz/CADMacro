import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { TitleBar } from "@/components/TitleBar";
import { NewMacroModal } from "@/components/NewMacroModal";
import { Toaster } from "@/components/Toaster";
import { MacrosView } from "@/views/MacrosView";
import { LibraryView } from "@/views/LibraryView";
import { SettingsView } from "@/views/SettingsView";
import { Spinner } from "@/components/ui";

function App() {
  const view = useStore((s) => s.view);
  const loaded = useStore((s) => s.loaded);
  const init = useStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <TitleBar />
      <main className="flex-1 overflow-y-auto p-4">
        {!loaded ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : view === "macros" ? (
          <MacrosView />
        ) : view === "library" ? (
          <LibraryView />
        ) : (
          <SettingsView />
        )}
      </main>
      <NewMacroModal />
      <Toaster />
    </div>
  );
}

export default App;
