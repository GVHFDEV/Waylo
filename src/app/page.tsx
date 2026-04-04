import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      <div className="mb-6">
        <Image 
          src="/logo.svg" 
          alt="Waylo" 
          width={137} 
          height={45} 
          priority 
          style={{ height: '45px', width: 'auto' }}
        />
      </div>
      <p className="text-xl text-foreground font-sans">
        O design system e as fontes estão funcionando.
      </p>
    </main>
  );
}