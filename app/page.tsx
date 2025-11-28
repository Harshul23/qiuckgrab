import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-black flex justify-center items-center flex-col gap-2">
      <h1 className="text-4xl text-white text-center font-medium">Hello Team </h1>
      <span className="text-white text-center font-black text-6xl">Five Star</span>
    </div>

  );
}
