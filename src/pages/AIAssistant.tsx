import { motion } from "framer-motion";
import AIChat from "@/components/AIChat";

export default function AIAssistant() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen bg-background flex flex-col overflow-hidden"
    >
      <AIChat fullScreen />
    </motion.div>
  );
}
