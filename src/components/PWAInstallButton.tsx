
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;

        if (result.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setDeferredPrompt(null);
            setIsInstallable(false);
            setOpen(false);
        }
    };

    if (!isInstallable) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    variant="secondary"
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-glow text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    Install App
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">
                        Install App
                    </DialogTitle>
                    <DialogDescription className="text-lg pt-2">
                        Get the full experience nicely on your device.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 border border-border/50">
                            <Smartphone className="w-8 h-8 mb-2 text-primary" />
                            <span className="text-sm font-medium">Mobile</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 border border-border/50">
                            <Monitor className="w-8 h-8 mb-2 text-primary" />
                            <span className="text-sm font-medium">Desktop</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleInstallClick}
                        size="lg"
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg text-lg h-12"
                    >
                        Download Now
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
