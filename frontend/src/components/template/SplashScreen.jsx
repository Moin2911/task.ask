export function SplashScreen() {
  return (
    <div className="fixed grid h-full w-full place-content-center bg-white dark:bg-dark-900">
      <img
        src="/images/askinnovationlogo.webp"
        alt="Ask Innovation"
        className="h-16 w-auto object-contain dark:brightness-0 dark:invert"
      />
    </div>
  );
}
