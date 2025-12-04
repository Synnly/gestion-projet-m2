import { AnimatePresence, motion } from 'framer-motion';
import { useDarkModeStore } from '../../store/darkModeStore';
import { Moon, Sun } from 'lucide-react';
export function ToggleDarkMode() {
    const changeDarkMode = useDarkModeStore((state) => state.toggleDarkMode);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    return (
        <button
            className="rounded-2xl overflow-hidden w-12 h-12 flex items-center justify-center"
            onClick={() => changeDarkMode()}
        >
            <AnimatePresence initial={false} mode="sync">
                {darkMode ? (
                    <motion.div
                        key="moon"
                        initial={{ y: -50, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.4 }}
                        className="absolute"
                    >
                        <Moon className="size-7 text-primary" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute"
                    >
                        <Sun className="size-7 text-primary" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
