import { motion } from "framer-motion";

function Cloud({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute" style={style}>
      <svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" className="fill-current">
        <ellipse cx="100" cy="60" rx="80" ry="20" />
        <ellipse cx="80" cy="50" rx="50" ry="25" />
        <ellipse cx="120" cy="45" rx="45" ry="28" />
        <ellipse cx="100" cy="40" rx="35" ry="30" />
      </svg>
    </div>
  );
}

const clouds = [
  { delay: 0, duration: 60, y: "10%", size: 180, opacity: 0.06 },
  { delay: -15, duration: 80, y: "25%", size: 220, opacity: 0.04 },
  { delay: -30, duration: 55, y: "5%", size: 150, opacity: 0.07 },
  { delay: -45, duration: 90, y: "40%", size: 260, opacity: 0.03 },
  { delay: -10, duration: 70, y: "60%", size: 200, opacity: 0.05 },
  { delay: -20, duration: 65, y: "75%", size: 170, opacity: 0.04 },
];

export function CloudBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {clouds.map((cloud, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: cloud.y, width: cloud.size, height: cloud.size * 0.4, color: `rgba(0, 229, 255, ${cloud.opacity})` }}
          initial={{ x: "-20%" }}
          animate={{ x: "110vw" }}
          transition={{
            duration: cloud.duration,
            delay: cloud.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Cloud style={{ width: "100%", height: "100%" }} />
        </motion.div>
      ))}
      {/* Subtle gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-cyan-500/5 to-transparent" />
    </div>
  );
}
