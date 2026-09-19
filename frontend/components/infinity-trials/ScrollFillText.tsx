"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import styles from "./scroll-fill.module.css";

function Word({ word, index, count, progress, disabled }: { word: string; index: number; count: number; progress: MotionValue<number>; disabled: boolean }) {
  const fill = useTransform(progress, [index / count, (index + 1) / count], ["0% 100%, 100% 100%", "100% 100%, 100% 100%"]);
  return <motion.span className={styles.word} style={{ backgroundSize: disabled ? "100% 100%, 100% 100%" : fill }}>{word}</motion.span>;
}
export default function ScrollFillText({ text, disabled = false }: { text: string; disabled?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "end 0.5"] });
  const words = text.split(" ");
  return <span ref={ref} className={styles.text}>{words.map((word, index) => <span key={`${index}-${word}`}><Word word={word} index={index} count={words.length} progress={scrollYProgress} disabled={disabled} />{index < words.length - 1 ? " " : ""}</span>)}</span>;
}
